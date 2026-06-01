// src/types/trainingSetup.types.ts
import { ContactPersona, PlaybookSection } from '@shared/types/shared.types';
import { MeetingContext } from '@training/types/trainingSession.types';

export interface VoiceOption {
  id: string;
  label: string;       // e.g. "Voice 1"
  description: string; // e.g. "Professional Female - Confident & Direct"
  previewText: string; // spoken aloud on preview click (frontend demo only)
}

export interface TrainingSetupPage {
  trainingId: string;
  trainingTitle: string;
  persona: ContactPersona;
  meetingContext: MeetingContext;
  voices: VoiceOption[];
  playbookSections: PlaybookSection[];
}
