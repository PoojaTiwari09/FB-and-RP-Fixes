import { UserRole } from '@/interfaces/user-role.enum';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: UserRole[]) => import("node_modules/@nestjs/common").CustomDecorator<string>;
