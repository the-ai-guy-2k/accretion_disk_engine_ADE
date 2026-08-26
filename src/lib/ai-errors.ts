export type AiFailureCode =
  | "missing_credentials"
  | "unsupported_provider"
  | "unavailable"
  | "timeout"
  | "malformed"
  | "generation_failed";

export type AiCompleteSuccess = {
  ok: true;
  text: string;
  provider: string;
  model: string;
};

export type AiGenerateSuccess = {
  ok: true;
  title: string;
  body: string;
  provider: string;
  model: string;
};

export type AiGenerateFailure = {
  ok: false;
  code: AiFailureCode;
  message: string;
  status: number;
};

export type AiCompleteResult = AiCompleteSuccess | AiGenerateFailure;
export type AiGenerateResult = AiGenerateSuccess | AiGenerateFailure;

export function failure(
  code: AiFailureCode,
  message: string,
  status: number
): AiGenerateFailure {
  return { ok: false, code, message, status };
}

export function classifyHttpFailure(status: number, providerLabel: string): AiGenerateFailure {
  if (status === 401 || status === 403) {
    return failure(
      "missing_credentials",
      `${providerLabel} rejected the credentials. Check ADE_AI_API_KEY (or OPENAI_API_KEY for OpenAI) and restart ADE.`,
      503
    );
  }
  if (status === 408) {
    return failure("timeout", `${providerLabel} timed out.`, 504);
  }
  if (status === 429) {
    return failure("unavailable", `${providerLabel} is rate-limited. Try again shortly.`, 502);
  }
  if (status >= 500) {
    return failure("unavailable", `${providerLabel} is unavailable (HTTP ${status}).`, 502);
  }
  return failure(
    "generation_failed",
    `${providerLabel} could not complete the AI request (HTTP ${status}).`,
    502
  );
}
