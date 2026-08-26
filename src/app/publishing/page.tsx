"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { JourneyStrip, Provenance } from "@/components/WorkflowStrip";
import { MOCK_FACEBOOK_BANNER } from "@/lib/channel-adapter";
import { publicationStatusLabel } from "@/lib/labels";

type Publication = {
  id: number;
  status: string;
  content_id: number;
  content_title: string;
  content_status: string;
  source_id: number;
  source_title: string;
  source_provenance: string;
  source_is_test: number;
  goal_id: number | null;
  goal_title: string | null;
  is_mock: number;
  adapter_id: string;
  failure_reason: string | null;
  external_post_id: string | null;
  published_at: string | null;
};

export default function PublishingPage() {
  const [items, setItems] = useState<Publication[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resultFor, setResultFor] = useState<number | null>(null);
  const [metricLabels, setMetricLabels] = useState<Record<string, string>>({});
  const [resultForm, setResultForm] = useState<Record<string, string>>({});

  async function load() {
    const [res, goalRes] = await Promise.all([fetch("/api/publications"), fetch("/api/goals")]);
    const data = await res.json();
    const goalData = await goalRes.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setItems(data.publications);
    if (goalData.ok) setMetricLabels(goalData.metricLabels || {});
    setError("");
  }

  async function saveResults() {
    if (resultFor == null) return;
    const metrics: Record<string, number> = {};
    for (const [key, value] of Object.entries(resultForm)) {
      if (value === "") continue;
      metrics[key] = Number(value);
    }
    const res = await fetch(`/api/publications/${resultFor}/results`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metrics, capture_method: "manual", is_test: true })
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setNotice(
      `${data.banner || `Manual results saved for publication #${resultFor}.`} Next: open Intelligence for a recommendation.`
    );
    setResultFor(null);
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: number, action: string) {
    const res = await fetch(`/api/publications/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        reason: action === "fail" ? "Simulated mock publish failure. Facebook was not contacted." : undefined
      })
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setNotice(data.adapter?.message || `Updated publication #${id} (${action}).`);
    await load();
  }

  return (
    <section>
      <JourneyStrip current="Publishing" />
      <h1>Publishing</h1>
      <p className="lede">
        Approved content only. This queue uses a mock Facebook adapter. It does not
        publish to a real Facebook page.
      </p>
      <div className="banner">{MOCK_FACEBOOK_BANNER}</div>
      {error ? <p className="error">{error}</p> : null}
      {notice ? (
        <p className="status-ok">
          {notice} {notice.toLowerCase().includes("intelligence") ? <Link href="/intelligence">Open Intelligence</Link> : null}
        </p>
      ) : null}
      <div className="panel">
        <h2>Queue</h2>
        {items.length === 0 ? (
          <p className="muted">Queue empty. Approve a draft in Review first.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>State</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    #{item.id} {item.content_title}
                    <Provenance
                      sourceId={item.source_id}
                      sourceTitle={item.source_title}
                      provenance={item.source_provenance}
                      isTest={item.source_is_test}
                    />
                    {item.goal_id ? (
                      <p className="muted">
                        Goal #{item.goal_id} {item.goal_title}
                      </p>
                    ) : null}
                    <p className="muted">
                      Mock Facebook adapter
                      {item.external_post_id ? ` · id ${item.external_post_id}` : ""}
                      {item.failure_reason ? ` · ${item.failure_reason}` : ""}
                    </p>
                  </td>
                  <td>
                    <strong>{publicationStatusLabel(item.status)}</strong>
                    {item.status === "PUBLISHED" ? (
                      <p className="muted">Recorded {item.published_at}. Not a live Facebook post.</p>
                    ) : null}
                  </td>
                  <td>
                    <div className="actions">
                      {item.status === "PENDING" ? (
                        <>
                          <button className="primary" type="button" onClick={() => void act(item.id, "hand_to_adapter")}>
                            Hand to mock Facebook
                          </button>
                          <button className="danger" type="button" onClick={() => void act(item.id, "fail")}>
                            Simulate failure
                          </button>
                        </>
                      ) : null}
                      {item.status === "READY" ? (
                        <>
                          <button className="primary" type="button" onClick={() => void act(item.id, "confirm")}>
                            Confirm mock publish
                          </button>
                          <button className="danger" type="button" onClick={() => void act(item.id, "fail")}>
                            Simulate failure
                          </button>
                        </>
                      ) : null}
                      {item.status === "FAILED" ? (
                        <button type="button" onClick={() => void act(item.id, "retry")}>
                          Retry (back to PENDING)
                        </button>
                      ) : null}
                      {item.status === "PUBLISHED" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setResultFor(item.id);
                            setResultForm({});
                          }}
                        >
                          Enter results
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {resultFor ? (
        <div className="panel" style={{ marginTop: "1rem" }}>
          <h2>Manual results for publication #{resultFor}</h2>
          <p className="muted">
            Manually entered metrics. ADE has not collected these from Facebook or any
            other platform. Leave a field blank to skip it.
          </p>
          <div className="metric-grid">
            {Object.entries(metricLabels).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  value={resultForm[key] || ""}
                  onChange={(e) => setResultForm({ ...resultForm, [key]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <div className="actions">
            <button className="primary" type="button" onClick={() => void saveResults()}>
              Save manual results
            </button>
            <button type="button" onClick={() => setResultFor(null)}>
              Cancel
            </button>
            <Link href="/intelligence">After saving: Intelligence</Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
