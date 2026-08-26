import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import {
  buildMockDraft,
  manualFacebookAdapter,
  type ChannelPublishInput
} from "@/lib/channel-adapter";
import { generateLiveDraft, liveGenerationNote } from "@/lib/ai-generation";
import { throwIfFailed } from "@/lib/ai-provider";
import type { GenerationDirection } from "@/lib/ai-prompt";
import { WorkflowError } from "@/lib/errors";
import { activeGoal, resolveGoalId } from "@/lib/goals";
import {
  CONTENT_STATUS,
  FACEBOOK_CHANNEL_TYPE,
  GENERATION_MODE,
  GENERATION_STATUS,
  MANUAL_FACEBOOK_ADAPTER_ID,
  PUBLICATION_STATUS,
  canConfirmOrFail,
  canEnterPublishQueue,
  canHandToAdapter,
  canRetryFailed,
  isTerminalPublished
} from "@/lib/schema";

export { WorkflowError } from "@/lib/errors";

function nowIso(): string {
  return new Date().toISOString();
}

function facebookChannel() {
  const row = getDb()
    .prepare("SELECT * FROM channels WHERE channel_type = ? LIMIT 1")
    .get(FACEBOOK_CHANNEL_TYPE) as Record<string, unknown> | undefined;
  if (!row) {
    throw new WorkflowError("Facebook Channel 01 is not initialized", 500);
  }
  return row;
}

export function listSources() {
  return getDb()
    .prepare(
      `SELECT s.*, g.title AS goal_title, g.target_metric AS goal_metric
       FROM sources s
       LEFT JOIN goals g ON g.id = s.goal_id
       ORDER BY s.id DESC`
    )
    .all() as Record<string, unknown>[];
}

