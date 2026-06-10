export declare class M07TestController {
    health(): {
        success: boolean;
        module: string;
        status: string;
        timestamp: string;
    };
    smoke(): {
        success: boolean;
        module: string;
        checks: string[];
        endpoints: {
            sampleDashboard: string;
            widgetCatalog: string;
        };
    };
}
