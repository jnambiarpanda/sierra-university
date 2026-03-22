These snippets are designed for your Sierra University instructor to help them run the demo portions
of Sierra University with fewer typos. You're free to peruse these examples, but you probably want
to look at the student-workbook.md for code snippets specific to your assignments.

## Demo #1: Updating a brand object

Add the following to your `createAgent` parameters:

```TypeScript
    brand: {
        agentName: "Otto the Owl",
        organizationName: "Sierra Outfitters",
        customerServiceTeamName: "Sierra Outfitters Customer Care",
        customerNoun: "member",
    },
```

## Demo #2: Creating a tool

This will create the tool "skeleton" that still needs to be filled out.

```TypeScript
const CountWordsTool = tools.registerTool({
    type: "lookup",
    name: "CountWords",
    description: "Count the number of words in the conversation so far",
    noCodeId: "count-words-tool",
    params: {},
    func: (ctx, params, controls) => {
        // TODO: Fill this out
        return {};
    },
});
```

And the implementation:

```TypeScript
        const words = ctx.conversation.map(message => message.content).join(" ").split(" ").length;
        return controls.result({
            data: words.toString(),
        });
        // In a case as simple as this, you could also do:
        // return { wordCount: words };
```

Don't forget that you still need to add the tool in Agent Studio to see it.

For fun, try adding an instruction to your result.

```TypeScript
            instructions: "Provide your answer to the user IN ALL CAPS.",
```

## Demo #3: Creating a tool that makes a network call

