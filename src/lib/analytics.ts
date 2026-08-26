import { getDb } from "@/lib/db";
import { WorkflowError } from "@/lib/errors";
import { activeGoal, getGoal } from "@/lib/goals";
import {
  CAPTURE_METHOD,
  METRIC_KEYS,
  PUBLICATION_STATUS,
  isMetricKey,
  type MetricKey
} from "@/lib/schema";
import { getPublication } from "@/lib/workflow";
import {
  HIERARCHY,
  classifyMaterialKind,
  materialKindLabel,
  metricLabel,
  rankBy,
  runAnalysis,
  scoreMetrics,
  towardGoalValue,
  type AnalysisInput,
  type MetricMap,
  type ScoredPublication
} from "@/lib/analytics-logic";

function nowIso(): string {
  return new Date().toISOString();
}

function asMetricMap(rows: Record<string, unknown>[]): {
  metrics: MetricMap;
  captureMethod: ScoredPublication["captureMethod"];
  hasResults: boolean;
} {
  const metrics: MetricMap = {};
  const methods = new Set<string>();
  for (const row of rows) {
    const name = String(row.metric_name || "");
    if (!isMetricKey(name)) continue;
    metrics[name] = Number(row.numeric_value ?? row.metric_value ?? 0) || 0;
    if (row.capture_method) methods.add(String(row.capture_method));
  }
  let captureMethod: ScoredPublication["captureMethod"] = "none";
  if (methods.size === 1) {
    captureMethod = [...methods][0] === CAPTURE_METHOD.platform ? "platform" : "manual";
  } else if (methods.size > 1) {
    captureMethod = "mixed";
  }
  return { metrics, captureMethod, hasResults: rows.length > 0 };
}

export function listMetrics(publicationId: number) {
  return getDb()
    .prepare(
      `SELECT * FROM metrics WHERE publication_id = ? ORDER BY metric_name`
    )
    .all(publicationId) as Record<string, unknown>[];
}

