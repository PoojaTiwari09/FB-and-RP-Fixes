import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard, TenantGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('all')
  async getAllNotifications(@Req() req: any) {
    try {
      const notifications = await this.prisma.dealNotification.findMany({
        where: { tenantid: req.tenantId },
        orderBy: { timestamp: 'desc' },
      });
      return {
        success: true,
        data: notifications.map((n) => ({
          id: n.id,
          message: n.message,
          timestamp: n.timestamp.toISOString(),
          read: n.read,
          type: n.type,
          repName: n.repName,
        })),
        isMock: false,
      };
    } catch (error: any) {
      return { success: false, data: [], isMock: false, error: error.message };
    }
  }
}