```TypeScript
const SearchForItems = tools.registerTool({
    type: "lookup",
    name: "SearchForItem",
    description: "Search for an item in the Sierra Outfitters inventory. This will return a list of products that match the query and include pricing, inventory, review scores, and variants",
    noCodeId: "search-for-item-tool",
    params: {
        query: toolParam.string("A word to search for in the product name or description"),
    },
    func: (ctx, params, controls) => {
        const response = fetch.jsonSync<any>(
            `https://gosierra.biz/api/v1/products?q=${encodeURIComponent(params.query)}&page=1&limit=5`,
            {
                method: "GET",
                headers: {
                    "X-API-Key": "sierra_u",
                },
            }
        );

        return controls.result({
            data: response.body,
        });
    },
});
```

Try searching for a sleeping bag, kayak, poles, etc.

## Demo #4: Saving to root storage

Let's authenticate a user!

Call our endpoint to send an OTP code

```TypeScript
const SendOtpCode = tools.registerTool({
    type: "action",
    name: "SendOtpCode",
    description: "Send an OTP code to the customer",
    noCodeId: "send-otp-code",
    params: {
        phoneNumber: toolParam.string("The phone number to send the OTP code to"),
    },
    func: (ctx, params, controls) => {
        const response = fetch.jsonSync<any>(`https://gosierra.biz/api/v1/auth/otp/send`, {
            method: "POST",
            headers: {
                "X-API-Key": "sierra_u",
            },
            body: {
                phone: params.phoneNumber,
            },
        });
        const auth_session_id = response.body.data.auth_session_id;

        ctx.store.update(prev => ({
            ...prev,
            auth_session_id: auth_session_id,
        }));
        return controls.result({ data: { status: "initiated" } });
    },
});
```

Call an endpoint to verify an OTP code

```TypeScript
const VerifyOtpCode = tools.registerTool({
    type: "action",
    name: "VerifyOtpCode",
    description: "Verify an OTP code sent to the customer",
    noCodeId: "verify-otp-code",
    params: {
        otpCode: toolParam.string(
            "The OTP code to verify, submitted by the customer. Should be 6 digits."
        ),
    },
    func: (ctx, params, controls) => {
        const auth_session_id = ctx.store.value["auth_session_id"];
        const response = fetch.jsonSync<any>(`https://gosierra.biz/api/v1/auth/otp/verify`, {
            method: "POST",
            headers: {
                "X-API-Key": "sierra_u",
            },
            body: {
                code: params.otpCode,
                auth_session_id: auth_session_id,
            },
        });
        // check if the response is successful
        if (response.status !== 200 || !response.body || !response.body.data.token) {
            return controls.error("Failed to verify OTP code");
        }

        const sessionToken = response.body.data.token;
        // Store the session token in the root store
        ctx.store.update(prev => ({
            ...prev,
            sessionToken: sessionToken,
        }));

        return controls.result({ data: { status: "verified" } });
    },
});
```

Create the journey in agent studio. It's shockingly simple.

**Condition**: The customer has indicated that they would like to sign in

**Goal**: Sign in the customer by sending and then verifying an OTP code

Show how the auth_session_id is returned when you generate a code, and how it's automatically sent
when you verify the code

(We don't actually need to authenticate the user, so just explain how this would be useful in a
real-life scenario, including how this journey might actually be a component instead of a journey)

## Demo #5: Creating a new integration

(This is a somewhat complex demo, so feel free to skip it if you'd like. Make sure you register for
an API key at https://ridb.recreation.gov/docs/)

Let's integrate with the https://ridb.recreation.gov/docs APIs so we can search for camping, hiking,
etc places near us!

Step 1: `pnpm sierra init-integration` Call it Recreation Gov

In your definition, feel free to add this logo:

```TypeScript
    logo: { type: "svg", value: `<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.024 14.5601C10.7142 15.484 9.5593 15.946 8.89964 15.4977C8.74324 15.3914 8.60834 15.2565 8.50206 15.1001C8.0538 14.4405 8.51575 13.2856 9.43967 10.9758C9.63673 10.4831 9.73527 10.2368 9.90474 10.0435C9.94792 9.99429 9.99429 9.94792 10.0435 9.90474C10.2368 9.73527 10.4831 9.63673 10.9758 9.43966C13.2856 8.51575 14.4405 8.0538 15.1001 8.50206C15.2565 8.60834 15.3914 8.74324 15.4977 8.89964C15.946 9.5593 15.484 10.7142 14.5601 13.024C14.363 13.5166 14.2645 13.763 14.095 13.9562C14.0518 14.0055 14.0055 14.0518 13.9562 14.095C13.763 14.2645 13.5166 14.363 13.024 14.5601Z" stroke="#1C274C" stroke-width="1.5"/>
<path d="M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.48697 8.47087 3.33782 7" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
</svg>
` },
```

This documentation:

```TypeScript
    documentation: `
See the [Recreaction.gov API documentation](https://ridb.recreation.gov/docs) for more information.
`,
```

And this field! (We're not really going to use per-environment keys, but it's a nice demo)

```TypeScript
    fields: [
        defineField({
            name: "apiKey",
            label: "API Key",
            type: "per_environment",
            childType: { type: "text" },
        }),
    ],
```

Remember to call `pnpm sierra integrations build` at this point.

Step 2: Update your api.ts file

At this at the top

```TypeScript
const RIDB_BASE_URL = "https://ridb.recreation.gov/api/v1";
```

Then replace all of `registerFunctions` with:

```TypeScript
    .registerFunctions({
        searchFacilities: makeFunction({
            description:
                "Search for recreation facilities (campgrounds, parks, trails, etc.) in your state",
            params: {
                query: {
                    type: "string",
                    description: "Search term to filter by facility name, description, or keywords",
                    optional: true,
                },
                state: {
                    type: "string",
                    description: "The 2-letter abbreviation for the state we're searching in (e.g. CA or MA)",
                },
                activity: {
                    type: "string",
                    description: "Comma-delimited list of activity IDs or keywords, e.g. 'camping,hiking'",
                    optional: true,
                },
                limit: {
                    type: "number",
                    description: "Number of results to return (max 50, default 3)",
                    optional: true,
                },
            },
            output: {
                type: "object",
                description: "Search results for facilities in your state",
                additionalProperties: "any",
            },
            func: (ctx, params) => {
                const { apiKey } = resolveEnvironment(ctx.settings);
                const qs: string[] = [
                    `limit=${params.limit ?? 3}`,
                    "full=true",
                ];
                if (params.query) qs.push(`query=${encodeURIComponent(params.query)}`);
                if (params.state) qs.push(`state=${encodeURIComponent(params.state)}`);
                if (params.activity) qs.push(`activity=${encodeURIComponent(params.activity)}`);

                const response = fetch
                    .jsonSync<{ RECDATA: any[]; METADATA: any }>(
                        `${RIDB_BASE_URL}/facilities?${qs.join("&")}`,
                        { headers: { apikey: apiKey ?? "" } },
                    );
                return response.body;
           },
        }),
    });

