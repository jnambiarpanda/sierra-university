// Copyright Sierra

import {
    defaultReactWebConfig,
    reactDeclaration,
    CarouselDeclaration,
    ChatImageDeclaration,
    DateTimeSelectorDeclaration,
    FileAttachmentDeclaration,
} from "@sierra/web-react";

// Import css for the built-in components
import "@sierra/web-react/dist/sierra.css";

// ─────────────────────────────────────────────────────────────────────────────
// Channel Cards Attachment
// Renders a row of SiriusXM channel artwork tiles with name + channel number.
// ─────────────────────────────────────────────────────────────────────────────

type ChannelCardItem = {
    channelKey: string;
    channelName: string;
    channelNumber: string;
    imageUrl: string;
    playerLandingPage?: string;
    description?: string;
};

type ChannelCardsPayload = {
    type: "channel-cards";
    title?: string;
    channels: ChannelCardItem[];
};

const ChannelCardsAttachment = reactDeclaration<ChannelCardsPayload>({
    type: "channel-cards",
    name: "Channel Cards",
    description: "SiriusXM channel artwork tiles",
    renderPreview: data => {
        const props = data ?? { channels: [] };
        return (
            <div style={{ display: "flex", gap: 8 }}>
                {props.channels.slice(0, 3).map((ch: ChannelCardItem) => (
                    <a
                        key={ch.channelKey}
                        href={ch.playerLandingPage}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "block", lineHeight: 0 }}
                    >
                        <img
                            src={ch.imageUrl}
                            alt={ch.channelName}
                            style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }}
                        />
                    </a>
                ))}
            </div>
        );
    },
    render: data => {
        const props = data ?? { channels: [], title: "" };
        return (
            <div style={{ fontFamily: "sans-serif", padding: "8px 0" }}>
                {props.title && (
                    <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#333" }}>
                        {props.title}
                    </p>
                )}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {props.channels.map((ch: ChannelCardItem) => (
                        <a
                            key={ch.channelKey}
                            href={ch.playerLandingPage}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: "none", color: "inherit" }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 5,
                                    width: 72,
                                }}
                            >
                                <img
                                    src={ch.imageUrl}
                                    alt={ch.channelName}
                                    style={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: 10,
                                        objectFit: "cover",
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 10,
                                        textAlign: "center",
                                        color: "#444",
                                        lineHeight: 1.3,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {ch.channelName}
                                </span>
                                <span style={{ fontSize: 9, color: "#999" }}>Ch. {ch.channelNumber}</span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        );
    },
});

const attachmentTypes = [
    CarouselDeclaration,
    ChatImageDeclaration,
    DateTimeSelectorDeclaration,
    FileAttachmentDeclaration,
    ChannelCardsAttachment,
];

export default defaultReactWebConfig(attachmentTypes);
