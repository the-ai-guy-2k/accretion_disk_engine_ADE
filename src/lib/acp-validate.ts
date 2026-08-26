export class AcpValidationError extends Error {
  readonly status = 400;
  readonly issues: AcpIssue[];
  constructor(issues: AcpIssue[]) {
    const summary =
      issues.length === 1
        ? issues[0].message
        : `This Campaign Package cannot be accepted (${issues.length} problems).`;
    super(summary);
    this.name = "AcpValidationError";
    this.issues = issues;
  }
}

export const ACP_VERSION = "1";

export const FORBIDDEN_SECRET_KEY_PATTERNS = [
  /access[_-]?token/i,
  /^api[_-]?key$/i,
  /[_-]api[_-]?key$/i,
  /^password$/i,
  /passwd/i,
  /client[_-]?secret/i,
  /app[_-]?secret/i,
  /private[_-]?key/i,
  /^secret$/i,
  /[_-]secret$/i,
  /^bearer$/i,
  /^authorization$/i,
  /ade_ai_api_key/i,
  /openai_api_key/i,
  /meta_app_secret/i,
  /page_access_token/i
];

export type AcpIssue = { path: string; message: string };

export type AcpMeasurementTarget = {
  metric: string;
  targetValue: number;
  startingValue?: number;
  unit?: string;
};

export type AcpMediaRef = { kind: string; value: string };

export type AcpPost = {
  title?: string;
  body: string;
  callToAction?: string;
  mediaReferences: AcpMediaRef[];
};

export type AcpSourceEvidence = {
  title?: string;
  reference?: string;
  notes?: string;
};

export const ACP_POST_TYPES = ["text", "image"] as const;
export const ACP_PUBLISH_MODES = ["now", "scheduled"] as const;

export type AcpPostType = (typeof ACP_POST_TYPES)[number];
export type AcpPublishMode = (typeof ACP_PUBLISH_MODES)[number];

export type AcpExecution = {
  clientId: string;
  platform: string;
  postType: AcpPostType;
  message: string;
  mediaReference?: AcpMediaRef;
  link?: string;
  callToAction?: string;
  publishMode: AcpPublishMode;
  scheduledAt?: string;
};

export type AcpPackage = {
  acpVersion: string;
  packageId: string;
  originatingSystem: string;
  clientBusinessId: string;
  campaignName: string;
  createdAt: string;
  isTest?: boolean;
  objective: {
    statement: string;
    measurementTarget: AcpMeasurementTarget;
    intendedPlatforms: string[];
  };
  audience: {
    description: string;
  };
  content: {
    posts: AcpPost[];
  };
  provenance: {
    originatingIntelligenceSource: string;
    sourceEvidence: AcpSourceEvidence[];
    notes?: string;
  };
  executionIntent: {
    timingPreference?: string;
    restrictions: string[];
    approvalRequirements: string;
  };
  measurementIntent: {
    signals: string[];
    notes?: string;
  };
  execution?: AcpExecution;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isForbiddenKey(key: string): boolean {
  return FORBIDDEN_SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function collectSecretKeys(value: unknown, path: string, issues: AcpIssue[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectSecretKeys(item, `${path}[${index}]`, issues));
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const next = path ? `${path}.${key}` : key;
    if (isForbiddenKey(key)) {
      issues.push({
        path: next,
        message:
          "Campaign Packages must not include credentials, API keys, tokens, or passwords. Keep secrets in ADE's future integration settings, not in ACP artifacts."
      });
      continue;
    }
    collectSecretKeys(child, next, issues);
  }
}

function reqString(value: unknown, path: string, issues: AcpIssue[]): string {
  if (typeof value !== "string" || !value.trim()) {
    issues.push({ path, message: `${path} is required.` });
    return "";
  }
  return value.trim();
}

function optString(value: unknown, path: string, issues: AcpIssue[]): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string") {
    issues.push({ path, message: `${path} must be text.` });
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function reqNumber(value: unknown, path: string, issues: AcpIssue[]): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push({ path, message: `${path} must be a number. ADE will not guess or repair it.` });
    return null;
  }
  return value;
}

function optNumber(value: unknown, path: string, issues: AcpIssue[]): number | undefined {
  if (value == null || value === "") return undefined;
  return reqNumber(value, path, issues) ?? undefined;
}

