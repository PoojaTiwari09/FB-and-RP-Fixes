// src/mocks/trainingDashboard.mock.ts
import { TrainingDashboardPage } from '@training/types/trainingDashboard.types';

export const TRAINING_DASHBOARD_MOCK: TrainingDashboardPage = {
  trainings: [
    {
      id: '1',
      title: 'Discovery Call Practice',
      progressPercent: 65,
      dueDateIso: '2026-05-10T00:00:00.000Z',
      status: 'in-progress',
      lastSessionId: null,
    },
    {
      id: '2',
      title: 'Objection Handling',
      progressPercent: 30,
      dueDateIso: '2026-05-15T00:00:00.000Z',
      status: 'in-progress',
      lastSessionId: null,
    },
    {
      id: '3',
      title: 'Closing Techniques',
      progressPercent: 100,
      dueDateIso: '2026-05-08T00:00:00.000Z',
      status: 'completed',
      lastSessionId: 'session-3a',
    },
    {
      id: '4',
      title: 'Value Proposition Practice',
      progressPercent: 45,
      dueDateIso: '2026-05-12T00:00:00.000Z',
      status: 'in-progress',
      lastSessionId: null,
    },
    {
      id: '5',
      title: 'Product Demo Mastery',
      progressPercent: 100,
      dueDateIso: '2026-05-05T00:00:00.000Z',
      status: 'completed',
      lastSessionId: 'session-5a',
    },
  ],
};