```

TypeScript will complain about your function, but that's fine for now.

Step 3: Try it!

- You might need to stop and restart `sierra watch`
- Go into your integrations. Enable Recreation.gov
- Add your API key on the configuration screen.
- Add a tool!
    - Name: FindRecreationFacilities
    - Description: Find campsites and other recreation sites in my state
    - Input:
        - Activity: Text, Optional, A comma delimited of activities this place should support (e.g.
          camping, hiking, etc.)
        - State: Text, Required, Two letter abbreviation for the state we're interested in
    - Implementation

```TypeScript
        	const searchResults = ctx.apis.recreactionGovApi.searchFacilities({ state: params.state, activity: params.activity })
	        return searchResults;
```

Notice that a) This works, but b) You get a loooooot of data back. Also, this object isn't strongly
typed. No fun tab completion or anything.

Step 4: Improve it.

Copy and paste the following into your api.ts code:

```TypeScript
interface SimplifiedFacility {
    facilityId: string;
    name: string;
    type: string;
    description: string;
    directions: string;
    latitude: number;
    longitude: number;
    phone: string;
    adaAccess: string;
    reservable: boolean;
    keywords: string;
    activities?: string[];
    recArea?: string;
    organization?: string;
    officialUrl?: string;
    feeDescription?: string;
    image?: { title: string; description: string; url: string };
}

