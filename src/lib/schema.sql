CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  status TEXT,
  target_metric TEXT,
  starting_value REAL NOT NULL DEFAULT 0,
  target_value REAL,
  target_date TEXT,
  is_test INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT '',
  body TEXT,
  source_type TEXT,
  activity_date TEXT,
  provenance TEXT,
  origin TEXT,
  marketing_eligibility TEXT,
  notes TEXT,
  is_test INTEGER NOT NULL DEFAULT 0,
  goal_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (goal_id) REFERENCES goals(id)
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER,
  title TEXT NOT NULL DEFAULT '',
  objective TEXT,
  status TEXT,
  start_date TEXT,
  end_date TEXT,
  is_test INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  plan_summary TEXT,
  plan_mode TEXT,
  plan_boundary_note TEXT,
  plan_generated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (goal_id) REFERENCES goals(id)
);

CREATE TABLE IF NOT EXISTS campaign_sources (
  campaign_id INTEGER NOT NULL,
  source_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (campaign_id, source_id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER,
  campaign_id INTEGER,
  goal_id INTEGER,
  title TEXT NOT NULL DEFAULT '',
  body TEXT,
  status TEXT,
  channel_hint TEXT,
  generation_mode TEXT,
  generation_note TEXT,
  generation_provider TEXT,
  generation_model TEXT,
  generation_status TEXT,
  is_test INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_id) REFERENCES sources(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (goal_id) REFERENCES goals(id)
);

CREATE TABLE IF NOT EXISTS campaign_plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  source_id INTEGER,
  content_id INTEGER,
  sequence INTEGER NOT NULL DEFAULT 1,
  title TEXT,
  purpose TEXT,
  format TEXT,
  intended_audience TEXT,
  suggested_timing TEXT,
  status TEXT,
  is_test INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (source_id) REFERENCES sources(id),
  FOREIGN KEY (content_id) REFERENCES content_items(id)
);

CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER,
  decision TEXT,
  decided_by TEXT,
  notes TEXT,
  decided_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (content_id) REFERENCES content_items(id)
);

CREATE TABLE IF NOT EXISTS channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  channel_type TEXT,
  adapter_id TEXT,
  status TEXT,
  is_mock INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER,
  channel_id INTEGER,
  status TEXT,
  scheduled_at TEXT,
  published_at TEXT,
  external_post_id TEXT,
  failure_reason TEXT,
  adapter_id TEXT,
  is_mock INTEGER NOT NULL DEFAULT 1,
  attempt_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (content_id) REFERENCES content_items(id),
  FOREIGN KEY (channel_id) REFERENCES channels(id)
);

CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  publication_id INTEGER,
  metric_name TEXT,
  metric_value TEXT,
  numeric_value REAL,
  captured_at TEXT,
  capture_method TEXT,
  captured_by TEXT,
  notes TEXT,
  is_simulated INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (publication_id) REFERENCES publications(id)
);

CREATE TABLE IF NOT EXISTS audience_network_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT,
  count INTEGER,
  notes TEXT,
  occurred_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER,
  campaign_id INTEGER,
  channel_id INTEGER,
  status TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (content_id) REFERENCES content_items(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (channel_id) REFERENCES channels(id)
);

CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER,
  title TEXT,
  status TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER,
  campaign_id INTEGER,
  summary TEXT,
  action_hint TEXT,
  observed TEXT,
  why_it_matters TEXT,
  evidence_json TEXT,
  analysis_mode TEXT,
  analysis_boundary_note TEXT,
  is_test INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (goal_id) REFERENCES goals(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

CREATE TABLE IF NOT EXISTS dgix_missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT '',
  business_label TEXT,
  platform TEXT,
  objective TEXT,
  status TEXT,
  goal_id INTEGER,
  campaign_id INTEGER,
  is_test INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (goal_id) REFERENCES goals(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

CREATE TABLE IF NOT EXISTS dgix_acp_intakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id INTEGER NOT NULL,
  package_id TEXT NOT NULL UNIQUE,
  acp_version TEXT NOT NULL,
  originating_system TEXT,
  client_business_id TEXT,
  campaign_name TEXT,
  package_created_at TEXT,
  imported_at TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  review_state TEXT NOT NULL,
  execution_authorized INTEGER NOT NULL DEFAULT 0,
  materialized INTEGER NOT NULL DEFAULT 0,
  is_test INTEGER NOT NULL DEFAULT 0,
  acp_profile TEXT,
  execution_status TEXT,
  decision_at TEXT,
  decision_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (mission_id) REFERENCES dgix_missions(id)
);
