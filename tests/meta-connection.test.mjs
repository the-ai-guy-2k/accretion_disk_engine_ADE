import assert from "node:assert/strict";
import test from "node:test";
import { validateAcp } from "../src/lib/acp-validate.ts";
import { graphPathUrl, sanitizeMetaText } from "../src/lib/meta-graph.ts";
import { DEFAULT_GRAPH_API_VERSION } from "../src/lib/meta-config.ts";
import {
  BLOCKED_VALIDATION,
  resolveFacebookConnection,
  routeAuthorizedAcp
} from "../src/lib/facebook-resolve.ts";

function withEnv(values, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("Graph calls are versioned and secrets are stripped from error text", () => {
  assert.equal(DEFAULT_GRAPH_API_VERSION, "v26.0");
  assert.equal(graphPathUrl("12345", "v26.0"), "https://graph.facebook.com/v26.0/12345");
  assert.ok(!graphPathUrl("me").includes("graph.facebook.com/me"));
  const cleaned = sanitizeMetaText("failed access_token=EAABsecret&input_token=xyz");
  assert.ok(!cleaned.includes("EAABsecret"));
  assert.ok(!cleaned.includes("xyz"));
});

test("logical client + facebook resolves only the configured connection", () => {
  withEnv(
    {
      ADE_DGIX_FB_CLIENT_ID: "TAIG",
      FACEBOOK_PAGE_ID: "111",
      META_PAGE_ACCESS_TOKEN: "secret-token",
      META_AD_ACCOUNT_ID: "",
      ADE_DGIX_FB_AD_ACCOUNT_ID: "",
      META_AD_ACCESS_TOKEN: "",
      ADE_DGIX_FB_AD_ACCESS_TOKEN: ""
    },
    () => {
      const ok = resolveFacebookConnection("TAIG", "facebook");
      assert.equal(ok.ok, true);
      if (!ok.ok) return;
      assert.equal(ok.connection.organicConfigured, true);
      assert.equal(ok.connection.paidConfigured, false);
      assert.equal(ok.connection.pageId, "111");
      assert.ok(!JSON.stringify(ok.connection).includes("secret-token"));

      const other = resolveFacebookConnection("OTHER", "facebook");
      assert.equal(other.ok, false);
      if (other.ok) return;
      assert.equal(other.code, "client_mismatch");
    }
  );
});

test("missing Facebook configuration does not fabricate a connection", () => {
  withEnv(
    {
      ADE_DGIX_FB_CLIENT_ID: "",
      FACEBOOK_PAGE_ID: "",
      ADE_DGIX_FB_PAGE_ID: "",
      META_PAGE_ACCESS_TOKEN: "",
      ADE_DGIX_FB_PAGE_ACCESS_TOKEN: "",
      META_AD_ACCOUNT_ID: "",
      ADE_DGIX_FB_AD_ACCOUNT_ID: "",
      META_AD_ACCESS_TOKEN: "",
      ADE_DGIX_FB_AD_ACCESS_TOKEN: ""
    },
    () => {
      const missing = resolveFacebookConnection("TAIG", "facebook");
      assert.equal(missing.ok, false);
      if (missing.ok) return;
      assert.equal(missing.code, "missing_connection_configuration");
      assert.ok(missing.message.includes("CREDENTIAL/ASSET INPUT REQUIRED"));
      assert.ok(missing.message.includes(BLOCKED_VALIDATION.split("—")[0].trim()) || missing.message.includes("BLOCKED"));
    }
  );
});

test("authorized ACP routing selects organic vs paid adapters without executing", () => {
  const organic = routeAuthorizedAcp({
    execution: {
      clientId: "TAIG",
      platform: "facebook",
      postType: "text",
      message: "TEST DATA",
      publishMode: "now",
      distributionType: "organic"
    }
  });
  assert.equal(organic.executed, false);
  assert.equal(organic.ready, true);
  assert.equal(organic.adapter, "facebook_organic_page");

  const paid = routeAuthorizedAcp({
    execution: {
      clientId: "TAIG",
      platform: "facebook",
      postType: "text",
      message: "TEST DATA",
      publishMode: "now",
      distributionType: "paid"
    }
  });
  assert.equal(paid.executed, false);
  assert.equal(paid.ready, false);
  assert.equal(paid.adapter, "facebook_paid_marketing");
});

test("ACP distributionType defaults to organic and still rejects secrets", () => {
  const base = {
    acpVersion: "1",
    packageId: "acp-dist-1",
    originatingSystem: "test",
    clientBusinessId: "TAIG",
    campaignName: "Test",
    createdAt: "2026-08-26T21:00:00Z",
    isTest: true,
    objective: {
      statement: "Generate 2 qualified TAIG client contacts through Facebook.",
      measurementTarget: { metric: "qualified_client_contacts", targetValue: 2 },
      intendedPlatforms: ["facebook"]
    },
    audience: { description: "TEST DATA" },
    content: { posts: [{ body: "TEST DATA" }] },
    provenance: {
      originatingIntelligenceSource: "test",
      sourceEvidence: [{ title: "test" }]
    },
    executionIntent: { restrictions: [], approvalRequirements: "human" },
    measurementIntent: { signals: ["qualified_client_contacts"] },
    execution: {
      clientId: "TAIG",
      platform: "facebook",
      postType: "text",
      message: "TEST DATA final copy",
      publishMode: "now"
    }
  };
  const result = validateAcp(base);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.execution?.distributionType, "organic");

  const secret = validateAcp({ ...base, packageId: "acp-dist-secret", META_PAGE_ACCESS_TOKEN: "nope" });
  assert.equal(secret.ok, false);
});
