import { execSync } from "node:child_process";

// Runs pending Prisma migrations during the Vercel build when a database
// is configured; skips quietly for local builds without one.
if (process.env.DATABASE_URL) {
  console.log("DATABASE_URL found — running prisma migrate deploy…");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} else {
  console.log("DATABASE_URL not set — skipping prisma migrate deploy");
}
