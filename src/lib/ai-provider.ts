import { WorkflowError } from "@/lib/errors";
import type { AiGenerateResult, AiGenerateSuccess } from "@/lib/ai-errors";

export type { AiGenerateResult, AiGenerateSuccess, AiGenerateFailure, AiFailureCode } from "@/lib/ai-errors";
export { failure, classifyHttpFailure } from "@/lib/ai-errors";

export type AiContentProvider = {
  id: string;
  generate(input: {
    systemPrompt: string;
    userPrompt: string;
    model: string;
    timeoutMs: number;
  }): Promise<AiGenerateResult>;
};

export function throwIfFailed(result: AiGenerateResult): asserts result is AiGenerateSuccess {
  if (!result.ok) {
    throw new WorkflowError(result.message, result.status);
  }
}
