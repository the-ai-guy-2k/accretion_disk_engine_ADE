import assert from "node:assert/strict";
import test from "node:test";
import { validateAcp } from "../src/lib/acp-validate.ts";
import {
  IMAGE_POST_UNSUPPORTED,
  PAID_ORGANIC_REFUSAL,
  executePageFeedPost,
  mapAcpToPageFeed
} from "../src/lib/facebook-organic-adapter.ts";
import { FACEBOOK_ORGANIC_ADAPTER, routeAuthorizedAcp } from "../src/lib/facebook-resolve.ts";

const organicExecution = {
  clientId: "TAIG",
  platform: "facebook",
  postType: "text",
  message: "TEST DATA. Final publish-ready copy. Do not rewrite.",
  link: "https://example.invalid/taig-test-contact",
  publishMode: "now",
  distributionType: "organic"
};

test("facebook + organic routes to the organic adapter without executing", () => {
  const routed = routeAuthorizedAcp({ execution: organicExecution });
  assert.equal(routed.adapter, FACEBOOK_ORGANIC_ADAPTER);
  assert.equal(routed.ready, true);
  assert.equal(routed.executed, false);
  assert.equal(routed.distributionType, "organic");
});

test("paid ACPs are refused by the organic Page feed mapper", () => {
  const paid = mapAcpToPageFeed(
    { ...organicExecution, distributionType: "paid" },
    "111"
  );
  assert.equal(paid.ok, false);
  if (paid.ok) return;
  assert.equal(paid.code, "paid_not_implemented");
  assert.equal(paid.message, PAID_ORGANIC_REFUSAL);
});

test("ACP message maps unchanged onto Meta message; optional link is copied", () => {
  const mapped = mapAcpToPageFeed(organicExecution, "page-99");
  assert.equal(mapped.ok, true);
  if (!mapped.ok) return;
  assert.equal(mapped.apiPath, "page-99/feed");
  assert.equal(mapped.operation, "page_feed_post");
  assert.equal(mapped.graphApiVersion, "v26.0");
  assert.equal(mapped.fields.message, organicExecution.message);
  assert.equal(mapped.fields.link, organicExecution.link);
  assert.equal(mapped.messageUnmodified, true);
  assert.ok(!JSON.stringify(mapped).includes("access_token"));
});

test("image posts are refused rather than guessed as photo uploads", () => {
  const mapped = mapAcpToPageFeed(
    {
      ...organicExecution,
      postType: "image",
      mediaReference: { kind: "description", value: "not a file" }
    },
    "111"
  );
  assert.equal(mapped.ok, false);
  if (mapped.ok) return;
  assert.equal(mapped.message, IMAGE_POST_UNSUPPORTED);
});

test("successful Meta id is required; HTTP attempt without id is not executed", async () => {
  const mapped = mapAcpToPageFeed(organicExecution, "111");
  assert.equal(mapped.ok, true);
  if (!mapped.ok) return;

  const success = await executePageFeedPost(mapped, "token-must-not-be-logged", async () => ({
    ok: true,
    value: { id: "111_222" }
  }));
  assert.equal(success.ok, true);
  if (!success.ok) return;
  assert.equal(success.externalObjectId, "111_222");

  const empty = await executePageFeedPost(mapped, "token-must-not-be-logged", async () => ({
    ok: true,
    value: {}
  }));
  assert.equal(empty.ok, false);

  const failed = await executePageFeedPost(mapped, "token-must-not-be-logged", async () => ({
    ok: false,
    code: "invalid_expired_authorization",
    message: "Meta authorization failed."
  }));
  assert.equal(failed.ok, false);
});

test("ACP still rejects credential keys", () => {
  const result = validateAcp({
    acpVersion: "1",
    packageId: "acp-organic-secret",
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
    execution: organicExecution,
    page_access_token: "nope"
  });
  assert.equal(result.ok, false);
});
