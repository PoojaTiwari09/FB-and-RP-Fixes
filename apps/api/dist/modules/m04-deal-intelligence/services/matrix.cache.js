"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatrixCache = void 0;
const common_1 = require("@nestjs/common");
const deal_drivers_entities_1 = require("../entities/deal-drivers.entities");
const TTL_MS = {
    [deal_drivers_entities_1.Period.NOW]: 5 * 60 * 1000,
    [deal_drivers_entities_1.Period.LAST_30_DAYS]: 30 * 60 * 1000,
    [deal_drivers_entities_1.Period.LAST_90_DAYS]: 30 * 60 * 1000,
};
let MatrixCache = class MatrixCache {
    store = new Map();
    key(managerId, boardId, period) {
        return `${managerId}:${boardId}:${period}`;
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.data;
    }
    set(key, data, period) {
        const ttl = TTL_MS[period] ?? TTL_MS[deal_drivers_entities_1.Period.NOW];
        this.store.set(key, { data, expiresAt: Date.now() + ttl });
    }
    invalidateByBoard(boardId) {
        for (const key of this.store.keys()) {
            if (key.includes(boardId))
                this.store.delete(key);
        }
    }
};
exports.MatrixCache = MatrixCache;
exports.MatrixCache = MatrixCache = __decorate([
    (0, common_1.Injectable)()
], MatrixCache);
//# sourceMappingURL=matrix.cache.js.map