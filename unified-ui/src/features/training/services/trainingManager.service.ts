// src/services/trainingManager.service.ts
import {
  getMockManagerDashboard,
  mockReassignTraining,
} from '@training/mocks/trainingManager.mock';
import { ManagerDashboardPage, ReassignResponse } from '@training/types/trainingManager.types';
import { ENV } from '@shared/config/env';

/**
 * Adapts raw API response to our typed ManagerDashboardPage shape.
 */
function adaptManagerDashboard(raw: Record<string, unknown>): ManagerDashboardPage {
  const trainings = (raw['trainings'] as Record<string, unknown>[]) ?? [];
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
    activeTrainings: [], // Real API should return this, falling back to empty for now
  };
}

import { cookies } from 'next/headers';
import { CreateTrainingRequest, CreateTrainingResponse, ManagerActiveTraining } from '@training/types/trainingCreate.types';

/**
 * Helper to fetch manager dashboard with active trainings from cookies (for mock/fallback).
 */
async function getManagerDashboardWithCookies(): Promise<ManagerDashboardPage> {
  const base = getMockManagerDashboard();
  
  const cookieStore = await cookies();
  const createdStr = cookieStore.get('created_trainings')?.value;
  const created = createdStr ? JSON.parse(createdStr) : [];
  
  const completedStr = cookieStore.get('completed_trainings')?.value;
  const parsedCompleted = completedStr ? JSON.parse(decodeURIComponent(completedStr)) : {};
  const completedMap = Array.isArray(parsedCompleted) 
    ? parsedCompleted.reduce((acc: any, id: string) => ({ ...acc, [id]: 'mock-session-id' }), {})
    : parsedCompleted;
  
  // Split created trainings into active and completed
  const activeCreated = created.filter((t: ManagerActiveTraining) => !completedMap[t.id]);
  const completedCreated = created.filter((t: ManagerActiveTraining) => !!completedMap[t.id]);
  
  // Format completed created trainings to match ManagerDashboardPage.trainings shape
  const newlyCompleted = completedCreated.map((t: ManagerActiveTraining) => ({
    id: t.id,
    repId: t.repId || 'rep-demo',
    repName: t.repName || 'Demo Rep',
    trainingTitle: t.trainingTitle,
    completedDate: new Date().toISOString().split('T')[0],
    overallScore: 85, // Mock score
    overallRating: 'good',
    lastSessionId: completedMap[t.id] || 'demo-session',
    isReassigned: false,
  }));
  
  return {
    ...base,
    trainings: [...base.trainings, ...newlyCompleted],
    activeTrainings: activeCreated,
  };
}

/**
 * GET /api/manager/trainings
 * Fetch all completed trainings across reps for manager review.
 */
export async function fetchManagerDashboard(): Promise<ManagerDashboardPage> {


  try {
    const res = await fetch(`${ENV.M09_API_BASE_URL}/api/manager/trainings`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const raw = await res.json();
    const data = adaptManagerDashboard(raw as Record<string, unknown>);
    
    // In demo, we might still want to merge cookies even if the real API responds?
    // Usually no, but since backend might not exist, we just return data.
    return data;
  } catch (error) {
    console.warn('[ManagerService] API failed, falling back to mock:', error);
    return getManagerDashboardWithCookies();
  }
}

/**
 * POST /api/manager/trainings/create
 * Create a new training and assign it to a rep.
 */
export async function createTraining(data: CreateTrainingRequest): Promise<CreateTrainingResponse> {


  try {
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
  } catch (error) {
    console.warn('[ManagerService] Create API failed, falling back to mock:', error);
    return { success: true, trainingId: `mock-created-${Date.now()}` };
  }
}

/**
 * POST /api/manager/trainings/:trainingId/reassign
 * Reassign a completed training back to a rep for further practice.
 */
export async function reassignTraining(
  trainingId: string,
  repId: string,
): Promise<ReassignResponse> {


  try {
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
  } catch (error) {
    console.warn('[ManagerService] Reassign API failed, falling back to mock:', error);
    return mockReassignTraining(trainingId, repId);
  }
}
