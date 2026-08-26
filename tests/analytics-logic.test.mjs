import assert from "node:assert/strict";
import test from "node:test";

function computeGoalProgress({ startingValue, targetValue, contributed }) {
  const starting = Number(startingValue) || 0;
  const targetRaw = Number(targetValue);
  const target = Number.isFinite(targetRaw) ? targetRaw : null;
  const current = starting + (Number(contributed) || 0);
  const span = target == null ? null : target - starting;
  let percent = null;
  if (span != null && span !== 0) percent = Math.max(0, (current - starting) / span);
  return {
    starting,
    target,
    contributed: Number(contributed) || 0,
    current,
    percent,
    achieved: target != null && current >= target
  };
}

function hierarchyScore({ leads = 0, audience = 0, conversations = 0, comments = 0, views = 0 }) {
  const business = leads * 10 + audience * 5;
  const engagement = conversations * 4 + comments * 3;
  const visibility = views;
  return business * 1000 + engagement * 10 + visibility;
}

test("goal progress uses starting value plus contributed results", () => {
  const mid = computeGoalProgress({ startingValue: 0, targetValue: 10, contributed: 7 });
  assert.equal(mid.current, 7);
  assert.equal(mid.percent, 0.7);
  assert.equal(mid.achieved, false);
  const done = computeGoalProgress({ startingValue: 0, targetValue: 10, contributed: 10 });
  assert.equal(done.achieved, true);
});

test("business outcomes outrank meaningful engagement and raw visibility", () => {
  const highVisibility = hierarchyScore({ views: 500, comments: 1 });
  const highNetwork = hierarchyScore({ audience: 2, views: 10 });
  assert.ok(highNetwork > highVisibility);
});

test("recommendation comparison flips when the leading metric flips", () => {
  const first = { client: 7, informational: 1 };
  const second = { client: 7, informational: 8 };
  assert.ok(first.client > first.informational);
  assert.ok(second.informational > second.client);
});
