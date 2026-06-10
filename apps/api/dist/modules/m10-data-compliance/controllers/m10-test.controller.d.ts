import { RevenueGraphService } from '../revenue-graph/services/revenue-graph.service';
import { PrismaService } from '../database/prisma.service';
export declare class M10TestController {
    private readonly graph;
    private readonly prisma;
    constructor(graph: RevenueGraphService, prisma: PrismaService);
    health(): {
        success: boolean;
        module: string;
        status: string;
    };
    smoke(): {
        success: boolean;
        module: string;
        entityResolution: {
            similarity: number;
            bestMatch: import("../revenue-graph/entity-resolution/entity-resolution.engine").MatchCandidate;
            ambiguous: boolean;
        };
        checks: string[];
    };
    accounts(req: any): Promise<import("../revenue-graph/dto/response-revenue-graph.dto").PaginatedResponseDto<import("../revenue-graph/dto/response-revenue-graph.dto").AccountResponseDto>>;
    seed(): Promise<any>;
}
