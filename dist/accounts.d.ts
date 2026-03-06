export interface Account {
    email: string;
    username: string;
    sshKeyPath: string;
    sshHost: string;
    createdAt: string;
}
export interface AccountStore {
    accounts: Account[];
}
export declare function loadAccounts(): AccountStore;
export declare function saveAccounts(store: AccountStore): void;
export declare function addAccount(account: Account): void;
export declare function findAccountByUsername(username: string): Account | undefined;
export declare function getStoreDir(): string;
//# sourceMappingURL=accounts.d.ts.map