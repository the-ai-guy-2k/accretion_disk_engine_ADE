import { FoundationStatus } from "@/components/FoundationStatus";
import { PRODUCT_NAME, PRODUCT_SHORT } from "@/lib/config";

const DASHBOARD_CARDS = [
  {
    title: "Active goals",
    body: "No goals stored. This card is a placeholder for later goal tracking."
  },
  {
    title: "Campaigns",
    body: "No campaigns stored. Campaign workflow is not implemented in this foundation."
  },
  {
    title: "Pending approvals",
    body: "No approval queue. Human review is not implemented yet."
  },
  {
    title: "Publishing status",
    body: "No publications. Scheduling and publishing are out of scope for ACI-002."
  },
  {
    title: "Recent performance",
    body: "No metrics. This is not live analytics."
  },
  {
    title: "Audience Network",
    body: "No audience events recorded."
  },
  {
    title: "ADE recommendations",
    body: "No recommendations. Intelligence is not implemented yet."
  }
];

export default function DashboardPage() {
  return (
    <section>
      <h1>{PRODUCT_NAME}</h1>
      <p className="lede">
        <strong>{PRODUCT_SHORT}</strong> is an early localhost MVP foundation.
        The Hub frame is real. The cards below are placeholders and do not
        represent live TAIG results.
      </p>
      <p className="lede">
        Operator loop: <strong>Goals → Decisions → Results</strong>
      </p>
      <FoundationStatus />
      <div className="grid" style={{ marginTop: "1rem" }}>
        {DASHBOARD_CARDS.map((card) => (
          <article className="card" key={card.title}>
            <p className="placeholder-flag">Placeholder</p>
            <h2>{card.title}</h2>
            <p className="muted">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
