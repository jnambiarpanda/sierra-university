// Copyright Sierra

// Simplified Pokemon API types - consolidated from pokeapi-models

/** API Resource */
export interface APIResource {
    /** The URL of the referenced resource */
    url: string;
}

/** Named API Resource */
export interface NamedAPIResource {
    /** The name of the referenced resource */
    name: string;
    /** The URL of the referenced resource */
    url: string;
}

/** Name resource */
export interface Name {
    /** The localized name for an API resource in a specific language */
    name: string;
    /** The language this name is in */
    language: NamedAPIResource;
}

/** Description resource */
export interface Description {
    /** The localized description for an API resource in a specific language */
    description: string;
    /** The language this description is in */
    language: NamedAPIResource;
}

/** Flavor text resource */
export interface FlavorText {
    /** The localized flavor text for an API resource in a specific language */
    flavor_text: string;
    /** The language this flavor text is in */
    language: NamedAPIResource;
    /** The version this flavor text is extracted from */
    version?: NamedAPIResource;
}

/** Version encounter detail */
export interface VersionEncounterDetail {
    /** The version this encounter happens in */
    version: NamedAPIResource;
    /** The total percentage of all encounter potential */
    max_chance: number;
    /** A list of encounters and their specifics */
    encounter_details: any[];
}

/** Version game index */
export interface VersionGameIndex {
    /** The internal id of an API resource within game data */
    game_index: number;
    /** The version relevent to this game index */
    version: NamedAPIResource;
}

// Pokemon Types

export type PokemonCries = {
    /** The legacy depiction of this Pokémon's cry. */
    legacy: string;
    /** The latest depiction of this Pokémon's cry. */
    latest: string;
};

/** Abilities the given pokémon could potentially have */
export interface PokemonAbility {
    /** Whether or not this is a hidden ability */
    is_hidden: boolean;
    /** The slot this ability occupies in this Pokémon species */
    slot: number;
    /** The ability the Pokémon may have */
    ability: NamedAPIResource;
}

/** Details showing types the given Pokémon has */
export interface PokemonType {
    /** The order the Pokémon's types are listed in */
    slot: number;
    /** The type the referenced Pokémon has */
    type: NamedAPIResource;
}

/** Data describing a Pokemon's types in a previous generation. */
export interface PokemonPastType {
    /** The generation of this Pokémon Type. */
    generation: NamedAPIResource;
    /** Types this of this Pokémon in a previos generation. */
    types: PokemonType[];
}

/** Items the given Pokémon may be holding when encountered */
export interface PokemonHeldItem {
    /** The item the referenced Pokémon holds */
    item: NamedAPIResource;
    /** The details of the different versions in which the item is held */
    version_details: PokemonHeldItemVersion[];
}

/** The details of the different versions in which the item is held */
export interface PokemonHeldItemVersion {
    /** The version in which the item is held */
    version: NamedAPIResource;
    /** How often the item is held */
    rarity: number;
}

/** A Move along with learn methods and level details pertaining to specific version groups */
export interface PokemonMove {
    /** The move the Pokémon can learn */
    move: NamedAPIResource;
    /** The details of the version in which the Pokémon can learn the move */
    version_group_details: PokemonMoveVersion[];
}

/** The details of the version in which the Pokémon can learn the move */
export interface PokemonMoveVersion {
    /** The method by which the move is learned */
    move_learn_method: NamedAPIResource;
    /** The version group in which the move is learned */
    version_group: NamedAPIResource;
    /** The minimum level to learn the move */
    level_learned_at: number;
}

/** Base stat values for the given Pokémon */
export interface PokemonStat {
    /** The stat the Pokémon has */
    stat: NamedAPIResource;
    /** The effort points (EV) the Pokémon has in the stat */
    effort: number;
    /** The base value of the stat */
    base_stat: number;
}

/** A set of sprites used to depict this Pokémon in the game */
export interface PokemonSprites {
    /** The default depiction of this Pokémon from the front in battle */
    front_default: string | null;
    /** The shiny depiction of this Pokémon from the front in battle */
    front_shiny: string | null;
    /** The female depiction of this Pokémon from the front in battle */
    front_female: string | null;
    /** The shiny female depiction of this Pokémon from the front in battle */
    front_shiny_female: string | null;
    /** The default depiction of this Pokémon from the back in battle */
    back_default: string | null;
    /** The shiny depiction of this Pokémon from the back in battle */
    back_shiny: string | null;
    /** The female depiction of this Pokémon from the back in battle */
    back_female: string | null;
    /** The shiny female depiction of this Pokémon from the back in battle */
    back_shiny_female: string | null;
    /** Other sprite collections */
    other?: {
        "official-artwork"?: {
            front_default: string | null;
        };
    };
    /** Version-specific sprites - simplified */
    versions: { [key: string]: any };
}

/**
 * ## Pokemon
 * Pokémon are the creatures that inhabit the world of the Pokémon games.
 * They can be caught using Pokéballs and trained by battling with other Pokémon.
 * Each Pokémon belongs to a specific species but may take on a variant
 * which makes it differ from other Pokémon of the same species, such as base stats, available abilities and typings.
 * - See [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_(species)) for greater detail.
 */
export interface Pokemon {
    /** The identifier for this resource */
    id: number;
    /** The name for this resource */
    name: string;
    /** The base experience gained for defeating this Pokémon */
    base_experience: number;
    /** The height of this Pokémon in decimetres */
    height: number;
    /** Set for exactly one Pokémon used as the default for each species */
    is_default: boolean;
    /** Order for sorting. Almost national order, except families are grouped together */
    order: number;
    /** The weight of this Pokémon in hectograms */
    weight: number;
    /** A list of abilities this Pokémon could potentially have */
    abilities: PokemonAbility[];
    /** A list of forms this Pokémon can take on */
    forms: NamedAPIResource[];
    /** A list of game indices relevent to Pokémon item by generation */
    game_indices: VersionGameIndex[];
    /** A list of items this Pokémon may be holding when encountered */
    held_items: PokemonHeldItem[];
    /** A link to a list of location areas, as well as encounter details pertaining to specific versions */
    location_area_encounters: string;
    /** A list of moves along with learn methods and level details pertaining to specific version groups */
    moves: PokemonMove[];
    /** A set of sprites used to depict this Pokémon in the game. */
    sprites: PokemonSprites;
    /** A set of cries used to depict this Pokémon in the game. */
    cries: PokemonCries;
    /** The species this Pokémon belongs to */
    species: NamedAPIResource;
    /** A list of base stat values for this Pokémon */
    stats: PokemonStat[];
    /** A list of details showing types this Pokémon has */
    types: PokemonType[];
    /** Data describing a Pokemon's types in a previous generation. */
    past_types: PokemonPastType[];
}
