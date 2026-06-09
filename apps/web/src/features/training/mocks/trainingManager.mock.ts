// src/mocks/trainingManager.mock.ts
import { ManagedRepTraining, ManagerDashboardPage } from '@training/types/trainingManager.types';
import { TrainingItem } from '@training/types/trainingDashboard.types';

/**
 * In-memory store of reassigned training IDs.
 * Persists across calls within the same server process (demo-friendly).
 */
const reassignedTrainingIds = new Set<string>();

/**
 * In-memory store for trainings reassigned back to the rep.
 * The rep's dashboard service picks these up via getReassignedRepTrainings().
 */
const reassignedRepTrainings: TrainingItem[] = [];

export const MANAGER_DASHBOARD_MOCK: ManagerDashboardPage = {
  activeTrainings: [],
  trainings: [
    {
      id: '3',
      repId: 'rep-001',
      repName: 'Alex Chen',
      trainingTitle: 'Closing Techniques',
      completedDate: '2026-05-08T00:00:00.000Z',
      overallScore: 85,
      overallRating: 'Good',
      lastSessionId: 'session-3a',
      isReassigned: false,
    },
    {
      id: '5',
      repId: 'rep-001',
      repName: 'Alex Chen',
      trainingTitle: 'Product Demo Mastery',
      completedDate: '2026-05-05T00:00:00.000Z',
      overallScore: 72,
      overallRating: 'Needs Practice',
      lastSessionId: 'session-5a',
      isReassigned: false,
    },
    {
      id: '6',
      repId: 'rep-002',
      repName: 'Jordan Lee',
      trainingTitle: 'Discovery Call Practice',
      completedDate: '2026-05-12T00:00:00.000Z',
      overallScore: 91,
      overallRating: 'Excellent',
      lastSessionId: 'session-6a',
      isReassigned: false,
    },
    {
      id: '7',
      repId: 'rep-002',
      repName: 'Jordan Lee',
      trainingTitle: 'Objection Handling',
      completedDate: '2026-05-18T00:00:00.000Z',
      overallScore: 64,
      overallRating: 'Needs Practice',
      lastSessionId: 'session-7a',
      isReassigned: false,
    },
  ],
};

/**
 * Returns the manager dashboard with live reassignment state merged in.
 */
export function getMockManagerDashboard(): ManagerDashboardPage {
  return {
    activeTrainings: [],
    trainings: MANAGER_DASHBOARD_MOCK.trainings.map((t) => ({
      ...t,
      isReassigned: t.isReassigned || reassignedTrainingIds.has(t.id),
    })),
  };
}

/**
 * Marks a training as reassigned and creates a new rep-side training row.
 */
export function mockReassignTraining(
  trainingId: string,
  repId: string,
): { success: boolean; newTrainingId: string } {
  reassignedTrainingIds.add(trainingId);

  // Find the original training to derive the new rep-side row
  const original = MANAGER_DASHBOARD_MOCK.trainings.find((t) => t.id === trainingId);
  const newId = `reassigned-${trainingId}-${Date.now()}`;

  if (original) {
    reassignedRepTrainings.push({
      id: newId,
      title: `${original.trainingTitle} (Reassigned)`,
      progressPercent: 0,
      dueDateIso: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      status: 'in-progress',
      lastSessionId: null,
    });
  }

  return { success: true, newTrainingId: newId };
}

/**
 * Returns reassigned trainings that should appear on the rep's dashboard.
 * Called by trainingDashboard.service.ts in mock mode.
 */
export function getReassignedRepTrainings(): TrainingItem[] {
  return [...reassignedRepTrainings];
}
