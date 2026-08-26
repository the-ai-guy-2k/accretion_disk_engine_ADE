import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAnalysisSystemPrompt,
  parseAnalysisJson
} from "../src/lib/ai-prompt.ts";
import { aiConfigured } from "../src/lib/ai-config.ts";

test("analysis system prompt forbids invented metrics and requires evidence distinction", () => {
  const prompt = buildAnalysisSystemPrompt().toLowerCase();
  assert.ok(prompt.includes("do not invent"));
  assert.ok(prompt.includes("metrics"));
  assert.ok(prompt.includes("observed"));
  assert.ok(prompt.includes("meaning"));
  assert.ok(prompt.includes("json"));
  assert.ok(prompt.includes("facebook") || prompt.includes("meta"));
});

test("parseAnalysisJson keeps only publication ids present in the evidence pack", () => {
  const allowed = new Set([11, 12]);
  const parsed = parseAnalysisJson(
    JSON.stringify({
      observed: "Publication 11 recorded 9 audience_network_gained; publication 12 recorded 1.",
      meaning: "The higher Audience Network result is on publication 11.",
      action: "Consider another piece similar to publication 11.",
      citedPublicationIds: [11, 999999, "12", 0]
    }),
    allowed
  );
  assert.ok(parsed);
  assert.deepEqual(parsed.citedPublicationIds, [11, 12]);
  assert.equal(parseAnalysisJson("", allowed), null);
  assert.equal(parseAnalysisJson('{"observed":"x","meaning":"","action":"y"}', allowed), null);
  const fenced = parseAnalysisJson(
    '```json\n{"observed":"A","meaning":"B","action":"C","citedPublicationIds":[11]}\n```',
    allowed
  );
  assert.deepEqual(fenced?.citedPublicationIds, [11]);
});

test("missing credentials is detected without using a live analysis call", () => {
  const prevAde = process.env.ADE_AI_API_KEY;
  const prevOpen = process.env.OPENAI_API_KEY;
  process.env.ADE_AI_API_KEY = "";
  process.env.OPENAI_API_KEY = "";
  try {
    assert.equal(aiConfigured(), false);
  } finally {
    if (prevAde == null) delete process.env.ADE_AI_API_KEY;
    else process.env.ADE_AI_API_KEY = prevAde;
    if (prevOpen == null) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevOpen;
  }
});
