// Copyright Sierra

import { defineIntegration } from "@sierra/integrations-sdk/define";

const catFactsSvg = `<svg
    xmlns="http://www.w3.org/2000/svg"
    version="1.0"
    width="1228.000000pt"
    height="1280.000000pt"
    viewBox="0 0 1228.000000 1280.000000"
    preserveAspectRatio="xMidYMid meet"
>
    <g
        transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
        fill="#000000"
        stroke="none"
    >
        <path d="M3192 12780 c-156 -56 -378 -289 -574 -605 -42 -66 -94 -152 -116 -191 -41 -70 -42 -71 -89 -78 -145 -19 -547 -48 -739 -53 -212 -6 -223 -5 -265 15 -24 12 -150 113 -279 224 -514 442 -745 603 -882 616 -46 4 -50 3 -87 -36 -142 -148 -125 -508 72 -1564 l33 -176 -53 -79 c-64 -95 -136 -261 -168 -389 -148 -583 78 -1206 669 -1844 138 -149 150 -170 228 -400 80 -235 80 -235 72 -515 -7 -288 2 -372 62 -558 57 -176 121 -316 319 -702 451 -877 585 -1161 615 -1302 23 -104 15 -1487 -10 -1823 -24 -327 -59 -551 -99 -628 -23 -45 -41 -61 -108 -97 -160 -85 -307 -268 -328 -407 -16 -107 57 -225 184 -298 57 -33 60 -37 61 -74 0 -100 66 -255 127 -302 19 -14 73 -42 119 -60 189 -76 423 -110 594 -85 155 23 228 57 378 175 178 140 241 216 336 404 l46 92 38 -6 c273 -44 347 -60 344 -74 -2 -8 -13 -51 -24 -95 -44 -170 -5 -309 119 -431 75 -75 174 -127 281 -149 337 -69 1034 16 1883 231 l255 65 45 -25 c131 -73 326 -110 543 -104 261 9 430 56 759 214 223 108 444 185 662 233 1016 221 2224 121 2710 -224 309 -219 250 -439 -170 -635 -264 -124 -699 -249 -1173 -336 l-152 -28 -75 -76 c-137 -137 -190 -233 -183 -331 7 -96 70 -157 211 -205 381 -130 1000 -50 1667 213 648 256 1081 598 1201 950 35 100 33 250 -3 350 -53 149 -201 323 -424 504 -935 753 -2510 1100 -3989 879 -71 -10 -166 -26 -210 -35 -44 -8 -85 -15 -91 -15 -8 0 -5 23 8 68 142 503 244 1100 279 1645 15 234 6 840 -15 1042 -67 621 -236 1188 -488 1628 -440 772 -1125 1289 -2076 1568 -146 42 -180 62 -442 260 -177 134 -255 210 -289 282 -90 189 -363 482 -584 627 -49 33 -93 60 -98 62 -5 2 -26 53 -48 113 -105 298 -219 549 -292 645 l-42 54 21 141 c26 172 48 339 68 527 21 195 30 643 15 788 -34 350 -156 493 -359 420z" />
    </g>
</svg>`;

/** Definition for the Cat Facts API integration */
export const definition = defineIntegration({
    /**
     * name: A unique identifier (slug) for this integration.
     * Should be lowercase with dashes, e.g., "my-api".
     */
    name: "cat-facts-api",

    /**
     * title: A human-readable display name shown in Agent Studio UI.
     * Can include spaces, proper casing, and special characters, e.g., "My API Integration".
     */
    title: "Cat Facts API",

    version: "0.0.0",

    description: "Cat Facts API is a RESTful API that provides random cat facts.",
    tags: ["Fun"],
    provider: {
        key: "catFactsApi",
        title: "Cat Facts API",
        logo: {
            type: "svg",
            value: catFactsSvg,
        },
    },
    fields: [],
});

// Export as default
export default definition;
