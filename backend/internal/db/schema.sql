-- CRM / Operating System — MVP PostgreSQL Schema (DDL)

-- ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'HR', 'SALES', 'FINANCE', 'CLIENT', 'CLIENT_ADMIN', 'CLIENT_USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE talent_status AS ENUM (
      'SOURCED',
      'PRE_SCREENED',
      'BENCH_AVAILABLE',
      'BENCH_UNAVAILABLE',
      'ACTIVE_INTERVIEWING',
      'PLACED',
      'ARCHIVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE client_status AS ENUM ('LEAD', 'QUALIFIED', 'ACTIVE', 'CHURNED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('TRIAL', 'ACTIVE', 'ENDING', 'ENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_type AS ENUM ('CLIENT', 'CONTRACTOR', 'MSA', 'SOW', 'NDA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- TABLES

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  company_name TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Migrations (Idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE talent ADD COLUMN IF NOT EXISTS status talent_status NOT NULL DEFAULT 'SOURCED';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_status TEXT DEFAULT 'PENDING';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content TEXT;

-- Enum Updates (Idempotent)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CLIENT_ADMIN';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CLIENT_USER';
ALTER TYPE client_status ADD VALUE IF NOT EXISTS 'ARCHIVED';

CREATE TABLE IF NOT EXISTS talent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  linkedin_url TEXT,
  country TEXT,
  timezone TEXT,
  role TEXT NOT NULL,
  seniority TEXT,
  english_level TEXT,
  source TEXT,
  notes TEXT,
  status talent_status NOT NULL DEFAULT 'SOURCED',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT
);

CREATE TABLE IF NOT EXISTS talent_skills (
  talent_id UUID REFERENCES talent(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  level TEXT,
  PRIMARY KEY (talent_id, skill_id)
);

CREATE TABLE IF NOT EXISTS talent_commercial (
  talent_id UUID PRIMARY KEY REFERENCES talent(id) ON DELETE CASCADE,
  expected_monthly_rate_usd NUMERIC(10,2),
  availability_status TEXT,
  available_from_date DATE,
  payment_method TEXT
);

CREATE TABLE IF NOT EXISTS talent_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES talent(id) ON DELETE CASCADE,
  status talent_status NOT NULL,
  notes TEXT,
  changed_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  country TEXT,
  timezone TEXT,
  billing_currency TEXT,
  status client_status NOT NULL DEFAULT 'LEAD',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'ACTIVE',
  engagement_type TEXT,
  monthly_budget NUMERIC(12,2),
  target_hours_per_week INTEGER,
  billable_days_per_month INTEGER DEFAULT 21,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_planned_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  bill_rate NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE RESTRICT, -- Keep for redundancy or migration safety? Let's keep distinct if we want direct link, but strictly via project is better. Migration kept it. I will keep it for now to avoid breaking other queries immediately, or verify.
  talent_id UUID REFERENCES talent(id) ON DELETE RESTRICT,
  role TEXT NOT NULL,
  start_date DATE NOT NULL,
  trial_end_date DATE,
  monthly_client_rate NUMERIC(10,2), -- Nullable now
  monthly_contractor_cost NUMERIC(10,2) NOT NULL,
  daily_payout_rate NUMERIC(10,2),
  daily_bill_rate NUMERIC(10,2),
  hours_per_week INTEGER,
  status project_status NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type contract_type NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  talent_id UUID REFERENCES talent(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  signed BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  start_date DATE,
  end_date DATE,
  notice_period_days INTEGER,
  file_url TEXT,
  file_key TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
  billing_month TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  status invoice_status NOT NULL DEFAULT 'DRAFT',
  xero_invoice_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE RESTRICT,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS contractor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES talent(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE RESTRICT,
  billing_month TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  ocr_status TEXT DEFAULT 'PENDING',
  content TEXT,
  uploaded_at TIMESTAMP NOT NULL DEFAULT now()
);

-- FINANCE TABLES

CREATE TABLE IF NOT EXISTS financial_capital (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ARCHIVED
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  investor TEXT NOT NULL, -- 'GEO', 'IMAD', etc
  initial_amount NUMERIC(12,2) NOT NULL,
  current_value NUMERIC(12,2) NOT NULL,
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, LIQUIDATED
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_talent_role ON talent(role);
CREATE INDEX IF NOT EXISTS idx_talent_status_history_status ON talent_status_history(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_contractor_payments_status ON contractor_payments(status);
CREATE INDEX IF NOT EXISTS idx_expenses_budget_id ON expenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_investments_investor ON investments(investor);
