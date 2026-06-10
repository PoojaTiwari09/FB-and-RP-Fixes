"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngageBridgeModule = void 0;
const common_1 = require("@nestjs/common");
const m08_frontend_engage_controller_1 = require("./m08-frontend-engage.controller");
const m08_frontend_engage_service_1 = require("./m08-frontend-engage.service");
const m08_frontend_engage_manager_controller_1 = require("./manager/m08-frontend-engage-manager.controller");
const m08_frontend_engage_manager_service_1 = require("./manager/m08-frontend-engage-manager.service");
const prisma_module_1 = require("../database/prisma.module");
let EngageBridgeModule = class EngageBridgeModule {
};
exports.EngageBridgeModule = EngageBridgeModule;
exports.EngageBridgeModule = EngageBridgeModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [m08_frontend_engage_controller_1.M08FrontendEngageController, m08_frontend_engage_manager_controller_1.M08FrontendEngageManagerController],
        providers: [m08_frontend_engage_service_1.M08FrontendEngageService, m08_frontend_engage_manager_service_1.M08FrontendEngageManagerService],
    })
], EngageBridgeModule);
//# sourceMappingURL=engage-bridge.module.js.map