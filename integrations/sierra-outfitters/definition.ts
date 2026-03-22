// Copyright Sierra

import { defineField } from "@sierra/content-schema";
import { defineIntegration } from "@sierra/integrations-sdk/define";

/** Definition for the Sierra Outfitters integration */
export const definition = defineIntegration({
    /**
     * name: A unique identifier (slug) for this integration.
     * Should be lowercase with dashes, e.g., "my-api".
     */
    name: "sierra-outfitters",

    /**
     * title: A human-readable display name shown in Agent Studio UI.
     * Can include spaces, proper casing, and special characters, e.g., "My API Integration".
     */
    title: "Sierra Outfitters",

    version: "0.0.0",

    description:
        "Our integration with Sierra Outfitters, your one-stop shop for all your outdoor and sporting goodsneeds.",

    /**
     * tags: Categories for filtering/organizing integrations in Agent Studio.
     * Common tags: "Voice" (telephony), "Chat" (messaging), "CRM" (customer data),
     *              "Data" (data services), "Utility" (helper integrations)
     */
    tags: ["Data"],

    /**
     * logo: Optional branding for the integration shown in Agent Studio.
     * Use a built-in icon or provide a custom SVG.
     */
    // logo: { type: "icon", value: "sierra" },
    // logo: { type: "svg", value: "<svg>...</svg>" },

    documentation: `
See our swagger documentation at https://gosierra.biz/api/v1/docs`,

    fields: [
        defineField({
            name: "apiKey",
            label: "API Key",
            type: "text",
            description:
                "Your Sierra Outfitters API key. It's probably just sierra_u because our security is top-notch.",
        }),
    ],
});

// Export as default
export default definition;
