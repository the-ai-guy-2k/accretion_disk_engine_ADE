import { aiModel, aiPublicStatus, aiTimeoutMs } from "@/lib/ai-config";
import { resolveContentProvider } from "@/lib/ai-generation";
import { failure, type AiCompleteResult } from "@/lib/ai-provider";
import type { AnalysisInput, RecommendationDraft } from "@/lib/analytics-logic";
import { metricLabel, towardGoalValue } from "@/lib/analytics-logic";
import {
  LIVE_AI_ANALYSIS_BANNER,
  buildAnalysisSystemPrompt,
  parseAnalysisJson
} from "@/lib/ai-prompt";

export { LIVE_AI_ANALYSIS_BANNER, buildAnalysisSystemPrompt, parseAnalysisJson } from "@/lib/ai-prompt";

export function buildAnalysisUserPrompt(
  input: AnalysisInput,
  baseline: RecommendationDraft
): string {
  const goal = input.goal;
  const progress = input.progress;
  const rows = input.publications.map((item) => ({
    publicationId: item.publicationId,
    contentId: item.contentId,
    title: item.title,
    sourceId: item.sourceId,
    sourceTitle: item.sourceTitle,
    sourceType: item.sourceType,
    campaignId: item.campaignId,
    campaignTitle: item.campaignTitle,
    goalId: item.goalId,
    materialKind: item.materialKind,
    captureMethod: item.captureMethod,
    isTest: item.isTest,
    hasResults: item.hasResults,
    metrics: item.metrics,
    scores: item.scores,
    towardGoalMetric: goal ? towardGoalValue(item.metrics, goal.target_metric) : 0
  }));
  return [
    "Analyze this ADE performance pack.",
    goal
      ? `Goal #${goal.id} “${goal.title}” status=${goal.status} target_metric=${goal.target_metric} (${metricLabel(goal.target_metric)}) starting=${goal.starting_value} target=${goal.target_value ?? "none"}.`
      : "No Goal selected.",
    progress
      ? `Computed Goal progress (deterministic, not AI): current=${progress.current} contributed=${progress.contributed} remaining=${progress.remaining ?? "n/a"} percent=${progress.percent ?? "n/a"} achieved=${progress.achieved}.`
      : "No Goal progress computed.",
    "ADE deterministic baseline (not a live AI conclusion):",
    `Observed: ${baseline.observed}`,
    `Meaning: ${baseline.whyItMatters}`,
    `Recommended next action: ${baseline.action}`,
    "Questions to answer from the pack only:",
    "- What content appears to be performing best?",
    "- What appears to be increasing viewership?",
    "- What content produces meaningful engagement?",
    "- Is the Goal progressing?",
    "- What patterns appear across available content?",
    "- What should the operator try next?",
    "Evidence pack (JSON):",
    JSON.stringify(rows, null, 2)
  ].join("\n");
}

export async function analyzePerformanceWithAi(input: {
  analysis: AnalysisInput;
  baseline: RecommendationDraft;
}): Promise<AiCompleteResult & { draft?: RecommendationDraft }> {
  const status = aiPublicStatus();
  if (!status.configured) {
    return failure("missing_credentials", status.unavailableReason || "AI is not configured.", 503);
  }
  const provider = resolveContentProvider();
  if (!provider) {
    return failure(
      "unsupported_provider",
      status.unavailableReason || "AI provider is not implemented.",
      503
    );
  }
  const completed = await provider.complete({
    systemPrompt: buildAnalysisSystemPrompt(),
    userPrompt: buildAnalysisUserPrompt(input.analysis, input.baseline),
    model: aiModel(),
    timeoutMs: aiTimeoutMs()
  });
  if (!completed.ok) return completed;
  const allowed = new Set(
    input.analysis.publications.map((item) => item.publicationId)
  );
  const parsed = parseAnalysisJson(completed.text, allowed);
  if (!parsed) {
    return failure(
      "malformed",
      "The AI analysis response could not be turned into Observed / Meaning / Recommended Next Action. No AI recommendation was stored. Deterministic analytics remain available.",
      502
    );
  }
  const evidence = input.baseline.evidence.filter((item) =>
    parsed.citedPublicationIds.length === 0
      ? true
      : parsed.citedPublicationIds.includes(item.publicationId)
  );
  const draft: RecommendationDraft = {
    mode: "live_ai",
    boundaryNote: `${LIVE_AI_ANALYSIS_BANNER} Provider: ${completed.provider}. Model: ${completed.model}. Deterministic baseline was computed first and supplied as context.`,
    observed: parsed.observed,
    whyItMatters: parsed.meaning,
    action: parsed.action,
    summary: `${parsed.observed} ${parsed.action}`,
    evidence: evidence.length ? evidence : input.baseline.evidence
  };
  return { ...completed, draft };
}
