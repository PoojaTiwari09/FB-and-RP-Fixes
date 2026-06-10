import { DealDriversMatrix, Period } from '../entities/deal-drivers.entities';
export declare class MatrixCache {
    private store;
    key(managerId: string, boardId: string, period: Period): string;
    get(key: string): DealDriversMatrix | null;
    set(key: string, data: DealDriversMatrix, period: Period): void;
    invalidateByBoard(boardId: string): void;
}
