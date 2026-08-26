import {
  METRIC_KEYS,
  METRIC_LABELS,
  type MetricKey
} from "@/lib/schema";

export const DETERMINISTIC_ANALYSIS_BANNER =
  "ADE DETERMINISTIC / MOCK ANALYSIS BOUNDARY — live AI was not used. This recommendation is produced from persisted Goal, content, and operator-entered metrics only.";

export const MANUAL_METRICS_BANNER =
  "Manually entered metrics. ADE has not collected these from Facebook or any other platform.";

export const HIERARCHY = [
  {
    id: "business_outcomes",
    label: "Business Outcomes",
    metrics: ["leads_generated", "audience_network_gained"] as MetricKey[]
  },
  {
    id: "meaningful_engagement",
    label: "Meaningful Engagement",
    metrics: ["meaningful_conversations", "comments", "shares", "reactions"] as MetricKey[]
  },
  {
    id: "raw_visibility",
    label: "Raw Visibility",
    metrics: ["views_reach", "clicks"] as MetricKey[]
  }
] as const;

export type MetricMap = Partial<Record<MetricKey, number>>;

export type GoalProgress = {
  starting: number;
  target: number | null;
  contributed: number;
  current: number;
  remaining: number | null;
  percent: number | null;
  achieved: boolean;
};

export type ScoredPublication = {
  publicationId: number;
  contentId: number;
  sourceId: number | null;
  goalId: number | null;
  title: string;
  sourceTitle: string;
  sourceType: string;
  materialKind: "client_result" | "informational" | "other";
  materialKindLabel: string;
  isTest: boolean;
  captureMethod: "manual" | "platform" | "mixed" | "none";
  hasResults: boolean;
  metrics: MetricMap;
  scores: {
    business: number;
    engagement: number;
    visibility: number;
    towardGoal: number;
  };
};

export type EvidenceItem = {
  publicationId: number;
  contentId: number;
  title: string;
  metric: string;
  value: number;
  captureMethod: string;
};

export type RecommendationDraft = {
  mode: "deterministic_mock" | "live_ai";
  boundaryNote: string;
  observed: string;
  whyItMatters: string;
  action: string;
  summary: string;
  evidence: EvidenceItem[];
};

export type AnalysisInput = {
  goal: {
    id: number;
    title: string;
    target_metric: string;
    starting_value: number;
    target_value: number | null;
    status: string;
  } | null;
  progress: GoalProgress | null;
  publications: ScoredPublication[];
};

export function classifyMaterialKind(
  sourceType: string | null | undefined
): ScoredPublication["materialKind"] {
  const t = String(sourceType || "").toLowerCase();
  if (t === "client_result" || t.includes("client")) return "client_result";
  if (t === "informational" || t.includes("info")) return "informational";
  return "other";
}

export function materialKindLabel(kind: ScoredPublication["materialKind"]): string {
  if (kind === "client_result") return "client-result content";
  if (kind === "informational") return "general informational content";
  return "other content";
}

export function metricLabel(key: string): string {
  if (key in METRIC_LABELS) {
    return METRIC_LABELS[key as MetricKey];
  }
  return key;
}

function goalMetricPhrase(key: string): string {
  if (key === "audience_network_gained") return "Audience Network growth";
  return metricLabel(key);
}

export function computeGoalProgress(input: {
  startingValue: number | null | undefined;
  targetValue: number | null | undefined;
  contributed: number | null | undefined;
}): GoalProgress {
  const starting = Number(input.startingValue) || 0;
  const targetRaw = Number(input.targetValue);
  const target = Number.isFinite(targetRaw) ? targetRaw : null;
  const contributed = Number(input.contributed) || 0;
  const current = starting + contributed;
  const span = target == null ? null : target - starting;
  let percent: number | null = null;
  if (span != null && span !== 0) {
    percent = Math.max(0, (current - starting) / span);
  } else if (span === 0) {
    percent = current >= starting ? 1 : 0;
  }
  return {
    starting,
    target,
    contributed,
    current,
    remaining: target == null ? null : Math.max(0, target - current),
    percent,
    achieved: target != null && current >= target
  };
}

export function scoreMetrics(metrics: MetricMap): ScoredPublication["scores"] {
  const n = (key: MetricKey) => Number(metrics[key] || 0);
  return {
    business: n("leads_generated") * 10 + n("audience_network_gained") * 5,
    engagement:
      n("meaningful_conversations") * 4 +
      n("comments") * 3 +
      n("shares") * 2 +
      n("reactions"),
    visibility: n("views_reach") + n("clicks"),
    towardGoal: 0
  };
}

export function towardGoalValue(metrics: MetricMap, targetMetric: string | null | undefined): number {
  if (!targetMetric || !METRIC_KEYS.includes(targetMetric as MetricKey)) {
    return 0;
  }
  return Number(metrics[targetMetric as MetricKey] || 0);
}

