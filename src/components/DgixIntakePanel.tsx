"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

type Issue = { path: string; message: string };

type IntakeSummary = {
  id: number;
  packageId: string;
  campaignName: string;
  clientBusinessId: string;
  originatingSystem: string;
  acpVersion: string;
  importedAt: string;
  reviewState: string;
  reviewStateLabel: string;
  isTest: boolean;
  executionReady: boolean;
  executionAuthorized: boolean;
  materializedIntoAde: boolean;
};

export function DgixIntakePanel() {
  const [jsonText, setJsonText] = useState("");
  const [intakes, setIntakes] = useState<IntakeSummary[]>([]);
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/dgix/acp");
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || "Could not load Campaign Packages.");
      return;
    }
    setIntakes(data.intakes || []);
    setError("");
  }

  useEffect(() => {
    void load();
  }, []);

  async function importPackage(raw: unknown) {
    setBusy(true);
    setError("");
    setIssues([]);
    setNotice("");
    try {
      const res = await fetch("/api/dgix/acp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(raw)
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Campaign Package was not accepted.");
        setIssues(Array.isArray(data.issues) ? data.issues : []);
        return;
      }
      setNotice(
        data.banner ||
          "Imported for Operator review only. This is not approval and not publishing."
      );
      setJsonText("");
      await load();
    } catch {
      setError("ADE could not read that Campaign Package.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError("That text is not valid JSON. ADE will not repair it.");
      setIssues([{ path: "$", message: "Malformed JSON." }]);
      return;
    }
    await importPackage(parsed);
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setJsonText(text);
    };
    reader.readAsText(file);
  }

  return (
    <div id="intake" className="panel" style={{ marginBottom: "1rem" }}>
      <h2>Campaign Package Intake</h2>
      <p>
        Implemented. Paste an execution-ready ACP v1 JSON or choose a local{" "}
        <code>.json</code> file. Automatic Client QEN connectivity is not implemented.
        Import is <strong>not</strong> approval. Authorization is a later Operator
        action and still does <strong>not</strong> publish.
      </p>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          ACP v1 JSON
          <textarea
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            spellCheck={false}
            placeholder='{ "acpVersion": "1", ... }'
          />
        </label>
        <label>
          Or choose a local file
          <input type="file" accept="application/json,.json" onChange={onFile} />
        </label>
        <div className="actions">
          <button className="primary" type="submit" disabled={busy || !jsonText.trim()}>
            {busy ? "Validating…" : "Import for review"}
          </button>
        </div>
      </form>
      {notice ? <p className="status-ok">{notice}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {issues.length ? (
        <ul className="evidence-list">
          {issues.map((issue) => (
            <li key={`${issue.path}-${issue.message}`}>
              <code>{issue.path}</code>: {issue.message}
            </li>
          ))}
        </ul>
      ) : null}

      <h2 style={{ marginTop: "1.1rem" }}>Imported packages</h2>
      {intakes.length ? (
        <table className="table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Business</th>
              <th>State</th>
              <th>Authority</th>
            </tr>
          </thead>
          <tbody>
            {intakes.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link href={`/dgix/acp/${item.id}`}>{item.campaignName}</Link>
                  {item.isTest ? " · TEST DATA" : ""}
                  <div className="muted">
                    {item.packageId} · ACP v{item.acpVersion} · {item.originatingSystem}
                  </div>
                </td>
                <td>{item.clientBusinessId}</td>
                <td>
                  {item.reviewStateLabel}
                  <div className="muted">
                    {item.executionReady ? "execution-ready" : "legacy ACP"}
                  </div>
                </td>
                <td className="muted">
                  {item.executionAuthorized
                    ? "AUTHORIZED — PLATFORM EXECUTION NOT YET CONNECTED"
                    : "not authorized"}
                  {item.materializedIntoAde ? " · ADE records created" : " · no ADE records created"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted">No Campaign Packages imported yet.</p>
      )}
    </div>
  );
}
