// Copyright Sierra

import {
    Condition,
    jsx,
    useVoice,
    useEffect,
    useState,
    useDetectLanguage,
    OnActivation,
    addAgentTags,
    when,
    LanguageName,
} from "@sierra/agent";

const ENGLISH = { label: LanguageName.EnglishUS, id: "en-US" };
const FRENCH = { label: LanguageName.French, id: "fr-FR" };

export function DynamicLanguageSwitching() {
    const voice = useVoice();
    const detectedLanguage = useDetectLanguage([ENGLISH, FRENCH], true);
    const [activeLang, setActiveLang] = useState("en-US");

    useEffect(() => {
        setActiveLang(detectedLanguage.id);
    }, [detectedLanguage.id]);

    // Apply voice settings whenever detected language changes
    useEffect(() => {
        if (activeLang === "en-US") {
            voice.updateVoiceSettings({
                persona: "daisy-jordan",
                transcriptionOptions: { locale: "en-US" },
            });
            addAgentTags(["voice-switched:english"]);
        } else if (activeLang === "fr-FR") {
            voice.updateVoiceSettings({
                persona: "guillaume-lefevre",
                transcriptionOptions: { locale: "fr-FR" },
            });
            addAgentTags(["voice-switched:french"]);
        }
    }, [activeLang]);

    return (
        <>
            <Condition when={when.fact(activeLang === "en-US", "currently_speaking_english")}>
                <Condition when={when.observation(["The customer requests French or français."])}>
                    {activeLang !== "fr-FR" && <OnActivation fn={() => setActiveLang("fr-FR")} />}
                </Condition>
            </Condition>
            <Condition when={when.fact(activeLang === "fr-FR", "currently_speaking_french")}>
                <Condition when={when.observation(["The customer requests English."])}>
                    {activeLang !== "en-US" && <OnActivation fn={() => setActiveLang("en-US")} />}
                </Condition>
            </Condition>
        </>
    );
}
