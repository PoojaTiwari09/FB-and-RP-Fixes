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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { DealPlaybookService } from '@/services/deal-playbook.service';
import {
  CreatePlaybookItemDto,
  UpdatePlaybookItemDto,
  PlaybookItemResponseDto,
  PlaybookSummaryDto,
  PlaybookType,
  GeneratePlaybookSuggestionsDto,
} from '@/schemas/playbook.dto';
import { AuthGuard } from '@/guards/auth.guard';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';

@ApiTags('Deal Playbooks')
@Controller('deals/:dealId/playbook')
@UseGuards(AuthGuard)
@ApiCookieAuth()
export class DealPlaybookController {
  constructor(private readonly playbookService: DealPlaybookService) {}

  @Get()
  @ApiOperation({
    summary: 'Get playbook for a deal',
    description: 'Retrieve playbook items (MEDDICC, BANT, or CUSTOM) for a deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'type',
    description: 'Playbook type filter',
    enum: PlaybookType,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Playbook retrieved successfully',
    type: [PlaybookSummaryDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async getPlaybook(
    @Param('dealId') dealId: string,
    @Query('type') type?: PlaybookType,
  ): Promise<PlaybookSummaryDto[]> {
    return this.playbookService.getPlaybook(dealId, type);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Create playbook item',
    description: 'Add a new item to the deal playbook',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Playbook item created successfully',
    type: PlaybookItemResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async createPlaybookItem(
    @Param('dealId') dealId: string,
    @Body() dto: CreatePlaybookItemDto,
  ): Promise<PlaybookItemResponseDto> {
    return this.playbookService.createPlaybookItem(dealId, dto);
  }

  @Patch('items/:itemId')
  @ApiOperation({
    summary: 'Update playbook item',
    description: 'Update status, notes, or AI suggestions for a playbook item',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'itemId',
    description: 'Playbook item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Playbook item updated successfully',
    type: PlaybookItemResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Playbook item not found',
  })
  async updatePlaybookItem(
    @Param('dealId') dealId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePlaybookItemDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<PlaybookItemResponseDto> {
    return this.playbookService.updatePlaybookItem(dealId, itemId, dto, req.user?.id);
  }

  @Delete('items/:itemId')
  @ApiOperation({
    summary: 'Delete playbook item',
    description: 'Remove a playbook item from the deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'itemId',
    description: 'Playbook item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Playbook item deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Playbook item not found',
  })
  async deletePlaybookItem(
    @Param('dealId') dealId: string,
    @Param('itemId') itemId: string,
  ): Promise<{ message: string }> {
    await this.playbookService.deletePlaybookItem(dealId, itemId);
    return { message: 'Playbook item deleted successfully' };
  }

  @Post('initialize/meddicc')
  @ApiOperation({
    summary: 'Initialize MEDDICC playbook',
    description: 'Create a MEDDICC playbook with all 7 criteria for the deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'MEDDICC playbook initialized successfully',
    type: PlaybookSummaryDto,
  })
  @ApiResponse({
    status: 400,
    description: 'MEDDICC playbook already exists',
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async initializeMEDDICC(@Param('dealId') dealId: string): Promise<PlaybookSummaryDto> {
    return this.playbookService.initializeMEDDICC(dealId);
  }

  @Post('initialize/bant')
  @ApiOperation({
    summary: 'Initialize BANT playbook',
    description: 'Create a BANT playbook with all 4 criteria for the deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'BANT playbook initialized successfully',
    type: PlaybookSummaryDto,
  })
  @ApiResponse({
    status: 400,
    description: 'BANT playbook already exists',
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async initializeBANT(@Param('dealId') dealId: string): Promise<PlaybookSummaryDto> {
    return this.playbookService.initializeBANT(dealId);
  }

  @Post('suggestions')
  @ApiOperation({
    summary: 'Generate AI suggestions',
    description: 'Generate AI-powered suggestions for playbook items',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'AI suggestions generated successfully',
    type: PlaybookSummaryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal or playbook not found',
  })
  async generateAISuggestions(
    @Param('dealId') dealId: string,
    @Body() dto: GeneratePlaybookSuggestionsDto,
  ): Promise<PlaybookSummaryDto> {
    return this.playbookService.generateAISuggestions(dealId, dto.type);
  }
}