export function recordPublicationResults(
  publicationId: number,
  input: {
    metrics: Record<string, unknown>;
    capture_method?: string;
    notes?: string;
    is_test?: boolean;
  }
) {
  const pub = getPublication(publicationId);
  if (String(pub.status) !== PUBLICATION_STATUS.PUBLISHED) {
    throw new WorkflowError("Results can only be recorded for PUBLISHED content", 409);
  }
  const method = String(input.capture_method || CAPTURE_METHOD.manual);
  if (method === CAPTURE_METHOD.platform) {
    throw new WorkflowError(
      "Platform-collected metrics are not implemented. Enter results as manual, and do not present them as Facebook/Meta analytics.",
      409
    );
  }
  if (method !== CAPTURE_METHOD.manual) {
    throw new WorkflowError("capture_method must be manual (platform collection is not implemented)");
  }

  const entries: { key: MetricKey; value: number }[] = [];
  for (const [key, raw] of Object.entries(input.metrics || {})) {
    if (raw == null || raw === "") continue;
    if (!isMetricKey(key)) {
      throw new WorkflowError(`Unknown metric: ${key}`);
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new WorkflowError(`Metric ${key} must be a number`);
    }
    entries.push({ key, value });
  }
  if (entries.length === 0) {
    throw new WorkflowError("Provide at least one metric value");
  }

  const db = getDb();
  const stamp = nowIso();
  const upsert = db.prepare(
    `SELECT id FROM metrics WHERE publication_id = ? AND metric_name = ?`
  );
  const update = db.prepare(
    `UPDATE metrics
     SET metric_value = ?, numeric_value = ?, captured_at = ?, capture_method = ?,
         captured_by = ?, notes = ?, is_simulated = ?, updated_at = ?
     WHERE id = ?`
  );
  const insert = db.prepare(
    `INSERT INTO metrics (
       publication_id, metric_name, metric_value, numeric_value, captured_at,
       capture_method, captured_by, notes, is_simulated, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const entry of entries) {
    const existing = upsert.get(publicationId, entry.key) as { id?: number } | undefined;
    const stored = String(entry.value);
    if (existing?.id) {
      update.run(
        stored,
        entry.value,
        stamp,
        CAPTURE_METHOD.manual,
        "operator",
        input.notes?.trim() || "",
        input.is_test ? 1 : 0,
        stamp,
        existing.id
      );
    } else {
      insert.run(
        publicationId,
        entry.key,
        stored,
        entry.value,
        stamp,
        CAPTURE_METHOD.manual,
        "operator",
        input.notes?.trim() || "",
        input.is_test ? 1 : 0,
        stamp,
        stamp
      );
    }
  }

  return {
    publication: getPublication(publicationId),
    metrics: listMetrics(publicationId),
    capture_method: CAPTURE_METHOD.manual,
    banner:
      "Manually entered metrics. ADE has not collected these from Facebook or any other platform."
  };
}

function scorePublicationRow(row: Record<string, unknown>, targetMetric?: string | null): ScoredPublication {
  const metricRows = listMetrics(Number(row.id));
  const packed = asMetricMap(metricRows);
  const scores = scoreMetrics(packed.metrics);
  scores.towardGoal = towardGoalValue(packed.metrics, targetMetric);
  const kind = classifyMaterialKind(String(row.source_type || ""));
  return {
    publicationId: Number(row.id),
    contentId: Number(row.content_id),
    sourceId: row.source_id == null ? null : Number(row.source_id),
    goalId: row.goal_id == null ? null : Number(row.goal_id),
    title: String(row.content_title || ""),
    sourceTitle: String(row.source_title || ""),
    sourceType: String(row.source_type || ""),
    materialKind: kind,
    materialKindLabel: materialKindLabel(kind),
    isTest: Boolean(Number(row.source_is_test || row.is_test || 0)),
    captureMethod: packed.captureMethod,
    hasResults: packed.hasResults,
    metrics: packed.metrics,
    scores
  };
}

export function analyticsSnapshot(goalId?: number | null) {
  const goal = goalId ? getGoal(goalId) : activeGoal();
  const db = getDb();
  const published = db
    .prepare(
      `SELECT p.*, c.title AS content_title, c.source_id AS source_id, c.is_test AS is_test,
              COALESCE(c.goal_id, s.goal_id) AS goal_id, s.title AS source_title,
              s.source_type AS source_type, s.is_test AS source_is_test
       FROM publications p
       JOIN content_items c ON c.id = p.content_id
       LEFT JOIN sources s ON s.id = c.source_id
       WHERE p.status = ?
       ORDER BY p.id DESC`
    )
    .all(PUBLICATION_STATUS.PUBLISHED) as Record<string, unknown>[];

  const all = published.map((row) =>
    scorePublicationRow(row, goal ? String(goal.target_metric) : null)
  );
  const goalLinked = goal
    ? all.filter((item) => item.goalId === Number(goal.id))
    : [];
  const withResults = all.filter((item) => item.hasResults);
  const goalWithResults = goalLinked.filter((item) => item.hasResults);

  const mostVisibility = rankBy(withResults, (item) => item.scores.visibility);
  const mostEngagement = rankBy(withResults, (item) => item.scores.engagement);
  const mostAudienceNetwork = rankBy(withResults, (item) =>
    towardGoalValue(item.metrics, "audience_network_gained")
  );
  const mostUsefulTowardGoal = rankBy(goalWithResults, (item) => {
    return item.scores.business * 1000 + item.scores.engagement * 10 + item.scores.visibility;
  });
  const mostTowardGoalMetric = rankBy(goalWithResults, (item) => item.scores.towardGoal);

  return {
    hierarchy: HIERARCHY.map((row) => row.label).join(" > "),
    metricKeys: METRIC_KEYS,
    metricLabels: Object.fromEntries(METRIC_KEYS.map((key) => [key, metricLabel(key)])),
    goal,
    publications: all,
    goalPublications: goalLinked,
    answers: {
      mostVisibility: mostVisibility[0] || null,
      mostEngagement: mostEngagement[0] || null,
      mostAudienceNetwork: mostAudienceNetwork[0] || null,
      goalProgressing: goal
        ? {
            yes: Boolean(goal.progress && (goal.progress as { contributed: number }).contributed > 0),
            progress: goal.progress
          }
        : null,
      mostUsefulTowardGoal: mostUsefulTowardGoal[0] || mostTowardGoalMetric[0] || null
    },
    rankings: {
      visibility: mostVisibility,
      engagement: mostEngagement,
      audienceNetwork: mostAudienceNetwork,
      towardGoal: mostTowardGoalMetric,
      usefulTowardGoal: mostUsefulTowardGoal
    }
  };
}

function analysisInputFromSnapshot(snapshot: ReturnType<typeof analyticsSnapshot>): AnalysisInput {
  const goal = snapshot.goal;
  return {
    goal: goal
      ? {
          id: Number(goal.id),
          title: String(goal.title),
          target_metric: String(goal.target_metric),
          starting_value: Number(goal.starting_value) || 0,
          target_value: goal.target_value == null ? null : Number(goal.target_value),
          status: String(goal.status)
        }
      : null,
    progress: (goal?.progress as AnalysisInput["progress"]) ?? null,
    publications: snapshot.goalPublications.length ? snapshot.goalPublications : snapshot.publications
  };
}

export async function analyzeAndStore(goalId?: number | null, isTest = false) {
  const snapshot = analyticsSnapshot(goalId);
  const draft = await runAnalysis(analysisInputFromSnapshot(snapshot));
  const stamp = nowIso();
  const result = getDb()
    .prepare(
      `INSERT INTO recommendations (
         goal_id, summary, action_hint, observed, why_it_matters, evidence_json,
         analysis_mode, analysis_boundary_note, is_test, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      snapshot.goal ? Number(snapshot.goal.id) : null,
      draft.summary,
      draft.action,
      draft.observed,
      draft.whyItMatters,
      JSON.stringify(draft.evidence),
      draft.mode,
      draft.boundaryNote,
      isTest ? 1 : 0,
      stamp,
      stamp
    );
  return {
    recommendation: getRecommendation(Number(result.lastInsertRowid)),
    snapshot
  };
}

export function getRecommendation(id: number) {
  const row = getDb().prepare("SELECT * FROM recommendations WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!row) {
    throw new WorkflowError("Recommendation not found", 404);
  }
  return decorateRecommendation(row);
}

export function latestRecommendation(goalId?: number | null) {
  const row = (
    goalId
      ? getDb()
          .prepare("SELECT * FROM recommendations WHERE goal_id = ? ORDER BY id DESC LIMIT 1")
          .get(goalId)
      : getDb().prepare("SELECT * FROM recommendations ORDER BY id DESC LIMIT 1").get()
  ) as Record<string, unknown> | undefined;
  return row ? decorateRecommendation(row) : null;
}

function decorateRecommendation(row: Record<string, unknown>) {
  let evidence: unknown = [];
  try {
    evidence = row.evidence_json ? JSON.parse(String(row.evidence_json)) : [];
  } catch {
    evidence = [];
  }
  return {
    ...row,
    evidence,
    liveAiUsed: String(row.analysis_mode) === "live_ai"
  };
}
