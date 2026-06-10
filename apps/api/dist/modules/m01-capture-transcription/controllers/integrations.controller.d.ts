export declare class IntegrationsController {
    list(req: Record<string, string>): {
        status: string;
        accountEmail: string;
        accountName: string;
        connectedAt: string;
        hasCredentials: boolean;
        provider: string;
        name: string;
        icon: string;
        color: string;
    }[];
    connect(provider: string): {
        status: string;
        message: string;
        accountEmail: string;
        accountName: string;
    };
    disconnect(provider: string): {
        status: string;
        message: string;
    };
}
