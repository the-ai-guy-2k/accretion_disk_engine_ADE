/**
 * ACI-DGIX-016 validation: Facebook organic execution adapter without fabricating Meta success.
 * Usage: node scripts/validate-aci-dgix-016.mjs
 */
import fs from "node:fs";
import path from "node:path";

const base = process.env.ADE_APP_URL || "http://localhost:3000";
const validPath = path.resolve("examples/acp/acp-v1-taig-facebook-contacts.test.json");
const BLOCKED_PUBLISH = "REAL FACEBOOK PUBLISH VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED";

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
  valid.packageId = `acp-test-taig-016-${suffix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  return valid;
}

const health = await req("GET", "/api/health");
if (!health.data.ok) fail(health.data.error || "health failed");
const schemaVersion = Number(health.data.persistence?.schemaVersion);
if (!Number.isFinite(schemaVersion) || schemaVersion < 9) {
  fail(`expected schema v9 or later, got ${health.data.persistence?.schemaVersion}`);
}
if (health.data.facebook?.graphApiVersion !== "v26.0") {
  fail(`expected Graph API v26.0, got ${health.data.facebook?.graphApiVersion}`);
}
if (health.data.facebook?.realPublishingImplemented) {
  fail("health claimed live Facebook publishing was proven");
}
if (!health.data.facebook?.organicExecutionAdapterImplemented) {
  fail("health did not report the organic execution adapter");
}
if (health.data.facebook?.paidExecutionImplemented) fail("health claimed paid execution is implemented");
if (secretKeysIn(health.data).length) fail(`health leaked secret keys: ${secretKeysIn(health.data).join(", ")}`);
ok(`health schema v${health.data.persistence.schemaVersion} Graph ${health.data.facebook.graphApiVersion}`);

const workspace = await page("/dgix");
if (workspace.status !== 200) fail(`/dgix ${workspace.status}`);
mustContain(workspace.text, "Campaign Package Intake");
mustContain(workspace.text, "ACP Validation");
mustContain(workspace.text, "Operator Review");
mustContain(workspace.text, "Operator Authorization");
mustContain(workspace.text, "Facebook Account Connection");
mustContain(workspace.text, "Organic Facebook Execution Adapter");
mustContain(workspace.text, "IMPLEMENTED BUT REAL VALIDATION PENDING");
mustContain(workspace.text, "Paid Advertising Execution — NOT YET IMPLEMENTED");
mustContain(workspace.text, "Facebook Metrics Retrieval — NOT YET IMPLEMENTED");
mustContain(workspace.text, "Results Package Export — NOT YET IMPLEMENTED");
ok("DGIX workspace current truth is present");

const imported = await req("POST", "/api/dgix/acp", cloneValid("imported"));
if (!imported.data.ok) fail(imported.data.error || "import failed");
const importedExec = await req("POST", `/api/dgix/acp/${imported.data.intake.id}/execute`, {});
if (importedExec.data.ok || importedExec.data.executed) fail("imported ACP was executed");
if (importedExec.status !== 409) fail(`imported execute expected 409, got ${importedExec.status}`);
ok("unauthorized imported ACP cannot execute");

const reviewedPkg = cloneValid("reviewed");
const reviewedImport = await req("POST", "/api/dgix/acp", reviewedPkg);
await req("POST", `/api/dgix/acp/${reviewedImport.data.intake.id}/review`, { decision: "reviewed" });
const reviewedExec = await req("POST", `/api/dgix/acp/${reviewedImport.data.intake.id}/execute`, {});
if (reviewedExec.data.ok || reviewedExec.data.executed) fail("reviewed-only ACP was executed");
ok("reviewed but unauthorized ACP cannot execute");

const rejectPkg = cloneValid("reject");
const rejectImport = await req("POST", "/api/dgix/acp", rejectPkg);
const rejected = await req("POST", `/api/dgix/acp/${rejectImport.data.intake.id}/authorize`, {
  decision: "reject"
});
if (rejected.data.intake.reviewState !== "rejected") fail("reject path failed");
const rejectedExec = await req("POST", `/api/dgix/acp/${rejectImport.data.intake.id}/execute`, {});
if (rejectedExec.data.ok || rejectedExec.data.executed) fail("rejected ACP was executed");
ok("rejected ACP cannot execute");

const paidPkg = cloneValid("paid");
paidPkg.execution.distributionType = "paid";
const paidImport = await req("POST", "/api/dgix/acp", paidPkg);
const paidAuth = await req("POST", `/api/dgix/acp/${paidImport.data.intake.id}/authorize`, {
  decision: "authorize"
});
if (!paidAuth.data.ok) fail(paidAuth.data.error || "paid ACP could not be authorized");
const paidExec = await req("POST", `/api/dgix/acp/${paidImport.data.intake.id}/execute`, {});
if (paidExec.data.ok || paidExec.data.executed) fail("paid ACP executed through the organic adapter");
if (!String(paidExec.data.error || "").includes("NOT YET IMPLEMENTED")) {
  fail("paid refusal did not mention paid advertising is not implemented");
}
ok("paid ACP cannot execute through the organic adapter");

const before = await req("GET", "/api/workflow/summary");
const ready = cloneValid("ready");
const readyImport = await req("POST", "/api/dgix/acp", ready);
const authorized = await req("POST", `/api/dgix/acp/${readyImport.data.intake.id}/authorize`, {
  decision: "authorize"
});
if (!authorized.data.ok) fail(authorized.data.error || "authorize failed");
if (authorized.data.intake.executionStatus !== "ready_for_facebook_execution") {
  fail(`expected ready_for_facebook_execution, got ${authorized.data.intake.executionStatus}`);
}
if (authorized.data.intake.facebookRouting?.adapter !== "facebook_organic_page") {
  fail("authorized organic ACP did not route to facebook_organic_page");
}
if (authorized.data.intake.facebookRouting?.executed) fail("routing claimed execution at authorize time");
if (secretKeysIn(authorized.data).length) fail("authorize response leaked secrets");

const authPage = await page(`/dgix/acp/${readyImport.data.intake.id}`);
mustContain(authPage.text, "AUTHORIZED — READY FOR FACEBOOK EXECUTION");
mustContain(authPage.text, "Execute on Facebook");
ok("authorized organic Facebook ACP is ready for a separate execute action");

const executed = await req("POST", `/api/dgix/acp/${readyImport.data.intake.id}/execute`, {});
if (secretKeysIn(executed.data).length) fail(`execute response leaked secrets: ${secretKeysIn(executed.data).join(", ")}`);

const after = await req("GET", "/api/workflow/summary");
if (after.data.summary.queue.PUBLISHED !== before.data.summary.queue.PUBLISHED) {
  fail("organic execute used the Standard ADE mock publisher");
}
if (!after.data.summary.adapter?.isMock) fail("Standard ADE mock adapter is no longer mock");

let realPublishValidated = false;
if (executed.data.ok && executed.data.executed) {
  if (executed.data.intake.executionStatus !== "executed") {
    fail("successful Meta response was not recorded as EXECUTED");
  }
  if (!executed.data.execution?.externalObjectId) {
    fail("EXECUTED without a Facebook object id");
  }
  if (executed.data.execution.status !== "succeeded") fail("execution row was not succeeded");
  const again = await req("POST", `/api/dgix/acp/${readyImport.data.intake.id}/execute`, {});
  if (again.data.ok || again.data.executed) fail("duplicate successful execution was allowed");
  realPublishValidated = true;
  ok("real Facebook publish returned platform evidence; duplicate publish blocked");
} else {
  if (executed.data.intake?.executionStatus === "executed") {
    fail("failed/blocked execute was marked EXECUTED");
  }
  const blob = `${executed.data.error || ""} ${executed.data.blockedReason || ""}`;
  if (!blob.includes("CREDENTIAL/ASSET INPUT REQUIRED") && executed.status !== 502) {
    fail(`missing connection did not fail safely: ${blob || executed.status}`);
  }
  if (blob.includes("CREDENTIAL/ASSET INPUT REQUIRED")) {
    if ((executed.data.intake?.executions || []).some((row) => row.status === "succeeded")) {
      fail("blocked publish persisted a successful execution");
    }
    ok(BLOCKED_PUBLISH);
  } else {
    if (executed.data.intake?.executionStatus !== "execution_failed") {
      fail(`Meta failure was not recorded as execution_failed (${executed.data.intake?.executionStatus})`);
    }
    if (!executed.data.execution || executed.data.execution.status === "succeeded") {
      fail("failed Meta call was recorded as successful execution");
    }
    const retry = await req("POST", `/api/dgix/acp/${readyImport.data.intake.id}/execute`, {});
    if (retry.data.ok && retry.data.executed && !retry.data.execution?.externalObjectId) {
      fail("retry after failure fabricated success");
    }
    ok("failed execution persisted and was not marked successful");
  }
}

const fetched = await req("GET", `/api/dgix/acp/${readyImport.data.intake.id}`);
if (secretKeysIn(fetched.data).length) fail("intake GET leaked secrets");
if (fetched.data.intake.review?.FINAL_CONTENT !== ready.execution.message) {
  fail("DGIX rewrote or lost ACP message");
}
ok("ACP values remain unmodified and credentials stay off client records");

console.log(
  realPublishValidated
    ? "PASS ACI-DGIX-016 Facebook organic execution (REAL FACEBOOK PUBLISHING VALIDATED)"
    : "PASS ACI-DGIX-016 Facebook organic execution (REAL FACEBOOK PUBLISH VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED)"
);
