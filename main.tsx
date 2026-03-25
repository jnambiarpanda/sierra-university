// Copyright Sierra

import { createAgent } from "@sierra/agent/base";
import { AbuseType, fetch, Goal, jsx, Rule, toolParam, tools } from "@sierra/agent";
import { SierraUniversityAbuseDetection } from "./skills/abuse-detection";
import integrationsRegistry from "./integrations-registry";
import { info, logging } from "@sierra/agent";
import { apiContext } from "./integration-types";

const CountWordsTool = tools.registerTool({
    name: "CountWordsJN",
    type: "lookup",
    noCodeId: "count-words-tool-jn",
    description: "Counts the number of words in a given text.",
    params: {
        text: toolParam.string("The text to count the words in."),
    },
    func: (ctx, params, controls) => {
        const wordCount = ctx.conversation.map(message => message.text).join(" ").trim().split(/\s+/).length;
        // params.text.trim().split(/\s+/).length;
        return controls.result({ 
            data: { wordCount: wordCount }
         });
    },
});

const SearchForItemsTool = tools.registerTool({
    name: "SearchForItemsJN",
    type: "lookup",
    noCodeId: "search-for-items-tool-jn",
    description: "Searches for items based in the Sierra Outfitters inventory. This will return a list of products that match the query",
    params: {
        query: toolParam.string("The search query to find items."),
    },
    func: (ctx, params, controls) => {
        const response = fetch.jsonSync<any>(
            `https://gosierra.biz/api/v1/products?q=${encodeURIComponent(params.query)}&page=1&limit=5`,
            {
                method: "GET",
                headers: {
                    "X-API-Key": "sierra_u",
                },
                timeout: 100,
            }
        );

        return controls.result({
            data: response.body,
        });
    },
});

const ProductCategoryTool = tools.registerTool({
    name: "ProductCategoryToolJN",
    type: "lookup",
    noCodeId: "product-category-tool-jn",
    description: "Searches for product categories in the Sierra Outfitters inventory. This will return a list all products categories",
    params: {
        query: toolParam.string("The search query to find all product categories."),
    },
    func: (ctx, params, controls) => {
        const response = fetch.jsonSync<any>(
            `https://gosierra.biz/api/v1/categories`,
            {
                method: "GET",
                headers: {
                    "X-API-Key": "sierra_u",
                },
                timeout: 100,
            }
        );

        return controls.result({
            data: response.body,
        });
    },
});

// const SendOtpCode = tools.registerTool({
//     name: "SendOtpCodeJN",
//     type: "lookup",
//     noCodeId: "verify-otp-code-tool-jn",
//     description: "Sends a one-time password (OTP) code to the customer's phone for verification purposes.",
//     params: {
//         phoneNumber: toolParam.string("The phone number of the customer to send the OTP code to."),
//     },
//     func: (ctx, params, controls) => {
//         const response = fetch.jsonSync<any>(
//             `https://gosierra.biz/api/v1/auth/otp/send`,
//             {
//                 method: "POST",
//                 headers: {
//                     "X-API-Key": "sierra_u",
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({ phone: params.phoneNumber }),
//                 timeout: 100,
//             }
//         );

//         if (response.status === 200) {
//             return controls.result({
//                 data: { success: true, message: "OTP code sent successfully." },
//             });
//         } else {
//             return controls.error("Failed to send OTP code.");
//         }
//     },
// });

