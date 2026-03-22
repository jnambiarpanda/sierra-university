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
const SPANISH = { label: LanguageName.SpanishLatam, id: "es-MX" };
const FRENCH = { label: LanguageName.French, id: "fr-FR" };

export function DynamicLanguageSwitching() {
    const voice = useVoice();
    const detectedLanguage = useDetectLanguage([ENGLISH, SPANISH, FRENCH], true);
    const [activeLang, setActiveLang] = useState("en-US");

    useEffect(() => {
        setActiveLang(detectedLanguage.id);
    }, [detectedLanguage.id]);

    // Apply voice settings whenever detected voice changes
    useEffect(() => {
        if (activeLang === "es-MX") {
            voice.updateVoiceSettings({
                persona: "isabel-rios",
                transcriptionOptions: { locale: "es-MX" },
            });
            addAgentTags(["voice-switched:spanish"]);
        } else if (activeLang === "en-US") {
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

    // Or... apply voice settings whenever the customer requests a language change
    return (
        <>
            <Condition
                when={when.some(
                    when.fact(activeLang === "en-US", "currently_speaking_english"),
                    when.fact(activeLang === "fr-FR", "currently_speaking_french")
                )}
            >
                <Condition when={when.observation(["The customer requests Spanish or español."])}>
                    {activeLang !== "es-MX" && <OnActivation fn={() => setActiveLang("es-MX")} />}
                </Condition>
            </Condition>
            <Condition
                when={when.some(
                    when.fact(activeLang === "es-MX", "currently_speaking_spanish"),
                    when.fact(activeLang === "fr-FR", "currently_speaking_french")
                )}
            >
                <Condition when={when.observation(["The customer requests English."])}>
                    {activeLang !== "en-US" && <OnActivation fn={() => setActiveLang("en-US")} />}
                </Condition>
            </Condition>
            <Condition
                when={when.some(
                    when.fact(activeLang === "en-US", "currently_speaking_english"),
                    when.fact(activeLang === "es-MX", "currently_speaking_spanish")
                )}
            >
                <Condition when={when.observation(["The customer requests French."])}>
                    {activeLang !== "fr-FR" && <OnActivation fn={() => setActiveLang("fr-FR")} />}
                </Condition>
            </Condition>
        </>
    );
}
