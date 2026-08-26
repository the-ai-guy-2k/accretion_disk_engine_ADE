import type { ReactNode } from "react";
import Link from "next/link";

export const JOURNEY = [
  { href: "/goals", label: "Goal" },
  { href: "/campaigns", label: "Campaign" },
  { href: "/sources", label: "Source" },
  { href: "/create", label: "Draft" },
  { href: "/review", label: "Review" },
  { href: "/publishing", label: "Publishing" },
  { href: "/analytics", label: "Results" },
  { href: "/intelligence", label: "Intelligence" }
] as const;

export type JourneyLabel = (typeof JOURNEY)[number]["label"];

export function JourneyStrip({ current }: { current?: JourneyLabel }) {
  return (
    <div className="workflow-strip" aria-label="ADE operator journey">
      {JOURNEY.map((step, index) => (
        <span key={step.href} className={step.label === current ? "current" : undefined}>
          <Link href={step.href}>
            {index + 1}. {step.label}
          </Link>
        </span>
      ))}
    </div>
  );
}

/** @deprecated Use JourneyStrip. Kept so existing pages can migrate without a redesign. */
export function WorkflowStrip({
  current
}: {
  current: "Source" | "Draft" | "Review" | "Queue";
}) {
  const mapped: JourneyLabel =
    current === "Queue" ? "Publishing" : current === "Source" ? "Source" : current === "Draft" ? "Draft" : "Review";
  return <JourneyStrip current={mapped} />;
}

/** @deprecated Use JourneyStrip. */
export function LoopStrip({
  current
}: {
  current: "Goals" | "Campaigns" | "Decisions" | "Results";
}) {
  const mapped: JourneyLabel =
    current === "Goals"
      ? "Goal"
      : current === "Campaigns"
        ? "Campaign"
        : current === "Decisions"
          ? "Review"
          : "Results";
  return <JourneyStrip current={mapped} />;
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
      From source{sourceId ? ` #${sourceId}` : ""}: {sourceTitle || "(untitled)"}
      {isTest ? " · TEST DATA" : ""}
      {provenance ? ` · ${provenance}` : ""}
    </p>
  );
}

export function NextStep({ href, children }: { href: string; children: ReactNode }) {
  return (
    <p className="next-step">
      Next: <Link href={href}>{children}</Link>
    </p>
  );
}
