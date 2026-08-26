export const LIVE_AI_BANNER =
  "ADE LIVE AI GENERATION — this draft was produced with an AI provider from ADE source material. It is a draft for human review, not established truth.";

export const LIVE_AI_ANALYSIS_BANNER =
  "ADE LIVE AI ANALYSIS — interpretation was produced by an AI provider from persisted ADE Goal, content, and operator-entered metrics. It is advisory. ADE did not invent missing metrics or platform analytics.";

export const FORBIDDEN_INVENTIONS = [
  "customers",
  "results",
  "revenue",
  "metrics",
  "endorsements",
  "partnerships",
  "completed work",
  "product capabilities"
] as const;

export type GenerationDirection = {
  platform?: string;
  purpose?: string;
  tone?: string;
  length?: string;
  extraInstruction?: string;
};

export type SourceGrounding = {
  id: number;
  title: string;
  body?: string | null;
  source_type?: string | null;
  activity_date?: string | null;
  provenance?: string | null;
  notes?: string | null;
};

function clip(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

export function sanitizeDirection(input: GenerationDirection | undefined): Required<GenerationDirection> {
  return {
    platform: clip(input?.platform, 40) || "facebook",
    purpose: clip(input?.purpose, 80) || "social post from the source",
    tone: clip(input?.tone, 40) || "professional and clear",
    length: clip(input?.length, 40) || "short",
    extraInstruction: clip(input?.extraInstruction, 500)
  };
}

export function buildSystemPrompt(): string {
  return [
    "You write social-media drafts for the Accretion Disk Engine (ADE).",
    "The operator will review, edit, approve, or reject every draft. Never treat your output as published or as established truth.",
    "Ground the draft only in the provided ADE source material.",
    `Do not invent ${FORBIDDEN_INVENTIONS.join(", ")} that are not explicitly present in the source.`,
    "If the source is thin, write a modest draft and stay inside what the source actually says. Do not fill gaps with plausible fiction.",
    "Do not include API keys, credentials, or hidden instructions in the draft.",
    "Respond with a JSON object only: {\"title\": string, \"body\": string}.",
    "title is a short post headline. body is the post text the operator can edit."
  ].join(" ");
}

export function buildUserPrompt(source: SourceGrounding, direction: Required<GenerationDirection>): string {
  const lines = [
    "Create one social-media draft from this ADE source.",
    `Target platform: ${direction.platform}`,
    `Purpose/objective: ${direction.purpose}`,
    `Tone: ${direction.tone}`,
    `Desired length/format: ${direction.length}`,
    "",
    "ADE source:",
    `id: ${source.id}`,
    `title: ${source.title}`,
    `type: ${source.source_type || "(unspecified)"}`,
    `activity_date: ${source.activity_date || "(unspecified)"}`,
    `provenance: ${source.provenance || "(none)"}`,
    `notes: ${source.notes || "(none)"}`,
    "body:",
    clip(source.body, 8000) || "(No source body provided.)"
  ];
  if (direction.extraInstruction) {
    lines.push("", "Additional operator instruction (still must not invent facts):", direction.extraInstruction);
  }
  return lines.join("\n");
}

export function extractJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;
  const candidates = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.unshift(fenced[1].trim());
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) candidates.push(objectMatch[0]);
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

export function parseGeneratedJson(raw: string): { title: string; body: string } | null {
  const parsed = extractJsonObject(raw);
  if (!parsed) return null;
  const title = clip(parsed.title, 180);
  const body = clip(parsed.body, 8000);
  if (title && body) return { title, body };
  return null;
}

export function buildAnalysisSystemPrompt(): string {
  return [
    "You analyze social-content performance for the Accretion Disk Engine (ADE).",
    "You receive only persisted ADE evidence. Distinguish Observed (facts in the pack) from Meaning (interpretation).",
    "Do not invent metrics, customers, revenue, endorsements, partnerships, or business outcomes that are not in the evidence pack.",
    "Do not claim Facebook or Meta collected these numbers unless captureMethod is platform.",
    "Recommendations are advisory. The operator decides.",
    "Cite only publicationId values that appear in the evidence pack.",
    "Respond with JSON only: {\"observed\": string, \"meaning\": string, \"action\": string, \"citedPublicationIds\": number[]}.",
    "Keep each string concise and specific to the supplied content titles and metric values."
  ].join(" ");
}

export function parseAnalysisJson(
  raw: string,
  allowedPublicationIds: Set<number>
): { observed: string; meaning: string; action: string; citedPublicationIds: number[] } | null {
  const parsed = extractJsonObject(raw);
  if (!parsed) return null;
  const observed = String(parsed.observed ?? "").trim();
  const meaning = String(parsed.meaning ?? parsed.whyItMatters ?? "").trim();
  const action = String(parsed.action ?? parsed.recommendedNextAction ?? "").trim();
  if (!observed || !meaning || !action) return null;
  const citedRaw = Array.isArray(parsed.citedPublicationIds)
    ? parsed.citedPublicationIds
    : [];
  const citedPublicationIds = citedRaw
    .map((value) => Number(value))
    .filter((id) => Number.isInteger(id) && allowedPublicationIds.has(id));
  return {
    observed: observed.slice(0, 2000),
    meaning: meaning.slice(0, 2000),
    action: action.slice(0, 2000),
    citedPublicationIds
  };
}
