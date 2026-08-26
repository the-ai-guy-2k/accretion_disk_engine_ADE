import { getDb } from "@/lib/db";
import {
  GOAL_STATUS,
  METRIC_KEYS,
  PUBLICATION_STATUS,
  isMetricKey,
  type GoalStatus,
  type MetricKey
} from "@/lib/schema";
import { WorkflowError } from "@/lib/errors";
import { computeGoalProgress, type GoalProgress } from "@/lib/analytics-logic";

function nowIso(): string {
  return new Date().toISOString();
}

function optionalId(value: unknown): number | null {
  if (value == null || value === "") return null;
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new WorkflowError("Invalid goal id", 400);
  }
  return id;
}

function parseStatus(value: unknown, fallback: GoalStatus = GOAL_STATUS.active): GoalStatus {
  const status = String(value || fallback);
  if (!Object.values(GOAL_STATUS).includes(status as GoalStatus)) {
    throw new WorkflowError("Goal status must be active, paused, achieved, or archived");
  }
  return status as GoalStatus;
}

function parseMetric(value: unknown): MetricKey {
  const metric = String(value || "").trim();
  if (!isMetricKey(metric)) {
    throw new WorkflowError(`Unsupported metric. Use one of: ${METRIC_KEYS.join(", ")}`);
  }
  return metric;
}

export function listGoals() {
  return (getDb().prepare("SELECT * FROM goals ORDER BY id DESC").all() as Record<string, unknown>[]).map(
    (row) => attachProgress(row)
  );
}

export function getGoal(id: number) {
  const row = getDb().prepare("SELECT * FROM goals WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!row) {
    throw new WorkflowError("Goal not found", 404);
  }
  return attachProgress(row);
}

export function resolveGoalId(value: unknown): number | null {
  const id = optionalId(value);
  if (id == null) return null;
  getGoal(id);
  return id;
}

export function createGoal(input: {
  title: string;
  description?: string;
  target_metric?: string;
  starting_value?: number;
  target_value?: number;
  target_date?: string;
  status?: string;
  notes?: string;
  is_test?: boolean;
}) {
  const title = input.title?.trim();
  if (!title) {
    throw new WorkflowError("Goal name is required");
  }
  const stamp = nowIso();
  const result = getDb()
    .prepare(
      `INSERT INTO goals (title, description, status, target_metric, starting_value, target_value, target_date, is_test, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      input.description?.trim() || "",
      parseStatus(input.status),
      parseMetric(input.target_metric || "audience_network_gained"),
      Number(input.starting_value) || 0,
      input.target_value == null || String(input.target_value) === ""
        ? null
        : Number(input.target_value),
      input.target_date?.trim() || null,
      input.is_test ? 1 : 0,
      input.notes?.trim() || "",
      stamp,
      stamp
    );
  return getGoal(Number(result.lastInsertRowid));
}

export function updateGoal(
  id: number,
  input: {
    title?: string;
    description?: string;
    target_metric?: string;
    starting_value?: number;
    target_value?: number | null;
    target_date?: string | null;
    status?: string;
    notes?: string;
  }
) {
  const current = getGoal(id);
  const stamp = nowIso();
  getDb()
    .prepare(
      `UPDATE goals
       SET title = ?, description = ?, status = ?, target_metric = ?, starting_value = ?,
           target_value = ?, target_date = ?, notes = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      input.title?.trim() || String(current.title),
      input.description == null ? String(current.description || "") : String(input.description),
      parseStatus(input.status ?? current.status),
      input.target_metric ? parseMetric(input.target_metric) : String(current.target_metric),
      input.starting_value == null ? Number(current.starting_value) || 0 : Number(input.starting_value),
      input.target_value === undefined
        ? current.target_value
        : input.target_value,
      input.target_date === undefined ? current.target_date : input.target_date,
      input.notes == null ? String(current.notes || "") : String(input.notes),
      stamp,
      id
    );
  return getGoal(id);
}

export function goalContribution(goalId: number, metricName: string): number {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(m.numeric_value), 0) AS n
       FROM metrics m
       JOIN publications p ON p.id = m.publication_id
       JOIN content_items c ON c.id = p.content_id
       LEFT JOIN sources s ON s.id = c.source_id
       WHERE p.status = ?
         AND m.metric_name = ?
         AND COALESCE(c.goal_id, s.goal_id) = ?`
    )
    .get(PUBLICATION_STATUS.PUBLISHED, metricName, goalId) as { n: number };
  return Number(row.n) || 0;
}

function attachProgress(row: Record<string, unknown>) {
  const contributed = goalContribution(Number(row.id), String(row.target_metric || ""));
  const progress: GoalProgress = computeGoalProgress({
    startingValue: Number(row.starting_value) || 0,
    targetValue: row.target_value == null ? null : Number(row.target_value),
    contributed
  });
  return { ...row, contributed, progress };
}

export function activeGoal() {
  const row = getDb()
    .prepare(
      `SELECT * FROM goals
       WHERE status = ?
       ORDER BY CASE WHEN is_test = 1 THEN 1 ELSE 0 END, id DESC
       LIMIT 1`
    )
    .get(GOAL_STATUS.active) as Record<string, unknown> | undefined;
  return row ? attachProgress(row) : null;
}
