import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

const SSH_DIR = path.join(os.homedir(), ".ssh");

function ensureSshDir(): void {
  if (!fs.existsSync(SSH_DIR)) {
    fs.mkdirSync(SSH_DIR, { mode: 0o700, recursive: true });
  }
}

/**
 * Generate an SSH key pair for a GitHub account.
 * Returns the path to the private key.
 */
export function generateSshKey(
  email: string,
  username: string
): { privateKeyPath: string; publicKeyPath: string } {
  ensureSshDir();

  const keyName = `github_${username.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const privateKeyPath = path.join(SSH_DIR, keyName);
  const publicKeyPath = `${privateKeyPath}.pub`;

  // If key already exists, reuse it
  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
    return { privateKeyPath, publicKeyPath };
  }

  // Generate ed25519 key (modern, fast, secure)
  execSync(
    `ssh-keygen -t ed25519 -C "${email}" -f "${privateKeyPath}" -N ""`,
    { stdio: "pipe" }
  );

  // Ensure correct permissions
  fs.chmodSync(privateKeyPath, 0o600);
  fs.chmodSync(publicKeyPath, 0o644);

  return { privateKeyPath, publicKeyPath };
}

/**
 * Read the public key content so the user can copy it.
 */
export function readPublicKey(publicKeyPath: string): string {
  return fs.readFileSync(publicKeyPath, "utf-8").trim();
}

/**
 * Build the SSH host alias for this account.
 * e.g. "github-john-work" which maps to github.com with a specific key.
 */
export function getSshHost(username: string): string {
  return `github-${username.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

/**
 * Add or update an entry in ~/.ssh/config for this account.
 */
export function updateSshConfig(
  sshHost: string,
  privateKeyPath: string
): void {
  ensureSshDir();
  const configPath = path.join(SSH_DIR, "config");

  let configContent = "";
  if (fs.existsSync(configPath)) {
    configContent = fs.readFileSync(configPath, "utf-8");
  }

  // Build the block we want
  const block = [
    `# git-account: ${sshHost}`,
    `Host ${sshHost}`,
    `  HostName github.com`,
    `  User git`,
    `  IdentityFile ${privateKeyPath}`,
    `  IdentitiesOnly yes`,
    "",
  ].join("\n");

  // Check if this host already exists in config
  const hostRegex = new RegExp(
    `# git-account: ${escapeRegex(sshHost)}[\\s\\S]*?(?=\\n# git-account:|\\nHost |$)`,
    "g"
  );

  if (hostRegex.test(configContent)) {
    // Replace existing block
    configContent = configContent.replace(hostRegex, block);
  } else {
    // Append new block
    if (configContent.length > 0 && !configContent.endsWith("\n")) {
      configContent += "\n";
    }
    configContent += "\n" + block;
  }

  fs.writeFileSync(configPath, configContent, { mode: 0o600 });
}

/**
 * Test SSH connection to GitHub using the host alias.
 * Returns { success, message }.
 */
export function testSshConnection(
  sshHost: string
): { success: boolean; message: string } {
  try {
    const output = execSync(`ssh -T -o StrictHostKeyChecking=accept-new ${sshHost} 2>&1`, {
      timeout: 15000,
      encoding: "utf-8",
    });
    // GitHub returns exit code 1 even on success, with message like:
    // "Hi username! You've successfully authenticated..."
    if (output.includes("successfully authenticated")) {
      return { success: true, message: output.trim() };
    }
    return { success: false, message: output.trim() };
  } catch (err: any) {
    const output = err.stdout || err.stderr || err.message || "";
    // GitHub exits with code 1 on successful auth
    if (output.includes("successfully authenticated")) {
      return { success: true, message: output.trim() };
    }
    return { success: false, message: output.trim() };
  }
}

/**
 * Start the SSH agent and add the key.
 */
export function addKeyToAgent(privateKeyPath: string): void {
  try {
    // Start agent if not running
    execSync("ssh-add -l 2>/dev/null || eval $(ssh-agent -s) 2>/dev/null", {
      stdio: "pipe",
      shell: "/bin/sh",
    });
    // Add key
    execSync(`ssh-add "${privateKeyPath}" 2>/dev/null`, {
      stdio: "pipe",
      shell: "/bin/sh",
    });
  } catch {
    // Non-fatal — the IdentityFile in ssh config should still work
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
