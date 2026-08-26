import { getDb } from "@/lib/db";
import { WorkflowError } from "@/lib/errors";
import { getGoal } from "@/lib/goals";
import {
  CAMPAIGN_STATUS,
  CONTENT_STATUS,
  PUBLICATION_STATUS,
  type CampaignStatus
} from "@/lib/schema";
import { buildCampaignPlan, CAMPAIGN_PLAN_BANNER } from "@/lib/campaign-plan";
import { createDraftFromSource, getContent, getSource, listContent } from "@/lib/workflow";
import { MOCK_GENERATION_BANNER } from "@/lib/channel-adapter";

function nowIso(): string {
  return new Date().toISOString();
}

function parseStatus(value: unknown, fallback: CampaignStatus = CAMPAIGN_STATUS.planning): CampaignStatus {
  const status = String(value || fallback);
  if (!Object.values(CAMPAIGN_STATUS).includes(status as CampaignStatus)) {
    throw new WorkflowError("Campaign status must be planning, active, paused, or completed");
  }
  return status as CampaignStatus;
}

export function listCampaigns() {
  return getDb()
    .prepare(
      `SELECT c.*, g.title AS goal_title, g.target_metric AS goal_metric,
              (SELECT COUNT(*) FROM campaign_sources cs WHERE cs.campaign_id = c.id) AS source_count,
              (SELECT COUNT(*) FROM campaign_plan_items pi WHERE pi.campaign_id = c.id) AS plan_count,
              (SELECT COUNT(*) FROM content_items ci WHERE ci.campaign_id = c.id) AS draft_count
       FROM campaigns c
       LEFT JOIN goals g ON g.id = c.goal_id
       ORDER BY c.id DESC`
    )
    .all() as Record<string, unknown>[];
}

