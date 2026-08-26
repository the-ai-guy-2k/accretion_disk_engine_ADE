import { metricLabel } from "@/lib/analytics-logic";

export const CAMPAIGN_PLAN_BANNER =
  "ADE DETERMINISTIC / MOCK CAMPAIGN PLAN BOUNDARY — live AI was not used. This plan is produced from the Goal, Campaign, and selected Sources only.";

export type PlanSource = {
  id: number;
  title: string;
  source_type?: string | null;
  is_test?: number | boolean;
};

export type PlannedItem = {
  sourceId: number;
  sequence: number;
  title: string;
  purpose: string;
  format: string;
  intendedAudience: string;
  suggestedTiming: string;
};

export type CampaignPlanDraft = {
  mode: "deterministic_mock" | "live_ai";
  boundaryNote: string;
  summary: string;
  postCount: number;
  items: PlannedItem[];
};

const KIND_PURPOSE: Record<string, string> = {
  client_result: "Show a concrete result that supports the Goal",
  informational: "Explain the idea so the audience understands why the Goal matters",
  taig_activity: "Share the underlying activity as source-backed proof"
};

export function purposeForSourceType(sourceType: string | null | undefined): string {
  const key = String(sourceType || "").toLowerCase();
  return KIND_PURPOSE[key] || "Support the campaign objective using this source";
}

export function suggestedTiming(sequence: number): string {
  const day = 1 + (sequence - 1) * 2;
  return `Suggested Day ${day} (timing is a plan hint, not a scheduler)`;
}

export function buildCampaignPlan(input: {
  campaignTitle: string;
  objective: string;
  goalTitle: string;
  targetMetric: string;
  sources: PlanSource[];
}): CampaignPlanDraft {
  const ordered = [...input.sources].sort((a, b) => {
    const rank = (type: string) =>
      String(type).toLowerCase() === "client_result" ? 0 : String(type).toLowerCase() === "informational" ? 1 : 2;
    return rank(String(a.source_type || "")) - rank(String(b.source_type || "")) || a.id - b.id;
  });
  const metric = metricLabel(input.targetMetric);
  const audience = `People who can help progress “${input.goalTitle}” (${metric})`;
  const items: PlannedItem[] = ordered.map((source, index) => {
    const sequence = index + 1;
    const purpose = purposeForSourceType(source.source_type);
    return {
      sourceId: source.id,
      sequence,
      title: `Post ${sequence}: ${source.title}`.slice(0, 180),
      purpose,
      format: "Facebook short post",
      intendedAudience: audience,
      suggestedTiming: suggestedTiming(sequence)
    };
  });
  const summary = [
    `${items.length} planned post(s) for “${input.campaignTitle}”.`,
    `Objective: ${input.objective || "(none)"}.`,
    `Goal: ${input.goalTitle} via ${metric}.`,
    "Order prefers result-proof sources before informational sources.",
    "Each item stays tied to one Source. Human review is still required before publishing."
  ].join(" ");

  const draft: CampaignPlanDraft = {
    mode: "deterministic_mock",
    boundaryNote: CAMPAIGN_PLAN_BANNER,
    summary,
    postCount: items.length,
    items
  };
  if (process.env.ADE_AI_API_KEY?.trim()) {
    return {
      ...draft,
      boundaryNote: `${CAMPAIGN_PLAN_BANNER} ADE_AI_API_KEY is set, but no live AI planner is wired in this slice; deterministic planning was used.`
    };
  }
  return draft;
}
