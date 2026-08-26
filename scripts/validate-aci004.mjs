/**
 * ACI-004 HTTP validation against a running ADE server.
 * Usage: node scripts/validate-aci004.mjs
 */
const base = process.env.ADE_APP_URL || "http://localhost:3000";

async function req(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  return { status: res.status, data };
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const sourceRes = await req("POST", "/api/sources", {
  title: "[TEST DATA] ADE ACI-004 validation source",
  body: "TAIG localhost Hub vertical slice check. TEST DATA. No client, revenue, or audience claim.",
  source_type: "taig_activity",
  activity_date: "2026-08-26",
  provenance: "scripts/validate-aci004.mjs",
  notes: "TEST DATA",
  is_test: true
});
if (!sourceRes.data.ok) fail(sourceRes.data.error);
const sourceId = sourceRes.data.source.id;
ok(`source ${sourceId} persisted`);

const draftRes = await req("POST", "/api/content", { source_id: sourceId });
if (!draftRes.data.ok) fail(draftRes.data.error);
const contentId = draftRes.data.content.id;
if (draftRes.data.content.source_id !== sourceId) fail("provenance lost on draft create");
ok(`draft ${contentId} linked to source ${sourceId}`);

const editRes = await req("PATCH", `/api/content/${contentId}`, {
  title: "[TEST DATA] Edited draft title",
  body: draftRes.data.content.body + "\n\nOperator edit recorded."
});
if (!editRes.data.ok) fail(editRes.data.error);
if (!String(editRes.data.content.title).includes("Edited")) fail("edit did not persist");
ok("draft edited");

const enqueueDraft = await req("POST", `/api/content/${contentId}`, { action: "enqueue" });
if (enqueueDraft.status !== 409) fail(`unapproved enqueue should 409, got ${enqueueDraft.status}`);
ok("unapproved content cannot enter queue");

const rejectRes = await req("POST", `/api/content/${contentId}`, { action: "reject" });
if (!rejectRes.data.ok) fail(rejectRes.data.error);
const enqueueRejected = await req("POST", `/api/content/${contentId}`, { action: "enqueue" });
if (enqueueRejected.status !== 409) fail("rejected content entered queue");
ok("rejected content cannot enter queue");

const returnRes = await req("POST", `/api/content/${contentId}`, { action: "return_to_draft" });
if (!returnRes.data.ok) fail(returnRes.data.error);

const approveRes = await req("POST", `/api/content/${contentId}`, { action: "approve" });
if (!approveRes.data.ok) fail(approveRes.data.error);
const pubId = approveRes.data.content.publication?.id;
if (!pubId) fail("approval did not create queue item");
if (approveRes.data.content.publication.status !== "PENDING") fail("queue item not PENDING");
if (approveRes.data.content.source_id !== sourceId) fail("provenance lost after approve");
ok(`approved content entered queue as publication ${pubId}`);

const failRes = await req("POST", `/api/publications/${pubId}`, {
  action: "fail",
  reason: "Controlled ACI-004 mock adapter failure"
});
if (!failRes.data.ok) fail(failRes.data.error);
if (failRes.data.publication.status !== "FAILED") fail("failure path did not set FAILED");
if (failRes.data.publication.status === "PUBLISHED") fail("failure incorrectly published");
if (failRes.data.publication.published_at) fail("FAILED row has published_at");
ok("failure path sets FAILED and not PUBLISHED");

const retryRes = await req("POST", `/api/publications/${pubId}`, { action: "retry" });
if (!retryRes.data.ok) fail(retryRes.data.error);
const handRes = await req("POST", `/api/publications/${pubId}`, { action: "hand_to_adapter" });
if (!handRes.data.ok) fail(handRes.data.error);
if (handRes.data.publication.status !== "READY") fail("adapter did not move to READY");
if (!String(handRes.data.adapter.message).includes("NOT REAL FACEBOOK")) {
  fail("mock Facebook boundary not identified");
}
ok("mock adapter hand-off identified as not real Facebook");

const dupHand = await req("POST", `/api/publications/${pubId}`, { action: "hand_to_adapter" });
if (dupHand.status !== 409) fail("duplicate adapter execution was allowed");
ok("duplicate adapter hand-off blocked");

const confirmRes = await req("POST", `/api/publications/${pubId}`, { action: "confirm" });
if (!confirmRes.data.ok) fail(confirmRes.data.error);
if (confirmRes.data.publication.status !== "PUBLISHED") fail("confirm did not publish mock");
if (!confirmRes.data.publication.is_mock) fail("published row not marked mock");
ok("mock publish success path");

const dupConfirm = await req("POST", `/api/publications/${pubId}`, { action: "confirm" });
if (dupConfirm.status !== 409) fail("duplicate confirm was allowed");
const failPublished = await req("POST", `/api/publications/${pubId}`, { action: "fail" });
if (failPublished.status !== 409) fail("published item was allowed to fail into rewrite");
ok("published mock item is terminal");

const again = await req("GET", `/api/content/${contentId}`);
if (again.data.content.source_id !== sourceId) fail("provenance lost after publish");
ok("source → draft provenance survived");

console.log("ACI-004 HTTP validation passed against", base);
