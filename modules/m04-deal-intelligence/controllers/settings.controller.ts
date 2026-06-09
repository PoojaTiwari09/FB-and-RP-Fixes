import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SettingsService } from '@/services/settings.service';
import {
  SaveFiltersRequestDto,
  GetFiltersResponseDto,
  SaveViewSettingsRequestDto,
  GetViewSettingsResponseDto,
  SaveNotificationSettingsRequestDto,
  GetNotificationSettingsResponseDto,
  SaveCoachingSettingsRequestDto,
  GetCoachingSettingsResponseDto,
  SaveGlobalSettingsRequestDto,
  GetGlobalSettingsResponseDto,
  AllSettingsResponseDto,
} from '@/schemas/settings.dto';
import { AuthGuard } from '@/guards/auth.guard';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(AuthGuard)
@ApiCookieAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ============= Filter Settings =============

  @Post('filters')
  @ApiOperation({
    summary: 'Save filter settings',
    description: 'Save user filter preferences for a board or globally',
  })
  @ApiResponse({
    status: 200,
    description: 'Filters saved successfully',
    type: GetFiltersResponseDto,
  })
  async saveFilters(
    @Body() dto: SaveFiltersRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GetFiltersResponseDto> {
    return this.settingsService.saveFilters(req.user.id, dto);
  }

  @Get('filters')
  @ApiOperation({
    summary: 'Get filter settings',
    description: 'Get user filter preferences for a board or globally',
  })
  @ApiQuery({ name: 'boardId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Filters retrieved successfully',
    type: GetFiltersResponseDto,
  })
  async getFilters(
    @Query('boardId') boardId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<GetFiltersResponseDto> {
    return this.settingsService.getFilters(req.user.id, boardId);
  }

  // ============= View Settings =============

  @Post('view')
  @ApiOperation({
    summary: 'Save view settings',
    description: 'Save user view preferences (columns, sort, group by, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'View settings saved successfully',
    type: GetViewSettingsResponseDto,
  })
  async saveViewSettings(
    @Body() dto: SaveViewSettingsRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GetViewSettingsResponseDto> {
    return this.settingsService.saveViewSettings(req.user.id, dto);
  }

  @Get('view')
  @ApiOperation({
    summary: 'Get view settings',
    description: 'Get user view preferences for a board or globally',
  })
  @ApiQuery({ name: 'boardId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'View settings retrieved successfully',
    type: GetViewSettingsResponseDto,
  })
  async getViewSettings(
    @Query('boardId') boardId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<GetViewSettingsResponseDto> {
    return this.settingsService.getViewSettings(req.user.id, boardId);
  }

  // ============= Notification Settings =============

  @Post('notifications')
  @ApiOperation({
    summary: 'Save notification settings',
    description: 'Save user notification preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification settings saved successfully',
    type: GetNotificationSettingsResponseDto,
  })
  async saveNotificationSettings(
    @Body() dto: SaveNotificationSettingsRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GetNotificationSettingsResponseDto> {
    return this.settingsService.saveNotificationSettings(req.user.id, dto);
  }

  @Get('notifications')
  @ApiOperation({
    summary: 'Get notification settings',
    description: 'Get user notification preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification settings retrieved successfully',
    type: GetNotificationSettingsResponseDto,
  })
  async getNotificationSettings(
    @Req() req: AuthenticatedRequest,
  ): Promise<GetNotificationSettingsResponseDto> {
    return this.settingsService.getNotificationSettings(req.user.id);
  }

  // ============= Coaching Settings (Manager Only) =============

  @Post('coaching')
  @ApiOperation({
    summary: 'Save coaching settings',
    description: 'Save manager coaching preferences (manager only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Coaching settings saved successfully',
    type: GetCoachingSettingsResponseDto,
  })
  async saveCoachingSettings(
    @Body() dto: SaveCoachingSettingsRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GetCoachingSettingsResponseDto> {
    return this.settingsService.saveCoachingSettings(req.user.id, dto);
  }

  @Get('coaching')
  @ApiOperation({
    summary: 'Get coaching settings',
    description: 'Get manager coaching preferences (manager only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Coaching settings retrieved successfully',
    type: GetCoachingSettingsResponseDto,
  })
  async getCoachingSettings(
    @Req() req: AuthenticatedRequest,
  ): Promise<GetCoachingSettingsResponseDto> {
    return this.settingsService.getCoachingSettings(req.user.id);
  }

  // ============= Global Settings =============

  @Post('global')
  @ApiOperation({
    summary: 'Save global settings',
    description: 'Save user global preferences (timezone, theme, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Global settings saved successfully',
    type: GetGlobalSettingsResponseDto,
  })
  async saveGlobalSettings(
    @Body() dto: SaveGlobalSettingsRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GetGlobalSettingsResponseDto> {
    return this.settingsService.saveGlobalSettings(req.user.id, dto);
  }

  @Get('global')
  @ApiOperation({
    summary: 'Get global settings',
    description: 'Get user global preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Global settings retrieved successfully',
    type: GetGlobalSettingsResponseDto,
  })
  async getGlobalSettings(
    @Req() req: AuthenticatedRequest,
  ): Promise<GetGlobalSettingsResponseDto> {
    return this.settingsService.getGlobalSettings(req.user.id);
  }

  // ============= All Settings =============

  @Get('all')
  @ApiOperation({
    summary: 'Get all settings',
    description: 'Get all user settings in one response',
  })
  @ApiResponse({
    status: 200,
    description: 'All settings retrieved successfully',
    type: AllSettingsResponseDto,
  })
  async getAllSettings(
    @Req() req: AuthenticatedRequest,
  ): Promise<AllSettingsResponseDto> {
    return this.settingsService.getAllSettings(req.user.id);
  }

  // ============= Delete Settings =============

  @Delete()
  @ApiOperation({
    summary: 'Delete specific settings',
    description: 'Delete a specific preference setting',
  })
  @ApiQuery({ name: 'preferenceKey', required: true, type: String })
  @ApiQuery({ name: 'boardId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Settings deleted successfully',
  })
  async deleteSettings(
    @Query('preferenceKey') preferenceKey: string,
    @Query('boardId') boardId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    await this.settingsService.deleteSettings(req.user.id, preferenceKey, boardId);
    return { message: 'Settings deleted successfully' };
  }

  @Delete('all')
  @ApiOperation({
    summary: 'Reset all settings',
    description: 'Reset all user settings to defaults',
  })
  @ApiResponse({
    status: 200,
    description: 'All settings reset successfully',
  })
  async resetAllSettings(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    await this.settingsService.resetAllSettings(req.user.id);
    return { message: 'All settings reset successfully' };
  }
}
