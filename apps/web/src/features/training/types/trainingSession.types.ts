// src/types/trainingSession.types.ts
import { ContactPersona, PlaybookSection } from '@shared/types/shared.types';

export type MessageSender = 'user' | 'ai';

export type InputType = 'text' | 'voice';

export type ScorecardSectionStatus = 'not-started' | 'in-progress' | 'completed';

export interface TranscriptMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestampSeconds: number;
}

export interface MeetingContext {
  scenario: string;
  objective: string;
  backgroundForTrainee: string; // additional context provided to the trainee
}

export interface SessionContext {
  trainingId: string;
  trainingTitle: string;
  persona: ContactPersona;
  meetingContext: MeetingContext;
  playbookSections: PlaybookSection[];
}

/**
 * Returned from GET /api/trainings/:trainingId/sessions/:sessionId
 * Contains full session state including conversation history (used for resume).
 */
export interface SessionData {
  context: SessionContext;
  sessionId: string;
  status: 'active' | 'paused' | 'completed';
  elapsedSeconds: number;
  messageCount: number;
  selectedVoiceId: string;
  messages: TranscriptMessage[];
}

/**
 * Returned from POST /api/trainings/:trainingId/sessions/:sessionId/messages
 */
export interface SendMessageResponse {
  aiReplyText: string;
  aiReplyId: string;
  aiReplyTimestamp: number;
  audioUrl: string;
  scorecardUpdate: Record<string, ScorecardSectionStatus> | null; // sectionId → status
}

export interface TrainingSessionState {
  context: SessionContext;
  transcript: TranscriptMessage[];
  elapsedSeconds: number;
  isAISpeaking: boolean;
  isMicActive: boolean;
}
