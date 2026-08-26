import assert from "node:assert/strict";
import test from "node:test";
import {
  FORBIDDEN_INVENTIONS,
  buildSystemPrompt,
  parseGeneratedJson
} from "../src/lib/ai-prompt.ts";
import { classifyHttpFailure } from "../src/lib/ai-errors.ts";
import { aiConfigured } from "../src/lib/ai-config.ts";

test("system prompt forbids inventing source-grounded facts", () => {
  const prompt = buildSystemPrompt().toLowerCase();
  for (const item of FORBIDDEN_INVENTIONS) {
    assert.ok(prompt.includes(item.toLowerCase()), `missing forbidden item: ${item}`);
  }
  assert.ok(prompt.includes("json"));
  assert.ok(prompt.includes("draft"));
});

test("parseGeneratedJson accepts object and fenced payloads", () => {
  const direct = parseGeneratedJson('{"title":"Hello","body":"A grounded post."}');
  assert.equal(direct?.title, "Hello");
  assert.ok(direct?.body.includes("grounded"));
  const fenced = parseGeneratedJson('```json\n{"title":"T","body":"B"}\n```');
  assert.equal(fenced?.title, "T");
  assert.equal(parseGeneratedJson(""), null);
  assert.equal(parseGeneratedJson('{"title":"","body":""}'), null);
});

test("HTTP provider failures map to operator-safe codes", () => {
  assert.equal(classifyHttpFailure(401, "OpenAI").code, "missing_credentials");
  assert.equal(classifyHttpFailure(429, "OpenAI").code, "unavailable");
  assert.equal(classifyHttpFailure(500, "OpenAI").code, "unavailable");
  assert.equal(classifyHttpFailure(400, "OpenAI").code, "generation_failed");
  assert.equal(classifyHttpFailure(401, "OpenAI").status, 503);
});

test("missing credentials is detected without using a live provider call", () => {
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
