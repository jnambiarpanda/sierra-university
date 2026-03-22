// Copyright Sierra

import { PromptContext, jsx, useRootStore } from "@sierra/agent";

// This won't work yet until you add the customer info to the root store.
// We'll be showing you how to do that during the workshop.
export function DynamicCustomerInfo() {
    const [rootStore, _] = useRootStore();
    const customer = rootStore["customer"] as
        | {
              first_name: string;
              last_name: string;
              email: string;
              phone: string;
          }
        | undefined;
    if (!customer) {
        return null;
    }
    const namePrompt =
        customer.first_name && customer.last_name
            ? `The customer's name is ${customer.first_name} ${customer.last_name}.`
            : "";
    const emailPrompt = `The customer's email is ${customer.email}.`;
    const phonePrompt = `The customer's phone number is ${customer.phone}.`;

    return (
        <PromptContext
            heading="Caller Information"
            content={`${namePrompt} ${emailPrompt} ${phonePrompt}`}
        />
    );
}
