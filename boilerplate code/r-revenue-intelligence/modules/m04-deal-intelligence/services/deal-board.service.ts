import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DealBoardRepository } from '@/repositories/deal-board.repository';
import { AuditLogService } from './audit-log.service';
import {
  CreateBoardDto,
  UpdateBoardDto,
  QueryBoardDto,
  BoardResponseDto,
  BoardListItemResponseDto,
  PaginatedBoardResponseDto,
} from '@/schemas';
import { DealBoard, BoardStatus, AuditAction, AuditEntityType } from '@/entities';

@Injectable()
export class DealBoardService {
  constructor(
    private readonly boardRepository: DealBoardRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createBoard(dto: CreateBoardDto, userId: string, userRole?: string): Promise<BoardResponseDto> {
    // Check if board name already exists
    const nameExists = await this.boardRepository.checkNameExists(dto.name);
    if (nameExists) {
      throw new ConflictException(`Board with name "${dto.name}" already exists`);
    }

    // Validate at least one filter exists
    if (!dto.filters || dto.filters.length === 0) {
      throw new BadRequestException('At least one filter is required');
    }

    // Validate at least one tab exists
    if (!dto.tabs || dto.tabs.length === 0) {
      throw new BadRequestException('At least one tab is required');
    }

    // Validate at least one column exists
    if (!dto.columns || dto.columns.length === 0) {
      throw new BadRequestException('At least one column is required');
    }

    // Create board
    const board = await this.boardRepository.create({
      name: dto.name,
      description: dto.description,
      audience: dto.audience,
      ownerId: userId,
      isLocked: dto.isLocked ?? false,
      allowRepColumnReorder: dto.allowRepColumnReorder ?? false,
      preventManualDealOverride: dto.preventManualDealOverride ?? true,
      status: BoardStatus.DRAFT,
    });

    // Create filters
    await this.boardRepository.createFilters(board.id, dto.filters);

    // Create tabs
    await this.boardRepository.createTabs(board.id, dto.tabs);

    // Create columns
    await this.boardRepository.createColumns(board.id, dto.columns);

    // Create permissions
    const permissionsWithGrantedBy = dto.permissions.map((p: any) => ({
      ...p,
      grantedBy: userId,
    }));
    await this.boardRepository.createPermissions(board.id, permissionsWithGrantedBy);

    // Log audit
    await this.auditLogService.log({
      entityType: AuditEntityType.BOARD,
      entityId: board.id,
      action: AuditAction.CREATE,
      userId,
      changesAfter: { name: board.name, status: board.status },
    });

    // Return full board with relations
    return this.getBoardById(board.id, userId, userRole);
  }

  async getBoardById(id: string, userId: string, userRole?: string): Promise<BoardResponseDto> {
    const board = await this.boardRepository.findByIdWithRelations(id);

    if (!board) {
      throw new NotFoundException(`Board with ID "${id}" not found`);
    }

    const userPermission = await this.boardRepository.getUserPermission(id, userId, userRole);
    if (userPermission === null) {
      throw new ForbiddenException('You do not have access to this board');
    }

    return {
      ...this.mapToResponseDto(board),
      userPermission,
    } as any;
  }

  async listBoards(
    query: QueryBoardDto,
    userId: string,
    userRole?: string,
  ): Promise<PaginatedBoardResponseDto> {
    const { page = 1, limit = 25, audience, status, search, accessibleOnly = true } = query;

    let boards: DealBoard[];
    let total: number;

    if (accessibleOnly) {
      [boards, total] = await this.boardRepository.findAccessibleBoards(
        userId,
        { audience, status, search },
        page,
        limit,
        userRole,
      );
    } else {
      [boards, total] = await this.boardRepository.findAll(
        {
          ...(audience && { audience }),
          ...(status && { status }),
        },
        page,
        limit,
      );
    }

    // Get user permissions for each board
    const boardsWithPermissions = await Promise.all(
      boards.map(async (board) => {
        const userPermission = await this.boardRepository.getUserPermission(board.id, userId, userRole);
        return {
          ...board,
          userPermission,
        };
      }),
    );

    return {
      data: boardsWithPermissions.map(this.mapToListItemDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateBoard(
    id: string,
    dto: UpdateBoardDto,
    userId: string,
    userRole?: string,
  ): Promise<BoardResponseDto> {
    const board = await this.boardRepository.findByIdWithRelations(id);

    if (!board) {
      throw new NotFoundException(`Board with ID "${id}" not found`);
    }

    // Check edit access
    const hasEditAccess = await this.boardRepository.hasEditAccess(id, userId, userRole);
    if (!hasEditAccess) {
      throw new ForbiddenException('You do not have permission to edit this board');
    }

    // Check if board is locked
    if (board.isLocked) {
      throw new ForbiddenException('This board is locked and cannot be edited');
    }

    // Check name uniqueness if name is being updated
    if (dto.name && dto.name !== board.name) {
      const nameExists = await this.boardRepository.checkNameExists(dto.name, id);
      if (nameExists) {
        throw new ConflictException(`Board with name "${dto.name}" already exists`);
      }
    }

    const changesBefore = { ...board };

    // Update board metadata
    if (dto.name || dto.description || dto.audience || dto.isLocked !== undefined) {
      await this.boardRepository.update(id, {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.audience && { audience: dto.audience }),
        ...(dto.isLocked !== undefined && { isLocked: dto.isLocked }),
        ...(dto.allowRepColumnReorder !== undefined && {
          allowRepColumnReorder: dto.allowRepColumnReorder,
        }),
        ...(dto.preventManualDealOverride !== undefined && {
          preventManualDealOverride: dto.preventManualDealOverride,
        }),
      });
    }

    // Update filters if provided
    if (dto.filters) {
      await this.boardRepository.updateFilters(id, dto.filters);
    }

    // Update tabs if provided
    if (dto.tabs) {
      await this.boardRepository.updateTabs(id, dto.tabs);
    }

    // Update columns if provided
    if (dto.columns) {
      await this.boardRepository.updateColumns(id, dto.columns);
    }

    // Update permissions if provided
    if (dto.permissions) {
      const permissionsWithGrantedBy = dto.permissions.map((p: any) => ({
        ...p,
        grantedBy: userId,
      }));
      await this.boardRepository.updatePermissions(id, permissionsWithGrantedBy);
    }

    const updatedBoard = await this.boardRepository.findByIdWithRelations(id);

    if (!updatedBoard) {
      throw new NotFoundException(`Board with ID "${id}" not found after update`);
    }

    // Log audit
    await this.auditLogService.log({
      entityType: AuditEntityType.BOARD,
      entityId: id,
      action: AuditAction.UPDATE,
      userId,
      changesBefore: { name: changesBefore.name, status: changesBefore.status },
      changesAfter: { name: updatedBoard.name, status: updatedBoard.status },
    });

    return this.mapToResponseDto(updatedBoard);
  }

  async deleteBoard(id: string, userId: string, userRole?: string): Promise<void> {
    const board = await this.boardRepository.findById(id);

    if (!board) {
      throw new NotFoundException(`Board with ID "${id}" not found`);
    }

    // Check admin access
    const hasAdminAccess = await this.boardRepository.hasAdminAccess(id, userId, userRole);
    if (!hasAdminAccess) {
      throw new ForbiddenException('You do not have permission to delete this board');
    }

    await this.boardRepository.delete(id);

    // Log audit
    await this.auditLogService.log({
      entityType: AuditEntityType.BOARD,
      entityId: id,
      action: AuditAction.DELETE,
      userId,
      changesBefore: { name: board.name, status: board.status },
    });
  }

  async publishBoard(id: string, userId: string, userRole?: string): Promise<BoardResponseDto> {
    const board = await this.boardRepository.findById(id);

    if (!board) {
      throw new NotFoundException(`Board with ID "${id}" not found`);
    }

    // Check admin access
    const hasAdminAccess = await this.boardRepository.hasAdminAccess(id, userId, userRole);
    if (!hasAdminAccess) {
      throw new ForbiddenException('You do not have permission to publish this board');
    }

    if (board.status === BoardStatus.PUBLISHED) {
      throw new BadRequestException('Board is already published');
    }

    await this.boardRepository.publish(id);

    // Log audit
    await this.auditLogService.log({
      entityType: AuditEntityType.BOARD,
      entityId: id,
      action: AuditAction.PUBLISH,
      userId,
      changesBefore: { status: BoardStatus.DRAFT },
      changesAfter: { status: BoardStatus.PUBLISHED },
    });

    return this.getBoardById(id, userId, userRole);
  }

  async unpublishBoard(id: string, userId: string, userRole?: string): Promise<BoardResponseDto> {
    const board = await this.boardRepository.findById(id);

    if (!board) {
      throw new NotFoundException(`Board with ID "${id}" not found`);
    }

    // Check admin access
    const hasAdminAccess = await this.boardRepository.hasAdminAccess(id, userId, userRole);
    if (!hasAdminAccess) {
      throw new ForbiddenException('You do not have permission to unpublish this board');
    }

    if (board.status !== BoardStatus.PUBLISHED) {
      throw new BadRequestException('Board is not published');
    }

    await this.boardRepository.unpublish(id);

    // Log audit
    await this.auditLogService.log({
      entityType: AuditEntityType.BOARD,
      entityId: id,
      action: AuditAction.UNPUBLISH,
      userId,
      changesBefore: { status: BoardStatus.PUBLISHED },
      changesAfter: { status: BoardStatus.DRAFT },
    });

    return this.getBoardById(id, userId, userRole);
  }

  private mapToResponseDto(board: DealBoard): BoardResponseDto {
    return {
      id: board.id,
      name: board.name,
      description: board.description,
      audience: board.audience,
      status: board.status,
      ownerId: board.ownerId,
      isLocked: board.isLocked,
      allowRepColumnReorder: board.allowRepColumnReorder,
      preventManualDealOverride: board.preventManualDealOverride,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      publishedAt: board.publishedAt,
      filters: board.filters || [],
      tabs: board.tabs || [],
      columns: board.columns || [],
      permissions: board.permissions || [],
    };
  }

  private mapToListItemDto(board: DealBoard & { userPermission: any }): BoardListItemResponseDto {
    return {
      id: board.id,
      name: board.name,
      description: board.description,
      audience: board.audience,
      status: board.status,
      ownerId: board.ownerId,
      updatedAt: board.updatedAt,
      userPermission: board.userPermission,
    };
  }
}
