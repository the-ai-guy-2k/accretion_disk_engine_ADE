"use client";

import { useEffect, useState } from "react";

type ConnectionView = {
  facebook: string;
  organic: string;
  paid: string;
  graphApiVersion: string;
  clientId: string | null;
  page: { id: string | null; name: string | null };
  adAccount: { id: string | null; name: string | null };
  realPublishingImplemented: boolean;
  paidExecutionImplemented: boolean;
  realValidation: string;
  blockedReason: string | null;
  failures: { code: string; message: string }[];
  lastValidatedAt: string | null;
};

export function DgixFacebookConnectionPanel() {
  const [connection, setConnection] = useState<ConnectionView | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/dgix/facebook");
    const data = await res.json();
    if (!data.ok && !data.connection) {
      setError(data.error || "Could not read Facebook connection status.");
      return;
    }
    setConnection(data.connection);
    setError("");
  }

  useEffect(() => {
    void load();
  }, []);

  async function validate() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/dgix/facebook/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.connection) setConnection(data.connection);
      if (data.banner) setNotice(data.banner);
      if (!data.ok && data.error) setError(data.error);
    } finally {
      setBusy(false);
    }
  }

  const facebookLabel = connection?.facebook || "NOT CONNECTED";
  const organicLabel = connection?.organic || "NOT AVAILABLE";
  const paidLabel = connection?.paid || "NOT AVAILABLE";

  return (
    <div className="panel" style={{ marginBottom: "1rem" }} id="facebook-connection">
      <h2>Facebook connection</h2>
      <p>
        Connection capability is not automatic publishing. The Organic Facebook
        Execution Adapter is implemented. Real Facebook Publishing is{" "}
        <strong>VALIDATED</strong> for authorized organic Page posts. Paid
        Advertising Execution remains <strong>NOT YET IMPLEMENTED</strong>.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Surface</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Facebook</td>
            <td className={facebookLabel === "CONNECTED" ? "status-ok" : "status-nyet"}>
              {facebookLabel}
            </td>
          </tr>
          <tr>
            <td>Organic</td>
            <td className={organicLabel === "AVAILABLE" ? "status-ok" : "status-nyet"}>
              {organicLabel === "AVAILABLE" ? "AVAILABLE" : "NOT AVAILABLE"}
            </td>
          </tr>
          <tr>
            <td>Paid</td>
            <td className={paidLabel === "AVAILABLE" ? "status-ok" : "status-nyet"}>
              {paidLabel === "AVAILABLE" ? "AVAILABLE" : "NOT AVAILABLE"}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="muted">
        Graph API {connection?.graphApiVersion || "v26.0"}
        {connection?.clientId ? ` · logical client ${connection.clientId}` : " · no logical client configured"}
        {connection?.page?.id ? ` · Page ${connection.page.name || connection.page.id}` : " · no Page identity"}
        {connection?.adAccount?.id ? ` · Ad Account ${connection.adAccount.name || connection.adAccount.id}` : " · no Ad Account"}
      </p>
      {connection?.blockedReason ? <p className="status-nyet">{connection.blockedReason}</p> : null}
      {connection?.failures?.length ? (
        <ul className="evidence-list">
          {connection.failures.map((item) => (
            <li key={`${item.code}-${item.message}`}>{item.message}</li>
          ))}
        </ul>
      ) : null}
      {notice ? <p className="status-ok">{notice}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <div className="actions">
        <button className="primary" type="button" disabled={busy} onClick={() => void validate()}>
          {busy ? "Validating…" : "Validate Facebook connection"}
        </button>
      </div>
      <p className="muted">
        Validation talks to Meta only to confirm identity and authorization. It does
        not publish, upload media, create campaigns, or spend.
      </p>
    </div>
  );
}
