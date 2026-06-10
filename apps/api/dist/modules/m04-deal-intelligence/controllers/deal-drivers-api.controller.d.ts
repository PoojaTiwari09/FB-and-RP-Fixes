import { DealDriversApiService } from '../services/deal-drivers-api.service';
import type { CreateDealDriverDto, UpdateDealDriverDto } from '../interfaces/deal-driver.types';
interface ApiResponse<T> {
    success: boolean;
    data: T;
}
export declare class DealDriversApiController {
    private readonly dealDrivers;
    constructor(dealDrivers: DealDriversApiService);
    list(dealId?: string, boardId?: string): Promise<ApiResponse<unknown[]>>;
    create(body: CreateDealDriverDto): Promise<ApiResponse<unknown>>;
    getOne(id: string): Promise<ApiResponse<unknown>>;
    update(id: string, body: UpdateDealDriverDto): Promise<ApiResponse<unknown>>;
    remove(id: string): Promise<ApiResponse<unknown>>;
}
export {};
