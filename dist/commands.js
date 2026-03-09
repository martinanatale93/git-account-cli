"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionCommand = versionCommand;
exports.helpCommand = helpCommand;
exports.listCommand = listCommand;
exports.currentCommand = currentCommand;
exports.switchCommand = switchCommand;
const chalk_1 = __importDefault(require("chalk"));
const accounts_1 = require("./accounts");
const git_1 = require("./git");
const update_checker_1 = require("./update-checker");
const ui_1 = require("./ui");
// ── git-account --version ──────────────────────────────────────────
function versionCommand() {
    const version = (0, update_checker_1.getCurrentVersion)();
    console.log(`git-account-cli v${version}`);
}
// ── git-account --help / git-account help ──────────────────────────
function helpCommand() {
    const version = (0, update_checker_1.getCurrentVersion)();
    console.log("");
    console.log(chalk_1.default.bold.cyan("🔧 Git Account CLI") + chalk_1.default.gray(` v${version}`));
    console.log(chalk_1.default.gray("   Manage multiple GitHub accounts per folder with SSH keys"));
    console.log("");
    console.log(chalk_1.default.bold("Usage:"));
    console.log(`  ${chalk_1.default.cyan("git-account")}                   Interactive setup for current folder`);
    console.log(`  ${chalk_1.default.cyan("git-account list")}              List all configured accounts`);
    console.log(`  ${chalk_1.default.cyan("git-account current")}           Show active account for current folder`);
    console.log(`  ${chalk_1.default.cyan("git-account switch <username>")} Switch account for current folder`);
    console.log("");
    console.log(chalk_1.default.bold("Options:"));
    console.log(`  ${chalk_1.default.cyan("--help, -h")}                    Show this help message`);
    console.log(`  ${chalk_1.default.cyan("--version, -v")}                 Show version number`);
    console.log("");
    console.log(chalk_1.default.bold("Examples:"));
    console.log(chalk_1.default.gray("  $ git-account                    # Interactive: add account + configure folder"));
    console.log(chalk_1.default.gray("  $ git-account list               # See all saved accounts"));
    console.log(chalk_1.default.gray("  $ git-account current            # Check which account this folder uses"));
    console.log(chalk_1.default.gray("  $ git-account switch work-user   # Quickly switch this folder's account"));
    console.log("");
    console.log(chalk_1.default.gray(`  Docs: https://github.com/martinanatale93/git-account-cli`));
    console.log("");
}
// ── git-account list ───────────────────────────────────────────────
function listCommand() {
    const store = (0, accounts_1.loadAccounts)();
    if (store.accounts.length === 0) {
        (0, ui_1.showWarning)("No accounts configured yet.");
        (0, ui_1.showInfo)("Run `git-account` in a git repo to add your first account.");
        return;
    }
    // Try to detect current account from the folder's git config
    const currentDir = process.cwd();
    let currentUsername = null;
    if ((0, git_1.isGitRepo)(currentDir)) {
        const { email, name } = (0, git_1.getLocalGitUser)(currentDir);
        if (name) {
            currentUsername = name;
        }
    }
    console.log("");
    console.log(chalk_1.default.bold.cyan("Configured Git Accounts"));
    console.log("");
    store.accounts.forEach((account, index) => {
        const isCurrent = account.username === currentUsername;
        const marker = isCurrent ? chalk_1.default.green(" ◀ current") : "";
        const num = chalk_1.default.bold(`${index + 1}.`);
        console.log(`${num} ${chalk_1.default.bold.white(account.username)}${marker}`);
        console.log(chalk_1.default.gray(`   email: ${account.email}`));
        console.log(chalk_1.default.gray(`   ssh:   ${account.sshKeyPath}`));
        if (account.createdAt) {
            const date = new Date(account.createdAt).toLocaleDateString();
            console.log(chalk_1.default.gray(`   added: ${date}`));
        }
        console.log("");
    });
    if (currentUsername) {
        console.log(chalk_1.default.cyan(`Current account (this folder): ${currentUsername}`));
    }
    else {
        console.log(chalk_1.default.gray("Tip: run `git-account current` inside a git repo to see the active account."));
    }
    console.log("");
}
// ── git-account current ────────────────────────────────────────────
function currentCommand() {
    const currentDir = process.cwd();
    if (!(0, git_1.isGitRepo)(currentDir)) {
        (0, ui_1.showError)("Not inside a git repository.");
        (0, ui_1.showInfo)("Navigate to a git repo and try again.");
        process.exit(1);
    }
    const gitRoot = (0, git_1.getGitRoot)(currentDir);
    const workDir = gitRoot || currentDir;
    const { email, name } = (0, git_1.getLocalGitUser)(workDir);
    if (!email && !name) {
        (0, ui_1.showWarning)("No local git identity configured for this folder.");
        (0, ui_1.showInfo)("Run `git-account` to set one up, or `git-account switch <username>`.");
        return;
    }
    // Try to match with a saved account to get the SSH key info
    const store = (0, accounts_1.loadAccounts)();
    const matchedAccount = store.accounts.find((a) => a.username === name || a.email === email);
    console.log("");
    console.log(chalk_1.default.bold.cyan("Current Git Identity"));
    console.log(chalk_1.default.gray(`   Folder: ${workDir}`));
    console.log("");
    if (name)
        console.log(`   ${chalk_1.default.bold("Name:")}   ${name}`);
    if (email)
        console.log(`   ${chalk_1.default.bold("Email:")}  ${email}`);
    if (matchedAccount) {
        console.log(`   ${chalk_1.default.bold("SSH key:")} ${matchedAccount.sshKeyPath}`);
        console.log(`   ${chalk_1.default.bold("Host:")}    ${matchedAccount.sshHost}`);
    }
    else {
        (0, ui_1.showWarning)("This identity does not match any saved git-account profile.");
        (0, ui_1.showInfo)("Run `git-account` to register it.");
    }
    console.log("");
}
// ── git-account switch <username> ──────────────────────────────────
function switchCommand(username) {
    if (!username) {
        (0, ui_1.showError)("Missing username. Usage: git-account switch <username>");
        (0, ui_1.showInfo)("Run `git-account list` to see available accounts.");
        process.exit(1);
    }
    const currentDir = process.cwd();
    if (!(0, git_1.isGitRepo)(currentDir)) {
        (0, ui_1.showError)("Not inside a git repository.");
        (0, ui_1.showInfo)("Navigate to a git repo and try again.");
        process.exit(1);
    }
    const gitRoot = (0, git_1.getGitRoot)(currentDir);
    const workDir = gitRoot || currentDir;
    const account = (0, accounts_1.findAccountByUsername)(username);
    if (!account) {
        (0, ui_1.showError)(`Account "${username}" not found.`);
        (0, ui_1.showInfo)("Run `git-account list` to see available accounts.");
        const store = (0, accounts_1.loadAccounts)();
        if (store.accounts.length > 0) {
            console.log("");
            console.log(chalk_1.default.gray("Available accounts:"));
            for (const a of store.accounts) {
                console.log(chalk_1.default.gray(`  - ${a.username} (${a.email})`));
            }
        }
        process.exit(1);
    }
    // Apply account to the current repo
    (0, git_1.setLocalGitUser)(workDir, account.email, account.username);
    (0, git_1.setSshCommand)(workDir, account.sshKeyPath);
    // Convert remotes to use the correct SSH host alias
    const allRemotes = (0, git_1.getAllRemotes)(workDir);
    if (allRemotes.length > 0) {
        const { converted } = (0, git_1.convertAllRemotesToSsh)(workDir, account.sshHost);
        if (converted.length > 0) {
            for (const c of converted) {
                (0, ui_1.showInfo)(`Remote "${c.name}": ${c.oldUrl} → ${c.newUrl}`);
            }
        }
    }
    console.log("");
    (0, ui_1.showSuccess)(`Switched to account: ${chalk_1.default.bold(account.username)}`);
    console.log(`   ${chalk_1.default.bold("Email:")}   ${account.email}`);
    console.log(`   ${chalk_1.default.bold("SSH key:")} ${account.sshKeyPath}`);
    console.log(`   ${chalk_1.default.bold("Folder:")}  ${workDir}`);
    console.log("");
}
//# sourceMappingURL=commands.js.map