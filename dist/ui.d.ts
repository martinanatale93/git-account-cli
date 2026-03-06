import { Account } from "./accounts";
/**
 * Show the header banner.
 */
export declare function showHeader(currentDir: string): void;
/**
 * Prompt the user to select an existing account or create new.
 * Returns the selected account or null if they want to create new.
 */
export declare function promptSelectAccount(accounts: Account[]): Promise<Account | null>;
/**
 * Prompt for new account details (email and username).
 */
export declare function promptNewAccount(): Promise<{
    email: string;
    username: string;
}>;
/**
 * Display the SSH public key for the user to copy.
 */
export declare function showSshKey(publicKey: string): void;
/**
 * Wait for user to confirm they've added the SSH key to GitHub.
 */
export declare function promptConfirmKeyAdded(): Promise<boolean>;
/**
 * Show auth success.
 */
export declare function showAuthSuccess(message: string): void;
/**
 * Show auth failure.
 */
export declare function showAuthFailure(message: string): void;
/**
 * Show config success summary.
 */
export declare function showConfigSummary(dir: string, email: string, username: string, remoteUpdated: boolean): void;
/**
 * Show a generic info message.
 */
export declare function showInfo(msg: string): void;
/**
 * Show a success message.
 */
export declare function showSuccess(msg: string): void;
/**
 * Show a warning message.
 */
export declare function showWarning(msg: string): void;
/**
 * Show an error message.
 */
export declare function showError(msg: string): void;
/**
 * Ask if user wants to skip SSH test and proceed anyway.
 */
export declare function promptSkipTest(): Promise<boolean>;
/**
 * Ask if user wants to initialize a git repo in the folder.
 */
export declare function promptInitRepo(): Promise<boolean>;
/**
 * Warn about HTTPS remotes and ask if user wants to convert them.
 */
export declare function promptConvertHttpsRemotes(httpsRemotes: {
    name: string;
    url: string;
}[]): Promise<boolean>;
/**
 * Show the results of remote conversion.
 */
export declare function showRemoteConversionResults(converted: {
    name: string;
    oldUrl: string;
    newUrl: string;
}[], failed: {
    name: string;
    url: string;
    reason: string;
}[]): void;
//# sourceMappingURL=ui.d.ts.map