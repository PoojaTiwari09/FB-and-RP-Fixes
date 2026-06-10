"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAnalyticsAndSettings1779620000000 = void 0;
const typeorm_1 = require("typeorm");
class AddAnalyticsAndSettings1779620000000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'user_preferences',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'user_id',
                    type: 'uuid',
                    isNullable: false,
                },
                {
                    name: 'scope',
                    type: 'enum',
                    enum: ['GLOBAL', 'BOARD', 'DEAL'],
                    default: "'GLOBAL'",
                },
                {
                    name: 'scope_id',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'preference_key',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'preference_value',
                    type: 'jsonb',
                    isNullable: false,
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updated_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);
        await queryRunner.createIndex('user_preferences', new typeorm_1.TableIndex({
            name: 'IDX_user_preferences_user_id',
            columnNames: ['user_id'],
        }));
        await queryRunner.createIndex('user_preferences', new typeorm_1.TableIndex({
            name: 'IDX_user_preferences_user_scope_scopeid',
            columnNames: ['user_id', 'scope', 'scope_id'],
        }));
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'analytics_snapshots',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'type',
                    type: 'enum',
                    enum: ['DEAL_METRICS', 'TEAM_METRICS', 'FORECAST_METRICS', 'BOARD_METRICS'],
                    isNullable: false,
                },
                {
                    name: 'user_id',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'board_id',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'snapshot_date',
                    type: 'date',
                    isNullable: false,
                },
                {
                    name: 'metrics',
                    type: 'jsonb',
                    isNullable: false,
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);
        await queryRunner.createIndex('analytics_snapshots', new typeorm_1.TableIndex({
            name: 'IDX_analytics_snapshots_user_type_date',
            columnNames: ['user_id', 'type', 'snapshot_date'],
        }));
        await queryRunner.createIndex('analytics_snapshots', new typeorm_1.TableIndex({
            name: 'IDX_analytics_snapshots_board_type_date',
            columnNames: ['board_id', 'type', 'snapshot_date'],
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropIndex('analytics_snapshots', 'IDX_analytics_snapshots_board_type_date');
        await queryRunner.dropIndex('analytics_snapshots', 'IDX_analytics_snapshots_user_type_date');
        await queryRunner.dropIndex('user_preferences', 'IDX_user_preferences_user_scope_scopeid');
        await queryRunner.dropIndex('user_preferences', 'IDX_user_preferences_user_id');
        await queryRunner.dropTable('analytics_snapshots');
        await queryRunner.dropTable('user_preferences');
    }
}
exports.AddAnalyticsAndSettings1779620000000 = AddAnalyticsAndSettings1779620000000;
//# sourceMappingURL=1779620000000-AddAnalyticsAndSettings.js.map