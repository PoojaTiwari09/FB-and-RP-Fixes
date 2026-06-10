"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const fs_1 = require("fs");
const path_1 = require("path");
const pg_1 = require("pg");
async function main() {
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
    const migrationsDir = (0, path_1.join)(__dirname, '../db/migrations');
    const files = (0, fs_1.readdirSync)(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
        const { rows } = await pool.query('SELECT name FROM _migrations WHERE name = $1', [file]);
        if (rows.length > 0) {
            console.log(`✓ ${file} (already run)`);
            continue;
        }
        const sql = (0, fs_1.readFileSync)((0, path_1.join)(migrationsDir, file), 'utf-8');
        await pool.query(sql);
        await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        console.log(`✅ ${file}`);
    }
    await pool.end();
    console.log('All migrations complete.');
}
main().catch(err => { console.error(err); process.exit(1); });
//# sourceMappingURL=migrate.js.map