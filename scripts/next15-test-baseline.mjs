import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const worktree = path.resolve(process.cwd(), "..", "payslip-main-baseline");
const testsDir = path.resolve(process.cwd(), "tests");
const testFiles = fs.readdirSync(testsDir)
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => path.join("tests", name));

function runTests(cwd) {
  const result = execFileSync(
    process.execPath,
    ["--test", ...testFiles],
    { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  return result;
}

function runTestsAllowFailure(cwd) {
  try {
    return { output: runTests(cwd), status: 0 };
  } catch (error) {
    return {
      output: String(error.stdout || "") + String(error.stderr || ""),
      status: Number(error.status || 1),
    };
  }
}

function failures(output) {
  return [...output.matchAll(/not ok \d+ - (.+)/g)]
    .map((match) => match[1].trim())
    .map((value) => value.replace(/^\/[^\n]*\/tests\//, "tests/"))
    .sort();
}

function print(name, values) {
  console.log(`${name}=${values.length}`);
  for (const value of values) console.log(`  ${value}`);
}

try {
  execFileSync("git", ["worktree", "remove", "--force", worktree], { cwd: process.cwd(), stdio: "ignore" });
} catch {}

execFileSync("git", ["worktree", "add", "--detach", worktree, "origin/main"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

try {
  const baseline = runTestsAllowFailure(worktree);
  const migration = runTestsAllowFailure(process.cwd());

  const baselineFailures = failures(baseline.output);
  const migrationFailures = failures(migration.output);
  const newFailures = migrationFailures.filter((item) => !baselineFailures.includes(item));
  const fixedFailures = baselineFailures.filter((item) => !migrationFailures.includes(item));

  print("BASELINE_FAILURES", baselineFailures);
  print("MIGRATION_FAILURES", migrationFailures);
  print("NEW_FAILURES", newFailures);
  print("FIXED_FAILURES", fixedFailures);

  if (newFailures.length > 0) {
    console.error("FAIL | Next 15 migration introduced new test failures.");
    process.exit(1);
  }

  if (migration.status !== baseline.status && !(baseline.status !== 0 && migration.status === 0)) {
    console.error(`FAIL | test-run status changed unexpectedly: baseline=${baseline.status} migration=${migration.status}`);
    process.exit(1);
  }

  console.log("PASS | migration test regression is no worse than main baseline");
} finally {
  try {
    execFileSync("git", ["worktree", "remove", "--force", worktree], {
      cwd: process.cwd(),
      stdio: "inherit",
    });
  } catch (error) {
    console.error("WARN | could not remove temporary baseline worktree:", error.message);
  }
}
