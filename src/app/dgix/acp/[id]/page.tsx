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

  return (
    <section>
      <p className="placeholder-flag">ACP v{intake.acpVersion} · Operator review</p>
      <h1>{intake.campaignName}</h1>
      <p className="lede">
        {intake.isTest ? "TEST DATA. " : ""}
        This is an imported Campaign Package. It is not ADE-generated evidence and it is
        not a Facebook result.
      </p>
      <div className="banner">{intake.authorityNote}</div>

      <div className="grid" style={{ marginBottom: "1rem" }}>
        <article className="card">
          <h2>OBJECTIVE</h2>
          <p>
            <strong>What are we trying to accomplish?</strong>
          </p>
          <p>{view.OBJECTIVE}</p>
        </article>
        <article className="card">
          <h2>CAMPAIGN</h2>
          <p>
            <strong>What campaign is being proposed?</strong>
          </p>
          <p>{view.CAMPAIGN}</p>
          <p className="muted">Business: {intake.clientBusinessId}</p>
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
            <strong>What does the package propose publishing?</strong>
          </p>
          {view.CONTENT.map((post, index) => (
            <div key={`${post.title}-${index}`}>
              <p>
                <strong>{post.title}</strong>
              </p>
              <pre className="draft">{post.body}</pre>
              {post.mediaReferences.length ? (
                <ul className="evidence-list">
                  {post.mediaReferences.map((ref) => (
                    <li key={ref.value}>
                      {ref.kind}: {ref.value}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </article>
        <article className="card">
          <h2>SOURCE</h2>
          <p>
            <strong>Where did this intelligence/content come from?</strong>
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
          <h2>MEASUREMENT</h2>
          <p>
            <strong>How will success be evaluated?</strong>
          </p>
          <p>
            {view.MEASUREMENT.metric}: target {view.MEASUREMENT.targetValue}
            {view.MEASUREMENT.startingValue != null
              ? ` (starting ${view.MEASUREMENT.startingValue})`
              : ""}
            {view.MEASUREMENT.unit ? ` ${view.MEASUREMENT.unit}` : ""}
          </p>
          <p className="muted">Signals: {view.MEASUREMENT.signals.join(", ")}</p>
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
      </div>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Provenance</h2>
        <p>
          Package {intake.packageId} · ACP v{intake.acpVersion} · originated by{" "}
          {intake.originatingSystem} · created {intake.packageCreatedAt} · imported{" "}
          {intake.importedAt}
        </p>
        <p className="muted">
          Review state: {String(intake.reviewState).replaceAll("_", " ")} · execution
          authorized: {intake.executionAuthorized ? "yes" : "no"} · ADE Goal/Campaign/Draft
          created: {intake.materializedIntoAde ? "yes" : "no"}
        </p>
      </div>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Existing ADE mapping (not performed)</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ACP</th>
              <th>ADE concept</th>
              <th>This ACI</th>
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

      <AcpReviewActions intakeId={Number(intake.id)} />
      <p className="next-step">
        <Link href="/dgix">Back to DGIX</Link>
        {" · "}
        <Link href="/review">ADE Review (separate)</Link>
      </p>
    </section>
  );
}
