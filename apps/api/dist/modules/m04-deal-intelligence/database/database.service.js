"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pg_1 = require("pg");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    config;
    pool;
    logger = new common_1.Logger(DatabaseService_1.name);
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        this.pool = new pg_1.Pool({
            connectionString: this.config.get('DATABASE_URL'),
            max: 20,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
        });
        this.pool.on('error', (err) => this.logger.error('Unexpected pool error', err));
    }
    async onModuleDestroy() {
        await this.pool.end();
    }
    async many(sql, params) {
        const result = await this.pool.query(sql, params);
        return result.rows;
    }
    async one(sql, params) {
        const result = await this.pool.query(sql, params);
        if (result.rows.length === 0)
            throw new Error('Expected one row, got none');
        return result.rows[0];
    }
    async oneOrNone(sql, params) {
        const result = await this.pool.query(sql, params);
        return (result.rows[0] ?? null);
    }
    async query(sql, params) {
        await this.pool.query(sql, params);
    }
    async raw(sql, params) {
        return this.pool.query(sql, params);
    }
    async transaction(fn) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await fn(client);
            await client.query('COMMIT');
            return result;
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseService);
//# sourceMappingURL=database.service.js.map