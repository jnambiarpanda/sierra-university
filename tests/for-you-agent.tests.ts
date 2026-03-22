import { describe, test } from "@sierra/agent/test/api";

describe("For You personalization agent", "for-you-agent", () => {
  test("answers Play something for me with combined recommendations", {
    name: "Play something for me",
    messages: "Play something for me",
    expectedOutcomes: ["Agent responds with a list of music or trending content recommendations"],
  });

  test("answers I want news with talk recommendations", {
    name: "I want news",
    messages: "I want news",
    expectedOutcomes: ["Agent responds with talk or news content recommendations"],
  });

  test("answers I want music with music recommendations", {
    name: "I want music",
    messages: "I want music",
    expectedOutcomes: ["Agent responds with music recommendations"],
  });
});
