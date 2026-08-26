import { aiModel, aiProviderId, aiPublicStatus, aiTimeoutMs } from "@/lib/ai-config";
import {
  buildSystemPrompt,
  buildUserPrompt,
  LIVE_AI_BANNER,
  sanitizeDirection,
  type GenerationDirection,
  type SourceGrounding
} from "@/lib/ai-prompt";
import { failure, type AiGenerateResult } from "@/lib/ai-provider";
import { openaiContentProvider } from "@/lib/openai-content-provider";

export function resolveContentProvider() {
  const id = aiProviderId();
  if (id === "openai") return openaiContentProvider;
  return null;
}

export async function generateLiveDraft(input: {
  source: SourceGrounding;
  direction?: GenerationDirection;
}): Promise<AiGenerateResult> {
  const status = aiPublicStatus();
  if (!status.configured) {
    return failure("missing_credentials", status.unavailableReason || "AI is not configured.", 503);
  }
  const provider = resolveContentProvider();
  if (!provider) {
    return failure(
      "unsupported_provider",
      status.unavailableReason || `Provider "${aiProviderId()}" is not implemented.`,
      503
    );
  }
  const direction = sanitizeDirection(input.direction);
  return provider.generate({
    systemPrompt: buildSystemPrompt(),
    userPrompt: buildUserPrompt(input.source, direction),
    model: aiModel(),
    timeoutMs: aiTimeoutMs()
  });
}

export function liveGenerationNote(provider: string, model: string): string {
  return `${LIVE_AI_BANNER} Provider: ${provider}. Model: ${model}.`;
}
