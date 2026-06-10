import { DealDriversApiRepository } from '../repositories/deal-drivers-api.repository';
import { DealCatalogService } from './deal-catalog.service';
import type { CreateDealDriverDto, UpdateDealDriverDto, DealDriverRecord } from '../interfaces/deal-driver.types';
export declare class DealDriversApiService {
    private readonly repo;
    private readonly catalog;
    constructor(repo: DealDriversApiRepository, catalog: DealCatalogService);
    private attachDealContext;
    list(filters: {
        dealId?: string;
        boardId?: string;
    }): Promise<DealDriverRecord[]>;
    getById(id: string): Promise<DealDriverRecord>;
    create(dto: CreateDealDriverDto): Promise<DealDriverRecord>;
    update(id: string, dto: UpdateDealDriverDto): Promise<DealDriverRecord>;
    remove(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
    listByDealId(dealId: string): Promise<DealDriverRecord[]>;
}
