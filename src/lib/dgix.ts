/** DGIX workspace orientation, ACP intake, and Operator authorization status. */

export const DGIX_SHORT = "DGIX";
export const DGIX_FULL = "Distribution, Growth & Intelligence Exchange";
export const DGIX_STATUS = "POST-MVP — IN DEVELOPMENT";

export const DGIX_CONCEPT =
  "The Client QEN prepares an execution-ready Campaign Package. DGIX validates it, the Operator reviews exactly what will be sent and authorizes or rejects it, and a future platform adapter will execute and measure. DGIX does not regenerate the post and does not reconstruct the campaign as Standard ADE Goal, Campaign, Source, or Draft records.";

export const DGIX_FLOW = [
  {
    id: "campaign_package",
    label: "Campaign Package",
    availability: "implemented" as const,
    href: "/dgix#intake",
    note: "ACP v1 intake is implemented. Execution-ready packages carry publish-ready content. Import is not approval."
  },
  {
    id: "review",
    label: "Review",
    availability: "implemented" as const,
    href: "/dgix#intake",
    note: "DGIX Operator review of the imported ACP. The Operator sees destination, post type, final content, media/link, timing, objective, measurement, and provenance. ADE /review remains the Standard ADE engine."
  },
  {
    id: "approval",
    label: "Human Approval",
    availability: "implemented" as const,
    href: "/dgix#intake",
    note: "Operator Authorization is implemented. Authorization means DGIX may later execute through a configured adapter. It is not Facebook publishing."
  },
  {
    id: "distribution",
    label: "Distribution",
    availability: "not_implemented" as const,
    href: "/publishing",
    note: "Real platform distribution is not implemented. ADE's mock Facebook adapter is Standard ADE only and is not used as DGIX execution."
  },
  {
    id: "measurement",
    label: "Measurement",
    availability: "not_implemented" as const,
    href: "/publishing",
    note: "Platform-retrieved metrics are not implemented. ADE currently accepts manually entered results only."
  },
  {
    id: "intelligence",
    label: "Intelligence",
    availability: "ade_engine" as const,
    href: "/intelligence",
    note: "Uses existing ADE Intelligence (deterministic + live AI). Advisory, not a guarantee."
  },
  {
    id: "results_package",
    label: "Results Package",
    availability: "not_implemented" as const,
    href: null,
    note: "ACRP export is not implemented. This stage is orientation only."
  }
] as const;

export const DGIX_IMPLEMENTED_CAPABILITIES = [
  { name: "Campaign Package Intake", status: "IMPLEMENTED" },
  { name: "ACP Validation", status: "IMPLEMENTED" },
  { name: "Operator Review", status: "IMPLEMENTED" },
  { name: "Operator Authorization", status: "IMPLEMENTED" }
] as const;

export const DGIX_FUTURE_CAPABILITIES = [
  { name: "Facebook Account Connection", status: "NOT YET IMPLEMENTED" },
  { name: "Real Facebook Publishing", status: "NOT YET IMPLEMENTED" },
  { name: "Facebook Metrics Retrieval", status: "NOT YET IMPLEMENTED" },
  { name: "Results Package Export", status: "NOT YET IMPLEMENTED" },
  { name: "Distribution / Growth Optimization", status: "NOT YET IMPLEMENTED" }
] as const;

export const DGIX_PROVING_MISSION = {
  label: "TEST / DEMONSTRATION",
  business: "TAIG",
  platform: "Facebook",
  objective: "Generate 2 qualified TAIG client contacts through Facebook.",
  achieved: false,
  boundary:
    "This is the first intended DGIX proving mission. It is not achieved. ADE has not generated these contacts. These are not actual TAIG clients and not Facebook-collected results."
} as const;

export const DGIX_ORIENTATION = [
  {
    key: "OBJECTIVE",
    question: "What outcome are we trying to produce?",
    answer:
      "The proving mission objective is two qualified TAIG client contacts through Facebook. That outcome is not recorded as achieved."
  },
  {
    key: "INPUT",
    question: "What campaign/business intelligence was supplied?",
    answer:
      "ACP v1 intake is implemented. The Client QEN (or another producer) prepares the execution-ready package. Automatic Client QEN connectivity is not implemented."
  },
  {
    key: "DECISION",
    question: "What requires my approval?",
    answer:
      "The Operator reviews the final content and explicitly authorizes or rejects it. Import is not approval. Authorization is not Facebook publishing. DGIX does not ask the Operator to regenerate the post."
  },
  {
    key: "EXECUTION",
    question: "What approved activity is being distributed?",
    answer:
      "Facebook Account Connection and real Facebook publishing are not yet implemented. An authorized ACP stops at AUTHORIZED — PLATFORM EXECUTION NOT YET CONNECTED. The Standard ADE mock Facebook adapter is not DGIX real-platform execution."
  },
  {
    key: "RESULT",
    question: "What happened?",
    answer:
      "Facebook metric retrieval is not yet implemented. Operators can still enter results manually in ADE Publishing. Manual metrics are not platform-retrieved evidence."
  },
  {
    key: "INTELLIGENCE",
    question: "What did ADE learn?",
    answer:
      "Existing ADE Intelligence can interpret stored evidence. It must not invent contacts, clients, revenue, or Facebook attribution."
  },
  {
    key: "RETURN",
    question: "What evidence/intelligence needs to go back to the originating Client QEN?",
    answer:
      "Results Package export is not yet implemented. Nothing is automatically returned to a Client QEN."
  }
] as const;

export const ADE_ENGINE_LINKS = [
  { href: "/goals", label: "Goals" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/sources", label: "Sources" },
  { href: "/create", label: "Create / Drafts" },
  { href: "/review", label: "Review / Approval" },
  { href: "/publishing", label: "Publishing / Results" },
  { href: "/analytics", label: "Analytics" },
  { href: "/intelligence", label: "Intelligence" }
] as const;

export const DGIX_MISSION_MODEL = {
  table: "dgix_missions",
  related: "dgix_acp_intakes",
  schemaVersion: "7",
  purpose:
    "Persistence for an imported ACP, its review state, and Operator authorization. Goal/Campaign FKs remain unused. Authorization does not materialize Standard ADE records and does not call Facebook."
} as const;
