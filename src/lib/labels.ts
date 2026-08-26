import { METRIC_LABELS, type MetricKey } from "./schema";

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  taig_activity: "TAIG activity",
  client_result: "Client result",
  informational: "Informational"
};

export function sourceTypeLabel(value: string | null | undefined): string {
  const key = String(value || "");
  return SOURCE_TYPE_LABELS[key] || key || "Unspecified";
}

export function generationLabel(mode: string | null | undefined): string {
  return String(mode) === "live_ai" ? "Live AI" : "Manual draft";
}

export function captureLabel(method: string | null | undefined): string {
  const value = String(method || "");
  if (value === "platform") return "Platform-collected";
  if (value === "manual") return "Manually entered";
  return value || "Unspecified";
}

export function metricDisplay(name: string | null | undefined): string {
  const key = String(name || "");
  if (key in METRIC_LABELS) return METRIC_LABELS[key as MetricKey];
  return key;
}

export function publicationStatusLabel(status: string | null | undefined): string {
  switch (String(status)) {
    case "PENDING":
      return "PENDING — waiting for mock Facebook";
    case "READY":
      return "READY — confirm mock publish";
    case "PUBLISHED":
      return "PUBLISHED — mock only";
    case "FAILED":
      return "FAILED — mock publish did not complete";
    default:
      return String(status || "");
  }
}
