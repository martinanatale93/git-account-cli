#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const accounts_1 = require("./accounts");
const ssh_1 = require("./ssh");
const git_1 = require("./git");
const ui_1 = require("./ui");
const update_checker_1 = require("./update-checker");
async function main() {
    const currentDir = process.cwd();
    // Start update check in background (non-blocking)
    const updateCheckPromise = (0, update_checker_1.checkForUpdates)();
    (0, ui_1.showHeader)(currentDir);
    // ── Step 1: Ensure we're in a git repo ──────────────────────────
    let gitRoot = (0, git_1.getGitRoot)(currentDir);
    if (!(0, git_1.isGitRepo)(currentDir)) {
        const shouldInit = await (0, ui_1.promptInitRepo)();
        if (!shouldInit) {
            (0, ui_1.showWarning)("Cannot configure Git account without a Git repository.");
            (0, ui_1.showInfo)("Run 'git init' first, or choose a folder with an existing repo.");
            process.exit(1);
        }
        (0, git_1.initGitRepo)(currentDir);
        (0, ui_1.showSuccess)("Initialized git repository");
        gitRoot = currentDir;
    }
    const workDir = gitRoot || currentDir;
    // ── Step 2: Load existing accounts and let user choose ──────────
    const store = (0, accounts_1.loadAccounts)();
    let account = null;
    let isNewAccount = false;
    if (store.accounts.length > 0) {
        account = await (0, ui_1.promptSelectAccount)(store.accounts);
    }
    // ── Step 3: If new account, collect details and set up SSH ──────
    if (!account) {
        isNewAccount = true;
        const { email, username } = await (0, ui_1.promptNewAccount)();
        (0, ui_1.showInfo)("Generating SSH key...");
        const { privateKeyPath, publicKeyPath } = (0, ssh_1.generateSshKey)(email, username);
        (0, ui_1.showSuccess)(`SSH key generated: ${privateKeyPath}`);
        const sshHost = (0, ssh_1.getSshHost)(username);
        (0, ssh_1.updateSshConfig)(sshHost, privateKeyPath);
        (0, ui_1.showSuccess)("SSH config updated");
        // Add key to SSH agent
        (0, ssh_1.addKeyToAgent)(privateKeyPath);
        // Show the public key for the user to copy
        const publicKey = (0, ssh_1.readPublicKey)(publicKeyPath);
        (0, ui_1.showSshKey)(publicKey);
        // Wait for user to confirm they've added the key
        const keyAdded = await (0, ui_1.promptConfirmKeyAdded)();
        if (keyAdded) {
            (0, ui_1.showInfo)("Testing SSH connection...");
            const result = (0, ssh_1.testSshConnection)(sshHost);
            if (result.success) {
                (0, ui_1.showAuthSuccess)(result.message);
            }
            else {
                (0, ui_1.showAuthFailure)(result.message);
                const proceed = await (0, ui_1.promptSkipTest)();
                if (!proceed) {
                    (0, ui_1.showInfo)("Exiting. Run git-account again when ready.");
                    process.exit(1);
                }
            }
        }
        else {
            (0, ui_1.showWarning)("Skipping SSH test. You can test later with: ssh -T " + sshHost);
        }
        // Save the account
        account = {
            email,
            username,
            sshKeyPath: privateKeyPath,
            sshHost,
            createdAt: new Date().toISOString(),
        };
        (0, accounts_1.addAccount)(account);
        (0, ui_1.showSuccess)("Account saved to registry");
    }
    // ── Step 4: Configure the local git repo ────────────────────────
    if (account) {
        (0, git_1.setLocalGitUser)(workDir, account.email, account.username);
        // Set SSH command to use the specific key
        (0, git_1.setSshCommand)(workDir, account.sshKeyPath);
        // ── Step 4a: Detect and convert ALL HTTPS remotes ─────────────
        const httpsRemotes = (0, git_1.getHttpsRemotes)(workDir);
        if (httpsRemotes.length > 0) {
            const shouldConvert = await (0, ui_1.promptConvertHttpsRemotes)(httpsRemotes);
            if (shouldConvert) {
                const { converted, failed } = (0, git_1.convertAllRemotesToSsh)(workDir, account.sshHost);
                (0, ui_1.showRemoteConversionResults)(converted, failed);
            }
            else {
                (0, ui_1.showWarning)("HTTPS remotes left unchanged. Push/pull may use a different account.");
                (0, ui_1.showInfo)("You can re-run git-account anytime to convert them later.");
            }
        }
        else {
            // No HTTPS remotes — still convert any SSH remotes to use the right host alias
            const allRemotes = (0, git_1.getAllRemotes)(workDir);
            if (allRemotes.length > 0) {
                const { converted } = (0, git_1.convertAllRemotesToSsh)(workDir, account.sshHost);
                if (converted.length > 0) {
                    (0, ui_1.showSuccess)(`Updated ${converted.length} remote(s) to use SSH host alias`);
                    for (const c of converted) {
                        (0, ui_1.showInfo)(`  ${c.name}: ${c.oldUrl} → ${c.newUrl}`);
                    }
                }
            }
        }
        // Show summary
        const remoteCount = (0, git_1.getAllRemotes)(workDir).length;
        (0, ui_1.showConfigSummary)(workDir, account.email, account.username, remoteCount > 0);
        // If this is an existing account being applied to a new folder,
        // remind user about the SSH key if needed
        if (!isNewAccount) {
            const publicKey = (0, ssh_1.readPublicKey)(account.sshKeyPath + ".pub");
            (0, ui_1.showInfo)("SSH key for this account (in case you need it):");
            (0, ui_1.showSshKey)(publicKey);
        }
    }
    (0, ui_1.showSuccess)("All done! This folder is now configured.");
    (0, ui_1.showInfo)(`Any git operations in ${workDir} will use the account: ${account.username} (${account.email})`);
    // Show update notification if available (waits for the background check)
    await updateCheckPromise;
}
main().catch((err) => {
    (0, ui_1.showError)(`Unexpected error: ${err.message}`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map