const GetCustomerAddressJN = tools.registerTool({
    type: "lookup",
    name: "GetCustomerAddressJN",
    description: "Get the address of the customer",
    noCodeId: "get-customer-address-tool-jn",
    params: {
        addressType: toolParam.choice(
            "Whether you want to get the shipping or billing address. You must ask the customer which one they want if they haven't told you.",
            ["shipping", "billing"]
        ),
    },
    func: (ctx, params, controls) => {
        // Fun hack: All customers who start with "cust_9" have different shipping and billing addresses.
        const fakeCustomerId =
            "cust_9" +
            Array.from({ length: 7 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
        let allAddresses: any[] = [];

        const cachedAddresses = ctx.store.value["addresses"] as any[] | undefined;
        if (Array.isArray(cachedAddresses) && cachedAddresses.length > 0) {
            allAddresses = cachedAddresses;
        } else {
            const response = fetch.jsonSync<any>(
                `https://gosierra.biz/api/v1/customers/${fakeCustomerId}/addresses`,
                {
                    method: "GET",
                    headers: { "X-API-Key": "sierra_u" },
                }
            );
            if (response.status !== 200 || !response.body) {
                return controls.error("Failed to get customer address");
            }
            allAddresses = response.body.data;

            // TODO #1: Save the address list to root store
            ctx.store.update(prev => ({
                ...prev,
                addresses: allAddresses,
            }));
}


        // info('info2:' + JSON.stringify(response.body.data));


        // TODO #1: Save the address list to root store
        // ctx.store.update(prev => ({ ...prev, address: { address: allAddresses } }));

        const address = allAddresses.find((address: any) => address.type === params.addressType);

        return controls.result({
            data: address,
        });
    },
});

// const GenerateCoupon = tools.withContexts(apiContext).registerTool({
//     name: "GenerateCouponJN",
//     type: "create",
//     noCodeId: "generate-coupon-code-jn",
//     description: "Generate a coupon for a customer",
//     params: {
//         // What do you think we need here?
//     },
//     func: (ctx, params, controls) => {
//         const couponObject = ctx.apis.sierraOutfitters.createCoupon({
//             // Grab the values from our params object and pass them in here.
//         });
//         // This is similar to calling `return couponObject`
//         return controls.result({
//             data: couponObject,
//         });
//     },
// });

const GenerateCouponJN = tools.withContexts(apiContext).registerTool({
    name: "GenerateCouponJN",
    type: "create",
    noCodeId: "generate-coupon-code-jn",
    description: "Generate a coupon for a customer",
    params: {
        customerId: toolParam.string("The customer ID to generate the coupon for, for example cust_a1b2c3d4."),
        reason: toolParam.string("The reason for issuing the coupon, for example Apology for delayed shipment."),
    },
    func: (ctx, params, controls) => {
        const response = fetch.jsonSync<any>(
            `https://gosierra.biz/api/v1/customers/${params.customerId}/coupons`,
            {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "X-API-Key": "sierra_u",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reason: params.reason,
                }),
            }
        );

        if (response.status < 200 || response.status >= 300 || !response.body) {
            return controls.error("Failed to generate coupon");
        }

        return controls.result({
            data: response.body,
        });
    },
});

/**
 * Welcome to Sierra University. Below, you'll
 * find the createAgent function, which takes parameters that can
 * customize your agent.
 *
 * All configuration parameters that start with `use` are compatible with Sierra's SDK hooks.
 */
export default createAgent({
    // General configurations for the agent are available here.
    config: {
        voiceConfig: {
            enabledEvents: ["start", "inactivity"],
            inactivityTimeoutSeconds: 30,
        },
        textConfig: {
            enabledEvents: ["inactivity"],
            inactivityTimeoutSeconds: 100,
        },
        postConversationDelaySeconds: 60 * 15, // 15 minutes
    },
    brand: {
        agentName: "Peppa Pig",
        organizationName: "SXM University",
        customerServiceTeamName: "SXM University Rescue Rangers",
        customerNoun: "climber",
    },
    // Client events are triggered by a sierra client
    // createAgent handles most of these for you.
    onClientEvent: (props, next) => {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { event, conversation } = props;
        switch (event.type) {
            default:
                next(props);
        }
    },

    // Goal agent props are the properties passed to the GoalAgent component under the hood
    useCustomGoalAgentProps: () => ({
        transferToolProps: "none",
    }),

    // Use `useWrapper` to add contexts needed by your agent and its tools. This enables
    // global state for your agent and its tools.
    useWrapper: agent => {
        return agent;
    }, // Goal agent children are JSX components that can be used to add additional children to the underlying GoalAgent component.
    useAdditionalGoalAgentChildren: () => {
        return (
            <>
                <Goal description="Determine why the customer is reaching out to customer support.">
                    <Rule content="If unclear, ask the customer why they are reaching out to customer support." />
                </Goal>
            </>
        );
    },
    // Abuse detection is a core feature of Sierra. It is used to detect and respond to abuse in a conversation. You can override the default behavior as outlined below.
    useCustomAbuseDetectionProps: () => {
        const allowedBehaviors = [
            "The customer is asking about sports or outdoor activities",
            "The customer has questions about the rules of sports",
            "The customer has a mathematics-related question",
        ];
        return {
            mode: "observe", // Don't do this in an actual app
            foundAbuseDefendAction: () => <SierraUniversityAbuseDetection />,
            abuseOverrides: {
                [AbuseType.OutOfContext]: {
                    honeypots: allowedBehaviors,
                },
                [AbuseType.OutOfBounds]: {
                    honeypots: allowedBehaviors,
                },
            },
        };
    },
    // Use `useTools` to implement custom tools defined in the UI.
    // You can also define tools fully in code in useAdditionalGoalAgentChildren.
    useTools: () => {
        return {};
    },
    // Use `integrationRegistry` to add integrations to your agent.
    // By default, the integrationsRegistry contains all builtin integrations
    // from the @sierra/integrations-builtin package.
    //
    // To add custom integrations:
    // 1. Run `pnpm sierra init-integration` to create a new integration
    // 2. Run `pnpm sierra watch` to upload your code to Agent Studio
    // 3. The imported `integrationRegistry` in this file will pick up the
    //    changes from the rebuilt `integrations-registry.ts` file.
    integrationsRegistry,
});

