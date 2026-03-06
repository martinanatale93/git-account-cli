/**
 * Generate an SSH key pair for a GitHub account.
 * Returns the path to the private key.
 */
export declare function generateSshKey(email: string, username: string): {
    privateKeyPath: string;
    publicKeyPath: string;
};
/**
 * Read the public key content so the user can copy it.
 */
export declare function readPublicKey(publicKeyPath: string): string;
/**
 * Build the SSH host alias for this account.
 * e.g. "github-john-work" which maps to github.com with a specific key.
 */
export declare function getSshHost(username: string): string;
/**
 * Add or update an entry in ~/.ssh/config for this account.
 */
export declare function updateSshConfig(sshHost: string, privateKeyPath: string): void;
/**
 * Test SSH connection to GitHub using the host alias.
 * Returns { success, message }.
 */
export declare function testSshConnection(sshHost: string): {
    success: boolean;
    message: string;
};
/**
 * Start the SSH agent and add the key.
 */
export declare function addKeyToAgent(privateKeyPath: string): void;
//# sourceMappingURL=ssh.d.ts.map