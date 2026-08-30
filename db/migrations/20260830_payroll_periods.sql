BEGIN;

CREATE TABLE IF NOT EXISTS payroll_periods (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  year INTEGER NOT NULL CHECK (year >= 1300 AND year <= 1600),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (company_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_payroll_periods_company ON payroll_periods(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_year_month ON payroll_periods(year, month);

ALTER TABLE payslips
  ADD COLUMN IF NOT EXISTS payroll_period_id INTEGER REFERENCES payroll_periods(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_payslips_payroll_period ON payslips(payroll_period_id);

COMMIT;
