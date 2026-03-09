#!/usr/bin/env node

import { loadAccounts, addAccount, Account } from "./accounts";
import {
  generateSshKey,
  readPublicKey,
  getSshHost,
  updateSshConfig,
  testSshConnection,
  addKeyToAgent,
} from "./ssh";
import {
  isGitRepo,
  initGitRepo,
  setLocalGitUser,
  updateRemoteToSshHost,
  setSshCommand,
  getGitRoot,
  getHttpsRemotes,
  convertAllRemotesToSsh,
  getAllRemotes,
} from "./git";
import {
  showHeader,
  promptSelectAccount,
  promptNewAccount,
  showSshKey,
  promptConfirmKeyAdded,
  showAuthSuccess,
  showAuthFailure,
  showConfigSummary,
  showInfo,
  showSuccess,
  showWarning,
  showError,
  promptSkipTest,
  promptInitRepo,
  promptConvertHttpsRemotes,
  showRemoteConversionResults,
} from "./ui";
import { checkForUpdates } from "./update-checker";
import {
  versionCommand,
  helpCommand,
  listCommand,
  currentCommand,
  switchCommand,
} from "./commands";

// ── Command router ────────────────────────────────────────────────
const arg = process.argv[2];

if (arg === "--version" || arg === "-v") {
  versionCommand();
  process.exit(0);
}

if (arg === "--help" || arg === "-h" || arg === "help") {
  helpCommand();
  process.exit(0);
}

if (arg === "list") {
  listCommand();
  process.exit(0);
}

if (arg === "current") {
  currentCommand();
  process.exit(0);
}

if (arg === "switch") {
  switchCommand(process.argv[3]);
  process.exit(0);
}

// ── Interactive setup (default, no subcommand) ────────────────────

async function main(): Promise<void> {
  const currentDir = process.cwd();

  // Start update check in background (non-blocking)
  const updateCheckPromise = checkForUpdates();

  showHeader(currentDir);

  // ── Step 1: Ensure we're in a git repo ──────────────────────────
  let gitRoot = getGitRoot(currentDir);
  if (!isGitRepo(currentDir)) {
    const shouldInit = await promptInitRepo();
    if (!shouldInit) {
      showWarning("Cannot configure Git account without a Git repository.");
      showInfo("Run 'git init' first, or choose a folder with an existing repo.");
      process.exit(1);
    }
    initGitRepo(currentDir);
    showSuccess("Initialized git repository");
    gitRoot = currentDir;
  }

  const workDir = gitRoot || currentDir;

  // ── Step 2: Load existing accounts and let user choose ──────────
  const store = loadAccounts();
  let account: Account | null = null;
  let isNewAccount = false;

  if (store.accounts.length > 0) {
    account = await promptSelectAccount(store.accounts);
  }

  // ── Step 3: If new account, collect details and set up SSH ──────
  if (!account) {
    isNewAccount = true;
    const { email, username } = await promptNewAccount();

    showInfo("Generating SSH key...");
    const { privateKeyPath, publicKeyPath } = generateSshKey(email, username);
    showSuccess(`SSH key generated: ${privateKeyPath}`);

    const sshHost = getSshHost(username);
    updateSshConfig(sshHost, privateKeyPath);
    showSuccess("SSH config updated");

    // Add key to SSH agent
    addKeyToAgent(privateKeyPath);

    // Show the public key for the user to copy
    const publicKey = readPublicKey(publicKeyPath);
    showSshKey(publicKey);

    // Wait for user to confirm they've added the key
    const keyAdded = await promptConfirmKeyAdded();

    if (keyAdded) {
      showInfo("Testing SSH connection...");
      const result = testSshConnection(sshHost);

      if (result.success) {
        showAuthSuccess(result.message);
      } else {
        showAuthFailure(result.message);
        const proceed = await promptSkipTest();
        if (!proceed) {
          showInfo("Exiting. Run git-account again when ready.");
          process.exit(1);
        }
      }
    } else {
      showWarning("Skipping SSH test. You can test later with: ssh -T " + sshHost);
    }

    // Save the account
    account = {
      email,
      username,
      sshKeyPath: privateKeyPath,
      sshHost,
      createdAt: new Date().toISOString(),
    };
    addAccount(account);
    showSuccess("Account saved to registry");
  }

  // ── Step 4: Configure the local git repo ────────────────────────
  if (account) {
    setLocalGitUser(workDir, account.email, account.username);

    // Set SSH command to use the specific key
    setSshCommand(workDir, account.sshKeyPath);

    // ── Step 4a: Detect and convert ALL HTTPS remotes ─────────────
    const httpsRemotes = getHttpsRemotes(workDir);
    if (httpsRemotes.length > 0) {
      const shouldConvert = await promptConvertHttpsRemotes(httpsRemotes);
      if (shouldConvert) {
        const { converted, failed } = convertAllRemotesToSsh(workDir, account.sshHost);
        showRemoteConversionResults(converted, failed);
      } else {
        showWarning(
          "HTTPS remotes left unchanged. Push/pull may use a different account."
        );
        showInfo(
          "You can re-run git-account anytime to convert them later."
        );
      }
    } else {
      // No HTTPS remotes — still convert any SSH remotes to use the right host alias
      const allRemotes = getAllRemotes(workDir);
      if (allRemotes.length > 0) {
        const { converted } = convertAllRemotesToSsh(workDir, account.sshHost);
        if (converted.length > 0) {
          showSuccess(`Updated ${converted.length} remote(s) to use SSH host alias`);
          for (const c of converted) {
            showInfo(`  ${c.name}: ${c.oldUrl} → ${c.newUrl}`);
          }
        }
      }
    }

    // Show summary
    const remoteCount = getAllRemotes(workDir).length;
    showConfigSummary(workDir, account.email, account.username, remoteCount > 0);

    // If this is an existing account being applied to a new folder,
    // remind user about the SSH key if needed
    if (!isNewAccount) {
      const publicKey = readPublicKey(account.sshKeyPath + ".pub");
      showInfo("SSH key for this account (in case you need it):");
      showSshKey(publicKey);
    }
  }

  showSuccess("All done! This folder is now configured.");
  showInfo(
    `Any git operations in ${workDir} will use the account: ${account!.username} (${account!.email})`
  );

  // Show update notification if available (waits for the background check)
  await updateCheckPromise;
}

main().catch((err) => {
  showError(`Unexpected error: ${err.message}`);
  process.exit(1);
});
