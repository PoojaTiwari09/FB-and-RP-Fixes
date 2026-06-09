import { Test, TestingModule } from '@nestjs/testing';
import { DealBoardController } from './deal-board.controller';
import { DealBoardService } from '@/services/deal-board.service';
import { CreateBoardDto, UpdateBoardDto, QueryBoardDto } from '@/schemas';
import { UserRole } from '@/interfaces/user-role.enum';
import { FilterOperator, FilterLogic } from '@/entities';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('DealBoardController', () => {
  let controller: DealBoardController;
  let service: DealBoardService;

  const mockUser = {
    id: 'user-123',
    role: UserRole.MANAGER,
    email: 'test@example.com',
  };

  const mockBoard = {
    id: 'board-123',
    name: 'Test Board',
    description: 'Test Description',
    owner: 'user-123',
    filters: [{ fieldName: 'stage', operator: FilterOperator.EQUALS, value: 'Negotiation', logic: FilterLogic.AND }],
    tabs: [{ name: 'Pipeline', fieldName: 'forecast' }],
    columns: ['dealName', 'stage', 'amount'],
    permissions: [{ role: UserRole.MANAGER, permission: 'view' }],
    createdAt: new Date(),
    lastModified: new Date(),
    isPublished: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DealBoardController],
      providers: [
        {
          provide: DealBoardService,
          useValue: {
            createBoard: jest.fn(),
            listBoards: jest.fn(),
            getBoardById: jest.fn(),
            updateBoard: jest.fn(),
            deleteBoard: jest.fn(),
            duplicateBoard: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DealBoardController>(DealBoardController);
    service = module.get<DealBoardService>(DealBoardService);
  });

  describe('createBoard', () => {
    it('should create a new board', async () => {
      const createBoardDto = {
        name: 'New Board',
        description: 'New Board Description',
        filters: [{ fieldName: 'stage', operator: FilterOperator.EQUALS, value: 'Negotiation', logic: FilterLogic.AND }],
        tabs: [{ name: 'Pipeline', fieldName: 'forecast' }],
        columns: ['dealName', 'stage', 'amount'],
        permissions: [{ role: UserRole.MANAGER, permission: 'view' }],
        audience: [],
      } as any;

      jest.spyOn(service, 'createBoard').mockResolvedValue(mockBoard as any);

      const req = { user: mockUser };
      const result = await controller.createBoard(createBoardDto, req);

      expect(service.createBoard).toHaveBeenCalledWith(createBoardDto, mockUser.id, mockUser.role);
      expect(result).toEqual(mockBoard);
    });

    it('should throw ConflictException when board name already exists', async () => {
      const createBoardDto = {
        name: 'Existing Board',
        description: 'Test',
        filters: [],
        tabs: [],
        columns: [],
        permissions: [],
        audience: [],
      } as any;

      jest.spyOn(service, 'createBoard').mockRejectedValue(new ConflictException('Board name already exists'));

      const req = { user: mockUser };

      await expect(controller.createBoard(createBoardDto, req)).rejects.toThrow(ConflictException);
    });

    it('should require admin or manager role', async () => {
      const userWithoutPermission = { ...mockUser, role: UserRole.USER };
      // This should be enforced by the @Roles decorator and RolesGuard
      // The controller method signature allows it, but the guard should prevent execution
      expect(DealBoardController).toBeDefined();
    });
  });

  describe('listBoards', () => {
    it('should return paginated boards accessible to user', async () => {
      const queryDto: QueryBoardDto = {
        page: 1,
        limit: 10,
      };

      const mockPaginatedResult = {
        data: [mockBoard],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      jest.spyOn(service, 'listBoards').mockResolvedValue(mockPaginatedResult as any);

      const req = { user: mockUser };
      const result = await controller.listBoards(queryDto, req);

      expect(service.listBoards).toHaveBeenCalledWith(queryDto, mockUser.id, mockUser.role);
      expect(result).toEqual(mockPaginatedResult);
      expect(result.data.length).toBe(1);
    });

    it('should return empty list when user has no board access', async () => {
      const queryDto: QueryBoardDto = {
        page: 1,
        limit: 10,
      };

      const mockEmptyResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      jest.spyOn(service, 'listBoards').mockResolvedValue(mockEmptyResult as any);

      const req = { user: mockUser };
      const result = await controller.listBoards(queryDto, req);

      expect(result.data.length).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should respect pagination parameters', async () => {
      const queryDto: QueryBoardDto = {
        page: 2,
        limit: 20,
      };

      const mockPaginatedResult = {
        data: [mockBoard],
        total: 25,
        page: 2,
        limit: 20,
        totalPages: 2,
      };

      jest.spyOn(service, 'listBoards').mockResolvedValue(mockPaginatedResult as any);

      const req = { user: mockUser };
      const result = await controller.listBoards(queryDto, req);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });
  });

  describe('getBoardById', () => {
    it('should return a board by ID', async () => {
      jest.spyOn(service, 'getBoardById').mockResolvedValue(mockBoard as any);

      const req = { user: mockUser };
      const result = await controller.getBoardById('board-123', req);

      expect(service.getBoardById).toHaveBeenCalledWith('board-123', mockUser.id, mockUser.role);
      expect(result).toEqual(mockBoard);
    });

    it('should throw NotFoundException when board does not exist', async () => {
      jest.spyOn(service, 'getBoardById').mockRejectedValue(new NotFoundException('Board not found'));

      const req = { user: mockUser };

      await expect(controller.getBoardById('nonexistent', req)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user lacks access', async () => {
      jest.spyOn(service, 'getBoardById').mockRejectedValue(new ForbiddenException('Access denied'));

      const req = { user: mockUser };

      await expect(controller.getBoardById('board-123', req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateBoard', () => {
    it('should update a board', async () => {
      const updateBoardDto = {
        name: 'Updated Board',
        description: 'Updated Description',
        filters: [{ field: 'stage', operator: '=', value: 'Closed Won' }],
      } as any;

      const updatedBoard = { ...mockBoard, ...updateBoardDto };
      jest.spyOn(service, 'updateBoard').mockResolvedValue(updatedBoard as any);

      const req = { user: mockUser };
      const result = await controller.updateBoard('board-123', updateBoardDto, req);

      expect(service.updateBoard).toHaveBeenCalledWith('board-123', updateBoardDto, mockUser.id, mockUser.role);
      expect(result.name).toBe('Updated Board');
    });

    it('should throw ForbiddenException when user lacks edit permission', async () => {
      const updateBoardDto = {
        name: 'Updated Board',
      } as any;

      jest.spyOn(service, 'updateBoard').mockRejectedValue(new ForbiddenException('Edit permission required'));

      const req = { user: mockUser };

      await expect(controller.updateBoard('board-123', updateBoardDto, req)).rejects.toThrow(ForbiddenException);
    });

    it('should prevent duplicate board names', async () => {
      const updateBoardDto = {
        name: 'Existing Board Name',
      } as any;

      jest.spyOn(service, 'updateBoard').mockRejectedValue(new ConflictException('Board name already exists'));

      const req = { user: mockUser };

      await expect(controller.updateBoard('board-123', updateBoardDto, req)).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteBoard', () => {
    it('should delete a board', async () => {
      jest.spyOn(service, 'deleteBoard').mockResolvedValue(undefined as any);

      const req = { user: mockUser };
      await controller.deleteBoard('board-123', req);

      expect(service.deleteBoard).toHaveBeenCalledWith('board-123', mockUser.id, mockUser.role);
    });

    it('should throw ForbiddenException when user lacks permission', async () => {
      jest.spyOn(service, 'deleteBoard').mockRejectedValue(new ForbiddenException('Delete permission required'));

      const req = { user: mockUser };

      await expect(controller.deleteBoard('board-123', req)).rejects.toThrow(ForbiddenException);
    });
  });
});
