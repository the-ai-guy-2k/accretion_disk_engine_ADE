export const DEFAULT_AI_PROVIDER = "openai";
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_AI_TIMEOUT_MS = 45_000;

export function aiProviderId(): string {
  return (process.env.ADE_AI_PROVIDER?.trim() || DEFAULT_AI_PROVIDER).toLowerCase();
}

export function aiModel(): string {
  return process.env.ADE_AI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function aiBaseUrl(): string {
  return (process.env.ADE_AI_BASE_URL?.trim() || DEFAULT_OPENAI_BASE_URL).replace(/\/+$/, "");
}

export function aiTimeoutMs(): number {
  const raw = Number(process.env.ADE_AI_TIMEOUT_MS);
  return Number.isFinite(raw) && raw >= 1000 ? raw : DEFAULT_AI_TIMEOUT_MS;
}

export function aiApiKey(): string {
  const dedicated = process.env.ADE_AI_API_KEY?.trim();
  if (dedicated) return dedicated;
  if (aiProviderId() === "openai") {
    return process.env.OPENAI_API_KEY?.trim() || "";
  }
  return "";
}

export function aiConfigured(): boolean {
  return Boolean(aiApiKey());
}

/** Public status only — never includes the credential value. */
export function aiPublicStatus() {
  const configured = aiConfigured();
  return {
    configured,
    provider: configured ? aiProviderId() : aiProviderId(),
    model: configured ? aiModel() : aiModel(),
    ready: configured && aiProviderId() === "openai",
    purpose: "content_generation_and_analytics" as const,
    analyticsLive: configured && aiProviderId() === "openai",
    unavailableReason: configured
      ? aiProviderId() === "openai"
        ? null
        : `Provider "${aiProviderId()}" is not implemented. Use ADE_AI_PROVIDER=openai.`
      : "Set ADE_AI_API_KEY (or OPENAI_API_KEY for the OpenAI provider) in .env.local. Restart ADE after changing credentials."
  };
}
