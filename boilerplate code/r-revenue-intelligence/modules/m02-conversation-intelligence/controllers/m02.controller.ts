import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M02ConversationIntelligenceService } from '../services/m02.service';

/*
 * Note: query/body params are typed as `Record<string, any>` so the global
 * `ValidationPipe({ whitelist: true })` does NOT strip unknown keys. Zod is
 * the source of truth for shape validation (`SearchQuerySchema` / `SavedSearchSchema`).
 */

/**
 * Conversation Intelligence — primary surface (calls + emails archive + hybrid search).
 *
 * All routes are tenant-scoped. `TenantGuard` populates `req.tenantId` from a verified
 * source (JWT claim or the `x-tenant-id` header) and rejects requests that do not
 * provide one. No "tenant-123" / "user-456" defaults exist here — bypass attempts
 * surface as 401.
 */
@Controller('api/v1/conversation-intelligence')
@UseGuards(TenantGuard)
export class M02ConversationIntelligenceController {
  constructor(private readonly service: M02ConversationIntelligenceService) {}

  @Get('conversations/search')
  async search(@Query() queryDto: Record<string, any>, @Req() req: Record<string, any>) {
    const tenantId = this.requireTenant(req);
    return this.service.searchConversations(queryDto as any, tenantId);
  }

  @Get('conversations')
  async list(@Query() queryDto: Record<string, any>, @Req() req: Record<string, any>) {
    const tenantId = this.requireTenant(req);
    return this.service.getConversations(queryDto as any, tenantId);
  }

  @Get('conversations/:id')
  async findById(@Param('id') id: string, @Req() req: Record<string, any>) {
    const tenantId = this.requireTenant(req);
    const result = await this.service.getConversationById(id, tenantId);
    if (!result) {
      throw new NotFoundException(`Conversation ${id} not found for tenant ${tenantId}`);
    }
    return result;
  }

  @Post('saved-searches')
  async saveSearch(@Body() body: Record<string, any>, @Req() req: Record<string, any>) {
    const { tenantId, userId } = this.requireTenantAndUser(req);
    return this.service.createSavedSearch(body as any, tenantId, userId);
  }

  @Get('saved-searches')
  async getSavedSearches(@Req() req: Record<string, any>) {
    const { tenantId, userId } = this.requireTenantAndUser(req);
    return this.service.getSavedSearches(tenantId, userId);
  }

  /**
   * Boilerplate compliance fallback. Returns the same data as `GET /conversations`
   * but skips pagination metadata. Kept until M02 frontend migration completes.
   */
  @Get('findAll')
  findAllLegacy(@Req() req: Record<string, any>) {
    const tenantId = this.requireTenant(req);
    return this.service.findAll(tenantId);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private requireTenant(req: Record<string, any>): string {
    const tenantId = req.tenantId;
    if (!tenantId || typeof tenantId !== 'string') {
      throw new UnauthorizedException(
        'Missing or invalid tenant context. Authenticate or set the x-tenant-id header.',
      );
    }
    return tenantId;
  }

  private requireTenantAndUser(req: Record<string, any>) {
    const tenantId = this.requireTenant(req);
    const userId = req.userId;
    if (!userId || typeof userId !== 'string') {
      throw new UnauthorizedException(
        'Missing user context. Authenticate or set the x-user-id header.',
      );
    }
    return { tenantId, userId };
  }
}