function isoTimestamp(value: unknown, path: string, issues: AcpIssue[]): string {
  const text = reqString(value, path, issues);
  if (!text) return "";
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/.test(text)) {
    issues.push({
      path,
      message: `${path} must be an ISO-8601 date or timestamp (for example 2026-08-26T17:00:00Z).`
    });
  }
  return text;
}

function stringList(value: unknown, path: string, issues: AcpIssue[], required: boolean): string[] {
  if (value == null) {
    if (required) issues.push({ path, message: `${path} is required.` });
    return [];
  }
  if (!Array.isArray(value)) {
    issues.push({ path, message: `${path} must be a list of text values.` });
    return [];
  }
  const items: string[] = [];
  value.forEach((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      issues.push({ path: `${path}[${index}]`, message: `${path}[${index}] must be non-empty text.` });
      return;
    }
    items.push(item.trim());
  });
  if (required && items.length === 0) {
    issues.push({ path, message: `${path} must include at least one item.` });
  }
  return items;
}

function parseMediaRef(value: unknown, path: string, issues: AcpIssue[]): AcpMediaRef | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "string" && value.trim()) {
    return { kind: "description", value: value.trim() };
  }
  if (!isPlainObject(value)) {
    issues.push({ path, message: `${path} must be text or { kind, value }.` });
    return undefined;
  }
  const kind = reqString(value.kind, `${path}.kind`, issues) || "description";
  const refValue = reqString(value.value, `${path}.value`, issues);
  if (!refValue) return undefined;
  return { kind, value: refValue };
}

function parseExecution(raw: unknown, issues: AcpIssue[]): AcpExecution | undefined {
  if (raw == null) return undefined;
  if (!isPlainObject(raw)) {
    issues.push({
      path: "execution",
      message: "execution must be an object of publish-ready fields. DGIX will not infer it from other ACP sections."
    });
    return undefined;
  }
  const clientId = reqString(raw.clientId, "execution.clientId", issues);
  const platform = reqString(raw.platform, "execution.platform", issues);
  const postTypeRaw = reqString(raw.postType, "execution.postType", issues);
  const postType = ACP_POST_TYPES.includes(postTypeRaw as AcpPostType)
    ? (postTypeRaw as AcpPostType)
    : null;
  if (postTypeRaw && !postType) {
    issues.push({
      path: "execution.postType",
      message: `execution.postType must be one of: ${ACP_POST_TYPES.join(", ")}. This is not a proven Meta Graph contract.`
    });
  }
  const message = reqString(raw.message, "execution.message", issues);
  const publishModeRaw = reqString(raw.publishMode, "execution.publishMode", issues);
  const publishMode = ACP_PUBLISH_MODES.includes(publishModeRaw as AcpPublishMode)
    ? (publishModeRaw as AcpPublishMode)
    : null;
  if (publishModeRaw && !publishMode) {
    issues.push({
      path: "execution.publishMode",
      message: `execution.publishMode must be one of: ${ACP_PUBLISH_MODES.join(", ")}.`
    });
  }
  const mediaReference = parseMediaRef(raw.mediaReference, "execution.mediaReference", issues);
  if (postType === "image" && !mediaReference) {
    issues.push({
      path: "execution.mediaReference",
      message: "An image post requires execution.mediaReference. ADE will not invent a media file."
    });
  }
  const link = optString(raw.link, "execution.link", issues);
  const callToAction = optString(raw.callToAction, "execution.callToAction", issues);
  let scheduledAt: string | undefined;
  if (publishMode === "scheduled") {
    scheduledAt = isoTimestamp(raw.scheduledAt, "execution.scheduledAt", issues) || undefined;
  } else if (raw.scheduledAt != null && raw.scheduledAt !== "") {
    scheduledAt = isoTimestamp(raw.scheduledAt, "execution.scheduledAt", issues) || undefined;
  }

  if (!clientId || !platform || !postType || !message || !publishMode) return undefined;
  if (postType === "image" && !mediaReference) return undefined;
  if (publishMode === "scheduled" && !scheduledAt) return undefined;

  return {
    clientId,
    platform,
    postType,
    message,
    ...(mediaReference ? { mediaReference } : {}),
    ...(link ? { link } : {}),
    ...(callToAction ? { callToAction } : {}),
    publishMode,
    ...(scheduledAt ? { scheduledAt } : {})
  };
}

