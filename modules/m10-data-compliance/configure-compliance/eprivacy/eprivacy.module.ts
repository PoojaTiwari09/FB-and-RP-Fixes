import { Module } from "@nestjs/common";
import { EPrivacyController } from "./controllers/eprivacy.controller";
import { EPrivacyService } from "./services/eprivacy.service";
import { EPrivacyRepository } from "./repositories/eprivacy.repository";
import { PrismaModule } from "../../database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [EPrivacyController],
  providers: [EPrivacyService, EPrivacyRepository],
  exports: [EPrivacyService, EPrivacyRepository],
})
export class EPrivacyModule {}
