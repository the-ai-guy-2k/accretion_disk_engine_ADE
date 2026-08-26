"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Provenance, WorkflowStrip } from "@/components/WorkflowStrip";

type Source = {
  id: number;
  title: string;
  body: string;
  source_type: string;
  activity_date: string;
  provenance: string;
  notes: string;
  is_test: number;
};

const TEST_SOURCE = {
  title: "[TEST DATA] TAIG localhost ADE vertical-slice activity",
  body: "TAIG stood up the Accretion Disk Engine localhost Hub so real project work can later become approved marketing content. This record is a clearly labeled test source for ACI-004. It does not claim a client, revenue, endorsement, or audience result.",
  source_type: "taig_activity",
  activity_date: "2026-08-26",
  provenance: "ACI-004 validation / ADE localhost workspace",
  notes: "TEST DATA only. Not a production marketing claim.",
  is_test: true
};

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    body: "",
    source_type: "taig_activity",
    activity_date: new Date().toISOString().slice(0, 10),
    provenance: "",
    notes: "",
    is_test: false
  });

  async function load() {
    const res = await fetch("/api/sources");
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || "Failed to load sources");
      return;
    }
    setSources(data.sources);
    setError("");
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(payload: Record<string, unknown>) {
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || "Create failed");
      return;
    }
    await load();
  }

  return (
    <section>
      <WorkflowStrip current="Source" />
      <h1>Sources</h1>
      <p className="lede">
        Real TAIG activity that may later become content. Creating a source does not
        publish anything. Select a source, then continue to Create.
      </p>
      <div className="split">
        <form
          className="panel form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void create(form);
          }}
        >
          <h2>New source</h2>
          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>
          <label>
            Source content / description
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </label>
          <label>
            Source type
            <input
              value={form.source_type}
              onChange={(e) => setForm({ ...form, source_type: e.target.value })}
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={form.activity_date}
              onChange={(e) => setForm({ ...form, activity_date: e.target.value })}
            />
          </label>
          <label>
            Provenance / reference
            <input
              value={form.provenance}
              onChange={(e) => setForm({ ...form, provenance: e.target.value })}
            />
          </label>
          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.is_test}
              onChange={(e) => setForm({ ...form, is_test: e.target.checked })}
            />{" "}
            Mark as TEST DATA
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="actions">
            <button className="primary" type="submit">
              Save source
            </button>
            <button
              type="button"
              onClick={() => void create(TEST_SOURCE)}
            >
              Load ACI-004 test source
            </button>
          </div>
        </form>
        <div className="panel">
          <h2>Existing sources</h2>
          {sources.length === 0 ? (
            <p className="muted">No sources yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Next</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td>
                      <strong>{source.title}</strong>
                      <Provenance
                        sourceId={source.id}
                        sourceTitle={source.title}
                        provenance={source.provenance}
                        isTest={source.is_test}
                      />
                    </td>
                    <td>
                      <Link href={`/create?sourceId=${source.id}`}>Create draft</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
