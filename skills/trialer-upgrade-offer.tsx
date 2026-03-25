// Copyright Sierra
// Trialer Upgrade Offer skill — terminal skill for the TrialerConversion journey.
// Renders the subscription upgrade CTA and emits the appropriate outcome tag
// based on whether the user converts, defers, or declines.

import { jsx, Respond, useOutput } from "@sierra/agent";
import { emitTag, Tags } from "../tags";

/**
 * Presented when a trialer engages with the content moment and the agent
 * is ready to surface the upgrade offer. Emits outcome:converted on accept.
 */
export const TrialerUpgradeOffer = () => {
    const output = useOutput();
    return (
        <Respond
            mode="verbatim"
            onComplete={() => {
                emitTag(output, Tags.STAGE_OFFER_PRESENTED);
                emitTag(output, Tags.OFFER_UPGRADE_FULL);
                output.send({ type: "complete", reason: "Upgrade Offer Presented" });
            }}
        >
            You're currently on a free trial — and based on what you love listening to, there's a
            lot more waiting for you. Subscribe today to unlock exclusive artist interviews,
            live performances, and on-demand replays. Ready to upgrade?
        </Respond>
    );
};

/**
 * Presented when the user converts — confirms the subscription and closes the journey.
 */
export const TrialerConversionSuccess = () => {
    const output = useOutput();
    return (
        <Respond
            mode="verbatim"
            onComplete={() => {
                emitTag(output, Tags.RESPONSE_ENGAGED);
                emitTag(output, Tags.OUTCOME_CONVERTED);
                output.send({ type: "complete", reason: "Trialer Converted" });
            }}
        >
            Welcome to SiriusXM! Your subscription is now active. Enjoy unlimited access to the
            content you love — anytime, anywhere.
        </Respond>
    );
};

/**
 * Presented when the user defers — keeps the door open and schedules a follow-up.
 */
export const TrialerConversionDeferred = () => {
    const output = useOutput();
    return (
        <Respond
            mode="verbatim"
            onComplete={() => {
                emitTag(output, Tags.RESPONSE_HESITANT);
                emitTag(output, Tags.OUTCOME_DEFERRED);
                output.send({ type: "complete", reason: "Trialer Deferred" });
            }}
        >
            No problem — your trial is still active. We'll remind you before it ends so you
            don't miss any of the content you've been enjoying.
        </Respond>
    );
};

/**
 * Presented as a fallback when no high-confidence affinity match is found.
 * Offers a trial extension instead of a full upgrade pitch.
 */
export const TrialerExtensionOffer = () => {
    const output = useOutput();
    return (
        <Respond
            mode="verbatim"
            onComplete={() => {
                emitTag(output, Tags.OFFER_TRIAL_EXTENDED);
                output.send({ type: "complete", reason: "Trial Extension Offered" });
            }}
        >
            We'd love to give you more time to discover everything SiriusXM has to offer.
            We can extend your trial — would that help?
        </Respond>
    );
};
