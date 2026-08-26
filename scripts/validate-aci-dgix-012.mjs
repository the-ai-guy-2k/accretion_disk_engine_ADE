/**
 * ACI-DGIX-012 validation: DGIX workspace exists inside ADE Hub, truthfully labeled.
 * Does not require live AI. Does not implement ACP/Facebook/ACRP.
 * Usage: node scripts/validate-aci-dgix-012.mjs
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

function mustNotMatch(text, pattern, label) {
  if (pattern.test(text)) fail(`forbidden claim: ${label}`);
}

const health = await req("GET", "/api/health");
if (!health.data.ok) fail(health.data.error || "health failed");
ok(`health ${health.data.stage || "ok"}`);

const screens = [
  "/",
  "/dgix",
  "/goals",
  "/campaigns",
  "/sources",
  "/create",
  "/review",
  "/publishing",
  "/analytics",
  "/intelligence",
  "/settings"
];
for (const path of screens) {
  const view = await page(path);
  if (view.status !== 200) fail(`${path} returned ${view.status}`);
  if (/Application error|Module not found/i.test(view.text)) {
    fail(`${path} rendered an application error`);
  }
}
ok("Hub, DGIX, and Standard ADE screens return 200");

const hub = await page("/");
mustContain(hub.text, "/dgix", "Hub link to /dgix");
ok("Hub references DGIX");

const dgix = await page("/dgix");
mustContain(dgix.text, "DGIX");
mustContain(dgix.text, "Distribution, Growth & Intelligence Exchange");
mustContain(dgix.text, "POST-MVP — IN DEVELOPMENT");
mustContain(dgix.text, "Campaign Package");
mustContain(dgix.text, "Review");
mustContain(dgix.text, "Human Approval");
mustContain(dgix.text, "Distribution");
mustContain(dgix.text, "Measurement");
mustContain(dgix.text, "Intelligence");
mustContain(dgix.text, "Results Package");
ok("DGIX operating flow is present");

mustContain(dgix.text, "Campaign Package Intake");
for (const capability of [
  "Facebook Account Connection",
  "Real Facebook Publishing",
  "Facebook Metrics Retrieval",
  "Results Package Export",
  "Distribution / Growth Optimization"
]) {
  mustContain(dgix.text, capability);
}
const nyetCount = (dgix.text.match(/NOT YET IMPLEMENTED/g) || []).length;
if (nyetCount < 5) fail(`expected remaining unimplemented DGIX labels, found ${nyetCount}`);
ok("unimplemented DGIX capabilities are labeled");

mustContain(dgix.text, "TEST / DEMONSTRATION");
mustContain(dgix.text, "TAIG");
mustContain(dgix.text, "Facebook");
mustContain(dgix.text, "Generate 2 qualified TAIG client contacts through Facebook.");
mustContain(dgix.text, "Not achieved");
mustNotMatch(dgix.text, /proving mission is achieved|contacts achieved|generated two qualified/i, "achieved proving mission");
ok("TAIG proving mission is demonstration-only");

mustContain(dgix.text, "Existing ADE engine");
mustContain(dgix.text, "Standard ADE");
mustContain(dgix.text, "Client QEN");
mustContain(dgix.text, "AI assists");
mustContain(dgix.text, "/review");
mustContain(dgix.text, "/intelligence");
ok("reuse, Standard ADE vs DGIX, Client QEN, and authority are present");

const summary = await req("GET", "/api/workflow/summary");
if (!summary.data.ok) fail(summary.data.error || "workflow summary failed");
if (!summary.data.summary?.adapter?.isMock) fail("publishing adapter is no longer marked mock");
ok("Standard ADE workflow summary still works; Facebook adapter remains mock");

console.log("PASS ACI-DGIX-012 operator workspace");
