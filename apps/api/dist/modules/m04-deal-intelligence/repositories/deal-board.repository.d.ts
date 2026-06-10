import { DealBoard, BoardFilter, BoardTab, BoardColumn, BoardPermission, BoardStatus, BoardAudience, PermissionRole } from '@/entities';
import { M04EntityRepository } from '../database/m04-entity.repository';
type FindOptionsWhere<T> = Partial<Record<keyof T & string, unknown>>;
export declare class DealBoardRepository {
    private readonly boardRepository;
    private readonly filterRepository;
    private readonly tabRepository;
    private readonly columnRepository;
    private readonly permissionRepository;
    constructor(boardRepository: M04EntityRepository<DealBoard>, filterRepository: M04EntityRepository<BoardFilter>, tabRepository: M04EntityRepository<BoardTab>, columnRepository: M04EntityRepository<BoardColumn>, permissionRepository: M04EntityRepository<BoardPermission>);
    create(board: Partial<DealBoard>): Promise<DealBoard>;
    findById(id: string, relations?: string[]): Promise<DealBoard | null>;
    findByIdWithRelations(id: string): Promise<DealBoard | null>;
    findAll(where: FindOptionsWhere<DealBoard>, page?: number, limit?: number): Promise<[DealBoard[], number]>;
    findAccessibleBoards(userId: string, filters: {
        audience?: BoardAudience;
        status?: BoardStatus;
        search?: string;
    }, page?: number, limit?: number, userRole?: string): Promise<[DealBoard[], number]>;
    update(id: string, updates: Partial<DealBoard>): Promise<DealBoard | null>;
    delete(id: string): Promise<void>;
    publish(id: string): Promise<DealBoard | null>;
    unpublish(id: string): Promise<DealBoard | null>;
    checkNameExists(name: string, excludeId?: string): Promise<boolean>;
    createFilters(boardId: string, filters: Partial<BoardFilter>[]): Promise<BoardFilter[]>;
    updateFilters(boardId: string, filters: Partial<BoardFilter>[]): Promise<BoardFilter[]>;
    createTabs(boardId: string, tabs: Partial<BoardTab>[]): Promise<BoardTab[]>;
    updateTabs(boardId: string, tabs: Partial<BoardTab>[]): Promise<BoardTab[]>;
    createColumns(boardId: string, columns: Partial<BoardColumn>[]): Promise<BoardColumn[]>;
    updateColumns(boardId: string, columns: Partial<BoardColumn>[]): Promise<BoardColumn[]>;
    createPermissions(boardId: string, permissions: Partial<BoardPermission>[]): Promise<BoardPermission[]>;
    updatePermissions(boardId: string, permissions: Partial<BoardPermission>[]): Promise<BoardPermission[]>;
    getUserPermission(boardId: string, userId: string, userRole?: string): Promise<PermissionRole | null>;
    hasAccess(boardId: string, userId: string, userRole?: string): Promise<boolean>;
    hasEditAccess(boardId: string, userId: string, userRole?: string): Promise<boolean>;
    hasAdminAccess(boardId: string, userId: string, userRole?: string): Promise<boolean>;
}
export {};