function simplifyFacilityObject(raw: Record<string, any>): SimplifiedFacility {
    const media = raw["MEDIA"] as any[] | undefined;
    const primaryImage = media?.find((m: any) => m["IsPrimary"]) ?? media?.[0];
    const activities = (raw["ACTIVITY"] as any[] | undefined)
        ?.map((a: any) => a["ActivityName"] as string)
        .filter(Boolean);
    const recArea = (raw["RECAREA"] as any[] | undefined)?.[0]?.["RecAreaName"];
    const org = (raw["ORGANIZATION"] as any[] | undefined)?.[0]?.["OrgName"];
    const officialLink = (raw["LINK"] as any[] | undefined)?.find(
        (l: any) => l["LinkType"] === "Official Web Site",
    );
    const feeDescription = raw["FacilityUseFeeDescription"] || undefined;

    return {
        facilityId: raw["FacilityID"],
        name: raw["FacilityName"],
        type: raw["FacilityTypeDescription"],
        description: raw["FacilityDescription"],
        directions: raw["FacilityDirections"],
        latitude: raw["FacilityLatitude"],
        longitude: raw["FacilityLongitude"],
        phone: raw["FacilityPhone"],
        adaAccess: raw["FacilityAdaAccess"],
        reservable: raw["Reservable"],
        keywords: raw["Keywords"],
        ...(activities?.length && { activities }),
        ...(recArea && { recArea }),
        ...(org && { organization: org }),
        ...(officialLink && { officialUrl: officialLink["URL"] }),
        ...(feeDescription && { feeDescription }),
        ...(primaryImage && {
            image: {
                title: primaryImage["Title"],
                description: primaryImage["Description"],
                url: primaryImage["URL"],
            },
        }),
    };
}
```

Replace your output type with this

```TypeScript
            output: {
                type: "object",
                description: "Search results with somewhat simplified facility objects",
                properties: {
                    facilities: {
                        type: "array",
                        items: {
                            type: "object",
                            description: "A recreation facility",
                            properties: {
                                facilityId: { type: "string", description: "Unique facility ID for use in follow-up queries" },
                                name: { type: "string", description: "Facility name" },
                                type: { type: "string", description: "Facility type, e.g. 'Campground'" },
                                description: { type: "string", description: "HTML description with overview, recreation info, and nearby attractions" },
                                directions: { type: "string", description: "Driving directions to the facility" },
                                latitude: { type: "number", description: "Latitude in decimal degrees" },
                                longitude: { type: "number", description: "Longitude in decimal degrees" },
                                phone: { type: "string", description: "Contact phone number" },
                                adaAccess: { type: "string", description: "ADA accessibility flag" },
                                reservable: { type: "boolean", description: "Whether the facility accepts reservations" },
                                keywords: { type: "string", description: "Comma-separated search keywords" },
                                activities: { type: "array", items: { type: "string", description: "Activity name" }, optional: true },
                                recArea: { type: "string", description: "Parent recreation area name", optional: true },
                                organization: { type: "string", description: "Managing organization name", optional: true },
                                officialUrl: { type: "string", description: "Official website URL", optional: true },
                                feeDescription: { type: "string", description: "Fee information", optional: true },
                                image: {
                                    type: "object",
                                    description: "Primary image for the facility",
                                    optional: true,
                                    properties: {
                                        title: { type: "string", description: "Image title" },
                                        description: { type: "string", description: "Image description" },
                                        url: { type: "string", description: "Image URL" },
                                    },
                                },
                            },
                        },
                    },
                    totalCount: { type: "number", description: "Total number of matching facilities" },
                    error: { type: "string", description: "Error message if the request failed", optional: true },
                },
            },
```

Change that `return response.body` to this:

```TypeScript
                if (response?.body) {
                    return {
                        facilities: response.body["RECDATA"].map(simplifyFacilityObject),
                        totalCount: response.body["METADATA"]?.["RESULTS"]?.["TOTAL_COUNT"] ?? 0,
                    };
                } else {
                    return { facilities: [], totalCount: 0, error: "Failed to fetch facilities" };
                }
```

Note that Claude is great at handling this kind of tedious work.

Note now that your API returns very clean objects, you get nice tab completion in the editor, the
integration page has nice documentation, and more. It's still a lot of data -- I might simplify the
description in a real integration, but it's pretty darned good.

## Demo #6: Knowledge Scrapers

Demo the knowledge scraper in `knowledge.ts` -- note how it takes our single FAQ page and breaks it
up until multiple articles.

Add it to your agent by adding a new Knowledge Base

## Demo #7: Swapping voices on the fly

Start by adding jade hardy with mutli language support

```TypeScript
    onVoiceCheck: vcd => {
        return {
            voiceInputSupported: true, // Enable voice.
            persona: "jade-hardy-multi",
            transcriptionOptions: { locale: "multi", provider: "default" },
            enableDynamicTranscriptionSettings: true,
        } satisfies VoiceCheckOutput;
    },

