Welcome, Sierra University Student! This workbook contains a few code snippets that you might find
helpful when working through some of the workshops. Feel free to copy and paste to get started.

Happy coding!

## Exercise 1: Adding a new brand object.

You'll want to add this into your createAgent({}) code. Adding properties to this code is your main
way of modifying your agent's behavior using code.

```TypeScript
brand: {
    agentName: "",
    organizationName: "",
    customerServiceTeamName: "",
    customerNoun: "",
},
```

## Exercise 2: Adding a tool

Here's the basic framework for registering a tool that can be used both in Agent Studio and the SDK.

```TypeScript

const MyAmazingTool = tools
    .registerTool({
        type: "lookup",
        name: "ToolName",
        description: "Tool description goes here",
        noCodeId: "tool-name",
        params: {},
        func: (ctx, params, controls) => {
            return controls.result({
                data: {},
            });
        },
    });

```

Note that if you create this in an external file, you'll want to reference it in useTools

```TypeScript
    useTools: () => {
        return [MyAmazingTool];
    },
```

Want to make a network call? Remember to use Sierra's fetch library!

```TypeScript

const response = fetch.jsonSync<any>("https://gosierra.biz/api/v1", {
    method: "GET",
    headers: {
        "X-API-Key": "sierra_u",
    },
});
```

or

```TypeScript
const response = fetch.jsonSync<any>("https://gosierra.biz/api/v1", {
    method: "POST",
    headers: {
        "X-API-Key": "sierra_u",
    },
    body: {
        customer_id: "customer_1234",
    },
});
```

## Exercise 3 (optional): Fetch from root storage!

Start with this tool, then complete the two TODOs.

```TypeScript
const GetCustomerAddress = tools.registerTool({
    type: "lookup",
    name: "GetCustomerAddress",
    description: "Get the address of the customer",
    noCodeId: "get-customer-address",
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

        // TODO #2: Try to fetch the list of addresses from root store.

        const response = fetch.jsonSync<any>(
            `https://gosierra.biz/api/v1/customers/${fakeCustomerId}/addresses`,
            {
                method: "GET",
                headers: {
                    "X-API-Key": "sierra_u",
                },
            }
        );
        if (response.status !== 200 || !response.body) {
            return controls.error("Failed to get customer address");
        }
        allAddresses = response.body.data;

        // TODO #1: Save the address list to root store

        const address = allAddresses.find((address: any) => address.type === params.addressType);

        return controls.result({
            data: address,
        });
    },
});
```

Need a hint? Remember, you can save or update a value using this pattern

```TypeScript
ctx.store.update(prev => ({
    ...prev,
    some_key: new_value,
}));
```

and you can fetch a value by using:

```TypeScript
ctx.store.value["some_key"];
```

## Exercise 4: Integrations

Let's make angry users happy by generating a coupon for them to use.

First, we should create a tool that calls the method we defined in the integration method. Remember
we'll want to call tools.withContexts() in order to load it in.

```TypeScript
const GenerateCoupon = tools.withContexts(apiContext).registerTool({
    name: "GenerateCoupon",
    type: // What would you add here?
    noCodeId: "generate-coupon-code",
    description: "Generate a coupon for a customer",
    params: {
        // What do you think we need here?
    },
    func: (ctx, params, controls) => {
        const couponObject = ctx.apis.sierraOutfitters.createCoupon({
            // Grab the values from our params object and pass them in here.
        });
        // This is similar to calling `return couponObject`
        return controls.result({
            data: couponObject,
        });
    },
});
```

Add it to a journey. (Perhaps one where we observe the customer is upset and we want to cheer them
up)

Next, consider simplifying the object we return back to the LLM. Maybe return just the coupon code,
the discount type and amount, and the expiration date. Do this by changing how we create the
`couponData` object.

After that, let's make it functional. Remember, to call an API, you can use Sierra's jsonSync
method.

```TypeScript
const response = fetch.jsonSync<any>("https://gosierra.biz/api/v1", {
    method: "POST",
    headers: {
        "X-API-Key": "sierra_u",
    },
    body: {
        parameter_key: "value",
    },
});

// Look at response.body for the results

