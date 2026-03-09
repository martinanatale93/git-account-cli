# git-account

A cross-platform CLI tool that lets you use **different GitHub accounts for different folders** on your machine. No more juggling SSH keys or git configs manually.

## The Problem

You have multiple GitHub accounts (e.g. personal + work) and need different folders to authenticate with different accounts. Normally this requires manually editing `~/.ssh/config`, generating keys, and setting per-repo git configs — tedious and error-prone.

## The Solution

Run one command from any folder:

```bash
git-account
```

The CLI will:

1. Show your previously configured GitHub accounts (or let you add a new one)
2. Generate a dedicated SSH key for the account
3. Display the public key for you to add to GitHub
4. Test the SSH connection and confirm authentication
5. Configure the folder's git identity and SSH settings automatically
6. **Detect HTTPS remotes** and convert them to SSH (so the correct account is always used)

Or use subcommands for quick actions:

```bash
git-account list               # See all configured accounts
git-account current            # Check which account this folder uses
git-account switch <username>  # Instantly switch account for this folder
```

## Requirements

- **Node.js** 16 or later
- **Git** installed
- **ssh-keygen** available (comes with macOS/Linux; on Windows use Git Bash or WSL)

## Installation

### Option 1: Install from npm (recommended)

```bash
npm install -g git-account-cli
```

That's it. `git-account` is now available from any folder.

**Or run it without installing:**

```bash
npx git-account-cli
```

### Option 2: Install from source

```bash
# Clone the repo
git clone https://github.com/martinanatale93/git-account-cli.git
cd git-account-cli

# Install dependencies
npm install

# Build
npm run build

# Install globally (makes 'git-account' available from any folder)
npm link
```

After this, `git-account` works from **any directory** on your machine — no need to be in this project folder.

### Updating

```bash
# If installed via npm:
npm update -g git-account-cli

# If installed from source:
cd git-account-cli && git pull && npm install && npm run build
```

> The CLI will automatically notify you when a newer version is available.

> **Windows users:** All install methods work in Git Bash, PowerShell, or CMD. `npm install -g` and `npm link` both create a global `.cmd` shim so the command works everywhere.

## Usage

### Quick Reference

```bash
git-account                      # Interactive setup (add account + configure folder)
git-account list                 # List all configured accounts
git-account current              # Show active account for current folder
git-account switch <username>    # Switch account for current folder
git-account --help               # Show help
git-account --version            # Show version
```

### Interactive Setup

#### 1. Navigate to the folder you want to configure

```bash
cd ~/projects/my-work-repo
```

#### 2. Run the command

```bash
git-account
```

#### 3. Follow the interactive prompts

**If you have existing accounts configured:**

```
🔧 Git Account Manager
   Current folder: /Users/you/projects/my-work-repo

? Which GitHub account do you want to use for this folder?
  ❯ john@company.com (john-work)
    personal@gmail.com (john-personal)
    ── Add new account ──
```

Pick one, and the folder is immediately configured.

**If you're adding a new account:**

```
? GitHub email address: john@company.com
? GitHub username: john-work

ℹ Generating SSH key...
✔ SSH key generated: ~/.ssh/github_john-work
✔ SSH config updated

📋 Add this SSH key to your GitHub account:
   Go to: https://github.com/settings/ssh/new

────────────────────────────────────────────────────────
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... john@company.com
────────────────────────────────────────────────────────

? Have you added the SSH key to your GitHub account? Yes

ℹ Testing SSH connection...
✔ Auth successful! Hi john-work! You've successfully authenticated...

✔ Git config set for /Users/you/projects/my-work-repo
  user.email = john@company.com
  user.name  = john-work
✔ Remote origin updated to use SSH host alias

✔ All done! This folder is now configured.
```

### Listing Accounts

```bash
git-account list
```

```
Configured Git Accounts

1. john-work ◀ current
   email: john@company.com
   ssh:   /Users/you/.ssh/github_john-work
   added: 3/6/2026

2. john-personal
   email: john@gmail.com
   ssh:   /Users/you/.ssh/github_john-personal
   added: 3/1/2026

Current account (this folder): john-work
```

### Checking Current Account

```bash
git-account current
```

```
Current Git Identity
   Folder: /Users/you/projects/my-work-repo

   Name:   john-work
   Email:  john@company.com
   SSH key: /Users/you/.ssh/github_john-work
   Host:    github-john-work
```

### Switching Accounts

```bash
git-account switch john-personal
```

```
✔ Switched to account: john-personal
   Email:   john@gmail.com
   SSH key: /Users/you/.ssh/github_john-personal
   Folder:  /Users/you/projects/my-work-repo
```

This updates the folder's git identity, SSH key, and remote URLs in one step.

## How It Works

Under the hood, `git-account` does the following:

### SSH Keys
- Generates an **Ed25519 SSH key** per GitHub account, stored at `~/.ssh/github_<username>`
- Adds a **host alias** to `~/.ssh/config` so each account has its own SSH identity:

  ```
  Host github-john-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_john-work
    IdentitiesOnly yes
  ```

