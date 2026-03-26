// Copyright Sierra

import { createAgent } from "@sierra/agent/base";
import { AbuseType, addAgentTags, fetch, Goal, jsx, Rule, toolParam, tools } from "@sierra/agent";
import { SierraUniversityAbuseDetection } from "./skills/abuse-detection";
import integrationsRegistry from "./integrations-registry";
import { DynamicCustomerInfo } from "./dynamic-customer-info";
import { TAGS } from "./tags";
import { getUserProfileByPhone, getUserProfileByEmail } from "./data/synthetic-data";

// ─────────────────────────────────────────────────────────────────────────────
// Phase 0 — Caller Identification Tools
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ResolveCallerByPhone — reads clientPhoneNumber from conversation info,
 * looks up the matching profile, and stores it in root store.
 */
const ResolveCallerByPhone = tools.registerTool({
    name: "ResolveCallerByPhone",
    type: "lookup",
    noCodeId: "resolve-caller-by-phone",
    description:
        "Look up the caller's profile using their phone number from the conversation. " +
        "MUST be called as the very first action at the start of every conversation, before saying anything to the customer.",
    params: {},
    func: (ctx, _params, controls) => {
        const phoneNumber = ctx.conversationInfo.clientPhoneNumber;

        if (!phoneNumber || phoneNumber === "Anonymous") {
            addAgentTags([TAGS.stage.emailRequested]);
            return controls.result({
                data: { found: false, reason: "No phone number available for this conversation." },
                instructions: "Ask the customer for their email address to look up their account.",
            });
        }

        const phone = String(phoneNumber);
        const profile = getUserProfileByPhone(phone);

        if (!profile) {
            addAgentTags([TAGS.stage.emailRequested]);
            return controls.result({
                data: { found: false, reason: `No account found for phone number ${phone}.` },
                instructions: "Ask the customer for their email address to look up their account.",
            });
        }

        ctx.store.update(prev => ({
            ...prev,
            customer: {
                first_name: profile.firstName,
                last_name: profile.lastName,
                email: profile.email,
                phone: profile.phone,
            },
            resolvedUserId: profile.userId,
            subscriptionTier: profile.subscriptionTier,
        }));

        addAgentTags([TAGS.stage.callerIdentifiedByPhone]);
        return controls.result({
            data: {
                found: true,
                userId: profile.userId,
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                subscriptionTier: profile.subscriptionTier,
                trialEndDate: profile.trialEndDate ?? null,
            },
            instructions: `Greet the customer warmly using their first name: ${profile.firstName}.`,
        });
    },
});

/**
 * ResolveCallerByEmail — called when phone lookup is unavailable or returns no match.
 */
const ResolveCallerByEmail = tools.registerTool({
    name: "ResolveCallerByEmail",
    type: "lookup",
    noCodeId: "resolve-caller-by-email",
    description:
        "Look up the caller's profile using their email address. " +
        "Use this ONLY after ResolveCallerByPhone has returned found=false or no phone number is available.",
    params: {
        email: toolParam.string(
            "The email address provided by the customer. Must be a valid email address."
        ),
    },
    func: (ctx, params, controls) => {
        const profile = getUserProfileByEmail(params.email);

        if (!profile) {
            addAgentTags([TAGS.stage.callerUnknown]);
            return controls.result({
                data: { found: false, reason: `No account found for email ${params.email}.` },
            });
        }

        ctx.store.update(prev => ({
            ...prev,
            customer: {
                first_name: profile.firstName,
                last_name: profile.lastName,
                email: profile.email,
                phone: profile.phone,
            },
            resolvedUserId: profile.userId,
            subscriptionTier: profile.subscriptionTier,
        }));

        addAgentTags([TAGS.stage.callerIdentifiedByEmail]);
        return controls.result({
            data: {
                found: true,
                userId: profile.userId,
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                subscriptionTier: profile.subscriptionTier,
                trialEndDate: profile.trialEndDate ?? null,
            },
            instructions: `Greet the customer warmly using their first name: ${profile.firstName}.`,
        });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Pre-built loyalty tool (day-1 demo)
// ─────────────────────────────────────────────────────────────────────────────

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
            "The username or email of the customer we want to get loyalty information for."
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
        return controls.result({ data: { loyaltyInfo: result.body.data } });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Agent
// ─────────────────────────────────────────────────────────────────────────────

export default createAgent({
    brand: {
        agentName: "SiriusXM Virtual Assistant",
        organizationName: "SiriusXM",
        customerServiceTeamName: "SiriusXM Customer Care",
        customerNoun: "subscriber",
    },
    config: {
        voiceConfig: {
            enabledEvents: ["start", "inactivity"],
            inactivityTimeoutSeconds: 30,
        },
        textConfig: {
            enabledEvents: ["inactivity"],
            inactivityTimeoutSeconds: 100,
        },
        postConversationDelaySeconds: 60 * 15,
    },
    onClientEvent: (props, next) => {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { event, conversation } = props;
        switch (event.type) {
            default:
                next(props);
        }
    },

    useCustomGoalAgentProps: () => ({}),

    useWrapper: agent => agent,

    useAdditionalGoalAgentChildren: () => {
        return (
            <>
                {/* Phase 0: Render caller info as context for the LLM */}
                <DynamicCustomerInfo />

                {/* Phase 0: Caller identification tools */}
                <ResolveCallerByPhone />
                <ResolveCallerByEmail />

                {/* Phase 0: Identify the caller before asking why they are reaching out */}
                <Goal description="Identify the caller before asking why they are reaching out.">
                    <Rule content="Your very first action MUST be to call ResolveCallerByPhone. Do this before saying anything to the customer." />
                    <Rule content="If ResolveCallerByPhone returns found=false, ask the caller for their email address, then call ResolveCallerByEmail with that email." />
                    <Rule content="If ResolveCallerByEmail also returns found=false, proceed as an anonymous caller without asking for more identification." />
                    <Rule content="After identifying the caller, greet them by their first name if known, then ask why they are reaching out." />
                </Goal>

                <Goal description="Determine why the customer is reaching out to customer support.">
                    <Rule content="If unclear, ask the customer why they are reaching out to customer support." />
                </Goal>
            </>
        );
    },

    useCustomAbuseDetectionProps: () => {
        const allowedBehaviors = [
            "The customer is asking about sports or outdoor activities",
            "The customer has questions about the rules of sports",
            "The customer has a mathematics-related question",
        ];
        return {
            mode: "observe",
            foundAbuseDefendAction: () => <SierraUniversityAbuseDetection />,
            abuseOverrides: {
                [AbuseType.OutOfContext]: { honeypots: allowedBehaviors },
                [AbuseType.OutOfBounds]: { honeypots: allowedBehaviors },
            },
        };
    },

    useTools: () => ({}),

    integrationsRegistry,
});
