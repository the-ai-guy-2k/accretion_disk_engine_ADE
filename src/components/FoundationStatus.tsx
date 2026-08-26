"use client";

import { useEffect, useState } from "react";

type Health = {
  ok: boolean;
  persistence?: {
    ok: boolean;
    schemaVersion: string | null;
    initializedAt: string | null;
    tables: string[];
    missingTables: string[];
    displayPath: string;
  };
  error?: string;
};

export function FoundationStatus() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: Health) => setHealth(data))
      .catch((err: unknown) =>
        setHealth({
          ok: false,
          error: err instanceof Error ? err.message : "health request failed"
        })
      );
  }, []);

  if (!health) {
    return (
      <div className="panel">
        <h2>Local persistence</h2>
        <p className="muted">Checking foundation status…</p>
      </div>
    );
  }

  const persist = health.persistence;
  const ok = Boolean(health.ok && persist?.ok);

  return (
    <div className="panel">
      <h2>Local persistence</h2>
      <p className={ok ? "status-ok" : "status-bad"}>
        {ok ? "SQLite foundation initialized" : "Persistence check failed"}
      </p>
      {persist ? (
        <p className="muted">
          Schema v{persist.schemaVersion ?? "unknown"} · {persist.displayPath}
          {persist.initializedAt ? ` · first init ${persist.initializedAt}` : ""}
          {persist.tables.length ? ` · ${persist.tables.length} tables` : ""}
        </p>
      ) : null}
      {health.error ? <p className="status-bad">{health.error}</p> : null}
    </div>
  );
}
