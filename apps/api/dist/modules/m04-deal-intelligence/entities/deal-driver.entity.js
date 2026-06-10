"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealDriverEntity = void 0;
class DealDriverEntity {
    id;
    tenantId;
    dealId;
    boardId;
    name;
    type;
    status;
    priority;
    owner;
    dueDate;
    description;
    warningType;
    createdAt;
    updatedAt;
    dealName;
    boardName;
    constructor(data) {
        Object.assign(this, data);
    }
    static fromPrisma(row) {
        return new DealDriverEntity({
            id: row.id,
            tenantId: row.tenantid,
            dealId: row.dealId,
            boardId: row.boardId,
            name: row.name,
            type: row.type,
            status: row.status,
            priority: row.priority,
            owner: row.owner,
            dueDate: row.dueDate?.toISOString() ?? null,
            description: row.description,
            warningType: row.warningType,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
        });
    }
}
exports.DealDriverEntity = DealDriverEntity;
//# sourceMappingURL=deal-driver.entity.js.map