export function rankBy<T>(items: T[], read: (item: T) => number): T[] {
  return [...items].sort((a, b) => read(b) - read(a) || 0);
}

function kindContribution(
  publications: ScoredPublication[],
  metric: string
): { kind: ScoredPublication["materialKind"]; label: string; value: number }[] {
  const sums = new Map<ScoredPublication["materialKind"], number>();
  for (const item of publications) {
    if (!item.hasResults) continue;
    const value = towardGoalValue(item.metrics, metric);
    sums.set(item.materialKind, (sums.get(item.materialKind) || 0) + value);
  }
  return [...sums.entries()]
    .map(([kind, value]) => ({ kind, label: materialKindLabel(kind), value }))
    .sort((a, b) => b.value - a.value);
}

export function buildDeterministicRecommendation(input: AnalysisInput): RecommendationDraft {
  const boundaryNote = DETERMINISTIC_ANALYSIS_BANNER;
  const { goal, progress, publications } = input;
  const withResults = publications.filter((item) => item.hasResults);

  if (!goal) {
    return {
      mode: "deterministic_mock",
      boundaryNote,
      observed: "No Goal is selected.",
      whyItMatters:
        "Without a stated objective, ADE cannot tell whether published content helped.",
      action: "Create a Goal and associate source/draft activity with it.",
      summary: "No goal to evaluate.",
      evidence: []
    };
  }

  const metricName = goalMetricPhrase(goal.target_metric);
  const evidence: EvidenceItem[] = withResults.map((item) => ({
    publicationId: item.publicationId,
    contentId: item.contentId,
    title: item.title,
    metric: goal.target_metric,
    value: towardGoalValue(item.metrics, goal.target_metric),
    captureMethod: item.captureMethod
  }));

  if (withResults.length === 0) {
    const published = publications.length;
    return {
      mode: "deterministic_mock",
      boundaryNote,
      observed: published
        ? `${published} published item(s) are linked to “${goal.title}”, but no performance results have been entered.`
        : `Goal “${goal.title}” has no published content with results yet.`,
      whyItMatters: "Progress and next-action advice require measured or operator-entered results.",
      action:
        "Publish associated content (or confirm mock publish), then enter manual performance results. Do not invent platform numbers.",
      summary: "Waiting for results before recommending a next action.",
      evidence: []
    };
  }

  const ranked = rankBy(withResults, (item) => towardGoalValue(item.metrics, goal.target_metric));
  const top = ranked[0];
  const second = ranked[1];
  const kinds = kindContribution(withResults, goal.target_metric);
  const distinctKinds = kinds.filter((row) => row.kind !== "other");

  let observed: string;
  let action: string;
  if (distinctKinds.length >= 2 && kinds[0].value > kinds[1].value) {
    observed = `${capitalize(kinds[0].label)} is contributing more ${metricName} than ${kinds[1].label} (${kinds[0].value} vs ${kinds[1].value} on this Goal).`;
    action = `Consider producing another piece based on similar source material to the stronger ${kinds[0].label}.`;
  } else if (second && towardGoalValue(top.metrics, goal.target_metric) > towardGoalValue(second.metrics, goal.target_metric)) {
    observed = `“${top.title}” contributed ${towardGoalValue(top.metrics, goal.target_metric)} ${metricName}, more than “${second.title}” (${towardGoalValue(second.metrics, goal.target_metric)}).`;
    action = "Consider producing another piece based on similar source material.";
  } else {
    observed = `Associated published content has recorded ${metricName} results totaling ${progress?.contributed ?? 0}.`;
    action = "Enter additional results or publish more associated content so ADE can compare performance.";
  }

  const progressText =
    progress?.target != null
      ? `Goal progress is ${progress.current} of ${progress.target} ${metricName} (starting ${progress.starting}, contributed ${progress.contributed}).`
      : `Contributed ${progress?.contributed ?? 0} ${metricName} from entered results.`;

  const whyItMatters = [
    progressText,
    "ADE ranks usefulness by Business Outcomes, then Meaningful Engagement, then Raw Visibility.",
    "These figures are operator-entered unless a row is marked as platform-collected."
  ].join(" ");

  return {
    mode: "deterministic_mock",
    boundaryNote,
    observed,
    whyItMatters,
    action,
    summary: `${observed} ${action}`,
    evidence
  };
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function liveAiConfigured(): boolean {
  return Boolean(process.env.ADE_AI_API_KEY?.trim());
}

export async function runAnalysis(input: AnalysisInput): Promise<RecommendationDraft> {
  const draft = buildDeterministicRecommendation(input);
  if (!liveAiConfigured()) {
    return draft;
  }
  return {
    ...draft,
    mode: "deterministic_mock",
    boundaryNote:
      `${draft.boundaryNote} ADE_AI_API_KEY is set, but no live AI analyzer is wired in this slice; deterministic analysis was used.`
  };
}