export function getSource(id: number) {
  const row = getDb()
    .prepare(
      `SELECT s.*, g.title AS goal_title, g.target_metric AS goal_metric
       FROM sources s
       LEFT JOIN goals g ON g.id = s.goal_id
       WHERE s.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined;
  if (!row) {
    throw new WorkflowError("Source not found", 404);
  }
  return row;
}

export function createSource(input: {
  title: string;
  body?: string;
  source_type?: string;
  activity_date?: string;
  provenance?: string;
  notes?: string;
  is_test?: boolean;
  goal_id?: number | null;
}) {
  const title = input.title?.trim();
  if (!title) {
    throw new WorkflowError("Source title is required");
  }
  const stamp = nowIso();
  const goalId = resolveGoalId(input.goal_id);
  const result = getDb()
    .prepare(
      `INSERT INTO sources (title, body, source_type, activity_date, provenance, origin, notes, is_test, goal_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      input.body?.trim() || "",
      input.source_type?.trim() || "taig_activity",
      input.activity_date?.trim() || stamp.slice(0, 10),
      input.provenance?.trim() || "",
      input.provenance?.trim() || "",
      input.notes?.trim() || "",
      input.is_test ? 1 : 0,
      goalId,
      stamp,
      stamp
    );
  return getSource(Number(result.lastInsertRowid));
}

export function updateSource(id: number, input: { goal_id?: number | null }) {
  getSource(id);
  if (input.goal_id !== undefined) {
    getDb()
      .prepare("UPDATE sources SET goal_id = ?, updated_at = ? WHERE id = ?")
      .run(resolveGoalId(input.goal_id), nowIso(), id);
  }
  return getSource(id);
}

export function listContent(filter?: {
  status?: string;
  source_id?: number;
  goal_id?: number;
  campaign_id?: number;
}) {
  const db = getDb();
  let sql = `SELECT c.*, s.title AS source_title, s.provenance AS source_provenance, s.is_test AS source_is_test,
              s.source_type AS source_type, s.goal_id AS source_goal_id,
              COALESCE(c.goal_id, s.goal_id) AS effective_goal_id,
              g.title AS goal_title, camp.title AS campaign_title
     FROM content_items c
     LEFT JOIN sources s ON s.id = c.source_id
     LEFT JOIN goals g ON g.id = COALESCE(c.goal_id, s.goal_id)
     LEFT JOIN campaigns camp ON camp.id = c.campaign_id`;
  const params: (string | number)[] = [];
  const where: string[] = [];
  if (filter?.status) {
    where.push("c.status = ?");
    params.push(filter.status);
  }
  if (filter?.source_id) {
    where.push("c.source_id = ?");
    params.push(filter.source_id);
  }
  if (filter?.goal_id) {
    where.push("COALESCE(c.goal_id, s.goal_id) = ?");
    params.push(filter.goal_id);
  }
  if (filter?.campaign_id) {
    where.push("c.campaign_id = ?");
    params.push(filter.campaign_id);
  }
  if (where.length) {
    sql += ` WHERE ${where.join(" AND ")}`;
  }
  sql += " ORDER BY c.id DESC";
  return db.prepare(sql).all(...params) as Record<string, unknown>[];
}

export function getContent(id: number) {
  const row = getDb()
    .prepare(
      `SELECT c.*, s.title AS source_title, s.body AS source_body, s.source_type AS source_type,
              s.activity_date AS source_activity_date, s.provenance AS source_provenance,
              s.notes AS source_notes, s.is_test AS source_is_test, s.goal_id AS source_goal_id,
              COALESCE(c.goal_id, s.goal_id) AS effective_goal_id, g.title AS goal_title,
              camp.title AS campaign_title
       FROM content_items c
       LEFT JOIN sources s ON s.id = c.source_id
       LEFT JOIN goals g ON g.id = COALESCE(c.goal_id, s.goal_id)
       LEFT JOIN campaigns camp ON camp.id = c.campaign_id
       WHERE c.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined;
  if (!row) {
    throw new WorkflowError("Draft not found", 404);
  }
  const publication = getDb()
    .prepare(
      `SELECT * FROM publications WHERE content_id = ? ORDER BY id DESC LIMIT 1`
    )
    .get(id) as Record<string, unknown> | undefined;
  const approvals = getDb()
    .prepare("SELECT * FROM approvals WHERE content_id = ? ORDER BY id DESC")
    .all(id) as Record<string, unknown>[];
  return { ...row, publication: publication ?? null, approvals };
}

export function createDraftFromSource(
  sourceId: number,
  goalId?: number | null,
  campaignId?: number | null
) {
  const source = getSource(sourceId);
  const draft = buildMockDraft({
    id: Number(source.id),
    title: String(source.title),
    body: source.body as string,
    provenance: (source.provenance || source.origin) as string,
    is_test: Number(source.is_test || 0)
  });
  const resolvedGoal =
    goalId === undefined ? resolveGoalId(source.goal_id) : resolveGoalId(goalId);
  if (campaignId != null) {
    const campaign = getDb()
      .prepare("SELECT id FROM campaigns WHERE id = ?")
      .get(campaignId) as { id?: number } | undefined;
    if (!campaign?.id) {
      throw new WorkflowError("Campaign not found", 404);
    }
  }
  const stamp = nowIso();
  const result = getDb()
    .prepare(
      `INSERT INTO content_items (source_id, goal_id, campaign_id, title, body, status, channel_hint, generation_mode, generation_note, generation_provider, generation_model, generation_status, is_test, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      sourceId,
      resolvedGoal,
      campaignId ?? null,
      draft.title,
      draft.body,
      CONTENT_STATUS.draft,
      FACEBOOK_CHANNEL_TYPE,
      draft.generation_mode,
      draft.generation_note,
      null,
      null,
      null,
      Number(source.is_test || 0),
      stamp,
      stamp
    );
  return getContent(Number(result.lastInsertRowid));
}

export async function createDraftFromLiveAi(
  sourceId: number,
  direction?: GenerationDirection,
  goalId?: number | null
) {
  const source = getSource(sourceId);
  const generated = await generateLiveDraft({
    source: {
      id: Number(source.id),
      title: String(source.title),
      body: source.body as string,
      source_type: source.source_type as string,
      activity_date: source.activity_date as string,
      provenance: (source.provenance || source.origin) as string,
      notes: source.notes as string
    },
    direction
  });
  throwIfFailed(generated);
  const resolvedGoal =
    goalId === undefined ? resolveGoalId(source.goal_id) : resolveGoalId(goalId);
  const stamp = nowIso();
  const testPrefix = Number(source.is_test || 0) ? "[TEST DATA] " : "";
  const title = `${testPrefix}${generated.title}`.slice(0, 180);
  const result = getDb()
    .prepare(
      `INSERT INTO content_items (source_id, goal_id, campaign_id, title, body, status, channel_hint, generation_mode, generation_note, generation_provider, generation_model, generation_status, is_test, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      sourceId,
      resolvedGoal,
      null,
      title,
      generated.body,
      CONTENT_STATUS.draft,
      FACEBOOK_CHANNEL_TYPE,
      GENERATION_MODE.live_ai,
      liveGenerationNote(generated.provider, generated.model),
      generated.provider,
      generated.model,
      GENERATION_STATUS.succeeded,
      Number(source.is_test || 0),
      stamp,
      stamp
    );
  return getContent(Number(result.lastInsertRowid));
}

export function updateDraft(
  id: number,
  input: { title?: string; body?: string; goal_id?: number | null }
) {
  const current = getContent(id);
  const stamp = nowIso();
  if (input.goal_id !== undefined) {
    getDb()
      .prepare("UPDATE content_items SET goal_id = ?, updated_at = ? WHERE id = ?")
      .run(resolveGoalId(input.goal_id), stamp, id);
  }
  const wantsCopy = input.title !== undefined || input.body !== undefined;
  if (wantsCopy) {
    if (current.status === CONTENT_STATUS.approved) {
      const pub = current.publication as { status?: string } | null;
      if (pub && isTerminalPublished(pub.status)) {
        throw new WorkflowError("Published mock items cannot be edited", 409);
      }
      throw new WorkflowError("Approved drafts cannot be edited until returned to draft", 409);
    }
    getDb()
      .prepare(
        "UPDATE content_items SET title = ?, body = ?, updated_at = ? WHERE id = ?"
      )
      .run(
        input.title?.trim() || String(current.title),
        input.body ?? String(current.body || ""),
        stamp,
        id
      );
  }
  return getContent(id);
}

function recordApproval(contentId: number, decision: string, notes?: string) {
  const stamp = nowIso();
  getDb()
    .prepare(
      `INSERT INTO approvals (content_id, decision, decided_by, notes, decided_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(contentId, decision, "operator", notes || "", stamp, stamp, stamp);
}

export function approveContent(id: number, notes?: string) {
  const current = getContent(id);
  if (current.status === CONTENT_STATUS.approved) {
    return current;
  }
  const stamp = nowIso();
  getDb()
    .prepare("UPDATE content_items SET status = ?, updated_at = ? WHERE id = ?")
    .run(CONTENT_STATUS.approved, stamp, id);
  recordApproval(id, "approved", notes);
  enqueueApproved(id);
  return getContent(id);
}

export function rejectContent(id: number, notes?: string) {
  const current = getContent(id);
  const pub = current.publication as { id?: number; status?: string } | null;
  if (pub && isTerminalPublished(pub.status)) {
    throw new WorkflowError("Cannot reject a mock-published item", 409);
  }
  if (pub && (pub.status === PUBLICATION_STATUS.PENDING || pub.status === PUBLICATION_STATUS.READY)) {
    getDb()
      .prepare(
        "UPDATE publications SET status = ?, failure_reason = ?, updated_at = ? WHERE id = ?"
      )
      .run(PUBLICATION_STATUS.FAILED, "Returned from queue by operator reject", nowIso(), pub.id);
  }
  getDb()
    .prepare("UPDATE content_items SET status = ?, updated_at = ? WHERE id = ?")
    .run(CONTENT_STATUS.rejected, nowIso(), id);
  recordApproval(id, "rejected", notes);
  return getContent(id);
}

export function returnToDraft(id: number) {
  const current = getContent(id);
  const pub = current.publication as { id?: number; status?: string } | null;
  if (pub && isTerminalPublished(pub.status)) {
    throw new WorkflowError("Cannot return a mock-published item to draft", 409);
  }
  if (pub && (pub.status === PUBLICATION_STATUS.PENDING || pub.status === PUBLICATION_STATUS.READY)) {
    getDb()
      .prepare(
        "UPDATE publications SET status = ?, failure_reason = ?, updated_at = ? WHERE id = ?"
      )
      .run(PUBLICATION_STATUS.FAILED, "Queue item cancelled because content returned to draft", nowIso(), pub.id);
  }
  getDb()
    .prepare("UPDATE content_items SET status = ?, updated_at = ? WHERE id = ?")
    .run(CONTENT_STATUS.draft, nowIso(), id);
  recordApproval(id, "returned_to_draft");
  return getContent(id);
}

function openPublicationForContent(contentId: number) {
  return getDb()
    .prepare(
      `SELECT * FROM publications
       WHERE content_id = ? AND status IN (?, ?)
       ORDER BY id DESC LIMIT 1`
    )
    .get(contentId, PUBLICATION_STATUS.PENDING, PUBLICATION_STATUS.READY) as
    | Record<string, unknown>
    | undefined;
}

function enqueueApproved(contentId: number) {
  const current = getContent(contentId);
  if (!canEnterPublishQueue(String(current.status))) {
    throw new WorkflowError("Only approved content may enter the publishing queue", 409);
  }
  if (openPublicationForContent(contentId)) {
    return;
  }
  const channel = facebookChannel();
  const stamp = nowIso();
  getDb()
    .prepare(
      `INSERT INTO publications (content_id, channel_id, status, adapter_id, is_mock, attempt_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?)`
    )
    .run(
      contentId,
      channel.id,
      PUBLICATION_STATUS.PENDING,
      MANUAL_FACEBOOK_ADAPTER_ID,
      randomUUID(),
      stamp,
      stamp
    );
}

export function tryEnqueue(contentId: number) {
  const current = getContent(contentId);
  if (!canEnterPublishQueue(String(current.status))) {
    throw new WorkflowError("Only approved content may enter the publishing queue", 409);
  }
  enqueueApproved(contentId);
  return getContent(contentId);
}

function publicationInput(pub: Record<string, unknown>): ChannelPublishInput {
  const content = getContent(Number(pub.content_id));
  return {
    publicationId: Number(pub.id),
    contentId: Number(content.id),
    sourceId: content.source_id == null ? null : Number(content.source_id),
    title: String(content.title),
    body: String(content.body || "")
  };
}

export function listPublications() {
  return getDb()
    .prepare(
      `SELECT p.*, c.title AS content_title, c.status AS content_status, c.source_id AS source_id,
              COALESCE(c.goal_id, s.goal_id) AS goal_id, g.title AS goal_title,
              c.campaign_id AS campaign_id, camp.title AS campaign_title,
              s.title AS source_title, s.provenance AS source_provenance, s.is_test AS source_is_test,
              s.source_type AS source_type, ch.name AS channel_name
       FROM publications p
       JOIN content_items c ON c.id = p.content_id
       LEFT JOIN sources s ON s.id = c.source_id
       LEFT JOIN goals g ON g.id = COALESCE(c.goal_id, s.goal_id)
       LEFT JOIN campaigns camp ON camp.id = c.campaign_id
       LEFT JOIN channels ch ON ch.id = p.channel_id
       ORDER BY p.id DESC`
    )
    .all() as Record<string, unknown>[];
}

export function getPublication(id: number) {
  const row = getDb()
    .prepare(
      `SELECT p.*, c.title AS content_title, c.status AS content_status, c.source_id AS source_id,
              c.body AS content_body, COALESCE(c.goal_id, s.goal_id) AS goal_id, g.title AS goal_title,
              s.title AS source_title, s.provenance AS source_provenance, s.source_type AS source_type,
              s.is_test AS source_is_test
       FROM publications p
       JOIN content_items c ON c.id = p.content_id
       LEFT JOIN sources s ON s.id = c.source_id
       LEFT JOIN goals g ON g.id = COALESCE(c.goal_id, s.goal_id)
       WHERE p.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined;
  if (!row) {
    throw new WorkflowError("Publication not found", 404);
  }
  return row;
}

export function handToAdapter(publicationId: number) {
  const pub = getPublication(publicationId);
  if (isTerminalPublished(String(pub.status))) {
    throw new WorkflowError("Already mock-published; refusing duplicate execution", 409);
  }
  if (!canHandToAdapter(String(pub.status))) {
    throw new WorkflowError(`Cannot hand to adapter from status ${pub.status}`, 409);
  }
  if (!canEnterPublishQueue(String(pub.content_status))) {
    throw new WorkflowError("Content is no longer approved", 409);
  }
  const result = manualFacebookAdapter.accept(publicationInput(pub));
  getDb()
    .prepare(
      `UPDATE publications SET status = ?, adapter_id = ?, is_mock = 1, failure_reason = NULL, updated_at = ?
       WHERE id = ? AND status = ?`
    )
    .run(
      PUBLICATION_STATUS.READY,
      MANUAL_FACEBOOK_ADAPTER_ID,
      nowIso(),
      publicationId,
      PUBLICATION_STATUS.PENDING
    );
  const updated = getPublication(publicationId);
  if (updated.status !== PUBLICATION_STATUS.READY) {
    throw new WorkflowError("Duplicate adapter hand-off blocked", 409);
  }
  return { publication: updated, adapter: result };
}

export function confirmMockPublish(publicationId: number) {
  const pub = getPublication(publicationId);
  if (isTerminalPublished(String(pub.status))) {
    throw new WorkflowError("Already mock-published; refusing duplicate execution", 409);
  }
  if (!canConfirmOrFail(String(pub.status))) {
    throw new WorkflowError("Confirm is only valid from READY", 409);
  }
  const result = manualFacebookAdapter.confirm(publicationInput(pub));
  const stamp = nowIso();
  const changed = getDb()
    .prepare(
      `UPDATE publications
       SET status = ?, published_at = ?, external_post_id = ?, failure_reason = NULL, is_mock = 1, updated_at = ?
       WHERE id = ? AND status = ?`
    )
    .run(
      PUBLICATION_STATUS.PUBLISHED,
      stamp,
      result.externalPostId || null,
      stamp,
      publicationId,
      PUBLICATION_STATUS.READY
    );
  if (changed.changes !== 1) {
    throw new WorkflowError("Duplicate confirm blocked", 409);
  }
  return { publication: getPublication(publicationId), adapter: result };
}

export function failMockPublish(publicationId: number, reason?: string) {
  const pub = getPublication(publicationId);
  if (isTerminalPublished(String(pub.status))) {
    throw new WorkflowError("Cannot fail a mock-published item", 409);
  }
  if (
    String(pub.status) !== PUBLICATION_STATUS.READY &&
    String(pub.status) !== PUBLICATION_STATUS.PENDING
  ) {
    throw new WorkflowError(`Cannot fail from status ${pub.status}`, 409);
  }
  const detail = reason?.trim() || "Controlled mock Facebook adapter failure";
  const result = manualFacebookAdapter.fail(publicationInput(pub), detail);
  const fromStatus = String(pub.status);
  const changed = getDb()
    .prepare(
      `UPDATE publications
       SET status = ?, failure_reason = ?, published_at = NULL, is_mock = 1, updated_at = ?
       WHERE id = ? AND status = ?`
    )
    .run(PUBLICATION_STATUS.FAILED, detail, nowIso(), publicationId, fromStatus);
  if (changed.changes !== 1) {
    throw new WorkflowError("Failure transition blocked", 409);
  }
  const updated = getPublication(publicationId);
  if (updated.status === PUBLICATION_STATUS.PUBLISHED) {
    throw new WorkflowError("Invariant broken: failed item marked published", 500);
  }
  return { publication: updated, adapter: result };
}

export function retryFailedPublication(publicationId: number) {
  const pub = getPublication(publicationId);
  if (!canRetryFailed(String(pub.status))) {
    throw new WorkflowError("Only FAILED publications can be retried", 409);
  }
  if (!canEnterPublishQueue(String(pub.content_status))) {
    throw new WorkflowError("Content is not approved", 409);
  }
  getDb()
    .prepare(
      `UPDATE publications
       SET status = ?, failure_reason = NULL, published_at = NULL, attempt_id = ?, updated_at = ?
       WHERE id = ? AND status = ?`
    )
    .run(
      PUBLICATION_STATUS.PENDING,
      randomUUID(),
      nowIso(),
      publicationId,
      PUBLICATION_STATUS.FAILED
    );
  return getPublication(publicationId);
}

export function workflowSummary() {
  const db = getDb();
  const count = (sql: string, ...params: (string | number)[]) => {
    const row = db.prepare(sql).get(...params) as { n: number };
    return row.n;
  };
  const latestRecommendation = db
    .prepare("SELECT * FROM recommendations ORDER BY id DESC LIMIT 1")
    .get() as Record<string, unknown> | undefined;
  const recentResults = db
    .prepare(
      `SELECT m.id, m.publication_id, m.metric_name, m.numeric_value, m.capture_method, m.is_simulated,
              p.content_id, c.title AS content_title, COALESCE(c.goal_id, s.goal_id) AS goal_id
       FROM metrics m
       JOIN publications p ON p.id = m.publication_id
       JOIN content_items c ON c.id = p.content_id
       LEFT JOIN sources s ON s.id = c.source_id
       ORDER BY m.id DESC
       LIMIT 12`
    )
    .all() as Record<string, unknown>[];
  return {
    sources: count("SELECT COUNT(*) AS n FROM sources"),
    drafts: count("SELECT COUNT(*) AS n FROM content_items WHERE status = ?", CONTENT_STATUS.draft),
    pendingReview: count(
      "SELECT COUNT(*) AS n FROM content_items WHERE status IN (?, ?)",
      CONTENT_STATUS.draft,
      CONTENT_STATUS.rejected
    ),
    approved: count(
      "SELECT COUNT(*) AS n FROM content_items WHERE status = ?",
      CONTENT_STATUS.approved
    ),
    queue: {
      PENDING: count("SELECT COUNT(*) AS n FROM publications WHERE status = ?", PUBLICATION_STATUS.PENDING),
      READY: count("SELECT COUNT(*) AS n FROM publications WHERE status = ?", PUBLICATION_STATUS.READY),
      PUBLISHED: count("SELECT COUNT(*) AS n FROM publications WHERE status = ?", PUBLICATION_STATUS.PUBLISHED),
      FAILED: count("SELECT COUNT(*) AS n FROM publications WHERE status = ?", PUBLICATION_STATUS.FAILED)
    },
    adapter: {
      id: MANUAL_FACEBOOK_ADAPTER_ID,
      isMock: true,
      label: manualFacebookAdapter.label
    },
    activeGoal: activeGoal(),
    latestRecommendation: latestRecommendation ?? null,
    recentResults,
    campaigns: count("SELECT COUNT(*) AS n FROM campaigns")
  };
}
