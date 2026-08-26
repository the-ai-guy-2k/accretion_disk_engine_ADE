/** Server-side Meta/Facebook connection configuration. Never expose secret values. */

export const DEFAULT_GRAPH_API_VERSION = "v26.0";
export const META_GRAPH_HOST = "https://graph.facebook.com";
export const DEFAULT_META_TIMEOUT_MS = 20_000;
export const FACEBOOK_PLATFORM = "facebook";

function env(name: string): string {
  return process.env[name]?.trim() || "";
}

function firstEnv(...names: string[]): string {
  for (const name of names) {
    const value = env(name);
    if (value) return value;
  }
  return "";
}

export function graphApiVersion(): string {
  const raw = env("META_GRAPH_API_VERSION") || DEFAULT_GRAPH_API_VERSION;
  return raw.startsWith("v") ? raw : `v${raw}`;
}

export function metaTimeoutMs(): number {
  const raw = Number(env("ADE_DGIX_FB_TIMEOUT_MS") || env("META_TIMEOUT_MS"));
  return Number.isFinite(raw) && raw >= 1000 ? raw : DEFAULT_META_TIMEOUT_MS;
}

/** Logical ADE/DGIX client this process's Facebook connection belongs to. Not hardcoded to TAIG. */
export function configuredFacebookClientId(): string {
  return env("ADE_DGIX_FB_CLIENT_ID");
}

export function configuredFacebookPageId(): string {
  return firstEnv("ADE_DGIX_FB_PAGE_ID", "FACEBOOK_PAGE_ID");
}

export function configuredFacebookAdAccountId(): string {
  return firstEnv("ADE_DGIX_FB_AD_ACCOUNT_ID", "META_AD_ACCOUNT_ID");
}

export function facebookPageAccessToken(): string {
  return firstEnv("ADE_DGIX_FB_PAGE_ACCESS_TOKEN", "META_PAGE_ACCESS_TOKEN");
}

export function facebookAdAccessToken(): string {
  return firstEnv("ADE_DGIX_FB_AD_ACCESS_TOKEN", "META_AD_ACCESS_TOKEN") || facebookPageAccessToken();
}

export function metaAppId(): string {
  return env("META_APP_ID");
}

export function metaAppSecret(): string {
  return env("META_APP_SECRET");
}

export function normalizeAdAccountId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("act_") ? trimmed.slice(4) : trimmed;
}

export function facebookConnectionSecretsPresent() {
  return {
    pageAccessToken: Boolean(facebookPageAccessToken()),
    adAccessToken: Boolean(facebookAdAccessToken()),
    appSecret: Boolean(metaAppSecret())
  };
}

/** Public configuration only — no tokens or app secret. */
export function facebookConnectionConfigPublic() {
  const clientId = configuredFacebookClientId();
  const pageId = configuredFacebookPageId();
  const adAccountId = normalizeAdAccountId(configuredFacebookAdAccountId());
  const secrets = facebookConnectionSecretsPresent();
  return {
    graphApiVersion: graphApiVersion(),
    graphHost: META_GRAPH_HOST,
    platform: FACEBOOK_PLATFORM,
    clientId: clientId || null,
    pageId: pageId || null,
    adAccountId: adAccountId || null,
    appIdConfigured: Boolean(metaAppId()),
    pageAuthorizationConfigured: secrets.pageAccessToken,
    advertisingAuthorizationConfigured: Boolean(
      firstEnv("ADE_DGIX_FB_AD_ACCESS_TOKEN", "META_AD_ACCESS_TOKEN") ||
        (adAccountId && secrets.pageAccessToken)
    ),
    realPublishingImplemented: false,
    paidExecutionImplemented: false
  };
}
