import { Request } from 'express';
import { UserRole } from './user-role.enum';
import { Session, SessionData } from 'express-session';
export interface AuthenticatedUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
}
export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
    session: Session & Partial<SessionData>;
}