/**
 * Adding our first tool! We're actually adding this because we want to demonstrate to the
 * day 1 folks what it's like to have a tool already created by engineering and ready to use.
 */
type LoyaltyInfo = {
    id: string;
    customer_id: string;
    tier: string;
    points_balance: number;
    lifetime_points: number;
    tier_expires_at?: string;
    created_at: string;
};

type LoyaltyResponse = {
    success: boolean;
    data: LoyaltyInfo;
};

tools.registerTool({
    name: "PreBuiltGetLoyaltyInfo",
    type: "lookup",
    noCodeId: "pre-built-get-loyalty-info",
    description: "Get information about the Sierra Explorers loyalty program for a given customer",
    params: {
        customerId: toolParam.string(
            "The username or email of the customer we want to get loyalty information for. This must be a valid customer ID and not something generic like 'customer' or 'user'"
        ),
    },
    func: (ctx, params, controls) => {
        const result = fetch.jsonSync<LoyaltyResponse>(
            `https://gosierra.biz/api/v1/customers/${params.customerId}/loyalty`,
            { method: "GET", headers: { "X-API-Key": "sierra_u" } }
        );
        if (result.status !== 200 || !result.body) {
            return controls.error("Failed to get loyalty information");
        }
        return controls.result({
            data: { loyaltyInfo: result.body.data },
        });
    },
});

// ── Poem Tool ──────────────────────────────────────────────────────────────────

type DatamuseWord = { word: string; score: number };

/**
 * Fetches rhyming words from the Datamuse API for each input word,
 * then returns the words + rhymes so the agent can compose a poem.
 */
tools.registerTool({
    name: "WritePoemJN",
    type: "lookup",
    noCodeId: "write-poem-jn",
    description:
        "Generate a poem using the provided words. Calls the Datamuse rhyme API to find rhyming words for each input, then composes a poem. Use this whenever the user asks for a poem.",
    params: {
        words: toolParam.string(
            "Comma-separated list of words to feature in the poem. Example: 'moon, stars, night, dream'"
        ),
        style: toolParam.string(
            "Poem style: 'rhyming' (default AABB quatrain), 'haiku' (5-7-5), or 'limerick' (AABBA)."
        ),
    },
    func: (_ctx, params, controls) => {
        const wordList = params.words
            .split(",")
            .map(w => w.trim().toLowerCase())
            .filter(Boolean);

        if (wordList.length === 0) {
            return controls.error("No words provided. Please supply at least one word.");
        }

        // Fetch rhymes from Datamuse for each word
        const rhymeMap: Record<string, string[]> = {};
        for (const word of wordList) {
            const response = fetch.jsonSync<DatamuseWord[]>(
                `https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(word)}&max=8`
            );
            rhymeMap[word] =
                response.status === 200 && response.body
                    ? response.body.map(r => r.word)
                    : [];
        }

        const style = params.style?.toLowerCase() ?? "rhyming";
        const rhymeSummary = wordList
            .map(w => `${w} → [${(rhymeMap[w] ?? []).slice(0, 4).join(", ") || "no rhymes found"}]`)
            .join("; ");

        return controls.result({
            data: {
                words: wordList,
                rhymes: rhymeMap,
                style,
                instruction: `Write a ${style} poem that features these words: ${wordList.join(", ")}. Use the rhymes below to end lines. Rhyme pairs available: ${rhymeSummary}. Present only the finished poem — no preamble.`,
            },
        });
    },
});
