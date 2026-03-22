// Copyright Sierra

import { jsx, Respond, useOutput } from "@sierra/agent";

export const SierraUniversityAbuseDetection = () => {
    const output = useOutput();
    return (
        <Respond
            mode="verbatim"
            onComplete={() => {
                output.send({ type: "complete", reason: "Abuse Detected" });
            }}
        >
            You've activated the Sierra University Abuse Detection system. I'm ending this
            conversation using an output event of "complete".
        </Respond>
    );
};
