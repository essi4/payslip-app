# Payroll TEST MODE

The admin-only payroll TEST MODE runner lives at `/admin/test-mode`.

It is disabled unless the deployment environment contains `PAYROLL_TEST_MODE=true`.

When enabled, one run creates an isolated test company, two test employees, and one open payroll period, then exercises the real bulk payslip issuance endpoint, duplicate prevention, and final print validation endpoint. The runner always attempts cleanup using the exact IDs created by that run and verifies that the created company, period, employees, and payslips are gone.

Never enable TEST MODE as a substitute for normal production data operations. It is intended only for repeatable verification of the payroll issuance and print-validation chain.
