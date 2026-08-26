/**
 * ACI-DGIX-015 validation: Facebook connection foundation without publishing or ads.
 * Usage: node scripts/validate-aci-dgix-015.mjs
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

const health = await req("GET", "/api/health");
if (!health.data.ok) fail(health.data.error || "health failed");
const schemaVersion = Number(health.data.persistence?.schemaVersion);
if (!Number.isFinite(schemaVersion) || schemaVersion < 8) {
  fail(`expected schema v8 or later, got ${health.data.persistence?.schemaVersion}`);
}
if (health.data.facebook?.graphApiVersion !== "v26.0") {
  fail(`expected Graph API v26.0, got ${health.data.facebook?.graphApiVersion}`);
}
if (health.data.facebook?.realPublishingImplemented) fail("health claimed real publishing is implemented");
if (health.data.facebook?.paidExecutionImplemented) fail("health claimed paid execution is implemented");
if (secretKeysIn(health.data).length) fail(`health leaked secret keys: ${secretKeysIn(health.data).join(", ")}`);
ok(`health schema v${health.data.persistence.schemaVersion} Graph ${health.data.facebook.graphApiVersion}`);

const status = await req("GET", "/api/dgix/facebook");
if (status.status !== 200 || !status.data.connection) fail("Facebook connection status API missing");
if (secretKeysIn(status.data).length) fail(`connection status leaked secrets: ${secretKeysIn(status.data).join(", ")}`);
if (!("organic" in status.data.connection) || !("paid" in status.data.connection)) {
  fail("organic and paid capabilities are not independently represented");
}
if (status.data.connection.tokenExposed) fail("connection status set tokenExposed");
ok("server-side Facebook connection model is public without secrets");

const validated = await req("POST", "/api/dgix/facebook/validate", {});
if (secretKeysIn(validated.data).length) fail(`validate leaked secrets: ${secretKeysIn(validated.data).join(", ")}`);
const connection = validated.data.connection;
if (!connection) fail("validate did not return connection");
if (connection.organic === "AVAILABLE" && connection.paid === "UNAVAILABLE") {
  /* independent — allowed */
}
if (connection.facebook === "CONNECTED" && connection.realValidation !== "succeeded") {
  fail("CONNECTED was reported without a successful real Meta validation");
}
if (connection.realValidation === "blocked") {
  if (!String(connection.blockedReason || validated.data.banner || "").includes("CREDENTIAL/ASSET INPUT REQUIRED")) {
    fail("blocked validation did not report CREDENTIAL/ASSET INPUT REQUIRED");
  }
  ok("REAL CONNECTION VALIDATION BLOCKED — CREDENTIAL/ASSET INPUT REQUIRED");
} else if (connection.realValidation === "succeeded") {
  if (connection.facebook !== "CONNECTED") fail("successful Meta validation did not mark CONNECTED");
  ok("real Meta connection validation succeeded (sanitized; no tokens)");
} else {
  ok(`Facebook validation result ${connection.facebook} / ${connection.realValidation} (not fabricated PASS)`);
}

const workspace = await page("/dgix");
if (workspace.status !== 200) fail(`/dgix ${workspace.status}`);
mustContain(workspace.text, "Facebook Account Connection");
mustContain(workspace.text, "IMPLEMENTED");
mustContain(workspace.text, "Facebook");
mustContain(workspace.text, "NOT CONNECTED");
mustContain(workspace.text, "Organic");
mustContain(workspace.text, "NOT AVAILABLE");
mustContain(workspace.text, "Paid");
mustContain(workspace.text, "Real Facebook Publishing");
mustContain(workspace.text, "Paid Advertising Execution");
mustContain(workspace.text, "IMPLEMENTED BUT REAL VALIDATION PENDING");
mustContain(workspace.text, "Paid Advertising Execution — NOT YET IMPLEMENTED");
mustContain(workspace.text, "Organic Facebook Execution Adapter");
if (/Facebook Account Connection[\s\S]{0,40}NOT YET IMPLEMENTED/.test(workspace.text.replace(/<!--.*?-->/g, ""))) {
  fail("Facebook Account Connection still labeled NOT YET IMPLEMENTED");
}
ok("DGIX workspace shows connection vs execution truthfully");

const secretPkg = JSON.parse(fs.readFileSync(validPath, "utf8"));
secretPkg.packageId = `acp-015-secret-${Date.now()}`;
secretPkg.META_PAGE_ACCESS_TOKEN = "SHOULD_NOT_BE_HERE";
const secretRes = await req("POST", "/api/dgix/acp", secretPkg);
if (secretRes.status !== 400 || secretRes.data.ok) fail("ACP with META_PAGE_ACCESS_TOKEN was accepted");
ok("ACP remains credential-free");

const before = await req("GET", "/api/workflow/summary");
const valid = JSON.parse(fs.readFileSync(validPath, "utf8"));
valid.packageId = `acp-015-auth-${Date.now()}`;
const imported = await req("POST", "/api/dgix/acp", valid);
if (!imported.data.ok) fail(imported.data.error || "execution-ready ACP import failed");
const authorized = await req("POST", `/api/dgix/acp/${imported.data.intake.id}/authorize`, {
  decision: "authorize"
});
if (!authorized.data.ok) fail(authorized.data.error || "authorize failed");
if (authorized.data.intake.materializedIntoAde) fail("authorization materialized ADE records");
if (authorized.data.intake.reviewState !== "authorized") fail("authorized state missing");
if (!authorized.data.intake.facebookRouting || authorized.data.intake.facebookRouting.executed) {
  fail("routing contract missing or claimed execution");
}
const after = await req("GET", "/api/workflow/summary");
if (after.data.summary.queue.PUBLISHED !== before.data.summary.queue.PUBLISHED) {
  fail("authorization published via adapter");
}
if (after.data.summary.queue.PENDING !== before.data.summary.queue.PENDING) {
  fail("authorization queued a publication");
}
ok("authorized ACPs are not automatically executed");

if (!after.data.summary.adapter?.isMock) fail("Standard ADE mock adapter is no longer mock");
ok("Standard ADE remains operational");

console.log(
  connection.realValidation === "succeeded"
    ? "PASS ACI-DGIX-015 Meta/Facebook connection (real Meta validation)"
    : "PASS ACI-DGIX-015 Meta/Facebook connection (real validation blocked; no fabricated PASS)"
);
