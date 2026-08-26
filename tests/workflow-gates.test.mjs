import assert from "node:assert/strict";
import test from "node:test";
import {
  canConfirmOrFail,
  canEnterPublishQueue,
  canHandToAdapter,
  isTerminalPublished
} from "./workflow-gates.mjs";

test("only approved content may enter the publish queue", () => {
  assert.equal(canEnterPublishQueue("draft"), false);
  assert.equal(canEnterPublishQueue("rejected"), false);
  assert.equal(canEnterPublishQueue("approved"), true);
});

test("adapter and confirm transitions refuse duplicates and published terminals", () => {
  assert.equal(canHandToAdapter("PENDING"), true);
  assert.equal(canHandToAdapter("READY"), false);
  assert.equal(canConfirmOrFail("READY"), true);
  assert.equal(canConfirmOrFail("PENDING"), false);
  assert.equal(isTerminalPublished("PUBLISHED"), true);
  assert.equal(isTerminalPublished("FAILED"), false);
});