### Git Config (per folder)
- Sets **local** git config (not global) so only that folder is affected:

  ```
  git config --local user.email "john@company.com"
  git config --local user.name "john-work"
  git config --local core.sshCommand "ssh -i ~/.ssh/github_john-work -o IdentitiesOnly=yes"
  ```

- Updates the **remote origin URL** to use the host alias (e.g. `git@github-john-work:owner/repo.git`)

### Account Registry
- All configured accounts are saved in `~/.git-accounts/accounts.json` so you can reuse them across folders without re-entering details or regenerating keys.

## Example: Setting Up Two Accounts

```bash
# Configure work account for work projects
cd ~/projects/work-repo
git-account
# → Add new account → john@company.com / john-work
# → Copy SSH key → Add to your work GitHub account

# Configure personal account for personal projects
cd ~/projects/personal-repo
git-account
# → Add new account → john@gmail.com / john-personal
# → Copy SSH key → Add to your personal GitHub account

# Later, reuse work account on another work project
cd ~/projects/another-work-repo
git-account
# → Select "john@company.com (john-work)" from the list
# → Done instantly, no new key needed
```

Once both accounts are set up, switching is instant:

```bash
cd ~/projects/some-repo
git-account switch john-work       # Use work account here

cd ~/projects/another-repo
git-account switch john-personal   # Use personal account here

# Verify anytime:
git-account current
git-account list
```

## Compatibility

### Git GUI Tools

Because `git-account` uses standard Git config (`user.email`, `user.name`, `core.sshCommand`) stored in each repo's `.git/config`, it works with any tool that calls Git under the hood:

| Tool | Commits (identity) | Push / Pull (SSH auth) |
|---|---|---|
| Git CLI | ✅ | ✅ |
| VS Code | ✅ | ✅ |
| GitKraken | ✅ | ✅ |
| SourceTree | ✅ | ✅ |
| Tower | ✅ | ✅ |
| IntelliJ / WebStorm | ✅ | ✅ |
| GitHub Desktop | ✅ | ❌ (uses its own HTTPS auth) |

> **GitHub Desktop** ignores SSH config and manages authentication through its own UI. Commit identity (name/email) will still be correct, but push/pull uses GitHub Desktop's own login — not the SSH key from `git-account`.

### Forking

Forking happens on GitHub's website using whichever account you're logged into in the browser — that's separate from local SSH config. After you **clone** a fork, just run `git-account` in the cloned folder and select the matching account. If the account is already in your registry, no new key is needed — it's instant.

### New Clones

After cloning any repo, run `git-account` once in the new folder to set up the correct identity and SSH key.

### HTTPS Remote Detection

If your repo uses an HTTPS remote (e.g. `https://github.com/owner/repo.git`), `git-account` will **automatically detect it** and ask if you want to convert it to SSH. This is important because HTTPS remotes use cached credentials (like macOS Keychain) which may belong to a different GitHub account.

```
⚠  HTTPS remote(s) detected — these will NOT use your SSH key:
   origin → https://github.com/owner/repo.git

? Convert this remote from HTTPS to SSH? (Y/n)
```

This is handled for **all remotes** — `origin`, `upstream`, and any others.

### Pushing a New Repo

To push a local project to a new GitHub repo:

1. Create the repo on [github.com/new](https://github.com/new) (keep it empty — no README or .gitignore)
2. Run `git-account` in your project folder to configure the account
3. Add the remote using your SSH host alias:
   ```bash
   git remote add origin git@github-YOUR_USERNAME:YOUR_USERNAME/repo-name.git
   ```
   Replace `YOUR_USERNAME` with the username you entered in `git-account`.
4. Push:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

## Troubleshooting

### "Auth failed" after adding SSH key
- Make sure you added the key to the **correct** GitHub account (the one matching the username you entered)
- Go to [github.com/settings/keys](https://github.com/settings/keys) and verify the key is listed
- The CLI will show you the specific error message from SSH

### "This folder is not a git repository"
- The CLI will offer to run `git init` for you
- Alternatively, run `git init` yourself before running `git-account`

### SSH key already exists
- If a key for that username already exists at `~/.ssh/github_<username>`, it will be **reused** (not overwritten)
- To regenerate, delete the old key files first: `rm ~/.ssh/github_<username> ~/.ssh/github_<username>.pub`

### Command not found after install
- Make sure npm's global bin directory is in your PATH
- Check with: `npm prefix -g` — the `bin` subfolder should be in your PATH
- On macOS with nvm/fnm, this is usually handled automatically

## Uninstalling

```bash
# Remove the global command
npm unlink -g git-account

# Optionally remove saved accounts
rm -rf ~/.git-accounts

# Optionally remove generated SSH keys
rm ~/.ssh/github_*
```

## Support

If this tool saved you time, consider supporting its development:

<a href="https://buymeacoffee.com/martinanatale" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50"></a>

Your support helps me keep building and maintaining free, open-source developer tools. Thank you!

## License

MIT
