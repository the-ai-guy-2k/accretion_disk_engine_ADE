import assert from "node:assert/strict";
import test from "node:test";

function purposeForSourceType(sourceType) {
  const key = String(sourceType || "").toLowerCase();
  if (key === "client_result") return "Show a concrete result that supports the Goal";
  if (key === "informational") return "Explain the idea so the audience understands why the Goal matters";
  return "Support the campaign objective using this source";
}

function orderSources(sources) {
  const rank = (type) =>
    String(type).toLowerCase() === "client_result" ? 0 : String(type).toLowerCase() === "informational" ? 1 : 2;
  return [...sources].sort((a, b) => rank(a.source_type) - rank(b.source_type) || a.id - b.id);
}

test("campaign plan orders result-proof sources before informational sources", () => {
  const ordered = orderSources([
    { id: 2, source_type: "informational" },
    { id: 1, source_type: "client_result" }
  ]);
  assert.equal(ordered[0].source_type, "client_result");
  assert.equal(ordered[1].source_type, "informational");
  assert.equal(ordered.length, 2);
});

test("campaign plan purpose follows source type", () => {
  assert.match(purposeForSourceType("client_result"), /result/i);
  assert.match(purposeForSourceType("informational"), /explain/i);
});
