import Link from "next/link";

const STEPS = [
  { href: "/sources", label: "Source" },
  { href: "/create", label: "Draft" },
  { href: "/review", label: "Review" },
  { href: "/publishing", label: "Queue" }
] as const;

export function WorkflowStrip({ current }: { current: (typeof STEPS)[number]["label"] }) {
  return (
    <div className="workflow-strip" aria-label="ADE workflow">
      {STEPS.map((step, index) => (
        <span key={step.href} className={step.label === current ? "current" : undefined}>
          <Link href={step.href}>
            {index + 1}. {step.label}
          </Link>
        </span>
      ))}
    </div>
  );
}

export function Provenance({
  sourceId,
  sourceTitle,
  provenance,
  isTest
}: {
  sourceId?: number | null;
  sourceTitle?: string | null;
  provenance?: string | null;
  isTest?: number | boolean | null;
}) {
  return (
    <p className="muted">
      Provenance: source #{sourceId ?? "—"} — {sourceTitle || "(untitled)"}
      {provenance ? ` · ${provenance}` : ""}
      {isTest ? " · TEST DATA" : ""}
    </p>
  );
}
