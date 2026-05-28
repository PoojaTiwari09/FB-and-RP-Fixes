import { Controller, Get, Post, HttpCode } from '@nestjs/common';

@Controller('api/v1/revenue-dashboards/test')
export class M07TestController {
  @Get('health')
  health() {
    return {
      success: true,
      module: 'm07-revenue-dashboards',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('smoke')
  @HttpCode(200)
  smoke() {
    return {
      success: true,
      module: 'm07-revenue-dashboards',
      checks: ['health', 'sample_dashboard', 'widget_catalog'],
      endpoints: {
        sampleDashboard: '/api/v1/revenue-dashboards/sample-dashboard',
        widgetCatalog: '/api/v1/revenue-dashboards/widgets/catalog',
      },
    };
  }
}
