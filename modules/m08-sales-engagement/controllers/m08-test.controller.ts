import { Controller, Get, Post } from '@nestjs/common';
import { Public } from '../../platform-core/decorators/public.decorator';

@Controller('api/v1/sales-engagement/test')
@Public()
export class M08TestController {
  @Get('health')
  health() {
    return { success: true, module: 'm08-sales-engagement', status: 'ok' };
  }

  @Post('smoke')
  smoke() {
    return {
      success: true,
      module: 'm08-sales-engagement',
      checks: ['routes', 'prisma', 'queues', 'events'],
    };
  }
}
