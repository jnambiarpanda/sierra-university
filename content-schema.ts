// Copyright Sierra

import { BaseSchema, Guardrails, Intents, Transfers, extend } from "@sierra/content-schema";

const schema = extend(
    // required
    BaseSchema,

    // optional -- removing these will disable corresponding features in the agent
    Intents,
    Guardrails,
    // NOTE: if the agent relies on escalations, use `TransfersWithEscalations`
    Transfers
);

export default schema;
