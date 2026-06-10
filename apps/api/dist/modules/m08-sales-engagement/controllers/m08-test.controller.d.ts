export declare class M08TestController {
    health(): {
        success: boolean;
        module: string;
        status: string;
    };
    smoke(): {
        success: boolean;
        module: string;
        checks: string[];
    };
}
