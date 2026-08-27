/**
 * ACI-DGIX-018 validation: Operator UI can drive existing organic Facebook execution
 * without a second path and without auto-publishing.
 * Usage: node scripts/validate-aci-dgix-018.mjs
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

function secretKeysIn(value, pathName = "$") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => secretKeysIn(item, `${pathName}[${index}]`));
  }
  if (!value || typeof value !== "object") return [];
  const hits = [];
  for (const [key, child] of Object.entries(value)) {
    if (/access_token|page_access_token|app_secret|ad_access_token|password/i.test(key)) {
      hits.push(`${pathName}.${key}`);
    }
    hits.push(...secretKeysIn(child, `${pathName}.${key}`));
  }
  return hits;
}

function cloneValid(suffix) {
  const valid = JSON.parse(fs.readFileSync(validPath, "utf8"));
  valid.packageId = `acp-test-taig-018-${suffix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  return valid;
}

const health = await req("GET", "/api/health");
if (!health.data.ok) fail(health.data.error || "health failed");
if (secretKeysIn(health.data).length) fail("health leaked secret keys");
ok("health ok");

const workspace = await page("/dgix");
if (workspace.status !== 200) fail(`/dgix returned ${workspace.status}`);
mustContain(workspace.text, "DGIX");
mustContain(workspace.text, "Campaign Package Intake");
mustContain(workspace.text, "Import for review");
mustContain(workspace.text, "VALIDATED");
ok("DGIX workspace loads");

const imported = await req("POST", "/api/dgix/acp", cloneValid("ui-import"));
if (!imported.data.ok) fail(imported.data.error || "UI-path import failed");
if (imported.data.intake.reviewState !== "imported") fail("import was not stored as imported");
if (imported.data.intake.executionAuthorized) fail("import authorized the package");
if (imported.data.intake.canExecuteOrganic) fail("imported ACP was executable");
if (secretKeysIn(imported.data).length) fail("import leaked secrets");
ok("ACP import through the intake API does not authorize or execute");

const reviewPage = await page(`/dgix/acp/${imported.data.intake.id}`);
if (reviewPage.status !== 200) fail(`review page ${reviewPage.status}`);
mustContain(reviewPage.text, "Intended execution");
mustContain(reviewPage.text, "Client");
mustContain(reviewPage.text, "Platform");
mustContain(reviewPage.text, "Distribution");
mustContain(reviewPage.text, "organic");
mustContain(reviewPage.text, "facebook");
mustContain(reviewPage.text, "TAIG");
mustContain(reviewPage.text, imported.data.intake.review.FINAL_CONTENT);
mustContain(reviewPage.text, "now");
mustContain(reviewPage.text, "Authorize execution");
mustContain(reviewPage.text, "Reject package");
mustContain(reviewPage.text, "facebook_organic_page");
ok("review page shows client, platform, distribution, destination, content, and timing");

const importedExec = await req("POST", `/api/dgix/acp/${imported.data.intake.id}/execute`, {});
if (importedExec.data.ok || importedExec.data.executed) fail("unauthorized ACP executed");
if (importedExec.status !== 409) fail(`unauthorized execute expected 409, got ${importedExec.status}`);
ok("unauthorized ACP cannot execute");

const reviewed = await req("POST", `/api/dgix/acp/${imported.data.intake.id}/review`, {
  decision: "reviewed"
});
if (!reviewed.data.ok) fail(reviewed.data.error || "review failed");
if (reviewed.data.intake.executionAuthorized) fail("review authorized the package");
if (reviewed.data.intake.canExecuteOrganic) fail("reviewed-only ACP was executable");
const reviewedExec = await req("POST", `/api/dgix/acp/${imported.data.intake.id}/execute`, {});
if (reviewedExec.data.ok || reviewedExec.data.executed) fail("reviewed-only ACP executed");
ok("review is not authorization and not execution");

const authorized = await req("POST", `/api/dgix/acp/${imported.data.intake.id}/authorize`, {
  decision: "authorize"
});
if (!authorized.data.ok) fail(authorized.data.error || "authorize failed");
if (authorized.data.intake.facebookRouting?.executed) fail("authorize claimed execution");
if (!authorized.data.intake.canExecuteOrganic) fail("authorized organic ACP is not executable");
const authPage = await page(`/dgix/acp/${imported.data.intake.id}`);
mustContain(authPage.text, "AUTHORIZED - READY FOR FACEBOOK EXECUTION");
mustContain(authPage.text, "Execute on Facebook");
ok("authorized ACP is ready for a separate UI execute action");

const liveConfigured = Boolean(health.data.facebook?.pageAuthorizationConfigured);
if (liveConfigured) {
  ok("live Meta credentials are configured; ACI-DGIX-018 regression will not publish TEST DATA");
} else {
  const executed = await req("POST", `/api/dgix/acp/${imported.data.intake.id}/execute`, {});
  if (executed.data.ok && executed.data.executed && !executed.data.execution?.externalObjectId) {
    fail("execute claimed success without a Facebook object id");
  }
  ok("execute without live credentials did not fabricate Meta success");
}

const rejectPkg = cloneValid("reject");
const rejectImport = await req("POST", "/api/dgix/acp", rejectPkg);
const rejected = await req("POST", `/api/dgix/acp/${rejectImport.data.intake.id}/authorize`, {
  decision: "reject"
});
if (!rejected.data.ok) fail("reject failed");
const rejectedExec = await req("POST", `/api/dgix/acp/${rejectImport.data.intake.id}/execute`, {});
if (rejectedExec.data.ok || rejectedExec.data.executed) fail("rejected ACP executed");
ok("Operator can reject through the product workflow");

const prior = await req("GET", "/api/dgix/acp/43");
if (prior.data?.ok && prior.data.intake?.executionStatus === "executed") {
  const priorPage = await page("/dgix/acp/43");
  const objectId = prior.data.intake.latestExecution?.externalObjectId;
  if (!objectId) fail("intake 43 is EXECUTED without a Meta object id");
  mustContain(priorPage.text, "EXECUTED");
  mustContain(priorPage.text, objectId);
  if (secretKeysIn(prior.data).length) fail("executed intake leaked secrets");
  const dup = await req("POST", "/api/dgix/acp/43/execute", {});
  if (dup.data.ok || dup.data.executed) fail("duplicate execute of intake 43 was allowed");
  if (dup.status !== 409) fail(`duplicate execute expected 409, got ${dup.status}`);
  ok("prior EXECUTED intake remains visible in the UI with Meta object id and duplicate protection");
}

console.log("PASS ACI-DGIX-018 Operator UI organic execution (live UI publish still requires Operator authorization)");
