import { Injectable } from '@nestjs/common';
import {
  DealBoard,
  BoardFilter,
  BoardTab,
  BoardColumn,
  BoardPermission,
  BoardStatus,
  BoardAudience,
  PermissionRole,
} from '@/entities';
import { InjectRepository } from '../database/inject-repository';
import { M04EntityRepository } from '../database/m04-entity.repository';

type FindOptionsWhere<T> = Partial<Record<keyof T & string, unknown>>;

@Injectable()
export class DealBoardRepository {
  constructor(
    @InjectRepository(DealBoard)
    private readonly boardRepository: M04EntityRepository<DealBoard>,
    @InjectRepository(BoardFilter)
    private readonly filterRepository: M04EntityRepository<BoardFilter>,
    @InjectRepository(BoardTab)
    private readonly tabRepository: M04EntityRepository<BoardTab>,
    @InjectRepository(BoardColumn)
    private readonly columnRepository: M04EntityRepository<BoardColumn>,
    @InjectRepository(BoardPermission)
    private readonly permissionRepository: M04EntityRepository<BoardPermission>,
  ) {}

  async create(board: Partial<DealBoard>): Promise<DealBoard> {
    const newBoard = this.boardRepository.create(board);
    return this.boardRepository.save(newBoard) as Promise<DealBoard>;
  }

  async findById(id: string, relations: string[] = []): Promise<DealBoard | null> {
    return this.boardRepository.findOne({
      where: { id },
      relations,
    });
  }

  async findByIdWithRelations(id: string): Promise<DealBoard | null> {
    return this.boardRepository.findOne({
      where: { id },
      relations: ['filters', 'tabs', 'columns', 'permissions'],
    });
  }

  async findAll(
    where: FindOptionsWhere<DealBoard>,
    page: number = 1,
    limit: number = 25,
  ): Promise<[DealBoard[], number]> {
    const skip = (page - 1) * limit;

    return this.boardRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { updatedAt: 'DESC' },
    });
  }

  async findAccessibleBoards(
    userId: string,
    filters: {
      audience?: BoardAudience;
      status?: BoardStatus;
      search?: string;
    },
    page: number = 1,
    limit: number = 25,
    userRole?: string,
  ): Promise<[DealBoard[], number]> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.boardRepository
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.permissions', 'permission');

    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      queryBuilder.where(
        '(permission.subjectId = :userId OR (board.status = :publishedStatus AND :aeAudience = ANY(board.audience)))',
        { userId, publishedStatus: BoardStatus.PUBLISHED, aeAudience: BoardAudience.AE },
      );
    }

    if (filters.audience) {
      queryBuilder.andWhere(':audience = ANY(board.audience)', {
        audience: filters.audience,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('board.status = :status', { status: filters.status });
    }

    if (filters.search) {
      queryBuilder.andWhere('board.name ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    queryBuilder.orderBy('board.updatedAt', 'DESC').skip(skip).take(limit);

    return queryBuilder.getManyAndCount();
  }

  async update(id: string, updates: Partial<DealBoard>): Promise<DealBoard | null> {
    await this.boardRepository.update(id, updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.boardRepository.delete(id);
  }

  async publish(id: string): Promise<DealBoard | null> {
    await this.boardRepository.update(id, {
      status: BoardStatus.PUBLISHED,
      publishedAt: new Date(),
    });
    return this.findById(id);
  }

  async unpublish(id: string): Promise<DealBoard | null> {
    await this.boardRepository.update(id, {
      status: BoardStatus.DRAFT,
      publishedAt: null as any,
    });
    return this.findById(id);
  }

  async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
    const query = this.boardRepository.createQueryBuilder('board').where('board.name = :name', {
      name,
    });

    if (excludeId) {
      query.andWhere('board.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async createFilters(boardId: string, filters: Partial<BoardFilter>[]): Promise<BoardFilter[]> {
    const filterEntities = filters.map((filter) =>
      this.filterRepository.create({ ...filter, boardId }),
    );
    return this.filterRepository.save(filterEntities);
  }

  async updateFilters(boardId: string, filters: Partial<BoardFilter>[]): Promise<BoardFilter[]> {
    await this.filterRepository.delete({ boardId });
    return this.createFilters(boardId, filters);
  }

  async createTabs(boardId: string, tabs: Partial<BoardTab>[]): Promise<BoardTab[]> {
    const tabEntities = tabs.map((tab) => this.tabRepository.create({ ...tab, boardId }));
    return this.tabRepository.save(tabEntities);
  }

  async updateTabs(boardId: string, tabs: Partial<BoardTab>[]): Promise<BoardTab[]> {
    await this.tabRepository.delete({ boardId });
    return this.createTabs(boardId, tabs);
  }

  async createColumns(boardId: string, columns: Partial<BoardColumn>[]): Promise<BoardColumn[]> {
    const columnEntities = columns.map((column) =>
      this.columnRepository.create({ ...column, boardId }),
    );
    return this.columnRepository.save(columnEntities);
  }

  async updateColumns(boardId: string, columns: Partial<BoardColumn>[]): Promise<BoardColumn[]> {
    await this.columnRepository.delete({ boardId });
    return this.createColumns(boardId, columns);
  }

  async createPermissions(
    boardId: string,
    permissions: Partial<BoardPermission>[],
  ): Promise<BoardPermission[]> {
    const permissionEntities = permissions.map((permission) =>
      this.permissionRepository.create({ ...permission, boardId }),
    );
    return this.permissionRepository.save(permissionEntities);
  }

  async updatePermissions(
    boardId: string,
    permissions: Partial<BoardPermission>[],
  ): Promise<BoardPermission[]> {
    await this.permissionRepository.delete({ boardId });
    return this.createPermissions(boardId, permissions);
  }

  async getUserPermission(boardId: string, userId: string, userRole?: string): Promise<PermissionRole | null> {
    if (userRole === 'ADMIN') {
      return PermissionRole.ADMIN;
    }
    if (userRole === 'MANAGER') {
      return PermissionRole.ADMIN;
    }

    const permission = await this.permissionRepository.findOne({
      where: {
        boardId,
        subjectId: userId,
      },
    });

    if (permission) {
      return permission.role;
    }

    const board = await this.boardRepository.findOne({ where: { id: boardId } });
    if (board && board.status === BoardStatus.PUBLISHED && board.audience.includes(BoardAudience.AE)) {
      return PermissionRole.VIEWER;
    }

    return null;
  }

  async hasAccess(boardId: string, userId: string, userRole?: string): Promise<boolean> {
    const permission = await this.getUserPermission(boardId, userId, userRole);
    return permission !== null;
  }

  async hasEditAccess(boardId: string, userId: string, userRole?: string): Promise<boolean> {
    const permission = await this.getUserPermission(boardId, userId, userRole);
    return permission === PermissionRole.EDITOR || permission === PermissionRole.ADMIN;
  }

  async hasAdminAccess(boardId: string, userId: string, userRole?: string): Promise<boolean> {
    const permission = await this.getUserPermission(boardId, userId, userRole);
    return permission === PermissionRole.ADMIN;
  }
}
