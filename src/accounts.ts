import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface Account {
  email: string;
  username: string;
  sshKeyPath: string; // path to private key
  sshHost: string; // e.g. "github-john-work"
  createdAt: string;
}

export interface AccountStore {
  accounts: Account[];
}

const STORE_DIR = path.join(os.homedir(), ".git-accounts");
const STORE_FILE = path.join(STORE_DIR, "accounts.json");

function ensureStoreDir(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

export function loadAccounts(): AccountStore {
  ensureStoreDir();
  if (!fs.existsSync(STORE_FILE)) {
    return { accounts: [] };
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw) as AccountStore;
  } catch {
    return { accounts: [] };
  }
}

export function saveAccounts(store: AccountStore): void {
  ensureStoreDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export function addAccount(account: Account): void {
  const store = loadAccounts();
  // Replace if same username already exists
  const idx = store.accounts.findIndex(
    (a) => a.username === account.username && a.email === account.email
  );
  if (idx >= 0) {
    store.accounts[idx] = account;
  } else {
    store.accounts.push(account);
  }
  saveAccounts(store);
}

export function findAccountByUsername(username: string): Account | undefined {
  const store = loadAccounts();
  return store.accounts.find((a) => a.username === username);
}

export function getStoreDir(): string {
  return STORE_DIR;
}
