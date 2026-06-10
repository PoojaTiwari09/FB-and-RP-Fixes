"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealDriversModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const deal_drivers_controller_1 = require("../controllers/deal-drivers.controller");
const board_warning_config_controller_1 = require("../controllers/board-warning-config.controller");
const warning_definitions_controller_1 = require("../controllers/warning-definitions.controller");
const deal_drivers_service_1 = require("./deal-drivers.service");
const deal_drivers_repository_1 = require("../repositories/deal-drivers.repository");
const matrix_cache_1 = require("./matrix.cache");
const webhook_signature_guard_1 = require("../interfaces/webhook-signature.guard");
const database_module_1 = require("../database/database.module");
let DealDriversModule = class DealDriversModule {
};
exports.DealDriversModule = DealDriversModule;
exports.DealDriversModule = DealDriversModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            config_1.ConfigModule,
        ],
        controllers: [
            deal_drivers_controller_1.DealDriversController,
            board_warning_config_controller_1.BoardWarningConfigController,
            warning_definitions_controller_1.WarningDefinitionsController,
        ],
        providers: [
            deal_drivers_service_1.DealDriversService,
            deal_drivers_repository_1.DealDriversRepository,
            matrix_cache_1.MatrixCache,
            webhook_signature_guard_1.WebhookSignatureGuard,
        ],
        exports: [deal_drivers_service_1.DealDriversService],
    })
], DealDriversModule);
//# sourceMappingURL=deal-drivers.module.js.map