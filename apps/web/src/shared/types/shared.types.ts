// Types reused across multiple features — import from here, never duplicate.

export type UserRole = 'sales_rep' | 'sales_manager';

export type QuestionTag = 'high-impact' | 'missed-last-attempt';

export interface PlaybookQuestion {
  id: string;
  text: string;
  tags: QuestionTag[];
  whyItMatters: string | null; // expandable explanation — from backend spec
}

export interface PlaybookSection {
  id: string;
  title: string;
  questions: PlaybookQuestion[];
}

export interface ContactPersona {
  name: string;
  jobTitle: string;
  company: string;
  motivations: string;
  communicationStyle: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string;
}

export interface RoleContextValue {
  session: UserSession;
  role: UserRole;
  isManager: boolean;
  isRep: boolean;
}
