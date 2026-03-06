"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSshKey = generateSshKey;
exports.readPublicKey = readPublicKey;
exports.getSshHost = getSshHost;
exports.updateSshConfig = updateSshConfig;
exports.testSshConnection = testSshConnection;
exports.addKeyToAgent = addKeyToAgent;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const SSH_DIR = path.join(os.homedir(), ".ssh");
function ensureSshDir() {
    if (!fs.existsSync(SSH_DIR)) {
        fs.mkdirSync(SSH_DIR, { mode: 0o700, recursive: true });
    }
}
/**
 * Generate an SSH key pair for a GitHub account.
 * Returns the path to the private key.
 */
function generateSshKey(email, username) {
    ensureSshDir();
    const keyName = `github_${username.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const privateKeyPath = path.join(SSH_DIR, keyName);
    const publicKeyPath = `${privateKeyPath}.pub`;
    // If key already exists, reuse it
    if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
        return { privateKeyPath, publicKeyPath };
    }
    // Generate ed25519 key (modern, fast, secure)
    (0, child_process_1.execSync)(`ssh-keygen -t ed25519 -C "${email}" -f "${privateKeyPath}" -N ""`, { stdio: "pipe" });
    // Ensure correct permissions
    fs.chmodSync(privateKeyPath, 0o600);
    fs.chmodSync(publicKeyPath, 0o644);
    return { privateKeyPath, publicKeyPath };
}
/**
 * Read the public key content so the user can copy it.
 */
function readPublicKey(publicKeyPath) {
    return fs.readFileSync(publicKeyPath, "utf-8").trim();
}
/**
 * Build the SSH host alias for this account.
 * e.g. "github-john-work" which maps to github.com with a specific key.
 */
function getSshHost(username) {
    return `github-${username.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}
/**
 * Add or update an entry in ~/.ssh/config for this account.
 */
function updateSshConfig(sshHost, privateKeyPath) {
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
    const hostRegex = new RegExp(`# git-account: ${escapeRegex(sshHost)}[\\s\\S]*?(?=\\n# git-account:|\\nHost |$)`, "g");
    if (hostRegex.test(configContent)) {
        // Replace existing block
        configContent = configContent.replace(hostRegex, block);
    }
    else {
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
function testSshConnection(sshHost) {
    try {
        const output = (0, child_process_1.execSync)(`ssh -T -o StrictHostKeyChecking=accept-new ${sshHost} 2>&1`, {
            timeout: 15000,
            encoding: "utf-8",
        });
        // GitHub returns exit code 1 even on success, with message like:
        // "Hi username! You've successfully authenticated..."
        if (output.includes("successfully authenticated")) {
            return { success: true, message: output.trim() };
        }
        return { success: false, message: output.trim() };
    }
    catch (err) {
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
function addKeyToAgent(privateKeyPath) {
    try {
        // Start agent if not running
        (0, child_process_1.execSync)("ssh-add -l 2>/dev/null || eval $(ssh-agent -s) 2>/dev/null", {
            stdio: "pipe",
            shell: "/bin/sh",
        });
        // Add key
        (0, child_process_1.execSync)(`ssh-add "${privateKeyPath}" 2>/dev/null`, {
            stdio: "pipe",
            shell: "/bin/sh",
        });
    }
    catch {
        // Non-fatal — the IdentityFile in ssh config should still work
    }
}
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
//# sourceMappingURL=ssh.js.map