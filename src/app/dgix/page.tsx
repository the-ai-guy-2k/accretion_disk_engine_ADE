import Link from "next/link";
import {
  ADE_ENGINE_LINKS,
  DGIX_CONCEPT,
  DGIX_FLOW,
  DGIX_FULL,
  DGIX_FUTURE_CAPABILITIES,
  DGIX_ORIENTATION,
  DGIX_PROVING_MISSION,
  DGIX_SHORT,
  DGIX_STATUS,
  PROPOSED_DGIX_MISSION_MODEL
} from "@/lib/dgix";
import { PRODUCT_SHORT } from "@/lib/config";

function availabilityLabel(availability: (typeof DGIX_FLOW)[number]["availability"]) {
  if (availability === "ade_engine") return "ADE engine available";
  return "NOT YET IMPLEMENTED";
}

export default function DgixWorkspacePage() {
  return (
    <section>
      <p className="placeholder-flag">{DGIX_STATUS}</p>
      <h1>
        {DGIX_SHORT} workspace
      </h1>
      <p className="lede">
        <strong>
          {DGIX_FULL} ({DGIX_SHORT})
        </strong>{" "}
        is a specialized operating workspace inside {PRODUCT_SHORT}. It is not a
        separate application. {DGIX_CONCEPT}
      </p>

      <div className="banner">
        DGIX is post-MVP and in development. Unimplemented stages are labeled{" "}
        <strong>NOT YET IMPLEMENTED</strong>. Do not treat this workspace as a
        complete distribution or Client QEN exchange product.
      </div>

      <div className="workflow-strip" aria-label="DGIX operating flow">
        {DGIX_FLOW.map((step, index) => (
          <span
            key={step.id}
            className={
              step.availability === "ade_engine" ? "flow-engine" : "flow-future"
            }
          >
            {step.href ? (
              <Link href={step.href}>
                {index + 1}. {step.label}
              </Link>
            ) : (
              <>
                {index + 1}. {step.label}
              </>
            )}
          </span>
        ))}
      </div>
      <p className="muted" style={{ marginTop: "-0.4rem", marginBottom: "1rem" }}>
        Campaign Package → Review → Human Approval → Distribution → Measurement →
        Intelligence → Results Package
      </p>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <h2>DGIX operating flow</h2>
        <p className="muted">
          This is the primary DGIX operating model. Stages that reuse ADE are
          links into the existing Hub. Stages that are not built are not
          presented as working controls.
        </p>
        <table className="table">
          <thead>
            <tr>
              <th>Stage</th>
              <th>Status</th>
              <th>Truth</th>
            </tr>
          </thead>
          <tbody>
            {DGIX_FLOW.map((step) => (
              <tr key={step.id}>
                <td>{step.label}</td>
                <td>
                  <span
                    className={
                      step.availability === "ade_engine"
                        ? "status-ok"
                        : "status-nyet"
                    }
                  >
                    {availabilityLabel(step.availability)}
                  </span>
                </td>
                <td className="muted">
                  {step.note}{" "}
                  {step.href ? <Link href={step.href}>Open in ADE</Link> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <h2>First proving mission</h2>
        <p className="placeholder-flag">{DGIX_PROVING_MISSION.label}</p>
        <p>
          <strong>Business:</strong> {DGIX_PROVING_MISSION.business}
          {" · "}
          <strong>Platform:</strong> {DGIX_PROVING_MISSION.platform}
        </p>
        <p>
          <strong>Objective:</strong> {DGIX_PROVING_MISSION.objective}
        </p>
        <p className="muted">{DGIX_PROVING_MISSION.boundary}</p>
        <p className="status-nyet">Not achieved. No contacts, clients, or Facebook results are recorded here.</p>
      </div>

      <h2>Operator orientation</h2>
      <div className="grid" style={{ marginBottom: "1rem" }}>
        {DGIX_ORIENTATION.map((item) => (
          <article className="card" key={item.key}>
            <h2>
              {item.key}
            </h2>
            <p>
              <strong>{item.question}</strong>
            </p>
            <p className="muted">{item.answer}</p>
          </article>
        ))}
      </div>

      <div className="split" style={{ marginBottom: "1rem" }}>
        <article className="panel">
          <h2>Standard ADE</h2>
          <p>
            The Operator directly creates and manages Goals, Campaigns, Sources,
            content, approvals, results, and intelligence.
          </p>
          <p className="muted">
            Standard ADE continues independently of DGIX. Use the Hub journey
            for that work.
          </p>
          <p>
            <Link href="/">Open Hub</Link>
          </p>
        </article>
        <article className="panel">
          <h2>DGIX</h2>
          <p>
            The Operator works from structured campaign/business intelligence,
            uses ADE to execute the approved social workflow, receives platform
            evidence, and returns structured results intelligence to the
            originating Client QEN/system.
          </p>
          <p className="muted">
            Intake, real Facebook, and Results Package return are not yet
            implemented. Both modes use the same ADE engine.
          </p>
        </article>
      </div>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Existing ADE engine (reused, not duplicated)</h2>
        <p className="muted">
          DGIX Workspace → Existing ADE Engine → future artifact and platform
          interfaces. Do not recreate Goals, Campaigns, Sources, Drafts, Review,
          Publishing, Results, or Intelligence inside DGIX.
        </p>
        <p>
          {ADE_ENGINE_LINKS.map((item, index) => (
            <span key={item.href}>
              {index ? " · " : ""}
              <Link href={item.href}>{item.label}</Link>
            </span>
          ))}
        </p>
      </div>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Future DGIX capability status</h2>
        <p className="muted">
          Disabled surfaces explain the workflow. They do not perform the work.
        </p>
        <table className="table">
          <thead>
            <tr>
              <th>Capability</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {DGIX_FUTURE_CAPABILITIES.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td className="status-nyet">{item.status}</td>
                <td>
                  <button type="button" disabled>
                    {item.name} — {item.status}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="split" style={{ marginBottom: "1rem" }}>
        <article className="panel">
          <h2>Client QEN boundary</h2>
          <p>
            Architecturally intended later: Client QEN → ADE Campaign Package →
            DGIX, then DGIX → ADE Campaign Results Package → Operator → Client
            QEN.
          </p>
          <p className="muted">
            Artifact ingestion and export are not implemented in this ACI. The
            Client QEN remains responsible for client/business intelligence. ADE
            remains responsible for social execution, measurement, and
            social-performance intelligence.
          </p>
        </article>
        <article className="panel">
          <h2>Human authority</h2>
          <p>
            AI assists → Human decides → ADE executes. DGIX does not introduce
            an autonomous publishing path. Future Campaign Packages must still
            pass through human approval before external execution.
          </p>
          <p>
            <Link href="/review">Open Review / Approval</Link>
          </p>
        </article>
      </div>

      <div className="panel">
        <h2>DGIX Mission (concept)</h2>
        <p>
          A DGIX Mission is a Business Objective + Campaign Package + ADE
          Execution + Platform Evidence + Results Package. This ACI establishes
          the workspace and operating concept only.
        </p>
        <p className="muted">
          No persistent Mission table was added. Proposed later table{" "}
          <code>{PROPOSED_DGIX_MISSION_MODEL.table}</code> (
          {PROPOSED_DGIX_MISSION_MODEL.schemaVersionWhenAdded}):{" "}
          {PROPOSED_DGIX_MISSION_MODEL.fields.join(", ")}.
        </p>
      </div>
    </section>
  );
}
