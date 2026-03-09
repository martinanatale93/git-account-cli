import chalk from "chalk";
import { loadAccounts, findAccountByUsername, Account } from "./accounts";
import {
  isGitRepo,
  getGitRoot,
  getLocalGitUser,
  setLocalGitUser,
  setSshCommand,
  getHttpsRemotes,
  convertAllRemotesToSsh,
  getAllRemotes,
} from "./git";
import { readPublicKey } from "./ssh";
import { getCurrentVersion } from "./update-checker";
import {
  showInfo,
  showSuccess,
  showWarning,
  showError,
} from "./ui";

// ── git-account --version ──────────────────────────────────────────

export function versionCommand(): void {
  const version = getCurrentVersion();
  console.log(`git-account-cli v${version}`);
}

// ── git-account --help / git-account help ──────────────────────────

export function helpCommand(): void {
  const version = getCurrentVersion();
  console.log("");
  console.log(chalk.bold.cyan("🔧 Git Account CLI") + chalk.gray(` v${version}`));
  console.log(chalk.gray("   Manage multiple GitHub accounts per folder with SSH keys"));
  console.log("");
  console.log(chalk.bold("Usage:"));
  console.log(`  ${chalk.cyan("git-account")}                   Interactive setup for current folder`);
  console.log(`  ${chalk.cyan("git-account list")}              List all configured accounts`);
  console.log(`  ${chalk.cyan("git-account current")}           Show active account for current folder`);
  console.log(`  ${chalk.cyan("git-account switch <username>")} Switch account for current folder`);
  console.log("");
  console.log(chalk.bold("Options:"));
  console.log(`  ${chalk.cyan("--help, -h")}                    Show this help message`);
  console.log(`  ${chalk.cyan("--version, -v")}                 Show version number`);
  console.log("");
  console.log(chalk.bold("Examples:"));
  console.log(chalk.gray("  $ git-account                    # Interactive: add account + configure folder"));
  console.log(chalk.gray("  $ git-account list               # See all saved accounts"));
  console.log(chalk.gray("  $ git-account current            # Check which account this folder uses"));
  console.log(chalk.gray("  $ git-account switch work-user   # Quickly switch this folder's account"));
  console.log("");
  console.log(chalk.gray(`  Docs: https://github.com/martinanatale93/git-account-cli`));
  console.log("");
}

// ── git-account list ───────────────────────────────────────────────

export function listCommand(): void {
  const store = loadAccounts();

  if (store.accounts.length === 0) {
    showWarning("No accounts configured yet.");
    showInfo("Run `git-account` in a git repo to add your first account.");
    return;
  }

  // Try to detect current account from the folder's git config
  const currentDir = process.cwd();
  let currentUsername: string | null = null;
  if (isGitRepo(currentDir)) {
    const { email, name } = getLocalGitUser(currentDir);
    if (name) {
      currentUsername = name;
    }
  }

  console.log("");
  console.log(chalk.bold.cyan("Configured Git Accounts"));
  console.log("");

  store.accounts.forEach((account, index) => {
    const isCurrent = account.username === currentUsername;
    const marker = isCurrent ? chalk.green(" ◀ current") : "";
    const num = chalk.bold(`${index + 1}.`);

    console.log(`${num} ${chalk.bold.white(account.username)}${marker}`);
    console.log(chalk.gray(`   email: ${account.email}`));
    console.log(chalk.gray(`   ssh:   ${account.sshKeyPath}`));
    if (account.createdAt) {
      const date = new Date(account.createdAt).toLocaleDateString();
      console.log(chalk.gray(`   added: ${date}`));
    }
    console.log("");
  });

  if (currentUsername) {
    console.log(chalk.cyan(`Current account (this folder): ${currentUsername}`));
  } else {
    console.log(chalk.gray("Tip: run `git-account current` inside a git repo to see the active account."));
  }
  console.log("");
}

// ── git-account current ────────────────────────────────────────────

export function currentCommand(): void {
  const currentDir = process.cwd();

  if (!isGitRepo(currentDir)) {
    showError("Not inside a git repository.");
    showInfo("Navigate to a git repo and try again.");
    process.exit(1);
  }

  const gitRoot = getGitRoot(currentDir);
  const workDir = gitRoot || currentDir;
  const { email, name } = getLocalGitUser(workDir);

  if (!email && !name) {
    showWarning("No local git identity configured for this folder.");
    showInfo("Run `git-account` to set one up, or `git-account switch <username>`.");
    return;
  }

  // Try to match with a saved account to get the SSH key info
  const store = loadAccounts();
  const matchedAccount = store.accounts.find(
    (a) => a.username === name || a.email === email
  );

  console.log("");
  console.log(chalk.bold.cyan("Current Git Identity"));
  console.log(chalk.gray(`   Folder: ${workDir}`));
  console.log("");
  if (name) console.log(`   ${chalk.bold("Name:")}   ${name}`);
  if (email) console.log(`   ${chalk.bold("Email:")}  ${email}`);

  if (matchedAccount) {
    console.log(`   ${chalk.bold("SSH key:")} ${matchedAccount.sshKeyPath}`);
    console.log(`   ${chalk.bold("Host:")}    ${matchedAccount.sshHost}`);
  } else {
    showWarning("This identity does not match any saved git-account profile.");
    showInfo("Run `git-account` to register it.");
  }
  console.log("");
}

// ── git-account switch <username> ──────────────────────────────────

export function switchCommand(username: string | undefined): void {
  if (!username) {
    showError("Missing username. Usage: git-account switch <username>");
    showInfo("Run `git-account list` to see available accounts.");
    process.exit(1);
  }

  const currentDir = process.cwd();

  if (!isGitRepo(currentDir)) {
    showError("Not inside a git repository.");
    showInfo("Navigate to a git repo and try again.");
    process.exit(1);
  }

  const gitRoot = getGitRoot(currentDir);
  const workDir = gitRoot || currentDir;

  const account = findAccountByUsername(username);
  if (!account) {
    showError(`Account "${username}" not found.`);
    showInfo("Run `git-account list` to see available accounts.");
    const store = loadAccounts();
    if (store.accounts.length > 0) {
      console.log("");
      console.log(chalk.gray("Available accounts:"));
      for (const a of store.accounts) {
        console.log(chalk.gray(`  - ${a.username} (${a.email})`));
      }
    }
    process.exit(1);
  }

  // Apply account to the current repo
  setLocalGitUser(workDir, account.email, account.username);
  setSshCommand(workDir, account.sshKeyPath);

  // Convert remotes to use the correct SSH host alias
  const allRemotes = getAllRemotes(workDir);
  if (allRemotes.length > 0) {
    const { converted } = convertAllRemotesToSsh(workDir, account.sshHost);
    if (converted.length > 0) {
      for (const c of converted) {
        showInfo(`Remote "${c.name}": ${c.oldUrl} → ${c.newUrl}`);
      }
    }
  }

  console.log("");
  showSuccess(`Switched to account: ${chalk.bold(account.username)}`);
  console.log(`   ${chalk.bold("Email:")}   ${account.email}`);
  console.log(`   ${chalk.bold("SSH key:")} ${account.sshKeyPath}`);
  console.log(`   ${chalk.bold("Folder:")}  ${workDir}`);
  console.log("");
}
