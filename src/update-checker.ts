import * as https from "https";
import * as path from "path";
import * as fs from "fs";
import chalk from "chalk";

const PACKAGE_NAME = "git-account-cli";

/**
 * Get the current version from package.json.
 */
export function getCurrentVersion(): string {
  try {
    const pkgPath = path.join(__dirname, "..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/**
 * Fetch the latest version from the npm registry.
 * Returns null if the request fails (network error, not published yet, etc.)
 */
function fetchLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const url = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;

    const req = https.get(url, { timeout: 3000 }, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }

      let data = "";
      res.on("data", (chunk: string) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json.version || null);
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * Compare two semver strings. Returns:
 *  1 if a > b
 *  0 if a === b
 * -1 if a < b
 */
function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

/**
 * Check for updates and print a message if a newer version is available.
 * This is non-blocking and silent on failure — it should never prevent
 * the tool from running.
 */
export async function checkForUpdates(): Promise<void> {
  try {
    const current = getCurrentVersion();
    const latest = await fetchLatestVersion();

    if (!latest) return; // Not published yet or network error — skip silently

    if (compareSemver(latest, current) > 0) {
      console.log("");
      console.log(
        chalk.yellow(
          `  ⚠ Update available: ${chalk.gray(current)} → ${chalk.green(latest)}`
        )
      );
      console.log(
        chalk.yellow(
          `    Run: ${chalk.cyan(`npm update -g ${PACKAGE_NAME}`)}`
        )
      );
      console.log("");
    }
  } catch {
    // Never let update check break the tool
  }
}