export function getCampaign(id: number) {
  const row = getDb()
    .prepare(
      `SELECT c.*, g.title AS goal_title, g.target_metric AS goal_metric, g.status AS goal_status,
              g.starting_value AS goal_starting_value, g.target_value AS goal_target_value
       FROM campaigns c
       LEFT JOIN goals g ON g.id = c.goal_id
       WHERE c.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined;
  if (!row) {
    throw new WorkflowError("Campaign not found", 404);
  }
  return row;
}

export function createCampaign(input: {
  title: string;
  objective?: string;
  goal_id: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  notes?: string;
  is_test?: boolean;
}) {
  const title = input.title?.trim();
  if (!title) {
    throw new WorkflowError("Campaign name is required");
  }
  const goal = getGoal(input.goal_id);
  const stamp = nowIso();
  const result = getDb()
    .prepare(
      `INSERT INTO campaigns (goal_id, title, objective, status, start_date, end_date, is_test, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      Number(goal.id),
      title,
      input.objective?.trim() || "",
      parseStatus(input.status),
      input.start_date?.trim() || null,
      input.end_date?.trim() || null,
      input.is_test ? 1 : 0,
      input.notes?.trim() || "",
      stamp,
      stamp
    );
  return getCampaign(Number(result.lastInsertRowid));
}

export function updateCampaign(
  id: number,
  input: {
    title?: string;
    objective?: string;
    status?: string;
    start_date?: string | null;
    end_date?: string | null;
    notes?: string;
  }
) {
  const current = getCampaign(id);
  getDb()
    .prepare(
      `UPDATE campaigns
       SET title = ?, objective = ?, status = ?, start_date = ?, end_date = ?, notes = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      input.title?.trim() || String(current.title),
      input.objective == null ? String(current.objective || "") : String(input.objective),
      parseStatus(input.status ?? current.status),
      input.start_date === undefined ? current.start_date : input.start_date,
      input.end_date === undefined ? current.end_date : input.end_date,
      input.notes == null ? String(current.notes || "") : String(input.notes),
      nowIso(),
      id
    );
  return getCampaign(id);
}

export function listCampaignSources(campaignId: number) {
  return getDb()
    .prepare(
      `SELECT s.*, cs.created_at AS linked_at
       FROM campaign_sources cs
       JOIN sources s ON s.id = cs.source_id
       WHERE cs.campaign_id = ?
       ORDER BY s.id`
    )
    .all(campaignId) as Record<string, unknown>[];
}

export function setCampaignSources(campaignId: number, sourceIds: number[]) {
  getCampaign(campaignId);
  const unique = [...new Set(sourceIds.filter((id) => Number.isInteger(id) && id > 0))];
  if (unique.length === 0) {
    throw new WorkflowError("Select at least one source");
  }
  for (const sourceId of unique) {
    getSource(sourceId);
  }
  const db = getDb();
  const stamp = nowIso();
  db.prepare("DELETE FROM campaign_sources WHERE campaign_id = ?").run(campaignId);
  const insert = db.prepare(
    "INSERT INTO campaign_sources (campaign_id, source_id, created_at) VALUES (?, ?, ?)"
  );
  for (const sourceId of unique) {
    insert.run(campaignId, sourceId, stamp);
  }
  db.prepare("UPDATE campaigns SET updated_at = ? WHERE id = ?").run(stamp, campaignId);
  return listCampaignSources(campaignId);
}

export function listPlanItems(campaignId: number) {
  return getDb()
    .prepare(
      `SELECT pi.*, s.title AS source_title, s.source_type AS source_type, s.provenance AS source_provenance,
              s.is_test AS source_is_test, c.title AS draft_title, c.status AS draft_status
       FROM campaign_plan_items pi
       LEFT JOIN sources s ON s.id = pi.source_id
       LEFT JOIN content_items c ON c.id = pi.content_id
       WHERE pi.campaign_id = ?
       ORDER BY pi.sequence, pi.id`
    )
    .all(campaignId) as Record<string, unknown>[];
}

export function generateCampaignPlan(campaignId: number) {
  const campaign = getCampaign(campaignId);
  const sources = listCampaignSources(campaignId);
  if (sources.length < 1) {
    throw new WorkflowError("Select sources before generating a content plan");
  }
  const plan = buildCampaignPlan({
    campaignTitle: String(campaign.title),
    objective: String(campaign.objective || ""),
    goalTitle: String(campaign.goal_title || "Untitled goal"),
    targetMetric: String(campaign.goal_metric || "audience_network_gained"),
    sources: sources.map((source) => ({
      id: Number(source.id),
      title: String(source.title),
      source_type: source.source_type as string,
      is_test: Boolean(Number(source.is_test || 0))
    }))
  });
  const db = getDb();
  const stamp = nowIso();
  db.prepare(
    `DELETE FROM campaign_plan_items WHERE campaign_id = ? AND content_id IS NULL`
  ).run(campaignId);
  const existing = listPlanItems(campaignId);
  const usedSources = new Set(existing.map((row) => Number(row.source_id)));
  const insert = db.prepare(
    `INSERT INTO campaign_plan_items (
       campaign_id, source_id, sequence, title, purpose, format, intended_audience,
       suggested_timing, status, is_test, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  let sequence = existing.length;
  for (const item of plan.items) {
    if (usedSources.has(item.sourceId)) continue;
    sequence += 1;
    insert.run(
      campaignId,
      item.sourceId,
      item.sequence || sequence,
      item.title,
      item.purpose,
      item.format,
      item.intendedAudience,
      item.suggestedTiming,
      "planned",
      Number(campaign.is_test || 0),
      stamp,
      stamp
    );
  }
  db.prepare(
    `UPDATE campaigns
     SET plan_summary = ?, plan_mode = ?, plan_boundary_note = ?, plan_generated_at = ?, updated_at = ?
     WHERE id = ?`
  ).run(plan.summary, plan.mode, plan.boundaryNote, stamp, stamp, campaignId);
  return {
    campaign: getCampaign(campaignId),
    plan: {
      ...plan,
      items: listPlanItems(campaignId)
    }
  };
}

export function generateCampaignDrafts(campaignId: number) {
  const campaign = getCampaign(campaignId);
  const items = listPlanItems(campaignId);
  if (items.length === 0) {
    throw new WorkflowError("Generate a content plan before creating drafts");
  }
  const created: Record<string, unknown>[] = [];
  const skipped: number[] = [];
  for (const item of items) {
    if (item.content_id) {
      skipped.push(Number(item.id));
      continue;
    }
    if (!item.source_id) {
      throw new WorkflowError(`Plan item #${item.id} has no source`);
    }
    const draft = createDraftFromSource(
      Number(item.source_id),
      campaign.goal_id == null ? null : Number(campaign.goal_id),
      campaignId
    );
    const body = [
      String(draft.body || ""),
      "",
      `Campaign #${campaignId}: ${campaign.title}`,
      `Goal: ${campaign.goal_title || campaign.goal_id}`,
      `Plan purpose: ${item.purpose}`,
      `Suggested format: ${item.format}`,
      `Suggested timing: ${item.suggested_timing}`,
      MOCK_GENERATION_BANNER
    ].join("\n");
    const updated = getDb()
      .prepare("UPDATE content_items SET title = ?, body = ?, campaign_id = ?, updated_at = ? WHERE id = ?")
      .run(String(item.title || draft.title), body, campaignId, nowIso(), Number(draft.id));
    if (updated.changes !== 1) {
      throw new WorkflowError("Failed to attach campaign draft", 500);
    }
    getDb()
      .prepare(
        "UPDATE campaign_plan_items SET content_id = ?, status = ?, updated_at = ? WHERE id = ?"
      )
      .run(Number(draft.id), "drafted", nowIso(), Number(item.id));
    created.push(getContent(Number(draft.id)));
  }
  getDb().prepare("UPDATE campaigns SET updated_at = ? WHERE id = ?").run(nowIso(), campaignId);
  return {
    campaign: getCampaign(campaignId),
    created,
    skippedPlanItemIds: skipped,
    banner: MOCK_GENERATION_BANNER,
    planBanner: campaign.plan_boundary_note || CAMPAIGN_PLAN_BANNER
  };
}

export function campaignResults(campaignId: number) {
  getCampaign(campaignId);
  const totals = getDb()
    .prepare(
      `SELECT m.metric_name AS metric_name, COALESCE(SUM(m.numeric_value), 0) AS value,
              MAX(m.capture_method) AS capture_method
       FROM metrics m
       JOIN publications p ON p.id = m.publication_id
       JOIN content_items c ON c.id = p.content_id
       WHERE c.campaign_id = ? AND p.status = ?
       GROUP BY m.metric_name
       ORDER BY m.metric_name`
    )
    .all(campaignId, PUBLICATION_STATUS.PUBLISHED) as Record<string, unknown>[];
  const byPublication = getDb()
    .prepare(
      `SELECT p.id AS publication_id, p.status, c.id AS content_id, c.title AS content_title,
              c.source_id AS source_id, m.metric_name, m.numeric_value, m.capture_method
       FROM publications p
       JOIN content_items c ON c.id = p.content_id
       LEFT JOIN metrics m ON m.publication_id = p.id
       WHERE c.campaign_id = ?
       ORDER BY p.id DESC, m.metric_name`
    )
    .all(campaignId) as Record<string, unknown>[];
  return {
    campaignId,
    totals,
    byPublication,
    captureNote:
      "Campaign totals reuse ACI-005 metrics. Values are operator-entered unless capture_method is platform."
  };
}

export function campaignWorkspace(campaignId: number) {
  const campaign = getCampaign(campaignId);
  const sources = listCampaignSources(campaignId);
  const planItems = listPlanItems(campaignId);
  const drafts = listContent({ campaign_id: campaignId });
  const publications = getDb()
    .prepare(
      `SELECT p.*, c.title AS content_title, c.status AS content_status, c.source_id AS source_id
       FROM publications p
       JOIN content_items c ON c.id = p.content_id
       WHERE c.campaign_id = ?
       ORDER BY p.id DESC`
    )
    .all(campaignId) as Record<string, unknown>[];
  const approvalCounts = {
    draft: drafts.filter((row) => row.status === CONTENT_STATUS.draft).length,
    rejected: drafts.filter((row) => row.status === CONTENT_STATUS.rejected).length,
    approved: drafts.filter((row) => row.status === CONTENT_STATUS.approved).length
  };
  return {
    campaign,
    sources,
    planItems,
    drafts,
    publications,
    approvalCounts,
    results: campaignResults(campaignId),
    banners: {
      plan: campaign.plan_boundary_note || CAMPAIGN_PLAN_BANNER,
      generation: MOCK_GENERATION_BANNER
    }
  };
}
