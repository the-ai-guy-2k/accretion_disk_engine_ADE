/**
 * ACI-011 PAPEV validation against a running ADE Hub.
 * Product checks, not merely HTTP 200. Requires live AI credentials.
 * Usage: node scripts/validate-aci011.mjs
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
if (health.data.stage !== "MVP baseline" && health.data.stage !== "Local MVP") {
  fail(`unexpected stage ${health.data.stage}`);
}
ok(`health ${health.data.stage}`);

const ai = await req("GET", "/api/ai/status");
if (ai.data.ai?.credential || ai.data.ai?.apiKey) fail("AI status leaked a credential");
if (!ai.data.ai?.ready) fail(ai.data.ai?.unavailableReason || "live AI not ready");
ok("live AI ready; credentials not leaked");

const goalRes = await req("POST", "/api/goals", {
  title: "Increase TAIG client contacts through Facebook by 2",
  description:
    "ACI-011 PAPEV TEST DATA. Not a claim that ADE generated two real clients or Facebook contacts.",
  target_metric: "leads_generated",
  starting_value: 0,
  target_value: 2,
  status: "active",
  is_test: true
});
if (!goalRes.data.ok) fail(goalRes.data.error);
const goalId = goalRes.data.goal.id;
ok(`goal ${goalId}`);

const campaignRes = await req("POST", "/api/campaigns", {
  title: "[TEST DATA] PAPEV Facebook contacts campaign",
  objective: "Support the +2 contacts Goal with one labeled source. TEST DATA.",
  goal_id: goalId,
  status: "planning",
  is_test: true
});
if (!campaignRes.data.ok) fail(campaignRes.data.error);
const campaignId = campaignRes.data.campaign.id;

const sourceRes = await req("POST", "/api/sources", {
  title: "[TEST DATA] TAIG operator note for PAPEV contacts Goal",
  body:
    "TAIG localhost operator note for ADE PAPEV. TEST DATA. This is not a completed client engagement, not two real contacts, and not a Facebook-collected result.",
  source_type: "taig_activity",
  activity_date: "2026-08-26",
  provenance: "scripts/validate-aci011.mjs",
  notes: "TEST DATA",
  is_test: true,
  goal_id: goalId
});
if (!sourceRes.data.ok) fail(sourceRes.data.error);
const sourceId = sourceRes.data.source.id;
const attach = await req("PUT", `/api/campaigns/${campaignId}/sources`, { source_ids: [sourceId] });
if (!attach.data.ok) fail(attach.data.error);
ok(`campaign ${campaignId} + source ${sourceId}`);

const live = await req("POST", "/api/content/generate", {
  source_id: sourceId,
  goal_id: goalId,
  campaign_id: campaignId,
  platform: "facebook",
  purpose: "Create a short Facebook draft from the operator note",
  tone: "professional and clear",
  length: "short Facebook post",
  extra_instruction: "Stay inside the source. Do not invent clients, contacts, or results."
});
if (!live.data.ok) fail(live.data.error || "live generate failed");
const draft = live.data.content;
if (draft.status !== "draft") fail("AI skipped human review");
if (draft.generation_mode !== "live_ai") fail("draft not marked live AI");
if (draft.publication) fail("AI auto-published");
if (Number(draft.source_id) !== sourceId) fail("lost source provenance");
if (Number(draft.campaign_id) !== campaignId) fail("lost campaign relationship");
if (Number(draft.effective_goal_id) !== goalId && Number(draft.goal_id) !== goalId) fail("lost Goal");
if (!String(draft.generation_note || "").toLowerCase().includes("live ai")) {
  fail("draft missing live AI identification");
}
ok(`live AI draft ${draft.id} grounded in source ${sourceId}`);

const edited = await req("PATCH", `/api/content/${draft.id}`, {
  title: `${draft.title} (operator edit)`,
  body: `${draft.body}\n\nOperator edit: still a draft. TEST DATA.`
});
if (!edited.data.ok) fail(edited.data.error);
if (Number(edited.data.content.source_id) !== sourceId) fail("edit lost source");

const rejectDraft = await req("POST", "/api/content/generate", {
  source_id: sourceId,
  goal_id: goalId,
  campaign_id: campaignId,
  purpose: "Second draft used only to prove reject cannot publish"
});
if (!rejectDraft.data.ok) fail(rejectDraft.data.error);
const rejected = await req("POST", `/api/content/${rejectDraft.data.content.id}`, { action: "reject" });
if (!rejected.data.ok) fail(rejected.data.error);
const enqueueRejected = await req("POST", `/api/content/${rejectDraft.data.content.id}`, {
  action: "enqueue"
});
if (enqueueRejected.status !== 409) fail("rejected content entered publishing");
ok("human reject blocks publishing");

const approve = await req("POST", `/api/content/${draft.id}`, { action: "approve" });
if (!approve.data.ok) fail(approve.data.error);
const pubId = approve.data.content.publication?.id;
if (!pubId) fail("approve did not enqueue");

const vanity = await req("POST", "/api/content", {
  source_id: sourceId,
  goal_id: goalId,
  campaign_id: campaignId
});
if (!vanity.data.ok) fail(vanity.data.error);
if (vanity.data.content.generation_mode === "live_ai") fail("manual path marked live AI");
const vanityApprove = await req("POST", `/api/content/${vanity.data.content.id}`, { action: "approve" });
if (!vanityApprove.data.ok) fail(vanityApprove.data.error);
const vanityPub = vanityApprove.data.content.publication?.id;

async function mockPublish(id) {
  const hand = await req("POST", `/api/publications/${id}`, { action: "hand_to_adapter" });
  if (!hand.data.ok) fail(hand.data.error);
  if (hand.data.adapter && hand.data.adapter.isMock === false) fail("adapter claimed not mock");
  const msg = String(hand.data.adapter?.message || hand.data.message || "");
  if (!msg.toLowerCase().includes("not real facebook") && !msg.toLowerCase().includes("mock")) {
    fail("publish path did not identify mock Facebook");
  }
  const confirm = await req("POST", `/api/publications/${id}`, { action: "confirm" });
  if (!confirm.data.ok) fail(confirm.data.error);
  if (confirm.data.publication.status !== "PUBLISHED") fail("confirm did not mock-publish");
}

await mockPublish(pubId);
await mockPublish(vanityPub);
ok("mock Facebook path identified; no real API implied");

const goalResults = await req("PUT", `/api/publications/${pubId}/results`, {
  capture_method: "manual",
  is_test: true,
  metrics: { leads_generated: 2, views_reach: 40, reactions: 3 }
});
if (!goalResults.data.ok) fail(goalResults.data.error);
if (!String(goalResults.data.banner || "").toLowerCase().includes("manually")) {
  fail("results missing manual-metrics banner");
}
const vanityResults = await req("PUT", `/api/publications/${vanityPub}/results`, {
  capture_method: "manual",
  is_test: true,
  metrics: { leads_generated: 0, views_reach: 500, reactions: 40 }
});
if (!vanityResults.data.ok) fail(vanityResults.data.error);
const platform = await req("PUT", `/api/publications/${pubId}/results`, {
  capture_method: "platform",
  metrics: { leads_generated: 2 }
});
if (platform.status !== 409) fail("platform metrics were accepted");
ok("manual metrics stored; platform retrieval refused");

const goalAfter = await req("GET", `/api/goals/${goalId}`);
if (Number(goalAfter.data.goal.progress.contributed) !== 2) {
  fail(`Goal contributed ${goalAfter.data.goal.progress.contributed}, expected 2 leads`);
}
if (!goalAfter.data.goal.progress.achieved) fail("Goal should be achieved at 2/2 TEST DATA leads");
ok("Goal progress is +2 contacts from entered leads, not from views");

const analytics = await req("GET", `/api/analytics?goal_id=${goalId}`);
if (!analytics.data.ok) fail(analytics.data.error);
const useful = analytics.data.analytics.answers.mostUsefulTowardGoal;
const visibilityForGoal = (analytics.data.analytics.rankings.visibility || []).filter(
  (item) => item.goalId === goalId
);
if (useful?.publicationId !== pubId) {
  fail("most useful toward Goal was not the leads=2 content (vanity views may have won)");
}
if (visibilityForGoal[0]?.publicationId !== vanityPub) {
  fail("visibility ranking should prefer the 500-view item");
}
ok("Goal-oriented ranking prefers +2 leads over 500 views");

const analyze = await req("POST", "/api/intelligence/analyze", {
  goal_id: goalId,
  is_test: true,
  mode: "live_ai"
});
if (!analyze.data.ok) fail(analyze.data.error || "live analysis failed");
const rec = analyze.data.recommendation;
if (!rec.liveAiUsed) fail("analysis not live AI");
if (!String(rec.observed || "").trim()) fail("missing Observed");
if (!String(rec.why_it_matters || "").trim()) fail("missing Meaning");
if (!String(rec.action_hint || "").trim()) fail("missing Recommended next action");
if (Number(rec.goal_id) !== goalId) fail("recommendation lost Goal");
if (Number(rec.campaign_id) !== campaignId) fail("recommendation lost Campaign");
const evidence = rec.evidence || [];
const leadRow = evidence.find(
  (row) => Number(row.publicationId) === pubId && String(row.metric) === "leads_generated"
);
if (!leadRow || Number(leadRow.value) !== 2) fail("recommendation did not cite stored leads_generated=2");
if (leadRow.captureMethod !== "manual") fail("evidence claimed non-manual capture");
const blob = `${rec.observed} ${rec.why_it_matters} ${rec.action_hint}`.toLowerCase();
if (blob.includes("facebook collected") || blob.includes("meta collected")) {
  fail("AI implied platform-collected metrics");
}
if (blob.includes("revenue") || blob.includes("real client")) {
  fail("AI invented business outcomes");
}
ok(`live AI recommendation ${rec.id} cites stored leads=2`);

const summary = await req("GET", "/api/workflow/summary");
if (!summary.data.ok) fail("Hub summary failed");
const s = summary.data.summary;
if (!s.activeGoal) fail("Hub has no active Goal");
if (!s.latestRecommendation) fail("Hub has no recommendation");
if (!s.adapter?.isMock) fail("Hub adapter not marked mock");
ok("Hub summary carries Goal, recommendation, mock adapter");

console.log("ACI-011 PAPEV validation passed against", base);
console.log(
  JSON.stringify(
    {
      goalId,
      campaignId,
      sourceId,
      draftId: draft.id,
      goalPublicationId: pubId,
      vanityPublicationId: vanityPub,
      recommendationId: rec.id,
      observed: rec.observed,
      meaning: rec.why_it_matters,
      action: rec.action_hint
    },
    null,
    2
  )
);
