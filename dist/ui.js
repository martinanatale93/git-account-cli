"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showHeader = showHeader;
exports.promptSelectAccount = promptSelectAccount;
exports.promptNewAccount = promptNewAccount;
exports.showSshKey = showSshKey;
exports.promptConfirmKeyAdded = promptConfirmKeyAdded;
exports.showAuthSuccess = showAuthSuccess;
exports.showAuthFailure = showAuthFailure;
exports.showConfigSummary = showConfigSummary;
exports.showInfo = showInfo;
exports.showSuccess = showSuccess;
exports.showWarning = showWarning;
exports.showError = showError;
exports.promptSkipTest = promptSkipTest;
exports.promptInitRepo = promptInitRepo;
exports.promptConvertHttpsRemotes = promptConvertHttpsRemotes;
exports.showRemoteConversionResults = showRemoteConversionResults;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const NEW_ACCOUNT_VALUE = "__NEW_ACCOUNT__";
/**
 * Show the header banner.
 */
function showHeader(currentDir) {
    console.log("");
    console.log(chalk_1.default.bold.cyan("🔧 Git Account Manager"));
    console.log(chalk_1.default.gray(`   Current folder: ${currentDir}`));
    console.log("");
}
/**
 * Prompt the user to select an existing account or create new.
 * Returns the selected account or null if they want to create new.
 */
async function promptSelectAccount(accounts) {
    const choices = accounts.map((a) => ({
        name: `${a.email} (${a.username})`,
        value: a.username,
    }));
    choices.push(new inquirer_1.default.Separator());
    choices.push({
        name: chalk_1.default.green("+ Add new account"),
        value: NEW_ACCOUNT_VALUE,
    });
    const { selection } = await inquirer_1.default.prompt([
        {
            type: "list",
            name: "selection",
            message: "Which GitHub account do you want to use for this folder?",
            choices,
        },
    ]);
    if (selection === NEW_ACCOUNT_VALUE) {
        return null;
    }
    return accounts.find((a) => a.username === selection) || null;
}
/**
 * Prompt for new account details (email and username).
 */
async function promptNewAccount() {
    const answers = await inquirer_1.default.prompt([
        {
            type: "input",
            name: "email",
            message: "GitHub email address:",
            validate: (input) => {
                if (!input || !input.includes("@")) {
                    return "Please enter a valid email address";
                }
                return true;
            },
        },
        {
            type: "input",
            name: "username",
            message: "GitHub username:",
            validate: (input) => {
                if (!input || input.trim().length === 0) {
                    return "Please enter a GitHub username";
                }
                if (/[^a-zA-Z0-9_-]/.test(input)) {
                    return "Username should only contain letters, numbers, hyphens, and underscores";
                }
                return true;
            },
        },
    ]);
    return { email: answers.email.trim(), username: answers.username.trim() };
}
/**
 * Display the SSH public key for the user to copy.
 */
function showSshKey(publicKey) {
    console.log("");
    console.log(chalk_1.default.yellow("📋 Add this SSH key to your GitHub account:"));
    console.log(chalk_1.default.yellow("   Go to: https://github.com/settings/ssh/new"));
    console.log("");
    console.log(chalk_1.default.gray("─".repeat(60)));
    console.log(chalk_1.default.white(publicKey));
    console.log(chalk_1.default.gray("─".repeat(60)));
    console.log("");
}
/**
 * Wait for user to confirm they've added the SSH key to GitHub.
 */
async function promptConfirmKeyAdded() {
    const { ready } = await inquirer_1.default.prompt([
        {
            type: "confirm",
            name: "ready",
            message: "Have you added the SSH key to your GitHub account? (press Enter to test connection)",
            default: true,
        },
    ]);
    return ready;
}
/**
 * Show auth success.
 */
function showAuthSuccess(message) {
    console.log(chalk_1.default.green(`✔ Auth successful! ${message}`));
}
/**
 * Show auth failure.
 */
