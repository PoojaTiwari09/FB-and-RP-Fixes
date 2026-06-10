"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateM02ConversationIntelligenceSchema = void 0;
const zod_1 = require("zod");
exports.CreateM02ConversationIntelligenceSchema = zod_1.z.object({
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
});
//# sourceMappingURL=m02.schema.js.map