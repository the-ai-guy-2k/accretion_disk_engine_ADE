/** DGIX workspace orientation. No persistent Mission table in this ACI. */

export const DGIX_SHORT = "DGIX";
export const DGIX_FULL = "Distribution, Growth & Intelligence Exchange";
export const DGIX_STATUS = "POST-MVP — IN DEVELOPMENT";

export const DGIX_CONCEPT =
  "Structured campaign/business intelligence enters ADE. The Operator reviews and authorizes execution. ADE distributes approved content through connected social platforms. ADE retrieves and evaluates performance evidence. ADE produces structured results intelligence that can be returned to the originating Client QEN or other intelligence source.";

export const DGIX_FLOW = [
  {
    id: "campaign_package",
    label: "Campaign Package",
    availability: "not_implemented" as const,
    href: null,
    note: "ACP intake is not implemented. This stage is orientation only."
  },
  {
    id: "review",
    label: "Review",
    availability: "ade_engine" as const,
    href: "/review",
    note: "Uses the existing ADE Review screen. Not a second review engine."
  },
  {
    id: "approval",
    label: "Human Approval",
    availability: "ade_engine" as const,
    href: "/review",
    note: "Mandatory. AI cannot skip this. No autonomous DGIX publishing path."
  },
  {
    id: "distribution",
    label: "Distribution",
    availability: "not_implemented" as const,
    href: "/publishing",
    note: "Real platform distribution is not implemented. ADE currently has mock Facebook publishing only."
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

export const DGIX_FUTURE_CAPABILITIES = [
  { name: "Campaign Package Intake", status: "NOT YET IMPLEMENTED" },
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
      "Campaign Package intake is not yet implemented. No Client QEN artifact has been imported."
  },
  {
    key: "DECISION",
    question: "What requires my approval?",
    answer:
      "Any content ADE would execute still requires a human approve/reject on the existing Review screen. DGIX does not auto-publish."
  },
  {
    key: "EXECUTION",
    question: "What approved activity is being distributed?",
    answer:
      "Real Facebook distribution is not yet implemented. Approved items can still move through ADE's mock Facebook publishing workflow."
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

/**
 * Proposed later (not implemented): a `dgix_missions` row would bind a business
 * objective to optional ADE Goal/Campaign IDs plus future ACP/ACRP artifact refs.
 * ACI-DGIX-012 does not add this table.
 */
export const PROPOSED_DGIX_MISSION_MODEL = {
  table: "dgix_missions",
  schemaVersionWhenAdded: "later bounded ACI — not v5",
  fields: [
    "id",
    "title",
    "business_label",
    "platform",
    "objective",
    "status",
    "goal_id (nullable FK)",
    "campaign_id (nullable FK)",
    "is_test",
    "created_at",
    "notes"
  ]
} as const;
