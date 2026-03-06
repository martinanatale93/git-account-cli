export interface RemoteInfo {
    name: string;
    url: string;
    type: "fetch" | "push";
}
/**
 * Check if the current directory is inside a Git repository.
 */
export declare function isGitRepo(dir: string): boolean;
/**
 * Initialize a git repo if one doesn't exist.
 */
export declare function initGitRepo(dir: string): void;
/**
 * Set local (folder-level) git user config.
 */
export declare function setLocalGitUser(dir: string, email: string, username: string): void;
/**
 * Get the current remote URL for a given remote name (if any).
 */
export declare function getRemoteUrl(dir: string, remoteName?: string): string | null;
/**
 * Get ALL remotes with their URLs.
 */
export declare function getAllRemotes(dir: string): RemoteInfo[];
/**
 * Check if a remote URL is HTTPS (not SSH).
 */
export declare function isHttpsRemote(url: string): boolean;
/**
 * Get unique remote names that have HTTPS URLs.
 */
export declare function getHttpsRemotes(dir: string): {
    name: string;
    url: string;
}[];
/**
 * Extract owner/repo from any GitHub remote URL format.
 * Handles:
 *   - https://github.com/owner/repo.git
 *   - https://github.com/owner/repo
 *   - https://user:token@github.com/owner/repo.git
 *   - git@github.com:owner/repo.git
 *   - git@github-alias:owner/repo.git
 *   - ssh://git@github.com/owner/repo.git
 *   - github-alias:owner/repo.git
 */
export declare function extractOwnerRepo(url: string): string | null;
/**
 * Convert a single remote to use the SSH host alias.
 * Returns the new URL or null if conversion failed.
 */
export declare function convertRemoteToSsh(dir: string, remoteName: string, sshHost: string): string | null;
/**
 * Convert ALL remotes (origin, upstream, etc.) to use the SSH host alias.
 * Returns a summary of what was converted.
 */
export declare function convertAllRemotesToSsh(dir: string, sshHost: string): {
    converted: {
        name: string;
        oldUrl: string;
        newUrl: string;
    }[];
    failed: {
        name: string;
        url: string;
        reason: string;
    }[];
};
/**
 * Legacy wrapper: update origin remote only. Kept for backward compatibility.
 */
export declare function updateRemoteToSshHost(dir: string, sshHost: string): boolean;
/**
 * Set the SSH command for this repo to use a specific key directly.
 * This is a fallback/additional measure beyond ~/.ssh/config.
 */
export declare function setSshCommand(dir: string, privateKeyPath: string): void;
/**
 * Get the Git root directory for the current folder.
 */
export declare function getGitRoot(dir: string): string | null;
/**
 * Get current local git user config for display.
 */
export declare function getLocalGitUser(dir: string): {
    email: string | null;
    name: string | null;
};
//# sourceMappingURL=git.d.ts.map