export function validateAcp(input: unknown): { ok: true; value: AcpPackage } | { ok: false; issues: AcpIssue[] } {
  const issues: AcpIssue[] = [];
  if (!isPlainObject(input)) {
    return {
      ok: false,
      issues: [{ path: "$", message: "The Campaign Package must be a JSON object." }]
    };
  }

  collectSecretKeys(input, "", issues);

  const rawVersion = input.acpVersion;
  if (rawVersion !== ACP_VERSION && rawVersion !== 1) {
    issues.push({
      path: "acpVersion",
      message:
        rawVersion == null
          ? "acpVersion is required. ADE accepts ACP v1."
          : `Unsupported ACP version ${JSON.stringify(rawVersion)}. ADE accepts ACP v1 only.`
    });
  }

  const packageId = reqString(input.packageId, "packageId", issues);
  const originatingSystem = reqString(input.originatingSystem, "originatingSystem", issues);
  const clientBusinessId = reqString(input.clientBusinessId, "clientBusinessId", issues);
  const campaignName = reqString(input.campaignName, "campaignName", issues);
  const createdAt = isoTimestamp(input.createdAt, "createdAt", issues);

  if (input.objective == null) {
    issues.push({ path: "objective", message: "objective is required. ADE needs the business/social outcome." });
  } else if (!isPlainObject(input.objective)) {
    issues.push({ path: "objective", message: "objective must be an object, not a single text field." });
  }

  const objective = isPlainObject(input.objective) ? input.objective : {};
  const statement = reqString(objective.statement, "objective.statement", issues);
  let measurementTarget: AcpMeasurementTarget = { metric: "", targetValue: 0 };
  if (objective.measurementTarget == null) {
    issues.push({
      path: "objective.measurementTarget",
      message: "objective.measurementTarget is required and must be an object with metric and targetValue."
    });
  } else if (!isPlainObject(objective.measurementTarget)) {
    issues.push({
      path: "objective.measurementTarget",
      message: "objective.measurementTarget must be an object. A bare number or text value is not accepted."
    });
  } else {
    const metric = reqString(objective.measurementTarget.metric, "objective.measurementTarget.metric", issues);
    const targetValue = reqNumber(
      objective.measurementTarget.targetValue,
      "objective.measurementTarget.targetValue",
      issues
    );
    const startingValue = optNumber(
      objective.measurementTarget.startingValue,
      "objective.measurementTarget.startingValue",
      issues
    );
    const unit = optString(objective.measurementTarget.unit, "objective.measurementTarget.unit", issues);
    measurementTarget = {
      metric,
      targetValue: targetValue ?? 0,
      ...(startingValue != null ? { startingValue } : {}),
      ...(unit ? { unit } : {})
    };
  }

  const intendedPlatforms = stringList(
    objective.intendedPlatforms,
    "objective.intendedPlatforms",
    issues,
    true
  );

  if (input.audience == null || !isPlainObject(input.audience)) {
    issues.push({ path: "audience", message: "audience is required and must include a description." });
  }
  const audience = isPlainObject(input.audience) ? input.audience : {};
  const audienceDescription = reqString(audience.description, "audience.description", issues);

  if (input.content == null || !isPlainObject(input.content)) {
    issues.push({ path: "content", message: "content is required and must include a posts list." });
  }
  const content = isPlainObject(input.content) ? input.content : {};
  if (content.body != null && content.posts == null) {
    issues.push({
      path: "content.posts",
      message: "content.posts is required. ADE will not promote a single body field into a posts list."
    });
  }
  const postsRaw = Array.isArray(content.posts) ? content.posts : null;
  if (postsRaw == null) {
    if (isPlainObject(input.content) && content.body == null) {
      issues.push({ path: "content.posts", message: "content.posts must be a list of proposed posts." });
    }
  } else if (postsRaw.length === 0) {
    issues.push({ path: "content.posts", message: "content.posts must include at least one proposed post." });
  }

  const posts: AcpPost[] = [];
  (postsRaw || []).forEach((item, index) => {
    const path = `content.posts[${index}]`;
    if (!isPlainObject(item)) {
      issues.push({ path, message: `${path} must be an object with a body.` });
      return;
    }
    const body = reqString(item.body, `${path}.body`, issues);
    const title = optString(item.title, `${path}.title`, issues);
    const callToAction = optString(item.callToAction, `${path}.callToAction`, issues);
    const media: AcpMediaRef[] = [];
    if (item.mediaReferences != null) {
      if (!Array.isArray(item.mediaReferences)) {
        issues.push({ path: `${path}.mediaReferences`, message: `${path}.mediaReferences must be a list.` });
      } else {
        item.mediaReferences.forEach((ref, refIndex) => {
          const refPath = `${path}.mediaReferences[${refIndex}]`;
          if (typeof ref === "string" && ref.trim()) {
            media.push({ kind: "description", value: ref.trim() });
            return;
          }
          if (!isPlainObject(ref)) {
            issues.push({ path: refPath, message: `${refPath} must be text or { kind, value }.` });
            return;
          }
          const kind = reqString(ref.kind, `${refPath}.kind`, issues) || "description";
          const value = reqString(ref.value, `${refPath}.value`, issues);
          if (value) media.push({ kind, value });
        });
      }
    }
    if (body) {
      posts.push({
        body,
        ...(title ? { title } : {}),
        ...(callToAction ? { callToAction } : {}),
        mediaReferences: media
      });
    }
  });

  if (input.provenance == null || !isPlainObject(input.provenance)) {
    issues.push({
      path: "provenance",
      message: "provenance is required so ADE can identify where this campaign intelligence came from."
    });
  }
  const provenance = isPlainObject(input.provenance) ? input.provenance : {};
  const originatingIntelligenceSource = reqString(
    provenance.originatingIntelligenceSource,
    "provenance.originatingIntelligenceSource",
    issues
  );
  const evidenceRaw = Array.isArray(provenance.sourceEvidence) ? provenance.sourceEvidence : null;
  if (evidenceRaw == null) {
    issues.push({
      path: "provenance.sourceEvidence",
      message: "provenance.sourceEvidence must be a list of source evidence references."
    });
  } else if (evidenceRaw.length === 0) {
    issues.push({
      path: "provenance.sourceEvidence",
      message: "provenance.sourceEvidence must include at least one reference."
    });
  }
  const sourceEvidence: AcpSourceEvidence[] = [];
  (evidenceRaw || []).forEach((item, index) => {
    const path = `provenance.sourceEvidence[${index}]`;
    if (!isPlainObject(item)) {
      issues.push({ path, message: `${path} must be an object.` });
      return;
    }
    const title = optString(item.title, `${path}.title`, issues);
    const reference = optString(item.reference, `${path}.reference`, issues);
    const notes = optString(item.notes, `${path}.notes`, issues);
    if (!title && !reference) {
      issues.push({ path, message: `${path} needs a title or reference.` });
      return;
    }
    sourceEvidence.push({
      ...(title ? { title } : {}),
      ...(reference ? { reference } : {}),
      ...(notes ? { notes } : {})
    });
  });
  const provenanceNotes = optString(provenance.notes, "provenance.notes", issues);

  if (input.executionIntent == null || !isPlainObject(input.executionIntent)) {
    issues.push({ path: "executionIntent", message: "executionIntent is required, including approvalRequirements." });
  }
  const execution = isPlainObject(input.executionIntent) ? input.executionIntent : {};
  const approvalRequirements = reqString(
    execution.approvalRequirements,
    "executionIntent.approvalRequirements",
    issues
  );
  const timingPreference = optString(execution.timingPreference, "executionIntent.timingPreference", issues);
  const restrictions = stringList(execution.restrictions, "executionIntent.restrictions", issues, false);

  if (input.measurementIntent == null || !isPlainObject(input.measurementIntent)) {
    issues.push({
      path: "measurementIntent",
      message: "measurementIntent is required and must list signals to evaluate against the objective."
    });
  }
  const measurement = isPlainObject(input.measurementIntent) ? input.measurementIntent : {};
  const signals = stringList(measurement.signals, "measurementIntent.signals", issues, true);
  const measurementNotes = optString(measurement.notes, "measurementIntent.notes", issues);

  const executionBlock = parseExecution(input.execution, issues);

  let isTest: boolean | undefined;
  if (input.isTest != null) {
    if (typeof input.isTest !== "boolean") {
      issues.push({ path: "isTest", message: "isTest must be true or false when supplied." });
    } else {
      isTest = input.isTest;
    }
  }

  if (issues.length) return { ok: false, issues };

  return {
    ok: true,
    value: {
      acpVersion: ACP_VERSION,
      packageId,
      originatingSystem,
      clientBusinessId,
      campaignName,
      createdAt,
      ...(isTest != null ? { isTest } : {}),
      objective: {
        statement,
        measurementTarget,
        intendedPlatforms
      },
      audience: { description: audienceDescription },
      content: { posts },
      provenance: {
        originatingIntelligenceSource,
        sourceEvidence,
        ...(provenanceNotes ? { notes: provenanceNotes } : {})
      },
      executionIntent: {
        ...(timingPreference ? { timingPreference } : {}),
        restrictions,
        approvalRequirements
      },
      measurementIntent: {
        signals,
        ...(measurementNotes ? { notes: measurementNotes } : {})
      },
      ...(executionBlock ? { execution: executionBlock } : {})
    }
  };
}

