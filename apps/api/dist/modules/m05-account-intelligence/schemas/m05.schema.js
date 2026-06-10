"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateM05AccountIntelligenceSchema = void 0;
const zod_1 = require("zod");
exports.CreateM05AccountIntelligenceSchema = zod_1.z.object({
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
});
//# sourceMappingURL=m05.schema.js.map