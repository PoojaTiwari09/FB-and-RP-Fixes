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
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../entities/user.entity");
const data_source_1 = require("../database/data-source");
async function updatePasswords() {
    console.log('🔐 Updating user passwords...');
    const dataSource = new typeorm_1.DataSource(data_source_1.dataSourceOptions);
    try {
        await dataSource.initialize();
        console.log('✅ Database connection established');
        const userRepository = dataSource.getRepository(user_entity_1.User);
        const updates = [
            { email: 'admin@example.com', password: 'Admin123!' },
            { email: 'manager@example.com', password: 'Manager123!' },
            { email: 'user@example.com', password: 'User123!' },
        ];
        for (const update of updates) {
            const user = await userRepository.findOne({ where: { email: update.email } });
            if (user) {
                user.password = await bcrypt.hash(update.password, 10);
                await userRepository.save(user);
                console.log(`  ✓ Updated password for: ${user.email}`);
            }
            else {
                console.log(`  ⚠ User not found: ${update.email}`);
            }
        }
        console.log('✅ Password update completed');
        await dataSource.destroy();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error updating passwords:', error);
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
        process.exit(1);
    }
}
updatePasswords();
//# sourceMappingURL=update-passwords.js.map