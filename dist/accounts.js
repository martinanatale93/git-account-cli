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
exports.loadAccounts = loadAccounts;
exports.saveAccounts = saveAccounts;
exports.addAccount = addAccount;
exports.findAccountByUsername = findAccountByUsername;
exports.getStoreDir = getStoreDir;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const STORE_DIR = path.join(os.homedir(), ".git-accounts");
const STORE_FILE = path.join(STORE_DIR, "accounts.json");
function ensureStoreDir() {
    if (!fs.existsSync(STORE_DIR)) {
        fs.mkdirSync(STORE_DIR, { recursive: true });
    }
}
function loadAccounts() {
    ensureStoreDir();
    if (!fs.existsSync(STORE_FILE)) {
        return { accounts: [] };
    }
    try {
        const raw = fs.readFileSync(STORE_FILE, "utf-8");
        return JSON.parse(raw);
    }
    catch {
        return { accounts: [] };
    }
}
function saveAccounts(store) {
    ensureStoreDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}
function addAccount(account) {
    const store = loadAccounts();
    // Replace if same username already exists
    const idx = store.accounts.findIndex((a) => a.username === account.username && a.email === account.email);
    if (idx >= 0) {
        store.accounts[idx] = account;
    }
    else {
        store.accounts.push(account);
    }
    saveAccounts(store);
}
function findAccountByUsername(username) {
    const store = loadAccounts();
    return store.accounts.find((a) => a.username === username);
}
function getStoreDir() {
    return STORE_DIR;
}
//# sourceMappingURL=accounts.js.map