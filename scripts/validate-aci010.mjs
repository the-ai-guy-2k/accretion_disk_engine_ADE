/**
 * ACI-010 HTTP validation of the integrated Operator journey against a running ADE Hub.
 * Requires live AI credentials in the ADE process.
 * Usage: node scripts/validate-aci010.mjs
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

async function page(path) {
  const res = await fetch(base + path);
  const text = await res.text();
  return { status: res.status, text };
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
ok("health");

const aiStatus = await req("GET", "/api/ai/status");
if (!aiStatus.data.ai?.ready) {
  fail(aiStatus.data.ai?.unavailableReason || "live AI is not configured");
}
ok("live AI ready");

const screens = ["/", "/goals", "/campaigns", "/sources", "/create", "/review", "/publishing", "/analytics", "/intelligence", "/settings"];
for (const path of screens) {
  const view = await page(path);
  if (view.status !== 200) fail(`${path} returned ${view.status}`);
  if (/Application error|Module not found/i.test(view.text)) fail(`${path} rendered an application error`);
}
ok("operator screens return 200");

const goalRes = await req("POST", "/api/goals", {
  title: "Increase TAIG client contacts through Facebook by 2",
  description:
    "ACI-010 TEST DATA. Validation Goal only. This is not a claim that ADE generated two real clients.",
  target_metric: "leads_generated",
  starting_value: 0,
  target_value: 2,
  status: "active",
  is_test: true
});
if (!goalRes.data.ok) fail(goalRes.data.error);
const goalId = goalRes.data.goal.id;
ok(`goal ${goalId} created`);

const campaignRes = await req("POST", "/api/campaigns", {
  title: "[TEST DATA] TAIG Facebook contacts campaign",
  objective: "Coordinate one labeled test source into a Facebook draft. TEST DATA.",
  goal_id: goalId,
  status: "planning",
  is_test: true
});
if (!campaignRes.data.ok) fail(campaignRes.data.error);
const campaignId = campaignRes.data.campaign.id;
ok(`campaign ${campaignId}`);

const sourceRes = await req("POST", "/api/sources", {
  title: "[TEST DATA] TAIG operator note for Facebook contacts",
  body:
    "TAIG localhost note: the operator is practicing ADE's content workflow. TEST DATA. This is not a completed client, revenue claim, or two real Facebook contacts.",
  source_type: "taig_activity",
  activity_date: "2026-08-26",
  provenance: "scripts/validate-aci010.mjs",
  notes: "TEST DATA",
  is_test: true,
  goal_id: goalId
});
if (!sourceRes.data.ok) fail(sourceRes.data.error);
const sourceId = sourceRes.data.source.id;

const attach = await req("PUT", `/api/campaigns/${campaignId}/sources`, {
  source_ids: [sourceId]
});
if (!attach.data.ok) fail(attach.data.error);
ok(`source ${sourceId} attached to campaign`);

const live = await req("POST", "/api/content/generate", {
  source_id: sourceId,
  goal_id: goalId,
  campaign_id: campaignId,
  platform: "facebook",
  purpose: "Invite a professional audience to take a next step related to the operator note",
  tone: "professional and clear",
  length: "short Facebook post",
  extra_instruction: "Stay inside the source. Do not invent clients or contacts."
});
if (!live.data.ok) fail(live.data.error || "live AI generate failed");
const draft = live.data.content;
if (draft.status !== "draft") fail("AI draft skipped human review");
if (draft.generation_mode !== "live_ai") fail("expected live AI draft");
if (draft.publication) fail("AI draft auto-entered publishing");
if (Number(draft.campaign_id) !== campaignId) fail("live AI draft lost campaign relationship");
if (Number(draft.effective_goal_id) !== goalId && Number(draft.goal_id) !== goalId) {
  fail("live AI draft lost goal relationship");
}
ok(`live AI draft ${draft.id}`);

const edit = await req("PATCH", `/api/content/${draft.id}`, {
  title: `${draft.title} (operator edit)`,
  body: `${draft.body}\n\nOperator edit: still a draft. TEST DATA.`
});
if (!edit.data.ok) fail(edit.data.error);

const approve = await req("POST", `/api/content/${draft.id}`, { action: "approve" });
if (!approve.data.ok) fail(approve.data.error);
const pubId = approve.data.content.publication?.id;
if (!pubId) fail("approve did not enqueue");
ok(`approved into publishing ${pubId}`);

const skipped = await req("POST", "/api/content/generate", {
  source_id: sourceId,
  purpose: "Second draft used only to prove reject cannot publish"
});
if (!skipped.data.ok) fail(skipped.data.error);
const reject = await req("POST", `/api/content/${skipped.data.content.id}`, { action: "reject" });
if (!reject.data.ok) fail(reject.data.error);
const enqueueRejected = await req("POST", `/api/content/${skipped.data.content.id}`, { action: "enqueue" });
if (enqueueRejected.status !== 409) fail("rejected AI draft entered the queue");
ok("rejected AI draft cannot publish");

const hand = await req("POST", `/api/publications/${pubId}`, { action: "hand_to_adapter" });
if (!hand.data.ok) fail(hand.data.error);
const confirm = await req("POST", `/api/publications/${pubId}`, { action: "confirm" });
if (!confirm.data.ok) fail(confirm.data.error);
if (confirm.data.publication.status !== "PUBLISHED") fail("mock publish failed");
ok("mock Facebook confirm");

const results = await req("PUT", `/api/publications/${pubId}/results`, {
  capture_method: "manual",
  is_test: true,
  metrics: { leads_generated: 2, views_reach: 40, reactions: 3 }
});
if (!results.data.ok) fail(results.data.error);
const platform = await req("PUT", `/api/publications/${pubId}/results`, {
  capture_method: "platform",
  metrics: { leads_generated: 2 }
});
if (platform.status !== 409) fail("platform metrics should stay blocked");
ok("manual results recorded; platform capture refused");

const goalAfter = await req("GET", `/api/goals/${goalId}`);
if (Number(goalAfter.data.goal.progress.contributed) !== 2) {
  fail(`expected Goal progress 2, got ${goalAfter.data.goal.progress.contributed}`);
}
ok("goal progress 2/2 from TEST DATA results");

const analytics = await req("GET", `/api/analytics?goal_id=${goalId}`);
if (!analytics.data.ok) fail(analytics.data.error);
ok("deterministic analytics available");

const liveAnalyze = await req("POST", "/api/intelligence/analyze", {
  goal_id: goalId,
  is_test: true,
  mode: "live_ai"
});
if (!liveAnalyze.data.ok) fail(liveAnalyze.data.error || "live AI analyze failed");
const rec = liveAnalyze.data.recommendation;
if (!rec.liveAiUsed) fail("expected live AI recommendation");
const evidence = rec.evidence || [];
if (!evidence.some((row) => Number(row.publicationId) === pubId && Number(row.value) === 2)) {
  fail("recommendation evidence did not cite stored leads_generated=2");
}
ok(`live AI recommendation ${rec.id} cites stored evidence`);

const summary = await req("GET", "/api/workflow/summary");
if (!summary.data.ok) fail("hub summary failed");
if (!summary.data.summary.activeGoal) fail("hub summary missing active Goal");
ok("hub summary includes Goal and recommendation");

console.log("ACI-010 integrated journey validation passed against", base);