```

Then, add `<DynamicLanguageSwitching />` to your AdditionalGoalAgentChildren. (You might need to
import it.)

That's it! Talk to your agent and ask it to continue the conversation in French or Spanish. (Note
this only works with Sierra University at the moment -- other orgs might not support this yet.)

## Demo #8: Transfers and speed bumps

First, replace our useCustomGoalAgentProps with this:

```TypeScript
    // Goal agent props are the properties passed to the GoalAgent component under the hood
    useCustomGoalAgentProps: () => {
        const output = useOutput();
        const conversation = useConversation();
        const brand = useBrand();

        return {
            transferToolProps: {
                params: {
                    name: toolParam.string(
                        "The customer's name. Full name if they offer it, but first name is fine. Do not guess. This should be supplied either by the customer or as the result of a tool call where we fetched customer information."
                    ),
                    reason: toolParam.choice(
                        "The reason the user is reaching out to customer support",
                        [
                            "RETURN_POLICY",
                            "ORDER_SEARCH",
                            "TECHNICAL_ISSUE",
                            "LOGIN_ISSUE",
                            "OTHER_QUESTION",
                            "LOYALTY_PROGRAM",
                            "DAMAGED_PRODUCT",
                            "DID_NOT_SPECIFY",
                        ]
                    ),
                },

                func: (params, controls) => {
                    // Do something here
                    return {};
                },
            },
        };
    },
```

Note how it will categorize the conversation! And hopefully ask the user for their name.

Second, replace the implementation block with this:

```TypeScript
                    // Generate a conversation summary! Human agents appreciate this.
                    const summary = summarizeConversation({
                        brand,
                        messages: conversation,
                        lengthInstructions: ["50 words at most"],
                        additionalInstructions: [],
                    });
                    info(`Summary: ${summary}`);

                    info(`This conversation has ${conversation.length} messages.`);
                    if (conversation.length < 5 && params.reason === "DID_NOT_SPECIFY") {
                        return controls.result({
                            data: {
                                transfer: "failed",
                            },
                            instructions:
                                "The customer should at least tell you why they are reaching out to customer support.",
                        });
                    }

                    output.send({
                        type: "transfer",
                        isSync: true,
                        data: {},
                        transferData: {
                            phone: {
                                action: "Transfer",
                                phoneNumber: "+14155551212",
                            },
                            custom: {
                                reason: params.reason ?? "",
                                summary: summary,
                                name: params.name ?? "",
                            },
                        },
                    });
                    return controls.result({
                        data: {
                            transfer: "success",
                        },
                    });
```

Third, feeling brave? Add your phone number in the transfer section! Create a dev: target pointing
to your workspace. Add an inbound PSTN phone number pointing to that dev target, then have somebody
call your agent and request a transfer. If all has gone well, they should

Note that you should turn off any Do Not Disturb settings you might have.

## Demo #9: Load up some user info!

First, add this code to your useWrapper code. This will load up customer information if we find
their ID in memory. (Probably should be more like a session ID, but this will work for now.)

```TypeScript
        const [rootStore, setRootStore] = useRootStore();
        const memory = useMemory();
        const apis = apiContext.apis();
        useEffectOnce(() => {
            // Actually, should be more like a session token, but we'll use this for now.
            const customer = memory.variable("customerId") ?? "";
            if (customer !== "") {
                const response = apis.sierraOutfitters.getCustomerInfo({
                    customerId: customer,
                });
                const { addresses, ...customerInfo } = response;
                if (customerInfo) {
                    setRootStore(prev => ({
                        ...prev,
                        customer: customerInfo,
                    }));
                }
            }
        });
```

Then we can add this into our context. Add `<DynamicCustomerInfo>` into your
additionalGoalAgentChildren. (You'll probably need to import it.)

Make sure to let people see what's in this component you're adding.

You can test this by adding a memory variable (just a variable) to your dev chat. Your agent will
probably greet you by name! (Note that you should fully clear your dev chat and restart it.)

## Demo #9.5: Need to show a client event?

If you want to show a client event handler, here's a simple one to respond to when a user says
"Stop". Good for everybody who grew up in the 90s

```TypeScript

            case "message":
                if (
                    event.message.role === "user" &&
                    event.message.content.toLowerCase() === "stop"
                ) {
                    if (Math.random() < 0.5) {
                        conversation.output.send({
                            type: "message",
                            message: {
                                role: "assistant",
                                content: "Hammertime!",
                            },
                        });
                    } else {
                        conversation.output.send({
                            type: "message",
                            message: {
                                role: "assistant",
                                content: "Collaborate and listen",
                            },
                        });
                    }
                } else {
                    next(props);
                }
                break;
