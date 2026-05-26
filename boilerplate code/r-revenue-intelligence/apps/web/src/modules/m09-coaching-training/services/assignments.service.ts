import { apiClient } from '@/lib/api';
import { Assignment, CreateAssignmentDto, UpdateAssignmentDto } from '@/types/assignment.types';

const unwrapArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const firstArray = Object.values(object).find(Array.isArray);
    return (firstArray ?? []) as T[];
  }
  return [];
};

export const assignmentsService = {
  async getMyAssignments() {
    const { data } = await apiClient.get<Assignment[] | Record<string, unknown>>('/analytics/my-assignments');
    return unwrapArray<Assignment>(data);
  },
  async getAssignments() {
    const { data } = await apiClient.get<Assignment[] | Record<string, unknown>>('/training/assignments');
    return unwrapArray<Assignment>(data);
  },
  async createAssignments(payload: CreateAssignmentDto) {
    const { data } = await apiClient.post<any>('/training/assignments', payload);
    return data;
  },
  async updateAssignment(id: string, payload: UpdateAssignmentDto) {
    const { data } = await apiClient.patch<Assignment>(`/training/assignments/${id}`, payload);
    return data;
  },
  async deleteAssignment(id: string) {
    const { data } = await apiClient.delete<any>(`/training/assignments/${id}`);
    return data;
  },
};
