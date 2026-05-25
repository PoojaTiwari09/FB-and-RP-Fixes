import { Controller, Patch, Param, Body } from '@nestjs/common';
import { EditsService } from './edits.service';

@Controller('edits')
export class EditsController {
  constructor(private readonly editsService: EditsService) {}

  @Patch('company/:hubspotId')
  async editCompany(
    @Param('hubspotId') hubspotId: string,
    @Body() body: { field: string; value: string; role: string },
  ) {
    return this.editsService.editCompany(hubspotId, body.field, body.value, body.role);
  }

  @Patch('deal/:dealId')
  async editDeal(
    @Param('dealId') dealId: string,
    @Body() body: { field: string; value: string; role: string },
  ) {
    return this.editsService.editDeal(dealId, body.field, body.value, body.role);
  }

  @Patch('supplementary/:companyHubspotId')
  async editSupplementary(
    @Param('companyHubspotId') companyHubspotId: string,
    @Body() body: { field: string; value: string; role: string },
  ) {
    return this.editsService.editSupplementary(companyHubspotId, body.field, body.value, body.role);
  }
}