```

What's probably most interesting is what happens when you forget to include next(props)

## Demo #10: Add an attachment

Let's create a function that returns tracking information, but let's put the tracking events inside
of an attachment, so we can maybe show it off in a little widget or soemething.

```TypeScript
const GetTrackingInfoWithAttachment = tools.withContexts(apiContext).registerTool({
    type: "lookup",
    name: "GetTrackingInfoWithAttachment",
    description:
        "Get information about a shipment and return a widget to display the tracking information",
    noCodeId: "get-tracking-info-with-attachment",
    params: {
        shipmentId: toolParam.string("The ID of the shipment to get information about"),
    },
    func: (ctx, params, controls) => {
        const trackingInfo = ctx.apis.sierraOutfitters.getShipmentTracking({
            shipmentId: params.shipmentId,
        });
        const { events, ...trackingInfoWithoutEvents } = trackingInfo;
        return controls.result({
            data: { trackingInfo: trackingInfoWithoutEvents },
            attachments: {
                id: "tracking-events-group",
                description: "Tracking events for the shipment",
                data: [
                    {
                        type: "custom",
                        data: {
                            type: "tracking-events",
                            trackingInfo: trackingInfo.events,
                        },
                    },
                ],
            },
        });
    },
});
```

Add this to your "Where is my stuff?" journey. Make sure to **disable** any other tools you might
have already running.

Run this! You should see the events appear in the View Raw Attachment line

Great, next, let's render this somehow.

Run `pnpm sierra init-web` to generate the web project.

Add the payload:

```TypeScript
type TrackingEventsPayload = {
    type: "tracking-events";
    trackingInfo: Array<{
        description: string;
        location: string;
        status: string;
        timestamp: string;
    }>;
};
```

And a really boring way to render this

```TypeScript
const TrackingEventsDeclaration = reactDeclaration<TrackingEventsPayload>({
    type: "tracking-events", // this should be a unique string
    name: "Tracking Events",
    description: "Tracking events for the shipment",
    renderPreview: data => {
        return (
            <div>
                {data?.trackingInfo.map(event => (
                    <div>{event.description}</div>
                ))}
            </div>
        );
    },
    render: (data, opts) => {
        return (
            <div>
                {data.trackingInfo.map(event => (
                    <div>==&gt; {event.description} &lt;==</div>
                ))}
            </div>
        );
    },
});
```

Make sure to fix the exports.

```TypeScript
const attachmentTypes = [
    CarouselDeclaration,
    ChatImageDeclaration,
    DateTimeSelectorDeclaration,
    TrackingEventsDeclaration,
];

export default defaultReactWebConfig(attachmentTypes);
```

That's fine, but boy is it boring! Let's make it fancy. Ask cursor to make this fun and interactive.
Here's a sample prompt.

```
Hi, cursor. See this render function here? This is used to share some tracking information to our user. The problem is, it's boring! I would like this to be exciting! Give it some visual flair! Make it fun and exciting to use! Add animations! Make it interactive! Let me view these events one at a time! Feel free to be creative as possible.
```

## Demo #11: Add a test or two!

Create a new file in your `tests` folder, and add the following:

```TypeScript
import { describe, type Scenario } from "@sierra/agent/test/api";

