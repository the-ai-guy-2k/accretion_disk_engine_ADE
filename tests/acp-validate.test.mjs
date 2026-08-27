import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateAcp } from "../src/lib/acp-validate.ts";

const exampleDir = path.resolve("examples", "acp");
const validPath = path.join(exampleDir, "acp-v1-taig-facebook-contacts.test.json");
const invalidPath = path.join(exampleDir, "acp-v1-invalid-missing-objective.json");

function load(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

test("TAIG TEST ACP v1 is valid and labeled test data", () => {
  const pkg = load(validPath);
  const result = validateAcp(pkg);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.acpVersion, "1");
  assert.equal(result.value.isTest, true);
  assert.equal(result.value.clientBusinessId, "TAIG");
  assert.ok(result.value.objective.statement.includes("2 qualified TAIG client contacts"));
  assert.equal(result.value.objective.measurementTarget.targetValue, 2);
  assert.deepEqual(result.value.objective.intendedPlatforms, ["facebook"]);
});

test("missing objective is rejected with operator-facing path", () => {
  const pkg = load(invalidPath);
  const result = validateAcp(pkg);
  assert.equal(result.ok, false);
  if (result.ok) return;
  const paths = result.issues.map((issue) => issue.path);
  assert.ok(paths.includes("objective") || paths.includes("objective.statement"));
  assert.ok(result.issues.some((issue) => /objective/i.test(issue.message)));
});

test("unsupported version, malformed measurement, and secrets are rejected", () => {
  const base = load(validPath);
  const version = validateAcp({ ...base, acpVersion: "2" });
  assert.equal(version.ok, false);
  if (!version.ok) {
    assert.ok(version.issues.some((issue) => issue.path === "acpVersion"));
  }

  const measurement = validateAcp({
    ...base,
    packageId: "other-1",
    objective: { ...base.objective, measurementTarget: "2 contacts" }
  });
  assert.equal(measurement.ok, false);
  if (!measurement.ok) {
    assert.ok(
      measurement.issues.some((issue) => issue.path === "objective.measurementTarget")
    );
  }

  const secret = validateAcp({
    ...base,
    packageId: "other-2",
    access_token: "SHOULD_NOT_BE_HERE"
  });
  assert.equal(secret.ok, false);
  if (!secret.ok) {
    assert.ok(secret.issues.some((issue) => /credential|token|password|API key/i.test(issue.message)));
  }
});

test("content without posts list is not silently repaired", () => {
  const base = load(validPath);
  const result = validateAcp({
    ...base,
    packageId: "other-3",
    content: { body: "a lone body field is not a posts list" }
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.issues.some((issue) => issue.path.startsWith("content.posts")));
  }
});

test("execution-ready TAIG TEST ACP carries final publish-ready fields", () => {
  const pkg = load(validPath);
  const result = validateAcp(pkg);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.value.execution);
  assert.equal(result.value.execution.clientId, "TAIG");
  assert.equal(result.value.execution.platform, "facebook");
  assert.equal(result.value.execution.postType, "text");
  assert.equal(result.value.execution.publishMode, "now");
  assert.ok(result.value.execution.message.includes("TEST DATA"));
  assert.equal(result.value.objective.measurementTarget.metric, "qualified_client_contacts");
  assert.equal(result.value.objective.measurementTarget.targetValue, 2);
});

test("image posts require media and scheduled posts require a timestamp", () => {
  const base = load(validPath);
  const imageMissing = validateAcp({
    ...base,
    packageId: "img-missing",
    execution: {
      ...base.execution,
      postType: "image"
    }
  });
  assert.equal(imageMissing.ok, false);
  if (!imageMissing.ok) {
    assert.ok(imageMissing.issues.some((issue) => issue.path === "execution.mediaReference"));
  }

  const imageOk = validateAcp({
    ...base,
    packageId: "img-ok",
    execution: {
      ...base.execution,
      postType: "image",
      mediaReference: { kind: "description", value: "TEST DATA workshop still. Not uploaded." }
    }
  });
  assert.equal(imageOk.ok, true);

  const scheduledMissing = validateAcp({
    ...base,
    packageId: "sched-missing",
    execution: {
      ...base.execution,
      publishMode: "scheduled"
    }
  });
  assert.equal(scheduledMissing.ok, false);
  if (!scheduledMissing.ok) {
    assert.ok(scheduledMissing.issues.some((issue) => issue.path === "execution.scheduledAt"));
  }

  const scheduledOk = validateAcp({
    ...base,
    packageId: "sched-ok",
    execution: {
      ...base.execution,
      publishMode: "scheduled",
      scheduledAt: "2026-08-27T12:00:00Z"
    }
  });
  assert.equal(scheduledOk.ok, true);
});

test("legacy ACP without execution remains valid for intake compatibility", () => {
  const base = load(validPath);
  const { execution: _ignored, ...legacy } = base;
  const result = validateAcp({ ...legacy, packageId: "legacy-013" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.execution, undefined);
});

test("review view exposes client, platform, distribution, destination, and timing", async () => {
  const { reviewView } = await import("../src/lib/acp-validate.ts");
  const base = load(validPath);
  const result = validateAcp(base);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const view = reviewView(result.value);
  assert.equal(view.CLIENT, "TAIG");
  assert.equal(view.PLATFORM, "facebook");
  assert.equal(view.DISTRIBUTION_TYPE, "organic");
  assert.equal(view.DESTINATION, "facebook for client TAIG");
  assert.equal(view.TIMING, "now");
  assert.equal(view.FINAL_CONTENT, result.value.execution?.message);
});
