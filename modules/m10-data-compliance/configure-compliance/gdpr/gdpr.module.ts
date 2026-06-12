import { Module } from "@nestjs/common";
import { GdprController } from "./controllers/gdpr.controller";
import { GdprDsarService } from "./services/gdpr-dsar.service";
import { GdprErasureService } from "./services/gdpr-erasure.service";
import { GdprPortabilityService } from "./services/gdpr-portability.service";
import { GdprRopaService } from "./services/gdpr-ropa.service";
import { GdprRepository } from "./repositories/gdpr.repository";
import { PrismaModule } from "../../database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [GdprController],
  providers: [
    GdprDsarService,
    GdprErasureService,
    GdprPortabilityService,
    GdprRopaService,
    GdprRepository,
  ],
  exports: [GdprDsarService, GdprRepository],
})
export class GdprModule {}
