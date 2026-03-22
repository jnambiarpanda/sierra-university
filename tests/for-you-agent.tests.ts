import { describe, test } from "@sierra/agent/test/api";

describe("For You personalization agent", "for-you-agent", () => {
  test("answers Play something for me with combined recommendations", {
    name: "Play something for me",
    messages: "Play something for me",
    assertions: ["recommendations"],
  });

  test("answers I want news with talk recommendations", {
    name: "I want news",
    messages: "I want news",
    assertions: ["news-recommendations"],
  });
});