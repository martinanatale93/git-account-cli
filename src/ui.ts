import inquirer from "inquirer";
import chalk from "chalk";
import { Account } from "./accounts";

const NEW_ACCOUNT_VALUE = "__NEW_ACCOUNT__";

/**
 * Show the header banner.
 */
export function showHeader(currentDir: string): void {
  console.log("");
  console.log(chalk.bold.cyan("🔧 Git Account Manager"));
  console.log(chalk.gray(`   Current folder: ${currentDir}`));
  console.log("");
}

/**
 * Prompt the user to select an existing account or create new.
 * Returns the selected account or null if they want to create new.
 */
export async function promptSelectAccount(
  accounts: Account[]
): Promise<Account | null> {
  const choices = accounts.map((a) => ({
    name: `${a.email} (${a.username})`,
    value: a.username,
  }));

  choices.push(new inquirer.Separator() as any);
  choices.push({
    name: chalk.green("+ Add new account"),
    value: NEW_ACCOUNT_VALUE,
  });

  const { selection } = await inquirer.prompt([
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
export async function promptNewAccount(): Promise<{
  email: string;
  username: string;
}> {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message: "GitHub email address:",
      validate: (input: string) => {
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
      validate: (input: string) => {
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
export function showSshKey(publicKey: string): void {
  console.log("");
  console.log(
    chalk.yellow(
      "📋 Add this SSH key to your GitHub account:"
    )
  );
  console.log(
    chalk.yellow("   Go to: https://github.com/settings/ssh/new")
  );
  console.log("");
  console.log(chalk.gray("─".repeat(60)));
  console.log(chalk.white(publicKey));
  console.log(chalk.gray("─".repeat(60)));
  console.log("");
}

/**
 * Wait for user to confirm they've added the SSH key to GitHub.
 */
export async function promptConfirmKeyAdded(): Promise<boolean> {
  const { ready } = await inquirer.prompt([
    {
      type: "confirm",
      name: "ready",
      message:
        "Have you added the SSH key to your GitHub account? (press Enter to test connection)",
      default: true,
    },
  ]);
  return ready;
}

/**
 * Show auth success.
 */
export function showAuthSuccess(message: string): void {
  console.log(chalk.green(`✔ Auth successful! ${message}`));
}

/**
 * Show auth failure.
 */
export function showAuthFailure(message: string): void {
  console.log(chalk.red(`✖ Auth failed: ${message}`));
  console.log("");
  console.log(chalk.yellow("Possible reasons:"));
  console.log(
    chalk.yellow("  • The SSH key hasn't been added to your GitHub account yet")
  );
  console.log(
    chalk.yellow(
      "  • The SSH key was added to a different GitHub account"
    )
  );
  console.log(chalk.yellow("  • Network connectivity issue"));
  console.log("");
  console.log(
    chalk.gray("You can re-run git-account from this folder to try again.")
  );
}

/**
 * Show config success summary.
 */
export function showConfigSummary(
  dir: string,
  email: string,
  username: string,
  remoteUpdated: boolean
): void {
  console.log("");
  console.log(chalk.green(`✔ Git config set for ${dir}`));
  console.log(chalk.white(`  user.email = ${email}`));
  console.log(chalk.white(`  user.name  = ${username}`));
  if (remoteUpdated) {
    console.log(chalk.green(`✔ Remote origin updated to use SSH host alias`));
  }
  console.log("");
}

/**
 * Show a generic info message.
 */
export function showInfo(msg: string): void {
  console.log(chalk.cyan(`ℹ ${msg}`));
}

/**
 * Show a success message.
 */
export function showSuccess(msg: string): void {
  console.log(chalk.green(`✔ ${msg}`));
}

/**
 * Show a warning message.
 */
export function showWarning(msg: string): void {
  console.log(chalk.yellow(`⚠ ${msg}`));
}

/**
 * Show an error message.
 */
export function showError(msg: string): void {
  console.log(chalk.red(`✖ ${msg}`));
}

/**
 * Ask if user wants to skip SSH test and proceed anyway.
 */
export async function promptSkipTest(): Promise<boolean> {
  const { skip } = await inquirer.prompt([
    {
      type: "confirm",
      name: "skip",
      message:
        "Do you want to set up the local git config anyway? (You can test SSH later)",
      default: true,
    },
  ]);
  return skip;
}

/**
 * Ask if user wants to initialize a git repo in the folder.
 */
export async function promptInitRepo(): Promise<boolean> {
  const { init } = await inquirer.prompt([
    {
      type: "confirm",
      name: "init",
      message:
        "This folder is not a git repository. Do you want to initialize one?",
      default: true,
    },
  ]);
  return init;
}

/**
 * Warn about HTTPS remotes and ask if user wants to convert them.
 */
export async function promptConvertHttpsRemotes(
  httpsRemotes: { name: string; url: string }[]
): Promise<boolean> {
  console.log("");
  console.log(
    chalk.yellow("⚠  HTTPS remote(s) detected — these will NOT use your SSH key:")
  );
  for (const r of httpsRemotes) {
    console.log(chalk.yellow(`   ${r.name} → ${r.url}`));
  }
  console.log("");
  console.log(
    chalk.gray(
      "   HTTPS remotes use cached credentials (e.g. macOS Keychain) which may"
    )
  );
  console.log(
    chalk.gray(
      "   belong to a different GitHub account. Converting to SSH ensures the"
    )
  );
  console.log(
    chalk.gray("   correct account is used for push/pull.")
  );
  console.log("");

  const { convert } = await inquirer.prompt([
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
export function showRemoteConversionResults(
  converted: { name: string; oldUrl: string; newUrl: string }[],
  failed: { name: string; url: string; reason: string }[]
): void {
  for (const c of converted) {
    console.log(chalk.green(`✔ Remote "${c.name}" converted:`));
    console.log(chalk.gray(`   ${c.oldUrl}`));
    console.log(chalk.white(`   → ${c.newUrl}`));
  }
  for (const f of failed) {
    console.log(chalk.red(`✖ Remote "${f.name}" could not be converted:`));
    console.log(chalk.gray(`   ${f.url}`));
    console.log(chalk.red(`   Reason: ${f.reason}`));
  }
  if (converted.length > 0) {
    console.log("");
  }
}
