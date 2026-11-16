// Runs on Vercel before each build: creates or updates the database tables to match prisma/schema.prisma.
// Skipped when DATABASE_URL isn't set (the site still builds and shows its built-in content).
// `prisma db push` refuses changes that would delete data, so a risky schema change stops the deploy instead.
import { execSync } from "node:child_process";
if (!process.env.DATABASE_URL) {
  console.log("[db-sync] DATABASE_URL not set — skipping database setup.");
} else {
  console.log("[db-sync] Updating database tables…");
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
}