const customerOrders: Scenario[] = [
    {
        title: "Where is my order?",
        description: "Where is my order inquiry",
        fixture: {
            instructions: `You are calling to find out the status of your order, which you expected to arrive today.
                It is order number ord_m008 and your email is todd@sierra.ai, but don't offer this information unless the agent asks for it.
                 Once you have the order status, you don't need anything else.`,
        },
        expectedOutcomes: [
            `The agent tells the customer that their order is processing, but hasn't shipped yet.`,
        ],
        assertions: ["journey-order-status"],
        isCritical: false,
    },
    {
        title: "Make a sad customer happy",
        description: "Where is my order inquiry",
        fixture: {
            instructions: `You are calling to find out the status of your order, which you expected to arrive today.
                It is order number ord_m008 and your email is todd@sierra.ai, but don't offer this information unless the agent asks for it.
                If you are told that your order has arrived late, say that you are quite unhappy about it.
                If the agent offers to send you a coupon, say yes.
                If you are given a coupon or discount, change your tune! Be upbeat and grateful!`,
        },
        expectedOutcomes: [
            `The agent tells the customer that their order is processing, but hasn't shipped yet.`,
            `The agent generates a coupon code to make up for the inconvenience.`,
        ],
        assertions: ["journey-order-status", "journey-coupon-generated"],
        isCritical: false,
    },
    {
        title: "Where is my order phone call?",
        description: "Where is my order inquiry on phone",
        fixture: {
            userDevice: "voice_phone",
            instructions: `You are calling to find out the status of your order, which you expected to arrive today.
            It is order number ord_e003 and your email is todd@sierra.ai, but don't offer this information unless the agent asks for it.
            Once you have the order status, you don't need anything else.`,
        },
        expectedOutcomes: [`The agent tells the customer that their order was delivered.`],
        assertions: ["journey-order-status"],
        isCritical: false,
    },
];
describe("Order status checks", "customer-order", customerOrders);
```

You can test this with `pnpm sierra test --categories customer-order` from the command line

## Demo #12: Handle file uploads

First, let's create a function to grab the most recent image attachment that our user uploaded.

```TypeScript
function getMostRecentImageUrl(conversation: StandardMessage[]): string {
    // Find the most recent user message that contains any attachments
    const lastUserMessageWithAttachments = [...conversation]
        .reverse()
        .find(
            msg =>
                msg.role === "user" &&
                Array.isArray((msg as StandardMessage).attachments) &&
                (msg as StandardMessage).attachments!.length > 0
        ) as StandardMessage | undefined;

    const attachments = lastUserMessageWithAttachments?.attachments ?? [];

    const firstImageAttachment = attachments.find(
        att => att.type === "file" && att.data?.mimeType?.startsWith("image/")
    );
    info(`Found an image attachment: ${JSON.stringify(firstImageAttachment)}`);
    return firstImageAttachment ? (firstImageAttachment as FileAttachment).data.url : "";
}
```

Next, let's create a tool that helps the user identify what product they're looking for

```TypeScript
const VisualProductIdentifier = tools.registerTool({
    name: "VisualProductIdentifier",
    type: "lookup",
    noCodeId: "visual-product-identifier",
    description:
        "When the customer uploads a photo of an item they might be interested in, use this tool to identify the product they are looking for",
    params: {},
    func: (ctx, params, controls) => {
        // Let's grab the most recent image that the customer uploaded
        const mostRecentImageUrl = getMostRecentImageUrl(ctx.conversation as StandardMessage[]);

        if (mostRecentImageUrl) {
            const imageResult = analyzeImageFuture(
                "Based on the image, describe the product they are looking for in a few words. If you see more than one item, just pick the item that is most prominently featured. It will probably be an item used in outdoorsy or sporting activities.",
                mostRecentImageUrl
            ).get();
            info(`Image analysis result! ${imageResult.analysis}`);
            return controls.result({
                data: {
                    productDescription: imageResult.analysis,
                },
            });
        }
        return controls.error("No image found in the customer's message.");
    },
});
```

Add it at the top level, and then tell the agent you need help identifying a product. Upload an
image of a tent or a sleeping bag or something. Then ask it to find it for you!

(I thought making this part of a larger journey, like a tool to call to identify a product as part
of a return, but that started to feel too complicated.)