export function assertValidAcp(input: unknown): AcpPackage {
  const result = validateAcp(input);
  if (!result.ok) throw new AcpValidationError(result.issues);
  return result.value;
}

export function reviewView(pkg: AcpPackage) {
  const ctas = pkg.content.posts.map((post) => post.callToAction).filter(Boolean);
  const execution = pkg.execution;
  return {
    OBJECTIVE: pkg.objective.statement,
    CAMPAIGN: pkg.campaignName,
    AUDIENCE: pkg.audience.description,
    CONTENT: pkg.content.posts.map((post) => ({
      title: post.title || "(untitled)",
      body: post.body,
      mediaReferences: post.mediaReferences
    })),
    SOURCE: {
      originatingIntelligenceSource: pkg.provenance.originatingIntelligenceSource,
      sourceEvidence: pkg.provenance.sourceEvidence,
      notes: pkg.provenance.notes || null
    },
    CTA: ctas.length ? ctas : ["(none supplied)"],
    MEASUREMENT: {
      metric: pkg.objective.measurementTarget.metric,
      targetValue: pkg.objective.measurementTarget.targetValue,
      startingValue: pkg.objective.measurementTarget.startingValue ?? null,
      unit: pkg.objective.measurementTarget.unit || null,
      signals: pkg.measurementIntent.signals,
      notes: pkg.measurementIntent.notes || null
    },
    RESTRICTIONS: {
      approvalRequirements: pkg.executionIntent.approvalRequirements,
      timingPreference: pkg.executionIntent.timingPreference || null,
      restrictions: pkg.executionIntent.restrictions
    },
    DESTINATION: execution
      ? `${execution.platform} for client ${execution.clientId}`
      : "Not execution-ready. No platform destination was supplied.",
    POST_TYPE: execution?.postType || "not supplied",
    FINAL_CONTENT: execution?.message || null,
    MEDIA_LINK: {
      media: execution?.mediaReference || null,
      link: execution?.link || null,
      callToAction: execution?.callToAction || null
    },
    TIMING: execution
      ? execution.publishMode === "scheduled"
        ? `scheduled ${execution.scheduledAt}`
        : "now"
      : "not supplied",
    EXECUTION_READY: Boolean(execution)
  };
}

export function adapterHandoff(pkg: AcpPackage) {
  if (!pkg.execution) return null;
  return {
    clientId: pkg.execution.clientId,
    platform: pkg.execution.platform,
    postType: pkg.execution.postType,
    message: pkg.execution.message,
    mediaReference: pkg.execution.mediaReference || null,
    link: pkg.execution.link || null,
    callToAction: pkg.execution.callToAction || null,
    publishMode: pkg.execution.publishMode,
    scheduledAt: pkg.execution.scheduledAt || null,
    packageId: pkg.packageId,
    campaignName: pkg.campaignName,
    isTest: pkg.isTest === true,
    credentialBoundary:
      "No access tokens or API secrets. Future DGIX resolves an ADE-held connection from clientId + platform."
  };
}

export const ACP_TO_ADE_MAPPING = [
  {
    from: "DGIX execution",
    to: "Does not use Standard ADE Goal/Campaign/Source/Draft",
    note: "The Client QEN prepares final content. DGIX does not reconstruct the campaign in Standard ADE before execution."
  }
] as const;
