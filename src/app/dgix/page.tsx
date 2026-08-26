import Link from "next/link";
import { DgixFacebookConnectionPanel } from "@/components/DgixFacebookConnectionPanel";
import { DgixIntakePanel } from "@/components/DgixIntakePanel";
import {
  ADE_ENGINE_LINKS,
  DGIX_CONCEPT,
  DGIX_FLOW,
  DGIX_FULL,
  DGIX_FUTURE_CAPABILITIES,
  DGIX_IMPLEMENTED_CAPABILITIES,
  DGIX_MISSION_MODEL,
  DGIX_ORIENTATION,
  DGIX_PROVING_MISSION,
  DGIX_SHORT,
  DGIX_STATUS
} from "@/lib/dgix";
import { PRODUCT_SHORT } from "@/lib/config";

function availabilityLabel(availability: (typeof DGIX_FLOW)[number]["availability"]) {
  if (availability === "implemented") return "IMPLEMENTED";
  if (availability === "ade_engine") return "ADE engine available";
  return "NOT YET IMPLEMENTED";
}

export default function DgixWorkspacePage() {
  return (
    <section>
      <p className="placeholder-flag">{DGIX_STATUS}</p>
      <h1>{DGIX_SHORT} workspace</h1>
      <p className="lede">
        <strong>
          {DGIX_FULL} ({DGIX_SHORT})
        </strong>{" "}
        is a specialized operating workspace inside {PRODUCT_SHORT}. It is not a
        separate application. {DGIX_CONCEPT}
      </p>

      <div className="banner">
        DGIX is post-MVP and in development. Campaign Package Intake, ACP
        Validation, Operator Review, Operator Authorization, Facebook Account
        Connection, and the Organic Facebook Execution Adapter are implemented.
        Real Facebook publishing is implemented but real validation is pending
        until Operator-supplied Meta credentials/assets succeed. Paid advertising
        execution, metrics retrieval, and Results Package export remain{" "}
        <strong>NOT YET IMPLEMENTED</strong>. Authorization is not publishing.
      </div>

      <div className="workflow-strip" aria-label="DGIX operating flow">
        {DGIX_FLOW.map((step, index) => (
          <span
            key={step.id}
            className={
              step.availability === "not_implemented" ? "flow-future" : "flow-engine"
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
        Client QEN → Execution-Ready ACP → DGIX Validation → Operator Review →
        Operator Authorization → Facebook Organic Adapter → Meta Graph API.
        Human Approval is Operator Authorization. Organic distribution can execute
        when authorized; paid advertising remains NOT YET IMPLEMENTED.
      </p>

      <DgixIntakePanel />

      <DgixFacebookConnectionPanel />

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
                      step.availability === "not_implemented" ? "status-nyet" : "status-ok"
                    }
                  >
                    {availabilityLabel(step.availability)}
                  </span>
                </td>
                <td className="muted">
                  {step.note}{" "}
                  {step.href ? <Link href={step.href}>Open</Link> : null}
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
        <p className="status-nyet">
          Not achieved. No contacts, clients, or Facebook results are recorded here.
        </p>
      </div>

      <h2>Operator orientation</h2>
      <div className="grid" style={{ marginBottom: "1rem" }}>
        {DGIX_ORIENTATION.map((item) => (
          <article className="card" key={item.key}>
            <h2>{item.key}</h2>
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
            The Client QEN prepares. The Operator authorizes. An authorized organic
            Facebook ACP can be executed through the Facebook Organic Adapter when
            a valid Page connection exists. Paid advertising and Results Package
            return are not yet implemented. DGIX does not reconstruct the campaign
            in Standard ADE.
          </p>
        </article>
      </div>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Existing ADE engine (reused, not duplicated)</h2>
        <p className="muted">
          DGIX Workspace → Existing ADE Engine → future artifact and platform
          interfaces. ACP import does not silently create Goals, Campaigns,
          Sources, or Drafts.
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
        <h2>DGIX capability status</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Capability</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {DGIX_IMPLEMENTED_CAPABILITIES.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td
                  className={
                    item.status === "IMPLEMENTED BUT REAL VALIDATION PENDING"
                      ? "status-nyet"
                      : "status-ok"
                  }
                >
                  {item.status}
                </td>
              </tr>
            ))}
            {DGIX_FUTURE_CAPABILITIES.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td className="status-nyet">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          Disabled surfaces below do not perform Facebook or Results Package work.
        </p>
        <div className="actions">
          {DGIX_FUTURE_CAPABILITIES.map((item) => (
            <button key={item.name} type="button" disabled>
              {item.name} — {item.status}
            </button>
          ))}
        </div>
      </div>

      <div className="split" style={{ marginBottom: "1rem" }}>
        <article className="panel">
          <h2>Client QEN boundary</h2>
          <p>
            Working now: Client QEN (or another producer) → execution-ready ACP →
            DGIX validation → Operator review → Operator authorization.
          </p>
          <p className="muted">
            Automatic Client QEN connectivity and Results Package export are not
            implemented. The Client QEN remains responsible for client/business
            intelligence. ADE remains responsible for social execution,
            measurement, and social-performance intelligence.
          </p>
        </article>
        <article className="panel">
          <h2>Human authority</h2>
          <p>
            Client QEN prepares → Operator authorizes → Operator may execute an
            authorized organic Facebook ACP through the connected adapter. Importing
            a package does not approve it. Authorizing it does not publish it.
            Publishing requires a separate execute action and a successful Meta
            object id.
          </p>
          <p>
            <Link href="/review">Open ADE Review / Approval</Link>
          </p>
        </article>
      </div>

      <div className="panel">
        <h2>DGIX Mission (persistence)</h2>
        <p>
          A DGIX Mission is a Business Objective + Campaign Package + ADE
          Execution + Platform Evidence + Results Package. This ACI persists the
          Mission far enough to hold an imported ACP, its review/authorization
          state, a Facebook connection snapshot, and organic execution attempts.
        </p>
        <p className="muted">
          Schema v{DGIX_MISSION_MODEL.schemaVersion} tables{" "}
          <code>{DGIX_MISSION_MODEL.table}</code> and{" "}
          <code>{DGIX_MISSION_MODEL.related}</code>. {DGIX_MISSION_MODEL.purpose}
        </p>
      </div>
    </section>
  );
}
