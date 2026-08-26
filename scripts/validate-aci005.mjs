/**
 * ACI-005 HTTP validation against a running ADE server.
 * Usage: node scripts/validate-aci005.mjs
 */
const base = process.env.ADE_APP_URL || "http://localhost:3000";

async function req(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = { ok: false, error: "non-json" };
  }
  return { status: res.status, data };
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const health = await req("GET", "/api/health");
if (!health.data.ok) fail(health.data.error || "health failed");
const schemaVersion = Number(health.data.persistence?.schemaVersion);
if (!Number.isFinite(schemaVersion) || schemaVersion < 3) {
  fail(`expected schema v3 or later, got ${health.data.persistence?.schemaVersion}`);
}
ok("schema v3 health");

const goalRes = await req("POST", "/api/goals", {
  title: "[TEST DATA] Increase Audience Network by 10",
  description: "ACI-005 validation goal. TEST DATA. No fabricated audience claim.",
  target_metric: "audience_network_gained",
  starting_value: 0,
  target_value: 10,
  status: "active",
  is_test: true
});
if (!goalRes.data.ok) fail(goalRes.data.error);
const goalId = goalRes.data.goal.id;
ok(`goal ${goalId} created`);

async function makePublished(title, sourceType, body) {
  const sourceRes = await req("POST", "/api/sources", {
    title: `[TEST DATA] ${title}`,
    body,
    source_type: sourceType,
    activity_date: "2026-08-26",
    provenance: "scripts/validate-aci005.mjs",
    notes: "TEST DATA",
    is_test: true,
    goal_id: goalId
  });
  if (!sourceRes.data.ok) fail(sourceRes.data.error);
  const sourceId = sourceRes.data.source.id;
  if (sourceRes.data.source.goal_id !== goalId) fail("source lost goal_id");
  const draftRes = await req("POST", "/api/content", { source_id: sourceId, goal_id: goalId });
  if (!draftRes.data.ok) fail(draftRes.data.error);
  const contentId = draftRes.data.content.id;
  if (draftRes.data.content.source_id !== sourceId) fail("provenance lost on draft");
  if (Number(draftRes.data.content.effective_goal_id) !== goalId) fail("draft not linked to goal");
  const approveRes = await req("POST", `/api/content/${contentId}`, { action: "approve" });
  if (!approveRes.data.ok) fail(approveRes.data.error);
  const pubId = approveRes.data.content.publication?.id;
  if (!pubId) fail("approval did not enqueue");
  const pendingResults = await req("PUT", `/api/publications/${pubId}/results`, {
    metrics: { audience_network_gained: 1 },
    capture_method: "manual",
    is_test: true
  });
  if (pendingResults.status !== 409) fail("results allowed before PUBLISHED");
  const hand = await req("POST", `/api/publications/${pubId}`, { action: "hand_to_adapter" });
  if (!hand.data.ok) fail(hand.data.error);
  const confirm = await req("POST", `/api/publications/${pubId}`, { action: "confirm" });
  if (!confirm.data.ok) fail(confirm.data.error);
  if (confirm.data.publication.status !== "PUBLISHED") fail("confirm did not publish");
  if (Number(confirm.data.publication.goal_id) !== goalId) fail("publication lost goal link");
  return { sourceId, contentId, pubId };
}

const client = await makePublished(
  "Client-result source",
  "client_result",
  "Labeled TEST DATA client-result source for ACI-005. No live client or revenue claim."
);
const info = await makePublished(
  "Informational source",
  "informational",
  "Labeled TEST DATA informational source for ACI-005. General explanation, not a result story."
);
ok(`published client ${client.pubId} and informational ${info.pubId}`);

const platformBlocked = await req("PUT", `/api/publications/${client.pubId}/results`, {
  metrics: { audience_network_gained: 7 },
  capture_method: "platform",
  is_test: true
});
if (platformBlocked.status !== 409) fail("platform capture should be blocked");
ok("platform-collected metrics refused");

