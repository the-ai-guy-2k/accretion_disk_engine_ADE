/**
 * ACI-DGIX-014 validation: execution-ready ACP, conditional fields, Operator authorization.
 * Usage: node scripts/validate-aci-dgix-014.mjs
 */
import fs from "node:fs";
import path from "node:path";

const base = process.env.ADE_APP_URL || "http://localhost:3000";
const validPath = path.resolve("examples/acp/acp-v1-taig-facebook-contacts.test.json");

async function req(method, pathName, body) {
  const res = await fetch(base + pathName, {
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

async function page(pathName) {
  const res = await fetch(base + pathName);
  const raw = await res.text();
  const text = raw.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  return { status: res.status, text };
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

function mustContain(text, needle, label = needle) {
  const normalized = text.replace(/<!--.*?-->/g, "").replace(/[—–]/g, "-");
  const want = needle.replace(/[—–]/g, "-");
  if (!normalized.includes(want)) fail(`missing ${label}`);
}

function cloneValid(suffix) {
  const valid = JSON.parse(fs.readFileSync(validPath, "utf8"));
  valid.packageId = `acp-test-taig-014-${suffix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  return valid;
}

const health = await req("GET", "/api/health");
if (!health.data.ok) fail(health.data.error || "health failed");
const schemaVersion = Number(health.data.persistence?.schemaVersion);
if (!Number.isFinite(schemaVersion) || schemaVersion < 7) {
  fail(`expected schema v7 or later, got ${health.data.persistence?.schemaVersion}`);
}
ok(`health schema v${health.data.persistence.schemaVersion}`);

const workspace = await page("/dgix");
if (workspace.status !== 200) fail(`/dgix returned ${workspace.status}`);
for (const capability of [
  "Campaign Package Intake",
  "ACP Validation",
  "Operator Review",
  "Operator Authorization"
]) {
  if (/Campaign Package Intake[\s\S]{0,80}NOT YET IMPLEMENTED/.test(workspace.text) && capability === "Campaign Package Intake") {
    fail("Campaign Package Intake still labeled NOT YET IMPLEMENTED");
  }
  mustContain(workspace.text, capability);
  mustContain(workspace.text, `${capability}`);
}
mustContain(workspace.text, "IMPLEMENTED");
for (const label of [
  "Real Facebook Publishing",
  "Facebook Metrics Retrieval",
  "Results Package Export"
]) {
  mustContain(workspace.text, `${label} — NOT YET IMPLEMENTED`);
}
mustContain(workspace.text, "Facebook Account Connection");
ok("DGIX workspace reports authorization implemented and Facebook execution not connected");

const imageMissing = cloneValid("image-missing");
imageMissing.execution.postType = "image";
delete imageMissing.execution.mediaReference;
const imageRes = await req("POST", "/api/dgix/acp", imageMissing);
if (imageRes.status !== 400 || imageRes.data.ok) fail("image post without media was accepted");
if (!Array.isArray(imageRes.data.issues) || !imageRes.data.issues.some((issue) => issue.path === "execution.mediaReference")) {
  fail("image post did not report mediaReference as required");
}
ok("image post requires mediaReference");

const scheduledMissing = cloneValid("scheduled-missing");
scheduledMissing.execution.publishMode = "scheduled";
delete scheduledMissing.execution.scheduledAt;
const scheduledRes = await req("POST", "/api/dgix/acp", scheduledMissing);
if (scheduledRes.status !== 400 || scheduledRes.data.ok) fail("scheduled post without timestamp was accepted");
if (!scheduledRes.data.issues?.some((issue) => issue.path === "execution.scheduledAt")) {
  fail("scheduled post did not report scheduledAt as required");
}
ok("scheduled execution requires scheduledAt");

const secretPkg = cloneValid("secret");
secretPkg.page_access_token = "SHOULD_NOT_BE_HERE";
const secretRes = await req("POST", "/api/dgix/acp", secretPkg);
if (secretRes.status !== 400 || secretRes.data.ok) fail("ACP with page_access_token was accepted");
ok("credentials remain outside ACP");

const before = await req("GET", "/api/workflow/summary");
if (!before.data.ok) fail("workflow summary failed before import");
const beforeCounts = {
  sources: before.data.summary.sources,
  drafts: before.data.summary.drafts,
  campaigns: before.data.summary.campaigns,
  published: before.data.summary.queue.PUBLISHED,
  pending: before.data.summary.queue.PENDING
};

const valid = cloneValid("ready");
const imported = await req("POST", "/api/dgix/acp", valid);
if (imported.status !== 201 || !imported.data.ok) fail(imported.data.error || "execution-ready ACP was not imported");
const intake = imported.data.intake;
if (intake.reviewState !== "imported") fail(`expected imported, got ${intake.reviewState}`);
if (!intake.executionReady) fail("execution-ready flag missing");
if (intake.executionAuthorized) fail("import authorized execution");
if (intake.materializedIntoAde || intake.goalId || intake.campaignId) {
  fail("import materialized Standard ADE records");
}
if (intake.review?.FINAL_CONTENT !== valid.execution.message) fail("final content not preserved");
if (intake.review?.DESTINATION !== "facebook for client TAIG") fail(`destination ${intake.review?.DESTINATION}`);
if (intake.platformHandoff?.message !== valid.execution.message) fail("adapter handoff missing message");
const handoffKeys = Object.keys(intake.platformHandoff || {}).join(" ");
if (/access_token|page_access_token|api_key|password|app_secret/i.test(handoffKeys + JSON.stringify(intake.platformHandoff?.clientId))) {
  fail("adapter handoff exposed a credential field");
}
ok(`execution-ready ACP imported as intake ${intake.id}`);

const reviewPage = await page(`/dgix/acp/${intake.id}`);
if (reviewPage.status !== 200) fail(`review page ${reviewPage.status}`);
for (const heading of [
  "DESTINATION",
  "POST TYPE",
  "FINAL CONTENT",
  "MEDIA / LINK",
  "TIMING",
  "OBJECTIVE",
  "MEASUREMENT",
  "PROVENANCE"
]) {
  mustContain(reviewPage.text, heading);
}
mustContain(reviewPage.text, valid.execution.message);
mustContain(reviewPage.text, "EXECUTION-READY");
mustContain(reviewPage.text, "not regenerate");
ok("Operator review shows destination, post type, final content, media/link, timing, objective, measurement, provenance");

const reviewed = await req("POST", `/api/dgix/acp/${intake.id}/review`, { decision: "reviewed" });
if (!reviewed.data.ok) fail(reviewed.data.error || "review POST failed");
if (reviewed.data.intake.reviewState !== "ready_for_decision") fail("ready_for_decision not recorded");
if (reviewed.data.intake.executionAuthorized) fail("review authorized execution");
ok("Operator review does not authorize");

const authorized = await req("POST", `/api/dgix/acp/${intake.id}/authorize`, { decision: "authorize" });
if (!authorized.data.ok) fail(authorized.data.error || "authorize POST failed");
if (authorized.data.intake.reviewState !== "authorized") fail(`expected authorized, got ${authorized.data.intake.reviewState}`);
if (!authorized.data.intake.executionAuthorized) fail("executionAuthorized not set");
if (authorized.data.intake.executionStatus !== "authorized_platform_not_connected") {
  fail(`unexpected executionStatus ${authorized.data.intake.executionStatus}`);
}
if (authorized.data.intake.materializedIntoAde || authorized.data.intake.goalId || authorized.data.intake.campaignId) {
  fail("authorization materialized Standard ADE records");
}
if (!String(authorized.data.banner || "").replace(/[—–]/g, "-").includes("PLATFORM EXECUTION NOT YET CONNECTED")) {
  fail("authorization banner did not state platform execution is not connected");
}
ok("Operator can AUTHORIZE without executing");

const afterAuthPage = await page(`/dgix/acp/${intake.id}`);
mustContain(afterAuthPage.text, "AUTHORIZED — PLATFORM EXECUTION NOT YET CONNECTED");
ok("authorized package stays disconnected from Facebook");

const after = await req("GET", "/api/workflow/summary");
if (!after.data.ok) fail("workflow summary failed after authorize");
if (after.data.summary.sources !== beforeCounts.sources) fail("authorization created Source records");
if (after.data.summary.drafts !== beforeCounts.drafts) fail("authorization created Draft records");
if (after.data.summary.campaigns !== beforeCounts.campaigns) fail("authorization created Campaign records");
if (after.data.summary.queue.PUBLISHED !== beforeCounts.published) fail("authorization published via adapter");
if (after.data.summary.queue.PENDING !== beforeCounts.pending) fail("authorization queued a publication");
if (!after.data.summary.adapter?.isMock) fail("publishing adapter is no longer marked mock");
ok("authorization did not execute externally and did not materialize Standard ADE records");

const rejectPkg = cloneValid("reject");
const rejectImported = await req("POST", "/api/dgix/acp", rejectPkg);
if (!rejectImported.data.ok) fail("reject-path import failed");
const rejected = await req("POST", `/api/dgix/acp/${rejectImported.data.intake.id}/authorize`, {
  decision: "reject"
});
if (!rejected.data.ok) fail(rejected.data.error || "reject POST failed");
if (rejected.data.intake.reviewState !== "rejected") fail("rejected state not recorded");
if (rejected.data.intake.executionAuthorized) fail("reject authorized execution");
ok("Operator can REJECT");

const { execution: _drop, ...legacyBody } = cloneValid("legacy");
const legacy = { ...legacyBody, packageId: `acp-legacy-014-${Date.now()}` };
const legacyImported = await req("POST", "/api/dgix/acp", legacy);
if (!legacyImported.data.ok) fail(legacyImported.data.error || "legacy ACP should still import");
if (legacyImported.data.intake.executionReady) fail("legacy package marked execution-ready");
const legacyAuth = await req("POST", `/api/dgix/acp/${legacyImported.data.intake.id}/authorize`, {
  decision: "authorize"
});
if (legacyAuth.data.ok) fail("legacy ACP was authorized");
ok("existing ACP-without-execution records remain importable and are not silently authorized");

const fetched = await req("GET", `/api/dgix/acp/${intake.id}`);
if (fetched.data.intake.packageId !== valid.packageId) fail("packageId lost");
if (fetched.data.intake.importedAt !== intake.importedAt) fail("importedAt lost");
if (!fetched.data.intake.decisionBy) fail("decision actor not recorded");
if (!fetched.data.intake.decisionAt) fail("decision timestamp not recorded");
ok("ACP provenance and Operator decision remain intact");

console.log("PASS ACI-DGIX-014 execution-ready ACP");
