"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FoundationStatus } from "@/components/FoundationStatus";
import { WorkflowStrip } from "@/components/WorkflowStrip";
import { PRODUCT_NAME, PRODUCT_SHORT } from "@/lib/config";

type Summary = {
  sources: number;
  drafts: number;
  pendingReview: number;
  approved: number;
  queue: { PENDING: number; READY: number; PUBLISHED: number; FAILED: number };
  adapter: { id: string; isMock: boolean; label: string };
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/workflow/summary")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setSummary(data.summary);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section>
      <WorkflowStrip current="Source" />
      <h1>{PRODUCT_NAME}</h1>
      <p className="lede">
        <strong>{PRODUCT_SHORT}</strong> localhost vertical slice: Source → Draft →
        Review → Publishing queue. Operator loop:{" "}
        <strong>Goals → Decisions → Results</strong>
      </p>
      <FoundationStatus />
      <div className="grid" style={{ marginTop: "1rem" }}>
        <article className="card">
          <h2>Sources</h2>
          <p>{summary ? `${summary.sources} stored` : "Loading…"}</p>
          <Link href="/sources">Open sources</Link>
        </article>
        <article className="card">
          <h2>Pending decisions</h2>
          <p>{summary ? `${summary.pendingReview} draft/rejected items` : "Loading…"}</p>
          <Link href="/review">Open review</Link>
        </article>
        <article className="card">
          <h2>Publishing queue</h2>
          <p>
            {summary
              ? `PENDING ${summary.queue.PENDING} · READY ${summary.queue.READY} · PUBLISHED ${summary.queue.PUBLISHED} · FAILED ${summary.queue.FAILED}`
              : "Loading…"}
          </p>
          <Link href="/publishing">Open queue</Link>
        </article>
        <article className="card">
          <p className="placeholder-flag">Mock adapter</p>
          <h2>Facebook Channel 01</h2>
          <p className="muted">
            {summary?.adapter.label || "Manual / mock Facebook adapter"}. Not live Meta publishing.
          </p>
        </article>
        <article className="card">
          <p className="placeholder-flag">Placeholder</p>
          <h2>Audience / leads / intelligence</h2>
          <p className="muted">Not part of ACI-004. No fabricated metrics.</p>
        </article>
      </div>
    </section>
  );
}
