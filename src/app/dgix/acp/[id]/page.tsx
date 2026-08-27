import Link from "next/link";
import { notFound } from "next/navigation";
import { AcpReviewActions } from "@/components/AcpReviewActions";
import { getAcpIntake } from "@/lib/dgix-intake";

export default async function AcpReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) notFound();

  let intake;
  try {
    intake = getAcpIntake(numericId);
  } catch {
    notFound();
  }

  const view = intake.review;
  const media = view.MEDIA_LINK;

  return (
    <section>
      <p className="placeholder-flag">ACP v{intake.acpVersion} · Operator review</p>
      <h1>{intake.campaignName}</h1>
      <p className="lede">
        {intake.isTest ? "TEST DATA. " : ""}
        This Campaign Package is already prepared. DGIX will not regenerate the post.
        The Operator reviews exactly what would be sent, then authorizes or rejects it.
      </p>
      <div className="banner">{intake.authorityNote}</div>
      <p className={intake.executionStatus === "executed" ? "status-ok" : intake.executionStatus === "execution_failed" ? "error" : intake.executionAuthorized ? "status-ok" : "muted"}>
        State: {intake.reviewStateLabel}
        {intake.decisionBy ? ` · decided by ${intake.decisionBy}` : ""}
        {intake.decisionAt ? ` at ${intake.decisionAt}` : ""}
      </p>

      {!intake.executionReady ? (
        <div className="banner">
          Legacy ACP (ACI-DGIX-013 profile). Record and intelligence fields are preserved.
          This package cannot be authorized until an execution-ready ACP is imported.
        </div>
      ) : (
        <p className="status-ok">
          EXECUTION-READY. The Client QEN already prepared the final content. DGIX is not
          asking the Operator to rewrite it.
        </p>
      )}

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Intended execution</h2>
        <p className="muted">
          The Operator reviews these fields before authorization. DGIX does not
          rewrite them. Authorization is not publishing.
        </p>
        <table className="table">
          <tbody>
            <tr>
              <th>Client</th>
              <td>{view.CLIENT}</td>
            </tr>
            <tr>
              <th>Platform</th>
              <td>{view.PLATFORM}</td>
            </tr>
            <tr>
              <th>Distribution</th>
              <td>{view.DISTRIBUTION_TYPE}</td>
            </tr>
            <tr>
              <th>Destination</th>
              <td>{view.DESTINATION}</td>
            </tr>
            <tr>
              <th>Publish timing</th>
              <td>{view.TIMING}</td>
            </tr>
          </tbody>
        </table>
        {intake.facebookRouting ? (
          <p className={intake.facebookRouting.ready ? "status-ok" : "status-nyet"}>
            Routing: {intake.facebookRouting.adapter || "none"} ·{" "}
            {intake.facebookRouting.distributionType || view.DISTRIBUTION_TYPE}
            {intake.facebookRouting.ready
              ? " · organic Facebook Page path is selected"
              : ` · ${intake.facebookRouting.reason}`}
            {intake.facebookRouting.executed ? " · already executed" : " · not executed yet"}
          </p>
        ) : null}
      </div>

      <div className="grid" style={{ marginBottom: "1rem" }}>
        <article className="card">
          <h2>DESTINATION</h2>
          <p>
            <strong>Where is this intended to go?</strong>
          </p>
          <p>{view.DESTINATION}</p>
        </article>
        <article className="card">
          <h2>POST TYPE</h2>
          <p>
            <strong>What kind of social content is being executed?</strong>
          </p>
          <p>{view.POST_TYPE}</p>
        </article>
        <article className="card">
          <h2>FINAL CONTENT</h2>
          <p>
            <strong>Exactly what will be sent.</strong>
          </p>
          {view.FINAL_CONTENT ? (
            <pre className="draft">{view.FINAL_CONTENT}</pre>
          ) : (
            <p className="muted">No execution message was supplied (legacy package).</p>
          )}
        </article>
        <article className="card">
          <h2>MEDIA / LINK</h2>
          <p>
            <strong>What external content accompanies it.</strong>
          </p>
          <p>{media.media ? `${media.media.kind}: ${media.media.value}` : "No media reference."}</p>
          <p>{media.link ? `Link: ${media.link}` : "No link."}</p>
          <p>{media.callToAction ? `CTA: ${media.callToAction}` : "No CTA."}</p>
        </article>
        <article className="card">
          <h2>TIMING</h2>
          <p>
            <strong>Now or scheduled.</strong>
          </p>
          <p>{view.TIMING}</p>
        </article>
        <article className="card">
          <h2>OBJECTIVE</h2>
          <p>
            <strong>Why are we doing this?</strong>
          </p>
          <p>{view.OBJECTIVE}</p>
          <p className="muted">Campaign: {view.CAMPAIGN}</p>
        </article>
        <article className="card">
          <h2>MEASUREMENT</h2>
          <p>
            <strong>What outcome matters.</strong>
          </p>
          <p>
            {view.MEASUREMENT.metric}: target {view.MEASUREMENT.targetValue}
            {view.MEASUREMENT.startingValue != null
              ? ` (starting ${view.MEASUREMENT.startingValue})`
              : ""}
            {view.MEASUREMENT.unit ? ` ${view.MEASUREMENT.unit}` : ""}
          </p>
          <p className="muted">Signals: {view.MEASUREMENT.signals.join(", ")}</p>
          <p className="muted">This target is intent, not an achieved result.</p>
        </article>
        <article className="card">
          <h2>PROVENANCE / SOURCE</h2>
          <p>
            <strong>Who/what prepared the package.</strong>
          </p>
          <p>{view.SOURCE.originatingIntelligenceSource}</p>
          <ul className="evidence-list">
            {view.SOURCE.sourceEvidence.map((item, index) => (
              <li key={`${item.title || item.reference}-${index}`}>
                {item.title || "Evidence"} {item.reference ? `· ${item.reference}` : ""}
                {item.notes ? ` — ${item.notes}` : ""}
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h2>AUDIENCE</h2>
          <p>
            <strong>Who is it intended for?</strong>
          </p>
          <p>{view.AUDIENCE}</p>
        </article>
        <article className="card">
          <h2>CONTENT</h2>
          <p>
            <strong>Record copy carried with the package (not regenerated by DGIX).</strong>
          </p>
          {view.CONTENT.map((post, index) => (
            <div key={`${post.title}-${index}`}>
              <p>
                <strong>{post.title}</strong>
              </p>
              <pre className="draft">{post.body}</pre>
            </div>
          ))}
        </article>
        <article className="card">
          <h2>CTA</h2>
          <p>
            <strong>What action are we asking the audience to take?</strong>
          </p>
          <ul className="evidence-list">
            {view.CTA.map((cta) => (
              <li key={cta}>{cta}</li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h2>RESTRICTIONS</h2>
          <p>
            <strong>What constraints came with the package?</strong>
          </p>
          <p>Approval: {view.RESTRICTIONS.approvalRequirements}</p>
          {view.RESTRICTIONS.timingPreference ? (
            <p className="muted">{view.RESTRICTIONS.timingPreference}</p>
          ) : null}
          <ul className="evidence-list">
            {view.RESTRICTIONS.restrictions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h2>CAMPAIGN</h2>
          <p>
            <strong>What campaign is being proposed?</strong>
          </p>
          <p>{view.CAMPAIGN}</p>
          <p className="muted">Business: {intake.clientBusinessId}</p>
        </article>
      </div>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Provenance record</h2>
        <p>
          Package {intake.packageId} · ACP v{intake.acpVersion} · originated by{" "}
          {intake.originatingSystem} · client {intake.clientBusinessId} · created{" "}
          {intake.packageCreatedAt} · imported {intake.importedAt}
        </p>
        <p className="muted">
          Review state: {intake.reviewStateLabel} · execution authorized:{" "}
          {intake.executionAuthorized ? "yes" : "no"} · ADE Goal/Campaign/Draft created:{" "}
          {intake.materializedIntoAde ? "yes" : "no"}
          {intake.executionStatus ? ` · ${intake.executionStatus}` : ""}
        </p>
      </div>

      {intake.platformHandoff ? (
        <div className="panel" style={{ marginBottom: "1rem" }}>
          <h2>Adapter handoff (ACP contract, not Meta secrets)</h2>
          <p className="muted">
            AUTHORIZED ACP → DGIX → Facebook Organic Adapter → Meta Graph API → Facebook
            Page. DGIX does not rewrite ACP content. Credentials stay on the server.
          </p>
          <pre className="draft">{JSON.stringify(intake.platformHandoff, null, 2)}</pre>
        </div>
      ) : null}

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Standard ADE vs DGIX</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Boundary</th>
              <th>This package</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {intake.mapping.map((row) => (
              <tr key={row.from}>
                <td>{row.from}</td>
                <td>{row.to}</td>
                <td className="muted">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {intake.latestExecution ? (
        <div className="panel" style={{ marginBottom: "1rem" }}>
          <h2>Facebook execution record</h2>
          <p>
            Status: {intake.latestExecution.status}
            {intake.latestExecution.externalObjectId
              ? ` · Facebook object ${intake.latestExecution.externalObjectId}`
              : ""}
          </p>
          <p className="muted">
            Adapter {intake.latestExecution.adapterId} · {intake.latestExecution.operation} ·
            Graph {intake.latestExecution.graphApiVersion}
            {intake.latestExecution.pageId ? ` · Page ${intake.latestExecution.pageId}` : ""}
            {intake.latestExecution.completedAt
              ? ` · ${intake.latestExecution.completedAt}`
              : ` · attempted ${intake.latestExecution.attemptedAt}`}
          </p>
          {intake.latestExecution.sanitizedError ? (
            <p className="error">{intake.latestExecution.sanitizedError}</p>
          ) : null}
        </div>
      ) : null}

      <AcpReviewActions
        intakeId={Number(intake.id)}
        executionReady={intake.executionReady}
        reviewState={String(intake.reviewState)}
        executionAuthorized={intake.executionAuthorized}
        executionStatus={intake.executionStatus ? String(intake.executionStatus) : null}
        reviewStateLabel={String(intake.reviewStateLabel)}
        canExecuteOrganic={Boolean(intake.canExecuteOrganic)}
        latestExecution={intake.latestExecution}
        distributionType={intake.package.execution?.distributionType || null}
      />
      <p className="next-step">
        <Link href="/dgix">Back to DGIX</Link>
        {" · "}
        <Link href="/review">ADE Review (Standard ADE, separate)</Link>
      </p>
    </section>
  );
}
