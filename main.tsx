// Copyright Sierra

import { createAgent } from "@sierra/agent/base";
import { AbuseType, fetch, Goal, jsx, Rule, toolParam, tools } from "@sierra/agent";
import { SierraUniversityAbuseDetection } from "./skills/abuse-detection";
import integrationsRegistry from "./integrations-registry";

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
                <Goal description="Answer questions about baseball rules and regulations using the official MLB Baseball Rules knowledge base.">
                    <Rule content="Use the Baseball Rules knowledge base to answer any questions about official MLB baseball rules." />
                    <Rule content="When citing a rule, include the rule number and section name (e.g., 'Rule 5 – Playing the Game') for clarity." />
                    <Rule content="If the question is not covered by the baseball rules knowledge base, say so clearly rather than guessing." />
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
