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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForUpdates = checkForUpdates;
const https = __importStar(require("https"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const PACKAGE_NAME = "git-account-cli";
/**
 * Get the current version from package.json.
 */
function getCurrentVersion() {
    try {
        const pkgPath = path.join(__dirname, "..", "package.json");
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        return pkg.version || "0.0.0";
    }
    catch {
        return "0.0.0";
    }
}
/**
 * Fetch the latest version from the npm registry.
 * Returns null if the request fails (network error, not published yet, etc.)
 */
function fetchLatestVersion() {
    return new Promise((resolve) => {
        const url = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
        const req = https.get(url, { timeout: 3000 }, (res) => {
            if (res.statusCode !== 200) {
                resolve(null);
                return;
            }
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.version || null);
                }
                catch {
                    resolve(null);
                }
            });
        });
        req.on("error", () => resolve(null));
        req.on("timeout", () => {
            req.destroy();
            resolve(null);
        });
    });
}
/**
 * Compare two semver strings. Returns:
 *  1 if a > b
 *  0 if a === b
 * -1 if a < b
 */
function compareSemver(a, b) {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na > nb)
            return 1;
        if (na < nb)
            return -1;
    }
    return 0;
}
/**
 * Check for updates and print a message if a newer version is available.
 * This is non-blocking and silent on failure — it should never prevent
 * the tool from running.
 */
async function checkForUpdates() {
    try {
        const current = getCurrentVersion();
        const latest = await fetchLatestVersion();
        if (!latest)
            return; // Not published yet or network error — skip silently
        if (compareSemver(latest, current) > 0) {
            console.log("");
            console.log(chalk_1.default.yellow(`  ⚠ Update available: ${chalk_1.default.gray(current)} → ${chalk_1.default.green(latest)}`));
            console.log(chalk_1.default.yellow(`    Run: ${chalk_1.default.cyan(`npm update -g ${PACKAGE_NAME}`)}`));
            console.log("");
        }
    }
    catch {
        // Never let update check break the tool
    }
}
//# sourceMappingURL=update-checker.js.map