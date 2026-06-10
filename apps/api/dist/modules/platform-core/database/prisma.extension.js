"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantContext = void 0;
exports.getExtendedPrismaClient = getExtendedPrismaClient;
const async_hooks_1 = require("async_hooks");
exports.tenantContext = new async_hooks_1.AsyncLocalStorage();
function getExtendedPrismaClient(prisma) {
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ args, query }) {
                    const tenantId = exports.tenantContext.getStore();
                    if (!tenantId) {
                        return query(args);
                    }
                    return prisma.$transaction(async (tx) => {
                        await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant', $1, true)`, tenantId);
                        return query(args);
                    });
                },
            },
        },
    });
}
//# sourceMappingURL=prisma.extension.js.map