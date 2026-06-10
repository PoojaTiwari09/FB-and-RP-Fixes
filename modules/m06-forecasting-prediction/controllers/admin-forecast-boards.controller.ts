import { Prisma } from '@rri/database';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Headers,
  ForbiddenException,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminForecastBoardsService } from '../services/admin-forecast-boards.service';
import {
  CreateBoardDto,
  CreateBoardSchema,
  UpdateBoardDto,
  UpdateBoardSchema,
  UpdateColumnsDto,
  UpdateColumnsSchema,
  ReorderColumnsDto,
  ReorderColumnsSchema,
  UpdateCrmMappingDto,
  UpdateCrmMappingSchema,
  UpdateReminderConfigDto,
  UpdateReminderConfigSchema,
  UpdateQuotasDto,
  UpdateQuotasSchema,
  CreateColumnsFromCrmDto,
  CreateColumnsFromCrmSchema,
  UpdateColumnDto,
  UpdateColumnSchema,
  UpdateColumnVisibilityDto,
  UpdateColumnVisibilitySchema,
  UpdateStageMappingDto,
  UpdateStageMappingSchema,
} from '../schemas/admin-forecast-boards.schema';

const TenantHeader = 'X-Tenant-ID';

@Controller('api/v1/forecasting/admin/boards')
export class AdminForecastBoardsController {
  constructor(private readonly adminBoardsService: AdminForecastBoardsService) {}

  @Get()
  async getBoards(@Headers(TenantHeader.toLowerCase()) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.adminBoardsService.getBoards(tenantId);
  }

  @Get(':id')
  async getBoard(@Headers(TenantHeader.toLowerCase()) tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.adminBoardsService.getBoard(tenantId, id);
  }

  @Post()
  @ApiBody({ schema: { type: 'object' } })
  async createBoard(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Body() body: CreateBoardDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = CreateBoardSchema.parse(body);
    return this.adminBoardsService.createBoard(tenantId, data);
  }

  @Patch(':id')
  @ApiBody({ schema: { type: 'object' } })
  async updateBoard(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateBoardDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = UpdateBoardSchema.parse(body);
    return this.adminBoardsService.updateBoard(tenantId, id, data);
  }

  @Patch(':id/columns')
  @ApiBody({ schema: { type: 'object' } })
  async updateColumns(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateColumnsDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = UpdateColumnsSchema.parse(body);
    return this.adminBoardsService.updateBoardColumns(tenantId, id, data);
  }

  @Post(':id/columns/from-crm')
  @ApiBody({ schema: { type: 'object' } })
  async createColumnsFromCrm(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
    @Body() body: CreateColumnsFromCrmDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = CreateColumnsFromCrmSchema.parse(body);
    return this.adminBoardsService.createColumnsFromCrm(tenantId, id, data);
  }

  @Patch(':id/columns/:columnId')
  @ApiBody({ schema: { type: 'object' } })
  async updateColumn(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
    @Param('columnId') columnId: string,
    @Body() body: UpdateColumnDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = UpdateColumnSchema.parse(body);
    return this.adminBoardsService.updateColumn(tenantId, id, columnId, data);
  }

  @Patch(':id/columns/:columnId/visibility')
  @ApiBody({ schema: { type: 'object' } })
  async updateColumnVisibility(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
    @Param('columnId') columnId: string,
    @Body() body: UpdateColumnVisibilityDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = UpdateColumnVisibilitySchema.parse(body);
    return this.adminBoardsService.updateColumnVisibility(tenantId, id, columnId, data);
  }

  @Delete(':id/columns/:columnId')
  async deleteColumn(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
    @Param('columnId') columnId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.adminBoardsService.deleteColumn(tenantId, id, columnId);
  }

  @Post(':id/columns/reorder')
  @ApiBody({ schema: { type: 'object' } })
  async reorderColumns(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
    @Body() body: ReorderColumnsDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = ReorderColumnsSchema.parse(body);
    return this.adminBoardsService.reorderColumns(tenantId, id, data);
  }

  @Patch(':id/crm-mapping')
  @ApiBody({ schema: { type: 'object' } })
  async updateCrmMapping(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateCrmMappingDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = UpdateCrmMappingSchema.parse(body);
    return this.adminBoardsService.updateCrmMapping(tenantId, id, data);
  }

  @Get(':id/crm-mapping')
  async getCrmMapping(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.adminBoardsService.getCrmMapping(tenantId, id);
  }

  @Post(':id/stage-mapping')
  @ApiBody({ schema: { type: 'object' } })
  async updateStageMapping(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateStageMappingDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = UpdateStageMappingSchema.parse(body);
    return this.adminBoardsService.updateStageMapping(tenantId, id, data);
  }

  @Patch(':id/reminder-config')
  @ApiBody({ schema: { type: 'object' } })
  async updateReminderConfig(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateReminderConfigDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = UpdateReminderConfigSchema.parse(body);
    return this.adminBoardsService.updateReminderConfig(tenantId, id, data);
  }

  @Patch(':id/quotas')
  @ApiBody({ schema: { type: 'object' } })
  async updateQuotas(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateQuotasDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    const data = UpdateQuotasSchema.parse(body);
    return this.adminBoardsService.updateQuotas(tenantId, id, data);
  }

  @Post(':id/publish')
  async publishBoard(@Headers(TenantHeader.toLowerCase()) tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.adminBoardsService.publishBoard(tenantId, id);
  }

  @Patch(':id/save-draft')
  async saveDraft(@Headers(TenantHeader.toLowerCase()) tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.adminBoardsService.saveDraft(tenantId, id);
  }

  @Patch(':id/archive')
  async archiveBoard(@Headers(TenantHeader.toLowerCase()) tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.adminBoardsService.archiveBoard(tenantId, id);
  }

  @Get('crm/fields')
  async getCrmFields(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Query('object') objectType?: string,
    @Query('boardId') boardId?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.adminBoardsService.getCrmFields(tenantId, objectType, boardId);
  }

  @Post(':id/test-sync')
  async testSync(@Headers(TenantHeader.toLowerCase()) tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return (this.adminBoardsService as any).testSync(tenantId, id);
  }

  @Post(':id/test-reminder')
  async testReminder(@Headers(TenantHeader.toLowerCase()) tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return (this.adminBoardsService as any).testReminder(tenantId, id);
  }

  @Post(':id/quotas/import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async importQuotas(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    if (!file || !file.buffer) {
      throw new ForbiddenException('Quota import file required');
    }
    const csvContent = file.buffer.toString('utf-8');
    return this.adminBoardsService.importQuotas(tenantId, id, csvContent);
  }

  @Get(':id/permissions')
  async getPermissions(@Headers(TenantHeader.toLowerCase()) tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.adminBoardsService.getPermissions(tenantId, id);
  }

  @Get(':id/columns/:columnId/auto-submit-preview')
  async autoSubmitPreview(
    @Headers(TenantHeader.toLowerCase()) tenantId: string,
    @Param('id') id: string,
    @Param('columnId') columnId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.adminBoardsService.autoSubmitPreview(tenantId, id, columnId);
  }
}
