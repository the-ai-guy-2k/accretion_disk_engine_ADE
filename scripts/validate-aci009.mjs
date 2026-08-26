/**
 * ACI-009 HTTP validation against a running ADE server.
 * Requires live AI credentials in the ADE process (.env.local ADE_AI_API_KEY or OPENAI_API_KEY).
 * Usage: node scripts/validate-aci009.mjs
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

function metricMap(rows) {
  const out = {};
  for (const row of rows || []) {
    out[String(row.metric_name)] = Number(row.numeric_value);
  }
  return out;
}

const health = await req("GET", "/api/health");
if (!health.data.ok) fail(health.data.error || "health failed");
const schemaVersion = Number(health.data.persistence?.schemaVersion);
if (!Number.isFinite(schemaVersion) || schemaVersion < 5) {
  fail(`expected schema v5 or later, got ${health.data.persistence?.schemaVersion}`);
}
ok("schema v5 health");

const aiStatus = await req("GET", "/api/ai/status");
if (!aiStatus.data.ok) fail("ai status failed");
if (aiStatus.data.ai?.credential || aiStatus.data.ai?.apiKey) {
  fail("AI status leaked a credential field");
}
if (!aiStatus.data.ai?.ready || !aiStatus.data.ai?.analyticsLive) {
  fail(aiStatus.data.ai?.unavailableReason || "live AI analytics is not configured on the running ADE process");
}
ok(`AI analytics ready (${aiStatus.data.ai.provider} / ${aiStatus.data.ai.model})`);

const goalRes = await req("POST", "/api/goals", {
  title: "[TEST DATA] Increase Audience Network by 10",
  description: "ACI-009 live AI analytics validation goal. TEST DATA. No fabricated audience claim.",
  target_metric: "audience_network_gained",
  starting_value: 0,
  target_value: 10,
  status: "active",
  is_test: true
});
if (!goalRes.data.ok) fail(goalRes.data.error);
const goalId = goalRes.data.goal.id;
ok(`goal ${goalId} created`);

const campaignRes = await req("POST", "/api/campaigns", {
  title: "[TEST DATA] ACI-009 Performance Campaign",
  objective: "Hold two labeled test posts so ADE can compare stored results. TEST DATA.",
  goal_id: goalId,
  status: "planning",
  is_test: true
});
if (!campaignRes.data.ok) fail(campaignRes.data.error);
const campaignId = campaignRes.data.campaign.id;
ok(`campaign ${campaignId} linked to goal ${goalId}`);

async function makePublished(title, sourceType, body, metrics) {
  const sourceRes = await req("POST", "/api/sources", {
    title: `[TEST DATA] ${title}`,
    body,
    source_type: sourceType,
    activity_date: "2026-08-26",
    provenance: "scripts/validate-aci009.mjs",
    notes: "TEST DATA",
    is_test: true,
    goal_id: goalId
  });
  if (!sourceRes.data.ok) fail(sourceRes.data.error);
  const sourceId = sourceRes.data.source.id;
  const draftRes = await req("POST", "/api/content", {
    source_id: sourceId,
    goal_id: goalId,
    campaign_id: campaignId
  });
  if (!draftRes.data.ok) fail(draftRes.data.error);
  const contentId = draftRes.data.content.id;
  if (Number(draftRes.data.content.campaign_id) !== campaignId) fail("draft lost campaign_id");
  if (Number(draftRes.data.content.effective_goal_id) !== goalId) fail("draft not linked to goal");
  const approveRes = await req("POST", `/api/content/${contentId}`, { action: "approve" });
  if (!approveRes.data.ok) fail(approveRes.data.error);
  const pubId = approveRes.data.content.publication?.id;
  if (!pubId) fail("approval did not enqueue");
  const hand = await req("POST", `/api/publications/${pubId}`, { action: "hand_to_adapter" });
  if (!hand.data.ok) fail(hand.data.error);
  const confirm = await req("POST", `/api/publications/${pubId}`, { action: "confirm" });
  if (!confirm.data.ok) fail(confirm.data.error);
  const results = await req("PUT", `/api/publications/${pubId}/results`, {
    capture_method: "manual",
    is_test: true,
    metrics
  });
  if (!results.data.ok) fail(results.data.error);
  return { sourceId, contentId, pubId, title: draftRes.data.content.title, metrics };
}

const stronger = await makePublished(
  "Client-result source for AI analysis",
  "client_result",
  "Labeled TEST DATA client-result source for ACI-009. No live client or revenue claim.",
  {
    views_reach: 47,
    reactions: 6,
    comments: 3,
    shares: 2,
    clicks: 5,
    audience_network_gained: 9,
    meaningful_conversations: 4,
    leads_generated: 0
  }
);
const weaker = await makePublished(
  "Informational source for AI analysis",
  "informational",
  "Labeled TEST DATA informational source for ACI-009. General explanation, not a result story.",
  {
    views_reach: 412,
    reactions: 28,
    comments: 1,
    shares: 6,
    clicks: 40,
    audience_network_gained: 1,
    meaningful_conversations: 0,
    leads_generated: 0
  }
);
ok(`published stronger ${stronger.pubId} and weaker ${weaker.pubId}`);

const platformBlocked = await req("PUT", `/api/publications/${stronger.pubId}/results`, {
  metrics: { audience_network_gained: 99 },
  capture_method: "platform",
  is_test: true
});
if (platformBlocked.status !== 409) fail("platform capture should remain blocked");
ok("platform-collected metrics still refused");

const analytics = await req("GET", `/api/analytics?goal_id=${goalId}`);
if (!analytics.data.ok) fail(analytics.data.error);
if (analytics.data.analytics.answers.mostUsefulTowardGoal?.publicationId !== stronger.pubId) {
  fail("deterministic ranking should prefer the client-result publication");
}
const visibilityForGoal = (analytics.data.analytics.rankings.visibility || []).filter(
  (item) => item.goalId === goalId
);
if (visibilityForGoal[0]?.publicationId !== weaker.pubId) {
  fail("deterministic visibility ranking for this Goal should prefer the informational publication");
}
ok("deterministic analytics rankings preserved");

const beforeIntel = await req("GET", `/api/intelligence?goal_id=${goalId}`);
if (!beforeIntel.data.ok) fail(beforeIntel.data.error);
const beforeId = beforeIntel.data.recommendation?.id || null;

const invalidMode = await req("POST", "/api/intelligence/analyze", {
  goal_id: goalId,
  is_test: true,
  mode: "not_a_mode"
});
if (invalidMode.status !== 400 || invalidMode.data.ok) fail("invalid analysis mode should 400");
const afterInvalid = await req("GET", `/api/intelligence?goal_id=${goalId}`);
if ((afterInvalid.data.recommendation?.id || null) !== beforeId) {
  fail("invalid mode stored a recommendation");
}
ok("invalid analysis mode fails without storing a recommendation");

const deterministic = await req("POST", "/api/intelligence/analyze", {
  goal_id: goalId,
  is_test: true
});
if (!deterministic.data.ok) fail(deterministic.data.error);
if (deterministic.data.recommendation.liveAiUsed) fail("default analyze must remain deterministic");
if (!String(deterministic.data.recommendation.analysis_boundary_note).includes("DETERMINISTIC")) {
  fail("default analyze missing deterministic boundary");
}
const detId = deterministic.data.recommendation.id;
ok("default analyze remains deterministic (ACI-005 contract)");

const liveFailProbe = await req("POST", "/api/intelligence/analyze", {
  goal_id: 999999999,
  is_test: true,
  mode: "live_ai"
});
if (liveFailProbe.data.ok) fail("live AI analyze of a missing Goal should fail");
if (![400, 404].includes(liveFailProbe.status)) {
  fail(`expected 400/404 for missing Goal live analyze, got ${liveFailProbe.status}`);
}
const afterMissingGoal = await req("GET", `/api/intelligence?goal_id=${goalId}`);
if (afterMissingGoal.data.recommendation?.id !== detId) {
  fail("failed live AI analyze stored a recommendation on the validation Goal");
}
ok("failed live AI analyze does not store a fake recommendation");

const live = await req("POST", "/api/intelligence/analyze", {
  goal_id: goalId,
  is_test: true,
  mode: "live_ai"
});
if (!live.data.ok) fail(live.data.error || "live AI analyze failed");
const rec = live.data.recommendation;
if (!rec?.id) fail("live analyze did not return a recommendation");
if (!rec.liveAiUsed || rec.analysis_mode !== "live_ai") fail("expected analysis_mode live_ai");
if (!String(rec.analysis_boundary_note || "").toLowerCase().includes("live ai")) {
  fail("live recommendation missing live AI boundary");
}
if (!String(rec.observed || "").trim()) fail("live recommendation missing Observed");
if (!String(rec.why_it_matters || "").trim()) fail("live recommendation missing Meaning");
if (!String(rec.action_hint || "").trim()) fail("live recommendation missing Recommended next action");
if (Number(rec.goal_id) !== goalId) fail("live recommendation lost Goal relationship");
if (Number(rec.campaign_id) !== campaignId) fail("live recommendation lost Campaign relationship");
ok(`live AI recommendation ${rec.id} stored`);

const evidence = rec.evidence || [];
if (!evidence.length) fail("live recommendation has no evidence");
const evidencePubIds = new Set(evidence.map((row) => Number(row.publicationId)));
if (!evidencePubIds.has(stronger.pubId) && !evidencePubIds.has(weaker.pubId)) {
  fail("live evidence did not cite either stored publication");
}
for (const item of evidence) {
  if (![stronger.pubId, weaker.pubId].includes(Number(item.publicationId))) {
    fail(`evidence cited unknown publication ${item.publicationId}`);
  }
  const expected =
    Number(item.publicationId) === stronger.pubId ? stronger.metrics : weaker.metrics;
  const storedValue = expected[item.metric];
  if (storedValue == null) fail(`evidence metric ${item.metric} was not in the stored pack`);
  if (Number(item.value) !== Number(storedValue)) {
    fail(
      `evidence invented or mutated ${item.metric} for publication ${item.publicationId}: stored ${storedValue}, rec ${item.value}`
    );
  }
  if (item.captureMethod && item.captureMethod !== "manual") {
    fail("evidence claimed a non-manual capture method");
  }
}
ok("live recommendation evidence matches stored manual metrics");

const strongerMetrics = await req("GET", `/api/publications/${stronger.pubId}/results`);
const weakerMetrics = await req("GET", `/api/publications/${weaker.pubId}/results`);
const strongerStored = metricMap(strongerMetrics.data.metrics);
const weakerStored = metricMap(weakerMetrics.data.metrics);
if (Number(strongerStored.audience_network_gained) !== 9) fail("stored stronger AN metric changed");
if (Number(weakerStored.views_reach) !== 412) fail("stored weaker views metric changed");

const blob = `${rec.observed} ${rec.why_it_matters} ${rec.action_hint}`.toLowerCase();
const mentionsStronger =
  blob.includes(String(stronger.pubId)) ||
  blob.includes("client-result") ||
  blob.includes("9") ||
  String(stronger.title || "").split(" ").some((part) => part.length > 6 && blob.includes(part.toLowerCase()));
const mentionsWeaker =
  blob.includes(String(weaker.pubId)) ||
  blob.includes("informational") ||
  blob.includes("412") ||
  blob.includes("1");
if (!mentionsStronger && !mentionsWeaker) {
  fail(`live recommendation did not reference stored evidence text: ${blob.slice(0, 400)}`);
}
if (blob.includes("100000") || blob.includes("facebook collected") || blob.includes("meta collected")) {
  fail("live recommendation invented platform collection or extreme unseen metrics");
}
ok("live recommendation references stored evidence rather than invented platform analytics");

const stillDeterministic = await req("GET", `/api/analytics?goal_id=${goalId}`);
if (!stillDeterministic.data.ok) fail("analytics snapshot broken after live AI");
ok("deterministic analytics snapshot still available after live AI");

console.log("ACI-009 HTTP validation passed against", base);