```

Your coupon generator should now be working! But let's finish up by improving the integration itself
by defining our object properties, so we get nice tab completion and generated documentation. To
define your object properties, add an object like this. Make sure the keys match up with the keys in
your response object.

```TypeScript
properties: {
    property_name: { type: "string", description: "Description Goes here" },
    another_property: { type: "number", description: "Another description" },
},
```

## Exercise 5: Transfers

Here's the code you might write to implement a basic transfer:

```TypeScript
  useCustomGoalAgentProps: () => {
      const output = useOutput();
      // Useful for generating a summary
      const conversation = useConversation();
      const brand = useBrand();

      return {
        transferToolProps: {
          params: {
            parameter_name: toolParam.string("A parameter you might want the agent to pass in"),
            another_parameter: toolParam.string("An optional parameter", { optional: true }),
          },

          func: (params, controls) => {
            const summary = summarizeConversation({
                brand,
                messages: conversation,
                lengthInstructions: ["50 words at most"],
                additionalInstructions: [],
            });
            info(`Summary: ${summary}`);

            // Perform some other logic here!

            // Want to transfer?
            output.send({
                type: "transfer",
                isSync: true,
                data: {},
                transferData: {
                    custom: {
                        data: data_value,
                    }
                }
            });
            return controls.result({
                data: {
                    transfer: "success"
                }
            });
          },
        },
      };
    },
```

## Exercise 6 (optional): Pre-load data

Here's code you'll probably want to add to your useWrapper call to "pre-load" customer data:

```TypeScript
        const [rootStore, setRootStore] = useRootStore();
        const memory = useMemory();
        const apis = apiContext.apis();
        useEffectOnce(() => {
            // Step 1: Grab your customer ID from memory
            // This should probably be more like a session token, but we'll fake it for now
            const someVal = memory.variable("someVal") ?? "";

            // Step 2: Make a call to apis.sierraOutfitters.getCustomerInfo
            const response = apis.sierraOutfitters.getCustomerInfo({
                ...
            });

            // Step 3: Save the information you get back to root Storage

            setRootStore(prev => ({
                ...prev,
                key: value,
            }));
        });
```

Then you can display this dynamically in your additionalGoalAgentChildren

```TSX
<PromptContext
    heading="Customer Information"
    content={`${someInformationMightGoHere}`}
/>
```

## Exercise 7: Attachments

Here's some code to create an attachment from a tool

```TypeScript
const MyAttachmentTool = tools
    .registerTool({
        type: "lookup",
        name: "myAttachmentTool",
        description: "Description",
        noCodeId: "my-attachment-tool",
        params: {},
        func: (ctx, params, controls) => {
            return controls.result({
                data: {},
                attachments: {
                    id: "group-attachment-id",
                    description: "Describe the attachment to the LLM here",
                    data: [
                        {
                            type: "custom",
                            data: {
                                type: "unique-attachment-id",
                                other_data_goes_here: true
                            },
                        },
                    ],
                },

            });
        },
    });
```

Once you've run `pnpm sierra init-web`, add these snippets to your web/main.tsx file:

```TypeScript

type MyAttachmentPayload = {
    type: "unique-attachment-id";
    other_data_goes_here: boolean;
};

const MyAttachmentDeclaration = reactDeclaration<MyAttachmentPayload>({
    type: "unique-attachment-id", // This should match
    name: "My Attachment",
    description: "My custom attachment",
    renderPreview: data => {
        return <div style={{ color: "cyan" }}>{data.other_data_goes_here}</div>;
    },
    render: data => {
        return <div style={{ color: "hotpink" }}>{data.other_data_goes_here}</div>;
    },
});
```

## Exercise 8: Create your own simulation!

There's a couple of ways of creating simulations, but I like using the scenarios object.

```TypeScript
import { describe, type Scenario } from "@sierra/agent/test/api";

const myGroupName: Scenario[] = [
    {
        title: "Test title",
        description: "Test description",
        fixture: {
            instructions: `Instructions to our "customer"`,
        },
        expectedOutcomes: [
            `What we hope to see from the simulation`,
        ],
        assertions: ["required-tags-should-go-here"],
        isCritical: false,
    },
];
describe("My amazing test", "group-id", myGroupName);

```

## Exercise 9 (Optional) Extra Credit: File uploads

You can use logic like this to analyze the conversation and fetch recent attachments

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
    return firstImageAttachment ? (firstImageAttachment as FileAttachment).data.url : "";
}
```

And a tool like this can be used to analyze that data

```tsx
const AnalyzeMyImageTool = tools.registerTool({
    name: "AnalyzeMyImageTool",
    type: "lookup",
    noCodeId: "analyze-my-image",
    description: "A description of your tool would go here",
    params: {},
    func: (ctx, params, controls) => {
        // Let's grab the most recent image that the customer uploaded
        const mostRecentImageUrl = getMostRecentImageUrl(ctx.conversation as StandardMessage[]);

        if (mostRecentImageUrl) {
            const imageResult = analyzeImageFuture(
                "Add instructions here",
                mostRecentImageUrl
            ).get();
            info(`Image analysis result! ${imageResult.analysis}`);
            return controls.result({
                data: {
                    result: imageResult.analysis,
                },
            });
        }
        return controls.error("No image found in the customer's message.");
    },
});
```
