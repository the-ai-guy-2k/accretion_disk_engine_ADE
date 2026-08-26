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
