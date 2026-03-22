// Copyright Sierra

import { newIntegrationApi, makeFunction } from "@sierra/agent";
import type { CatFactsApiConfig } from "./types";

export default newIntegrationApi<CatFactsApiConfig>()
    .withContexts({
        // No additional contexts needed for this simple integration
    })
    .registerFunctions({
        getCatFact: makeFunction({
            description: "Get a random cat fact",
            params: {},
            output: {
                type: "object",
                description: "Cat fact response",
                // TODO Part 2: Add the properties for the cat fact response.
            },
            func: (_ctx, _params) => {
                // TODO: Implement the actual call to the cat facts API
                // at https://catfact.ninja/fact and replace the object
                // returned below
                return {
                    fact: "This is a test fact. Cats are awesome.",
                    length: 38,
                };
            },
        }),
    });
