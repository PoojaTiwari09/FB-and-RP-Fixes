import { Controller, Get, Put, Post, Delete, Patch, Param, Body } from '@nestjs/common';
import { BoardsService } from '../services/boards.service';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  async getAllBoards() {
    const boards = await this.boardsService.getAllBoards();
    return { boards };
  }

  @Get('team')
  async getTeam() {
    const team = await this.boardsService.getTeam();
    return { team };
  }

  @Get('permissions/:role')
  async getPermissions(@Param('role') role: string) {
    const permissions = await this.boardsService.getPermissions(role);
    return { permissions };
  }

  @Get(':slug')
  async getBoardBySlug(@Param('slug') slug: string) {
    const board = await this.boardsService.getBoardBySlug(slug);
    if (!board) {
      return { error: 'Board not found' };
    }
    return { board };
  }

  // ── Phase 3A: Board Creation ──────────────────────────────────────
  @Post()
  async createBoard(@Body() body: { step: number; data: any }) {
    const result = await this.boardsService.createBoard(body.step, body.data);
    // On step 4, result is the full board; on steps 1–3, result is { step, valid }
    if (body.step === 4) return { board: result };
    return result;
  }

  // ── Phase 2: Board CRUD ───────────────────────────────────────────
  @Put(':slug')
  async updateBoard(@Param('slug') slug: string, @Body() body: any) {
    const board = await this.boardsService.updateBoard(slug, body);
    return { board };
  }

  @Post(':slug/duplicate')
  async duplicateBoard(@Param('slug') slug: string) {
    const board = await this.boardsService.duplicateBoard(slug);
    return { board };
  }

  @Delete(':slug')
  async deleteBoard(@Param('slug') slug: string) {
    return this.boardsService.deleteBoard(slug);
  }

  // ── Phase 3B: Column Config ───────────────────────────────────────
  @Post(':slug/columns')
  async addColumn(@Param('slug') slug: string, @Body() body: any) {
    const col = await this.boardsService.addColumn(slug, body);
    return { column: col };
  }

  @Put(':slug/columns/:colId')
  async updateColumn(
    @Param('slug') slug: string,
    @Param('colId') colId: string,
    @Body() body: any,
  ) {
    const col = await this.boardsService.updateColumn(slug, colId, body);
    return { column: col };
  }

  @Delete(':slug/columns/:colId')
  async deleteColumn(@Param('slug') slug: string, @Param('colId') colId: string) {
    return this.boardsService.deleteColumn(slug, colId);
  }

  // ── Phase 4A: Brief Config ────────────────────────────────────────
  @Patch(':slug/brief-config')
  async updateBriefConfig(@Param('slug') slug: string, @Body() body: any) {
    const board = await this.boardsService.updateBriefConfig(slug, body);
    return { board };
  }
}
