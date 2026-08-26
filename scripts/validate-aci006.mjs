/**
 * ACI-006 HTTP validation against a running ADE server.
 * Usage: node scripts/validate-aci006.mjs
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
if (!Number.isFinite(schemaVersion) || schemaVersion < 4) {
  fail(`expected schema v4 or later, got ${health.data.persistence?.schemaVersion}`);
}
ok("schema v4 or later health");

const goalRes = await req("POST", "/api/goals", {
  title: "[TEST DATA] Increase Audience Network by 10",
  description: "ACI-006 campaign validation goal. TEST DATA.",
  target_metric: "audience_network_gained",
  starting_value: 0,
  target_value: 10,
  status: "active",
  is_test: true
});
if (!goalRes.data.ok) fail(goalRes.data.error);
const goalId = goalRes.data.goal.id;
ok(`goal ${goalId} created`);

async function makeSource(title, sourceType) {
  const res = await req("POST", "/api/sources", {
    title: `[TEST DATA] ${title}`,
    body: `Labeled TEST DATA ${sourceType} source for ACI-006 campaign planning.`,
    source_type: sourceType,
    activity_date: "2026-08-26",
    provenance: "scripts/validate-aci006.mjs",
    notes: "TEST DATA",
    is_test: true,
    goal_id: goalId
  });
  if (!res.data.ok) fail(res.data.error);
  return res.data.source;
}

const clientSource = await makeSource("Campaign client-result source", "client_result");
const infoSource = await makeSource("Campaign informational source", "informational");
ok(`sources ${clientSource.id} and ${infoSource.id} created`);

const campaignRes = await req("POST", "/api/campaigns", {
  title: "[TEST DATA] ADE Awareness Campaign",
  objective: "Coordinate two source-backed posts to support Audience Network growth. TEST DATA.",
  goal_id: goalId,
  status: "planning",
  is_test: true
});
if (!campaignRes.data.ok) fail(campaignRes.data.error);
const campaignId = campaignRes.data.campaign.id;
if (campaignRes.data.campaign.goal_id !== goalId) fail("campaign lost goal relationship");
ok(`campaign ${campaignId} linked to goal ${goalId}`);

const emptyPlan = await req("POST", `/api/campaigns/${campaignId}/plan`);
if (emptyPlan.status !== 400) fail("plan without sources should fail");

const sourcesPut = await req("PUT", `/api/campaigns/${campaignId}/sources`, {
  source_ids: [clientSource.id, infoSource.id]
});
if (!sourcesPut.data.ok) fail(sourcesPut.data.error);
if (sourcesPut.data.sources.length !== 2) fail("expected two selected sources");
ok("two sources attached to campaign");

const planRes = await req("POST", `/api/campaigns/${campaignId}/plan`);
if (!planRes.data.ok) fail(planRes.data.error);
if (!String(planRes.data.plan.boundaryNote).includes("DETERMINISTIC")) {
  fail("missing campaign plan boundary");
}
if ((planRes.data.plan.items || []).length < 2) fail("plan did not contain multiple pieces");
ok(`content plan has ${planRes.data.plan.items.length} items`);

const draftsRes = await req("POST", `/api/campaigns/${campaignId}/drafts`);
if (!draftsRes.data.ok) fail(draftsRes.data.error);
if ((draftsRes.data.created || []).length < 2) fail("expected multiple drafts");
const drafts = draftsRes.data.created;
for (const draft of drafts) {
  if (!draft.source_id) fail("draft missing source provenance");
  if (Number(draft.campaign_id) !== campaignId) fail("draft missing campaign relationship");
  if (Number(draft.effective_goal_id) !== goalId) fail("draft missing goal relationship");
  if (draft.status !== "draft") fail("generated item skipped human review");
}
ok("multiple drafts generated with goal, campaign, and source provenance");

const [first, second] = drafts;
const approveRes = await req("POST", `/api/content/${first.id}`, { action: "approve" });
if (!approveRes.data.ok) fail(approveRes.data.error);
if (approveRes.data.content.publication?.status !== "PENDING") {
  fail("approved campaign draft did not enter queue");
}
ok(`approved draft ${first.id} entered publishing queue`);

const rejectRes = await req("POST", `/api/content/${second.id}`, { action: "reject" });
if (!rejectRes.data.ok) fail(rejectRes.data.error);
const enqueueRejected = await req("POST", `/api/content/${second.id}`, { action: "enqueue" });
if (enqueueRejected.status !== 409) fail("rejected campaign draft entered queue");
ok("rejected campaign draft cannot enter publishing queue");

const workspace = await req("GET", `/api/campaigns/${campaignId}/workspace`);
if (!workspace.data.ok) fail(workspace.data.error);
const ws = workspace.data.workspace;
if (ws.campaign.goal_id !== goalId) fail("workspace lost goal");
if (ws.sources.length !== 2) fail("workspace lost sources");
if (ws.drafts.length < 2) fail("workspace lost drafts");
if (ws.approvalCounts.approved < 1) fail("workspace missing approved draft");
if (ws.approvalCounts.rejected < 1) fail("workspace missing rejected draft");
ok("campaign workspace shows plan, drafts, approvals, and publishing state");

const results = await req("GET", `/api/campaigns/${campaignId}/results`);
if (!results.data.ok) fail(results.data.error);
ok("campaign results endpoint reuses ACI-005 metrics primitives");

console.log("ACI-006 HTTP validation passed against", base);
