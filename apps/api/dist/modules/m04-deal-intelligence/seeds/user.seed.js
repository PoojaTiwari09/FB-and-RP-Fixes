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
exports.seedUsers = seedUsers;
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../entities/user.entity");
const user_role_enum_1 = require("../interfaces/user-role.enum");
async function seedUsers(dataSource) {
    const userRepository = dataSource.getRepository(user_entity_1.User);
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
        console.log('✓ Users already seeded, skipping...');
        return;
    }
    console.log('Seeding users...');
    const users = [
        {
            email: 'admin@example.com',
            password: await bcrypt.hash('Admin123!', 10),
            firstName: 'Admin',
            lastName: 'User',
            role: user_role_enum_1.UserRole.ADMIN,
            isActive: true,
        },
        {
            email: 'manager@example.com',
            password: await bcrypt.hash('Manager123!', 10),
            firstName: 'Manager',
            lastName: 'User',
            role: user_role_enum_1.UserRole.MANAGER,
            isActive: true,
        },
        {
            email: 'user@example.com',
            password: await bcrypt.hash('User123!', 10),
            firstName: 'Sales',
            lastName: 'Rep',
            role: user_role_enum_1.UserRole.USER,
            isActive: true,
        },
        {
            email: 'john.doe@example.com',
            password: await bcrypt.hash('password123', 10),
            firstName: 'John',
            lastName: 'Doe',
            role: user_role_enum_1.UserRole.USER,
            isActive: true,
        },
        {
            email: 'jane.smith@example.com',
            password: await bcrypt.hash('password123', 10),
            firstName: 'Jane',
            lastName: 'Smith',
            role: user_role_enum_1.UserRole.MANAGER,
            isActive: true,
        },
    ];
    for (const userData of users) {
        const user = userRepository.create(userData);
        await userRepository.save(user);
        console.log(`  ✓ Created user: ${user.email} (${user.role})`);
    }
    console.log('✓ Users seeded successfully');
}
//# sourceMappingURL=user.seed.js.map