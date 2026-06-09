import { Global, Module } from '@nestjs/common';
import { HubSpotClientService } from './hubspot-client.service';

@Global()
@Module({
  providers: [HubSpotClientService],
  exports: [HubSpotClientService],
})
export class HubSpotIntegrationModule {}
