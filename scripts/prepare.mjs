import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

if (existsSync(".git") && !process.env.VERCEL) {
  execFileSync("npx", ["husky"], { stdio: "inherit", shell: true });
}
