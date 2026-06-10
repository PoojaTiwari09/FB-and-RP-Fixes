export declare class M05AccountIntelligenceController {
    getModuleInfo(): {
        module: string;
        enabled: boolean;
        version: string;
        routes: {
            accounts: string;
            boards: string;
            webhooks: string;
            health: string;
        };
    };
}
