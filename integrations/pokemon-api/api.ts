// Copyright Sierra

import { newIntegrationApi, makeFunction, fetch } from "@sierra/agent";
import { type Pokemon } from "./pokemon-types";
import { type PokemonApiConfig } from "./types";

const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";

export default newIntegrationApi<PokemonApiConfig>()
    .withContexts({
        // No additional contexts needed for this integration
    })
    .registerFunctions({
        getPokemon: makeFunction({
            description: "Gets a pokemon by name or id number.",
            params: {
                nameOrId: { type: "string", description: "The name or id number of the pokemon." },
            },
            output: {
                type: "object",
                description: "Pokemon response",
                properties: {
                    data: {
                        type: "object",
                        description: "The response data",
                        properties: {
                            id: {
                                type: "number",
                                description: "The unique identifier for this Pokémon.",
                            },
                            name: { type: "string", description: "The name of the Pokémon." },
                            base_experience: {
                                type: "number",
                                description:
                                    "The base experience gained for defeating this Pokémon.",
                            },
                            order: {
                                type: "number",
                                description:
                                    "Order for sorting. Almost national order, except families are grouped together.",
                            },
                            weight: {
                                type: "number",
                                description: "The weight of this Pokémon in hectograms.",
                            },
                            types: {
                                type: "array",
                                description: "A list of types this Pokémon has.",
                                items: {
                                    type: "object",
                                    description: "Details of a Pokémon type.",
                                    properties: {
                                        slot: {
                                            type: "number",
                                            description:
                                                "The order the Pokémon's types are listed in.",
                                        },
                                        type: {
                                            type: "object",
                                            description: "Details of the type.",
                                            properties: {
                                                name: {
                                                    type: "string",
                                                    description: "The name of the type.",
                                                },
                                                url: {
                                                    type: "string",
                                                    description: "The URL of the type resource.",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            abilities: {
                                type: "array",
                                description:
                                    "A list of abilities this Pokémon could potentially have.",
                                items: {
                                    type: "object",
                                    description: "Details of a Pokémon ability.",
                                    properties: {
                                        is_hidden: {
                                            type: "boolean",
                                            description: "Whether or not this is a hidden ability.",
                                        },
                                        slot: {
                                            type: "number",
                                            description:
                                                "The slot this ability occupies for this Pokémon.",
                                        },
                                        ability: {
                                            type: "object",
                                            description: "The ability resource.",
                                            properties: {
                                                name: {
                                                    type: "string",
                                                    description: "The name of the ability.",
                                                },
                                                url: {
                                                    type: "string",
                                                    description: "The URL of the ability resource.",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            stats: {
                                type: "array",
                                description: "A list of base stat values for this Pokémon.",
                                items: {
                                    type: "object",
                                    description: "Details of a stat for a Pokémon.",
                                    properties: {
                                        base_stat: {
                                            type: "number",
                                            description: "The base value of the stat.",
                                        },
                                        effort: {
                                            type: "number",
                                            description:
                                                "The effort value (EV) contributed by this stat.",
                                        },
                                        stat: {
                                            type: "object",
                                            description: "The stat resource.",
                                            properties: {
                                                name: {
                                                    type: "string",
                                                    description: "The name of the stat.",
                                                },
                                                url: {
                                                    type: "string",
                                                    description: "The URL of the stat resource.",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            moves: {
                                type: "array",
                                description:
                                    "A list of moves along with learn methods and level details pertaining to specific version groups.",
                                items: {
                                    type: "object",
                                    description: "Details of a move for this Pokémon.",
                                    properties: {
                                        move: {
                                            type: "object",
                                            description: "The move resource.",
                                            properties: {
                                                name: {
                                                    type: "string",
                                                    description: "The name of the move.",
                                                },
                                                url: {
                                                    type: "string",
                                                    description: "The URL of the move resource.",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            sprites: {
                                type: "object",
                                description:
                                    "A set of sprites used to depict this Pokémon in the game.",
                                optional: true,
                                properties: {
                                    front_default: {
                                        type: "string",
                                        description:
                                            "The default depiction of this Pokémon from the front in battle.",
                                        optional: true,
                                    },
                                    front_shiny: {
                                        type: "string",
                                        description:
                                            "The shiny depiction of this Pokémon from the front in battle.",
                                        optional: true,
                                    },
                                    other: {
                                        type: "object",
                                        description: "Other sprite collections.",
                                        optional: true,
                                        properties: {
                                            "official-artwork": {
                                                type: "object",
                                                description:
                                                    "The official artwork of this Pokémon.",
                                                optional: true,
                                                properties: {
                                                    front_default: {
                                                        type: "string",
                                                        description: "The official artwork image.",
                                                        optional: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            func: (_ctx, params) => {
                const pokemon = fetch.jsonSync<Pokemon>(
                    `${POKEAPI_BASE_URL}/pokemon/${params.nameOrId}`,
                    { method: "GET" }
                ).body!;

                return {
                    data: {
                        id: pokemon.id,
                        name: pokemon.name,
                        base_experience: pokemon.base_experience,
                        order: pokemon.order,
                        weight: pokemon.weight,
                        types: pokemon.types.map(type => ({
                            slot: type.slot,
                            type: {
                                name: type.type.name,
                                url: type.type.url,
                            },
                        })),
                        abilities: pokemon.abilities.map(ability => ({
                            is_hidden: ability.is_hidden,
                            slot: ability.slot,
                            ability: {
                                name: ability.ability.name,
                                url: ability.ability.url,
                            },
                        })),
                        stats: pokemon.stats.map(stat => ({
                            base_stat: stat.base_stat,
                            effort: stat.effort,
                            stat: {
                                name: stat.stat.name,
                                url: stat.stat.url,
                            },
                        })),
                        moves: pokemon.moves.map(move => ({
                            move: {
                                name: move.move.name,
                                url: move.move.url,
                            },
                        })),
                        sprites: {
                            front_default: pokemon.sprites.front_default,
                            front_shiny: pokemon.sprites.front_shiny,
                            other: pokemon.sprites.other
                                ? {
                                      "official-artwork": pokemon.sprites.other["official-artwork"]
                                          ? {
                                                front_default:
                                                    pokemon.sprites.other["official-artwork"]
                                                        .front_default,
                                            }
                                          : null,
                                  }
                                : null,
                        },
                    },
                };
            },
        }),
    });
