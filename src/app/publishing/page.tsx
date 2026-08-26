"use client";

import { useEffect, useState } from "react";
import { Provenance, WorkflowStrip } from "@/components/WorkflowStrip";
import { MOCK_FACEBOOK_BANNER } from "@/lib/channel-adapter";

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

  async function load() {
    const res = await fetch("/api/publications");
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      return;
    }
    setItems(data.publications);
    setError("");
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
        reason: action === "fail" ? "Controlled ACI-004 mock adapter failure" : undefined
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
      <WorkflowStrip current="Queue" />
      <h1>Publishing</h1>
      <p className="lede">
        Approved content only. Channel 01 is Facebook via a manual/mock adapter.
      </p>
      <div className="banner">{MOCK_FACEBOOK_BANNER}</div>
      {error ? <p className="error">{error}</p> : null}
      {notice ? <p className="status-ok">{notice}</p> : null}
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
                    <p className="muted">
                      Adapter: {item.adapter_id} · mock={item.is_mock ? "yes" : "no"}
                      {item.external_post_id ? ` · ${item.external_post_id}` : ""}
                      {item.failure_reason ? ` · ${item.failure_reason}` : ""}
                    </p>
                  </td>
                  <td>
                    <strong>{item.status}</strong>
                    {item.status === "PUBLISHED" ? (
                      <p className="muted">Mock published at {item.published_at}</p>
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
                        <span className="muted">Terminal mock success</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
