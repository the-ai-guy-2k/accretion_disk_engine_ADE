/**
 * ACI-008 HTTP validation against a running ADE server.
 * Requires live AI credentials in the ADE process (.env.local ADE_AI_API_KEY or OPENAI_API_KEY).
 * Usage: node scripts/validate-aci008.mjs
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
if (!Number.isFinite(schemaVersion) || schemaVersion < 5) {
  fail(`expected schema v5 or later, got ${health.data.persistence?.schemaVersion}`);
}
ok("schema v5 health");

const aiStatus = await req("GET", "/api/ai/status");
if (!aiStatus.data.ok) fail("ai status failed");
if (aiStatus.data.ai?.credential || aiStatus.data.ai?.apiKey) {
  fail("AI status leaked a credential field");
}
if (!aiStatus.data.ai?.ready) {
  fail(aiStatus.data.ai?.unavailableReason || "live AI is not configured on the running ADE process");
}
ok(`AI ready (${aiStatus.data.ai.provider} / ${aiStatus.data.ai.model})`);

const listBefore = await req("GET", "/api/content");
const beforeIds = new Set((listBefore.data.content || []).map((row) => row.id));

const missing = await req("POST", "/api/content/generate", {});
if (missing.status !== 400 || missing.data.ok) fail("generate without source should fail");
const listAfterMissing = await req("GET", "/api/content");
const afterMissingIds = (listAfterMissing.data.content || []).map((row) => row.id);
if (afterMissingIds.some((id) => !beforeIds.has(id))) {
  fail("failed generate created a draft");
}
ok("missing source does not create a draft");

const missingSource = await req("POST", "/api/content/generate", { source_id: 999999 });
if (missingSource.status !== 404 || missingSource.data.ok) {
  fail("generate for unknown source should 404");
}
ok("unknown source generate fails without a successful draft");

const sourceRes = await req("POST", "/api/sources", {
  title: "[TEST DATA] ADE local operator note",
  body:
    "ADE localhost note: this week the operator is documenting the Create workflow. TEST DATA. This is not a customer case, revenue claim, endorsement, or completed client result.",
  source_type: "taig_activity",
  activity_date: "2026-08-26",
  provenance: "scripts/validate-aci008.mjs",
  notes: "TEST DATA. Non-sensitive local validation source.",
  is_test: true
});
if (!sourceRes.data.ok) fail(sourceRes.error || sourceRes.data.error);
const sourceId = sourceRes.data.source.id;
ok(`source ${sourceId} persisted`);

const live = await req("POST", "/api/content/generate", {
  source_id: sourceId,
  platform: "facebook",
  purpose: "Share the operator note as a short social post",
  tone: "professional and clear",
  length: "short Facebook post",
  extra_instruction: "Stay inside the source. Do not invent customers or results."
});
if (!live.data.ok) fail(live.data.error || "live AI generate failed");
const draft = live.data.content;
if (!draft?.id) fail("live generate did not return content");
if (Number(draft.source_id) !== sourceId) fail("live draft lost source provenance");
if (draft.status !== "draft") fail("live generate skipped human review");
if (draft.generation_mode !== "live_ai") fail("expected generation_mode live_ai");
if (draft.generation_status !== "succeeded") fail("expected generation_status succeeded");
if (!String(draft.body || "").trim()) fail("live draft body empty");
if (!String(draft.generation_note || "").toLowerCase().includes("live ai")) {
  fail("draft missing live AI identification");
}
if (draft.publication) fail("AI draft auto-entered publishing");
ok(`live AI draft ${draft.id} persisted with source ${sourceId}`);

const editedTitle = `${draft.title} (operator edit)`;
const editRes = await req("PATCH", `/api/content/${draft.id}`, {
  title: editedTitle,
  body: `${draft.body}\n\nOperator edit: still a draft.`
});
if (!editRes.data.ok) fail(editRes.data.error);
if (editRes.data.content.title !== editedTitle) fail("edit did not persist");
if (Number(editRes.data.content.source_id) !== sourceId) fail("edit lost source provenance");
ok("AI draft remains editable");

const approveRes = await req("POST", `/api/content/${draft.id}`, { action: "approve" });
if (!approveRes.data.ok) fail(approveRes.data.error);
if (approveRes.data.content.status !== "approved") fail("approve failed");
if (approveRes.data.content.publication?.status !== "PENDING") {
  fail("approved AI draft did not enter queue");
}
ok("approved AI draft entered publishing queue");

const second = await req("POST", "/api/content/generate", {
  source_id: sourceId,
  platform: "facebook",
  purpose: "Second validation draft for reject path",
  tone: "direct and concise",
  length: "short Facebook post"
});
if (!second.data.ok) fail(second.data.error || "second live generate failed");
const rejectRes = await req("POST", `/api/content/${second.data.content.id}`, { action: "reject" });
if (!rejectRes.data.ok) fail(rejectRes.data.error);
const enqueueRejected = await req("POST", `/api/content/${second.data.content.id}`, {
  action: "enqueue"
});
if (enqueueRejected.status !== 409) fail("rejected AI draft entered queue");
ok("rejected AI draft cannot enter publishing queue");

const mock = await req("POST", "/api/content", { source_id: sourceId });
if (!mock.data.ok) fail(mock.data.error);
if (mock.data.content.generation_mode !== "mock_manual") fail("manual draft path broken");
ok("mock/manual draft creation still works");

console.log("ACI-008 HTTP validation passed against", base);
