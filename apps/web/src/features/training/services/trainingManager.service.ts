// src/services/trainingManager.service.ts
import { ManagerDashboardPage, ReassignResponse } from '@training/types/trainingManager.types';
import { ENV } from '@shared/config/env';
import { CreateTrainingRequest, CreateTrainingResponse } from '@training/types/trainingCreate.types';

/**
 * Adapts raw API response to our typed ManagerDashboardPage shape.
 */
function adaptManagerDashboard(raw: Record<string, unknown>): ManagerDashboardPage {
  const trainings = (raw['trainings'] as Record<string, unknown>[]) ?? [];
  const activeTrainings = (raw['activeTrainings'] as Record<string, unknown>[]) ?? [];

  return {
    trainings: trainings.map((t) => ({
      id: String(t['id'] ?? ''),
      repId: String(t['repId'] ?? t['rep_id'] ?? ''),
      repName: String(t['repName'] ?? t['rep_name'] ?? ''),
      trainingTitle: String(t['trainingTitle'] ?? t['training_title'] ?? ''),
      completedDate: String(t['completedDate'] ?? t['completed_date'] ?? ''),
      overallScore: Number(t['overallScore'] ?? t['overall_score'] ?? 0),
      overallRating: String(t['overallRating'] ?? t['overall_rating'] ?? ''),
      lastSessionId: String(t['lastSessionId'] ?? t['last_session_id'] ?? ''),
      isReassigned: Boolean(t['isReassigned'] ?? t['is_reassigned'] ?? false),
    })),
    activeTrainings: activeTrainings.map((at) => ({
      id: String(at['id'] ?? ''),
      trainingTitle: String(at['trainingTitle'] ?? at['training_title'] ?? ''),
      repId: String(at['repId'] ?? at['rep_id'] ?? ''),
      repName: String(at['repName'] ?? at['rep_name'] ?? ''),
      dueDateIso: String(at['dueDateIso'] ?? at['due_date'] ?? ''),
      status: 'in-progress' as const,
      persona: (at['persona'] ?? at['contactPersona'] ?? at['contact_persona'] ?? {}) as any,
    })),
  };
}

/**
 * GET /api/manager/trainings
 * Fetch all completed and active trainings across reps for manager review.
 */
export async function fetchManagerDashboard(): Promise<ManagerDashboardPage> {
  const res = await fetch(`${ENV.M09_API_BASE_URL}/api/manager/trainings`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const raw = await res.json();
  return adaptManagerDashboard(raw as Record<string, unknown>);
}

/**
 * POST /api/manager/trainings/create
 * Create a new training and assign it to a rep.
 */
export async function createTraining(data: CreateTrainingRequest): Promise<CreateTrainingResponse> {
  const res = await fetch(`${ENV.M09_API_BASE_URL}/api/manager/trainings/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const raw = (await res.json()) as Record<string, unknown>;
  return {
    success: Boolean(raw['success'] ?? true),
    trainingId: String(raw['trainingId'] ?? raw['training_id'] ?? ''),
  };
}

/**
 * POST /api/manager/trainings/:trainingId/reassign
 * Reassign a completed training back to a rep for further practice.
 */
export async function reassignTraining(
  trainingId: string,
  repId: string,
): Promise<ReassignResponse> {
  const res = await fetch(
    `${ENV.M09_API_BASE_URL}/api/manager/trainings/${trainingId}/reassign`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repId }),
    },
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const raw = (await res.json()) as Record<string, unknown>;
  return {
    success: Boolean(raw['success'] ?? true),
    newTrainingId: String(raw['newTrainingId'] ?? raw['new_training_id'] ?? ''),
  };
}
