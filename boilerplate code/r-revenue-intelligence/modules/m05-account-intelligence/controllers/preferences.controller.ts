import { Controller, Get, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { PreferencesService } from '../services/preferences.service';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get(':role/last-board')
  async getLastViewedBoard(@Param('role') role: string) {
    return this.preferencesService.getLastViewedBoard(role);
  }

  @Get(':role')
  async getAllPreferences(@Param('role') role: string) {
    const preferences = await this.preferencesService.getAllPreferences(role);
    return { preferences };
  }

  @Put(':role/:boardId')
  async upsertPreferences(
    @Param('role') role: string,
    @Param('boardId') boardId: string,
    @Body() prefs: {
      active_tab_id?: string;
      sort_field?: string;
      sort_dir?: string;
      filters?: Record<string, any>;
      page_size?: number;
    },
  ) {
    return this.preferencesService.upsertPreferences(role, boardId, prefs);
  }

  @Delete(':role')
  async clearPreferences(
    @Param('role') role: string,
    @Query('board_id') boardId?: string,
  ) {
    return this.preferencesService.clearPreferences(role, boardId);
  }
}