function showAuthFailure(message) {
    console.log(chalk_1.default.red(`✖ Auth failed: ${message}`));
    console.log("");
    console.log(chalk_1.default.yellow("Possible reasons:"));
    console.log(chalk_1.default.yellow("  • The SSH key hasn't been added to your GitHub account yet"));
    console.log(chalk_1.default.yellow("  • The SSH key was added to a different GitHub account"));
    console.log(chalk_1.default.yellow("  • Network connectivity issue"));
    console.log("");
    console.log(chalk_1.default.gray("You can re-run git-account from this folder to try again."));
}
/**
 * Show config success summary.
 */
function showConfigSummary(dir, email, username, remoteUpdated) {
    console.log("");
    console.log(chalk_1.default.green(`✔ Git config set for ${dir}`));
    console.log(chalk_1.default.white(`  user.email = ${email}`));
    console.log(chalk_1.default.white(`  user.name  = ${username}`));
    if (remoteUpdated) {
        console.log(chalk_1.default.green(`✔ Remote origin updated to use SSH host alias`));
    }
    console.log("");
}
/**
 * Show a generic info message.
 */
function showInfo(msg) {
    console.log(chalk_1.default.cyan(`ℹ ${msg}`));
}
/**
 * Show a success message.
 */
function showSuccess(msg) {
    console.log(chalk_1.default.green(`✔ ${msg}`));
}
/**
 * Show a warning message.
 */
function showWarning(msg) {
    console.log(chalk_1.default.yellow(`⚠ ${msg}`));
}
/**
 * Show an error message.
 */
function showError(msg) {
    console.log(chalk_1.default.red(`✖ ${msg}`));
}
/**
 * Ask if user wants to skip SSH test and proceed anyway.
 */
async function promptSkipTest() {
    const { skip } = await inquirer_1.default.prompt([
        {
            type: "confirm",
            name: "skip",
            message: "Do you want to set up the local git config anyway? (You can test SSH later)",
            default: true,
        },
    ]);
    return skip;
}
/**
 * Ask if user wants to initialize a git repo in the folder.
 */
async function promptInitRepo() {
    const { init } = await inquirer_1.default.prompt([
        {
            type: "confirm",
            name: "init",
            message: "This folder is not a git repository. Do you want to initialize one?",
            default: true,
        },
    ]);
    return init;
}
/**
 * Warn about HTTPS remotes and ask if user wants to convert them.
 */
async function promptConvertHttpsRemotes(httpsRemotes) {
    console.log("");
    console.log(chalk_1.default.yellow("⚠  HTTPS remote(s) detected — these will NOT use your SSH key:"));
    for (const r of httpsRemotes) {
        console.log(chalk_1.default.yellow(`   ${r.name} → ${r.url}`));
    }
    console.log("");
    console.log(chalk_1.default.gray("   HTTPS remotes use cached credentials (e.g. macOS Keychain) which may"));
    console.log(chalk_1.default.gray("   belong to a different GitHub account. Converting to SSH ensures the"));
    console.log(chalk_1.default.gray("   correct account is used for push/pull."));
    console.log("");
    const { convert } = await inquirer_1.default.prompt([
        {
            type: "confirm",
            name: "convert",
            message: `Convert ${httpsRemotes.length === 1 ? "this remote" : `all ${httpsRemotes.length} remotes`} from HTTPS to SSH?`,
            default: true,
        },
    ]);
    return convert;
}
/**
 * Show the results of remote conversion.
 */
function showRemoteConversionResults(converted, failed) {
    for (const c of converted) {
        console.log(chalk_1.default.green(`✔ Remote "${c.name}" converted:`));
        console.log(chalk_1.default.gray(`   ${c.oldUrl}`));
        console.log(chalk_1.default.white(`   → ${c.newUrl}`));
    }
    for (const f of failed) {
        console.log(chalk_1.default.red(`✖ Remote "${f.name}" could not be converted:`));
        console.log(chalk_1.default.gray(`   ${f.url}`));
        console.log(chalk_1.default.red(`   Reason: ${f.reason}`));
    }
    if (converted.length > 0) {
        console.log("");
    }
}
//# sourceMappingURL=ui.js.map