// Copyright Sierra

import {
    type ArticleBatch,
    fetch,
    type FetchKnowledgeInput,
    info,
    NewCrawledKnowledgeBase,
    type Scraper,
    type ExtractedContent,
    logging,
} from "@sierra/agent";
import parse from "node-html-parser";
import TurndownService from "@sierra/turndown";
import baseballRulesData from "./baseball-rules-knowledge-base.json";

// Replace with your actual mock or production API base URL
const TRIALER_API_BASE = "https://api.sxm.internal/v1";

type BaseballArticle = {
    id: string;
    title: string;
    body: string;
    metadata: { rule_number: string; category: string; source_url: string };
};

type ContentItem = {
    contentId: string;
    title: string;
    artistHost: string;
    contentType: "music" | "podcast" | "sports" | "channel";
    channel: string;
    airTime: string;
    imageUrl: string;
    link: string;
};

type PokemonItem = {
    id: number;
    name: string;
    cost: number;
    fling_power: number;
    fling_effect: {
        name: string;
        url: string;
    };
    attributes: {
        name: string;
        url: string;
    }[];
    category: {
        name: string;
        url: string;
    };
    effect_entries: {
        effect: string;
        short_effect: string;
        language: {
            name: string;
            url: string;
        };
    }[];
    flavor_text_entries: {
        text: string;
        version_group: {
            name: string;
            url: string;
        };
        language: {
            name: string;
            url: string;
        };
    }[];
    game_indices: {
        game_index: number;
        generation: {
            name: string;
            url: string;
        };
    }[];
    names: {
        name: string;
        language: {
            name: string;
            url: string;
        };
    }[];
    sprites: {
        default: string;
    };
    held_by_pokemon: {
        pokemon: {
            name: string;
            url: string;
        };
        version_details: {
            rarity: number;
            version: {
                name: string;
                url: string;
            };
        }[];
    }[];
    baby_trigger_for: {
        url: string;
    };
};

function* fetchPokemonItems(input: FetchKnowledgeInput): Generator<ArticleBatch> {
    let idCounter = 1;
    let stop = false;
    while (!stop) {
        const url = `https://pokeapi.co/api/v2/item/${idCounter}/`;
        const response = fetch.jsonSync<PokemonItem>(
            `https://pokeapi.co/api/v2/item/${idCounter}/`
        );
        if (response.status !== 200) {
            info("No more items to fetch");
            stop = true;
        } else if (response.body) {
            yield {
                error: null,
                articles: [
                    {
                        title: response.body.name,
                        sourceUrl: url,
                        body: generateItemArticleBody(response.body),
                    },
                ],
            };
        }
        idCounter++;
    }
}

function generateItemArticleBody(item: PokemonItem): string {
    return `# ${item.name}

**Category:** ${item.category.name}

**Cost:** ${item.cost}

**Description:** ${
        item.flavor_text_entries.find(entry => entry.language.name === "en")?.text ??
        "No description available"
    }

**Effect:** ${
        item.effect_entries.find(entry => entry.language.name === "en")?.short_effect ??
        "No effect information available"
    }

**Attributes:**
${item.attributes.map(attr => `- ${attr.name}`).join("\n") || "No attributes listed"}

**Game Indices:**
${
    item.game_indices.map(game => `- ${game.generation.name} (${game.game_index})`).join("\n") ||
    "No game indices available"
}

**Held by Pokemon:**
${
    item.held_by_pokemon
        .map(
            held =>
                `- ${held.pokemon.name} (Rarity: ${held.version_details[0]?.rarity ?? "Unknown"})`
        )
        .join("\n") || "No Pokemon hold this item"
}`;
}

// ── Baseball Rules knowledge base ─────────────────────────────────────────────
function* fetchBaseballRules(_input: FetchKnowledgeInput): Generator<ArticleBatch> {
    const articles = (baseballRulesData as { articles: BaseballArticle[] }).articles;
    info(`Fetching ${articles.length} baseball rule articles`);
    yield {
        error: null,
        articles: articles.map(article => ({
            title: article.title,
            sourceUrl: article.metadata.source_url,
            body: article.body,
        })),
    };
}

// ── Content Catalog knowledge base ────────────────────────────────────────────
function* fetchContentCatalog(_input: FetchKnowledgeInput): Generator<ArticleBatch> {
    logging.info("Fetching content catalog from API");
    const response = fetch.jsonSync<{ items: ContentItem[] }>(
        `${TRIALER_API_BASE}/content/catalog`
    );
    if (response.status !== 200 || !response.body) {
        yield { error: "Failed to fetch content catalog", articles: [] };
        return;
    }
    yield {
        error: null,
        articles: response.body.items.map(item => ({
            title: `${item.title} — ${item.artistHost}`,
            sourceUrl: item.link,
            body: generateContentArticleBody(item),
        })),
    };
}

function generateContentArticleBody(item: ContentItem): string {
    return `# ${item.title}

**Artist / Host:** ${item.artistHost}

**Content Type:** ${item.contentType}

**Channel:** ${item.channel}

**Air Time:** ${item.airTime}

**Link:** ${item.link}

**Image:** ${item.imageUrl}`;
}

class SierraOutfittersFaqScraper implements Scraper {
    targetPage = "https://gosierra.biz/api/v1/faq";

    commonHeaders() {
        return {
            "user-agent": "Mozilla/5.0 (compatible; SierraCrawler/1.0)",
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        };
    }

    rootLinks() {
        return [this.targetPage];
    }

    extractContent(url: string, body: string): ExtractedContent {
        logging.info(`Extracting FAQ content from Sierra Outfitters page: ${url}`);

        const root = parse(body);
        const turndown = new TurndownService({
            headingStyle: "atx",
            linkStyle: "inlined",
        });
        turndown.remove(["script", "style", "noscript", "nav", "footer"]);

        const articles: ExtractedContent["articles"] = [];
        const categories = root.querySelectorAll(".category");

        for (const category of categories) {
            const sectionName = category.querySelector("h2")?.textContent.trim() ?? "General";

            const details = category.querySelectorAll("details");
            for (const detail of details) {
                const question = detail.querySelector("summary")?.textContent.trim() ?? "";
                const answerHtml =
                    detail.querySelector(".answer")?.innerHTML ??
                    detail.innerHTML.replace(detail.querySelector("summary")?.outerHTML ?? "", "");

                if (!question || !answerHtml) {
                    continue;
                }

                const answerMarkdown = turndown.turndown(answerHtml);
                const anchor = question
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
                articles.push({
                    title: question,
                    sourceUrl: `${url}#${anchor}`,
                    body: `**Category:** ${sectionName}\n\n${answerMarkdown}`,
                });
            }
        }

        return { articles, links: [] };
    }
}

const knowledgeBases = [
    {
        name: "Pokemon Items",
        fetchKnowledge: fetchPokemonItems,
    },
    NewCrawledKnowledgeBase("Sierra Outfitters FAQ", new SierraOutfittersFaqScraper(), {
        useBrowser: false,
        retries: 2,
        concurrency: 1,
        maxErrorRate: 0.1,
    }),
    {
        name: "Baseball Rules",
        fetchKnowledge: fetchBaseballRules,
    },
    {
        name: "Upcoming Artist Content",
        fetchKnowledge: fetchContentCatalog,
    },
];

export default knowledgeBases;
