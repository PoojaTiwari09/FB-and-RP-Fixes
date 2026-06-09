import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DealBoardService } from '@/services/deal-board.service';
import {
  CreateBoardDto,
  UpdateBoardDto,
  QueryBoardDto,
  BoardResponseDto,
  PaginatedBoardResponseDto,
} from '@/schemas';
import { AuthGuard } from '@/guards/auth.guard';
import { RolesGuard } from '@/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '@/interfaces/user-role.enum';

@ApiTags('Deal Boards')
@Controller('boards')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class DealBoardController {
  constructor(private readonly boardService: DealBoardService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new deal board' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Board created successfully',
    type: BoardResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Board name already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async createBoard(@Body() dto: CreateBoardDto, @Req() req: any): Promise<BoardResponseDto> {
    return this.boardService.createBoard(dto, req.user.id, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'List all accessible deal boards' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Boards retrieved successfully',
    type: PaginatedBoardResponseDto,
  })
  async listBoards(
    @Query() query: QueryBoardDto,
    @Req() req: any,
  ): Promise<PaginatedBoardResponseDto> {
    return this.boardService.listBoards(query, req.user.id, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get board by ID' })
  @ApiParam({ name: 'id', description: 'Board ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Board retrieved successfully',
    type: BoardResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Board not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async getBoardById(@Param('id') id: string, @Req() req: any): Promise<BoardResponseDto> {
    return this.boardService.getBoardById(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update board configuration' })
  @ApiParam({ name: 'id', description: 'Board ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Board updated successfully',
    type: BoardResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Board not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied or board is locked' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Board name already exists' })
  async updateBoard(
    @Param('id') id: string,
    @Body() dto: UpdateBoardDto,
    @Req() req: any,
  ): Promise<BoardResponseDto> {
    return this.boardService.updateBoard(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a board' })
  @ApiParam({ name: 'id', description: 'Board ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Board deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Board not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async deleteBoard(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.boardService.deleteBoard(id, req.user.id, req.user.role);
  }

  @Post(':id/publish')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Publish a board' })
  @ApiParam({ name: 'id', description: 'Board ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Board published successfully',
    type: BoardResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Board not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Board is already published' })
  async publishBoard(@Param('id') id: string, @Req() req: any): Promise<BoardResponseDto> {
    return this.boardService.publishBoard(id, req.user.id, req.user.role);
  }

  @Post(':id/unpublish')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Unpublish a board' })
  @ApiParam({ name: 'id', description: 'Board ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Board unpublished successfully',
    type: BoardResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Board not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Board is not published' })
  async unpublishBoard(@Param('id') id: string, @Req() req: any): Promise<BoardResponseDto> {
    return this.boardService.unpublishBoard(id, req.user.id, req.user.role);
  }
}
