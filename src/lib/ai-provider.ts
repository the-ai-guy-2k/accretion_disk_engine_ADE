import { WorkflowError } from "@/lib/errors";
import type {
  AiCompleteResult,
  AiCompleteSuccess,
  AiGenerateResult,
  AiGenerateSuccess
} from "@/lib/ai-errors";

export type {
  AiCompleteResult,
  AiCompleteSuccess,
  AiGenerateResult,
  AiGenerateSuccess,
  AiGenerateFailure,
  AiFailureCode
} from "@/lib/ai-errors";
export { failure, classifyHttpFailure } from "@/lib/ai-errors";

export type AiCompleteInput = {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  timeoutMs: number;
  temperature?: number;
};

export type AiContentProvider = {
  id: string;
  complete(input: AiCompleteInput): Promise<AiCompleteResult>;
  generate(input: AiCompleteInput): Promise<AiGenerateResult>;
};

export function throwIfFailed(result: AiGenerateResult): asserts result is AiGenerateSuccess {
  if (!result.ok) {
    throw new WorkflowError(result.message, result.status);
  }
}

export function throwIfCompleteFailed(
  result: AiCompleteResult
): asserts result is AiCompleteSuccess {
  if (!result.ok) {
    throw new WorkflowError(result.message, result.status);
  }
}