const clientResults = await req("PUT", `/api/publications/${client.pubId}/results`, {
  capture_method: "manual",
  is_test: true,
  metrics: {
    views_reach: 40,
    reactions: 6,
    comments: 2,
    shares: 1,
    clicks: 4,
    audience_network_gained: 7,
    meaningful_conversations: 3,
    leads_generated: 0
  }
});
if (!clientResults.data.ok) fail(clientResults.data.error);
if (clientResults.data.metrics.some((row) => row.capture_method !== "manual")) {
  fail("client results not marked manual");
}

const infoResults = await req("PUT", `/api/publications/${info.pubId}/results`, {
  capture_method: "manual",
  is_test: true,
  metrics: {
    views_reach: 200,
    reactions: 20,
    comments: 1,
    shares: 4,
    clicks: 30,
    audience_network_gained: 1,
    meaningful_conversations: 0,
    leads_generated: 0
  }
});
if (!infoResults.data.ok) fail(infoResults.data.error);
ok("manual results recorded for both publications");

const goalAfter = await req("GET", `/api/goals/${goalId}`);
if (!goalAfter.data.ok) fail(goalAfter.data.error);
if (goalAfter.data.goal.progress.contributed !== 8) {
  fail(`expected contributed 8, got ${goalAfter.data.goal.progress.contributed}`);
}
if (goalAfter.data.goal.progress.current !== 8) fail("progress current incorrect");
ok("goal progress 8/10 from entered results");

const analytics = await req("GET", `/api/analytics?goal_id=${goalId}`);
if (!analytics.data.ok) fail(analytics.data.error);
const answers = analytics.data.analytics.answers;
const rankings = analytics.data.analytics.rankings || {};
const visibilityForGoal = (rankings.visibility || []).filter((item) => item.goalId === goalId);
const towardGoal = rankings.towardGoal || [];
if (visibilityForGoal[0]?.publicationId !== info.pubId) fail("most visibility on this Goal should be informational");
if (towardGoal[0]?.publicationId !== client.pubId) {
  fail("most Audience Network toward this Goal should be client-result");
}
if (answers.mostUsefulTowardGoal?.publicationId !== client.pubId) {
  fail("most useful toward goal should be client-result");
}
if (!answers.goalProgressing?.yes) fail("goal should be progressing");
ok("analytics rankings follow outcomes > engagement > visibility");

const firstAnalyze = await req("POST", "/api/intelligence/analyze", {
  goal_id: goalId,
  is_test: true
});
if (!firstAnalyze.data.ok) fail(firstAnalyze.data.error);
const firstText = String(firstAnalyze.data.recommendation.summary || "");
if (!firstText.toLowerCase().includes("client-result")) {
  fail(`first recommendation missing client-result evidence: ${firstText}`);
}
if (firstAnalyze.data.recommendation.liveAiUsed) fail("must not claim live AI ran");
if (!String(firstAnalyze.data.recommendation.analysis_boundary_note).includes("DETERMINISTIC")) {
  fail("missing deterministic analysis boundary");
}
ok("first recommendation prefers client-result content");

const flipped = await req("PUT", `/api/publications/${info.pubId}/results`, {
  capture_method: "manual",
  is_test: true,
  metrics: { audience_network_gained: 8, views_reach: 200 }
});
if (!flipped.data.ok) fail(flipped.data.error);

const goalFlipped = await req("GET", `/api/goals/${goalId}`);
if (goalFlipped.data.goal.progress.contributed !== 15) {
  fail(`expected contributed 15 after flip, got ${goalFlipped.data.goal.progress.contributed}`);
}

const secondAnalyze = await req("POST", "/api/intelligence/analyze", {
  goal_id: goalId,
  is_test: true
});
if (!secondAnalyze.data.ok) fail(secondAnalyze.data.error);
const secondText = String(secondAnalyze.data.recommendation.summary || "");
if (!secondText.toLowerCase().includes("informational")) {
  fail(`second recommendation did not follow flipped results: ${secondText}`);
}
if (secondText === firstText) fail("recommendation did not change after results changed");
ok("recommendation changed after results were updated");

const contentCheck = await req("GET", `/api/content/${client.contentId}`);
if (contentCheck.data.content.source_id !== client.sourceId) fail("ACI-004 provenance lost");
ok("source → draft provenance preserved");

console.log("ACI-005 HTTP validation passed against", base);
