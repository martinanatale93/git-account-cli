import { execSync } from "child_process";
import * as path from "path";

export interface RemoteInfo {
  name: string;
  url: string;
  type: "fetch" | "push";
}

/**
 * Check if the current directory is inside a Git repository.
 */
export function isGitRepo(dir: string): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: dir,
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize a git repo if one doesn't exist.
 */
export function initGitRepo(dir: string): void {
  execSync("git init", { cwd: dir, stdio: "pipe" });
}

/**
 * Set local (folder-level) git user config.
 */
export function setLocalGitUser(
  dir: string,
  email: string,
  username: string
): void {
  execSync(`git config --local user.email "${email}"`, {
    cwd: dir,
    stdio: "pipe",
  });
  execSync(`git config --local user.name "${username}"`, {
    cwd: dir,
    stdio: "pipe",
  });
}

/**
 * Get the current remote URL for a given remote name (if any).
 */
export function getRemoteUrl(dir: string, remoteName: string = "origin"): string | null {
  try {
    const url = execSync(`git config --get remote.${remoteName}.url`, {
      cwd: dir,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
    return url || null;
  } catch {
    return null;
  }
}

/**
 * Get ALL remotes with their URLs.
 */
export function getAllRemotes(dir: string): RemoteInfo[] {
  try {
    const output = execSync("git remote -v", {
      cwd: dir,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
    if (!output) return [];

    const remotes: RemoteInfo[] = [];
    for (const line of output.split("\n")) {
      const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/);
      if (match) {
        remotes.push({
          name: match[1],
          url: match[2],
          type: match[3] as "fetch" | "push",
        });
      }
    }
    return remotes;
  } catch {
    return [];
  }
}

/**
 * Check if a remote URL is HTTPS (not SSH).
 */
export function isHttpsRemote(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Get unique remote names that have HTTPS URLs.
 */
export function getHttpsRemotes(dir: string): { name: string; url: string }[] {
  const allRemotes = getAllRemotes(dir);
  const seen = new Set<string>();
  const httpsRemotes: { name: string; url: string }[] = [];

  for (const remote of allRemotes) {
    if (isHttpsRemote(remote.url) && !seen.has(remote.name)) {
      seen.add(remote.name);
      httpsRemotes.push({ name: remote.name, url: remote.url });
    }
  }
  return httpsRemotes;
}

/**
 * Extract owner/repo from any GitHub remote URL format.
 * Handles:
 *   - https://github.com/owner/repo.git
 *   - https://github.com/owner/repo
 *   - https://user:token@github.com/owner/repo.git
 *   - git@github.com:owner/repo.git
 *   - git@github-alias:owner/repo.git
 *   - ssh://git@github.com/owner/repo.git
 *   - github-alias:owner/repo.git
 */
export function extractOwnerRepo(url: string): string | null {
  // HTTPS with optional auth: https://[user:pass@]github.com/owner/repo[.git]
  const httpsMatch = url.match(
    /https?:\/\/(?:[^@]+@)?[^/]+\/(.+?)(?:\.git)?\s*$/
  );
  if (httpsMatch) return httpsMatch[1];

  // SSH protocol: ssh://git@github.com/owner/repo[.git]
  const sshProtoMatch = url.match(
    /ssh:\/\/[^/]+\/(.+?)(?:\.git)?\s*$/
  );
  if (sshProtoMatch) return sshProtoMatch[1];

  // SCP-style SSH: git@host:owner/repo[.git] or alias:owner/repo[.git]
  const scpMatch = url.match(
    /(?:git@)?[^:]+:(?!\/\/)(.+?)(?:\.git)?\s*$/
  );
  if (scpMatch) return scpMatch[1];

  return null;
}

/**
 * Convert a single remote to use the SSH host alias.
 * Returns the new URL or null if conversion failed.
 */
export function convertRemoteToSsh(
  dir: string,
  remoteName: string,
  sshHost: string
): string | null {
  const remoteUrl = getRemoteUrl(dir, remoteName);
  if (!remoteUrl) return null;

  const ownerRepo = extractOwnerRepo(remoteUrl);
  if (!ownerRepo) return null;

  const newUrl = `git@${sshHost}:${ownerRepo}.git`;
  execSync(`git remote set-url ${remoteName} "${newUrl}"`, {
    cwd: dir,
    stdio: "pipe",
  });

  return newUrl;
}

/**
 * Convert ALL remotes (origin, upstream, etc.) to use the SSH host alias.
 * Returns a summary of what was converted.
 */
export function convertAllRemotesToSsh(
  dir: string,
  sshHost: string
): { converted: { name: string; oldUrl: string; newUrl: string }[]; failed: { name: string; url: string; reason: string }[] } {
  const allRemotes = getAllRemotes(dir);
  const seen = new Set<string>();
  const converted: { name: string; oldUrl: string; newUrl: string }[] = [];
  const failed: { name: string; url: string; reason: string }[] = [];

  for (const remote of allRemotes) {
    // Process each remote name only once (fetch and push share the same name)
    if (seen.has(remote.name)) continue;
    seen.add(remote.name);

    const ownerRepo = extractOwnerRepo(remote.url);
    if (!ownerRepo) {
      if (isHttpsRemote(remote.url)) {
        failed.push({ name: remote.name, url: remote.url, reason: "Could not parse owner/repo from URL" });
      }
      continue;
    }

    const newUrl = `git@${sshHost}:${ownerRepo}.git`;

    // Skip if already pointing to the correct SSH alias
    if (remote.url === newUrl) continue;

    try {
      execSync(`git remote set-url ${remote.name} "${newUrl}"`, {
        cwd: dir,
        stdio: "pipe",
      });
      converted.push({ name: remote.name, oldUrl: remote.url, newUrl });
    } catch (err: any) {
      failed.push({ name: remote.name, url: remote.url, reason: err.message || "Unknown error" });
    }
  }

  return { converted, failed };
}

/**
 * Legacy wrapper: update origin remote only. Kept for backward compatibility.
 */
export function updateRemoteToSshHost(
  dir: string,
  sshHost: string
): boolean {
  const result = convertRemoteToSsh(dir, "origin", sshHost);
  return result !== null;
}

/**
 * Set the SSH command for this repo to use a specific key directly.
 * This is a fallback/additional measure beyond ~/.ssh/config.
 */
export function setSshCommand(dir: string, privateKeyPath: string): void {
  execSync(
    `git config --local core.sshCommand "ssh -i ${privateKeyPath} -o IdentitiesOnly=yes"`,
    { cwd: dir, stdio: "pipe" }
  );
}

/**
 * Get the Git root directory for the current folder.
 */
export function getGitRoot(dir: string): string | null {
  try {
    return execSync("git rev-parse --show-toplevel", {
      cwd: dir,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Get current local git user config for display.
 */
export function getLocalGitUser(
  dir: string
): { email: string | null; name: string | null } {
  let email: string | null = null;
  let name: string | null = null;
  try {
    email = execSync("git config --local user.email", {
      cwd: dir,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
  } catch {}
  try {
    name = execSync("git config --local user.name", {
      cwd: dir,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
  } catch {}
  return { email, name };
}
