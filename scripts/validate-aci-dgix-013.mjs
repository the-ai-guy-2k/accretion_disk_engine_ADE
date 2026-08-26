/**
 * ACI-DGIX-013 validation: ACP v1 intake, rejection of invalid packages, no auto-approval.
 * Usage: node scripts/validate-aci-dgix-013.mjs
 */
import fs from "node:fs";
import path from "node:path";

const base = process.env.ADE_APP_URL || "http://localhost:3000";
const validPath = path.resolve("examples/acp/acp-v1-taig-facebook-contacts.test.json");
const invalidPath = path.resolve("examples/acp/acp-v1-invalid-missing-objective.json");

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
  if (!text.includes(needle)) fail(`missing ${label}`);
}

const health = await req("GET", "/api/health");
if (!health.data.ok) fail(health.data.error || "health failed");
const schemaVersion = Number(health.data.persistence?.schemaVersion);
if (!Number.isFinite(schemaVersion) || schemaVersion < 6) {
  fail(`expected schema v6 or later, got ${health.data.persistence?.schemaVersion}`);
}
ok(`health schema v${health.data.persistence.schemaVersion}`);

const screens = ["/", "/dgix", "/goals", "/campaigns", "/sources", "/create", "/review", "/publishing", "/analytics", "/intelligence"];
for (const pathName of screens) {
  const view = await page(pathName);
  if (view.status !== 200) fail(`${pathName} returned ${view.status}`);
  if (/Application error|Module not found/i.test(view.text)) fail(`${pathName} rendered an application error`);
}
ok("Hub, DGIX, and Standard ADE screens return 200");

const workspace = await page("/dgix");
mustContain(workspace.text, "Campaign Package Intake");
mustContain(workspace.text, "IMPLEMENTED");
mustContain(workspace.text, "Facebook Account Connection");
mustContain(workspace.text, "Real Facebook Publishing");
mustContain(workspace.text, "Facebook Metrics Retrieval");
mustContain(workspace.text, "Results Package Export");
mustContain(workspace.text, "Distribution / Growth Optimization");
for (const label of [
  "Facebook Account Connection",
  "Real Facebook Publishing",
  "Facebook Metrics Retrieval",
  "Results Package Export",
  "Distribution / Growth Optimization"
]) {
  if (!workspace.text.includes(`${label} — NOT YET IMPLEMENTED`) && !workspace.text.includes("NOT YET IMPLEMENTED")) {
    fail(`${label} not shown as unimplemented`);
  }
}
if (workspace.text.includes("Campaign Package Intake") && /Campaign Package Intake[\s\S]{0,80}NOT YET IMPLEMENTED/.test(workspace.text)) {
  fail("Campaign Package Intake still labeled NOT YET IMPLEMENTED");
}
ok("DGIX workspace truthfully shows ACP intake implemented");

const invalid = JSON.parse(fs.readFileSync(invalidPath, "utf8"));
const invalidRes = await req("POST", "/api/dgix/acp", invalid);
if (invalidRes.status !== 400 || invalidRes.data.ok) fail("invalid ACP was accepted");
if (!Array.isArray(invalidRes.data.issues) || !invalidRes.data.issues.length) {
  fail("invalid ACP did not return operator-facing issues");
}
if (!invalidRes.data.issues.some((issue) => /objective/i.test(issue.path + issue.message))) {
  fail("invalid ACP issues did not mention the missing objective");
}
ok("invalid ACP rejected with useful feedback");

const secretPkg = {
  ...JSON.parse(fs.readFileSync(validPath, "utf8")),
  packageId: `acp-secret-${Date.now()}`,
  access_token: "SHOULD_NOT_BE_HERE"
};
const secretRes = await req("POST", "/api/dgix/acp", secretPkg);
if (secretRes.status !== 400 || secretRes.data.ok) fail("ACP with access_token was accepted");
ok("credential fields are rejected");

const valid = JSON.parse(fs.readFileSync(validPath, "utf8"));
valid.packageId = `acp-test-taig-facebook-contacts-${Date.now()}`;
const imported = await req("POST", "/api/dgix/acp", valid);
if (imported.status !== 201 || !imported.data.ok) fail(imported.data.error || "valid TEST ACP was not imported");
const intake = imported.data.intake;
if (!intake?.id) fail("intake id missing");
if (intake.executionAuthorized) fail("import authorized execution");
if (intake.materializedIntoAde) fail("import materialized ADE records");
if (intake.goalId || intake.campaignId) fail("import created Goal or Campaign");
if (intake.reviewState !== "pending_operator_review") fail(`unexpected review state ${intake.reviewState}`);
if (!intake.isTest) fail("TEST ACP lost isTest");
if (intake.review?.OBJECTIVE !== valid.objective.statement) fail("objective not shown in review");
if (intake.review?.CAMPAIGN !== valid.campaignName) fail("campaign not shown in review");
if (!String(intake.package?.provenance?.originatingIntelligenceSource || "").includes("QEN")) {
  fail("provenance originating source missing");
}
ok(`TEST ACP imported as intake ${intake.id} without approval`);

const fetched = await req("GET", `/api/dgix/acp/${intake.id}`);
if (!fetched.data.ok) fail("persisted intake could not be read");
if (fetched.data.intake.packageId !== valid.packageId) fail("packageId did not persist");
if (fetched.data.intake.importedAt !== intake.importedAt) fail("importedAt did not persist");
ok("ACP provenance persisted");

const listed = await req("GET", "/api/dgix/acp");
if (!listed.data.ok || !listed.data.intakes.some((row) => row.id === intake.id)) {
  fail("intake missing from list");
}
ok("intake list includes the TEST package");

const reviewed = await req("POST", `/api/dgix/acp/${intake.id}/review`, { decision: "reviewed" });
if (!reviewed.data.ok) fail(reviewed.data.error || "review POST failed");
if (reviewed.data.intake.executionAuthorized) fail("review authorized execution");
if (reviewed.data.intake.materializedIntoAde) fail("review created ADE records");
if (reviewed.data.intake.reviewState !== "operator_reviewed") fail("review state not recorded");
ok("operator review is not approval");

const reviewPage = await page(`/dgix/acp/${intake.id}`);
if (reviewPage.status !== 200) fail(`review page ${reviewPage.status}`);
mustContain(reviewPage.text, "OBJECTIVE");
mustContain(reviewPage.text, "CAMPAIGN");
mustContain(reviewPage.text, "AUDIENCE");
mustContain(reviewPage.text, "CONTENT");
mustContain(reviewPage.text, "SOURCE");
mustContain(reviewPage.text, "CTA");
mustContain(reviewPage.text, "MEASUREMENT");
mustContain(reviewPage.text, "RESTRICTIONS");
mustContain(reviewPage.text, "not approval");
ok("Operator review page presents ACP coherently");

const summary = await req("GET", "/api/workflow/summary");
if (!summary.data.ok) fail(summary.data.error || "workflow summary failed");
if (!summary.data.summary?.adapter?.isMock) fail("publishing adapter is no longer marked mock");
ok("Standard ADE remains operational; Facebook adapter remains mock");

console.log("PASS ACI-DGIX-013 campaign package intake");
