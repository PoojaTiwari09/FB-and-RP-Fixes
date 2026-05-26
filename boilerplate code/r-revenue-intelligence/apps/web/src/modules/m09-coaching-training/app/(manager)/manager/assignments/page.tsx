'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsService } from '@/services/assignments.service';
import { scenariosService } from '@/services/scenarios.service';
import { analyticsService } from '@/services/analytics.service';
import { coachingService } from '@/services/coaching.service';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import Link from 'next/link';

export default function AssignmentsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    repId: '', scenarioId: '', deadline: '', priority: 'Medium', maxAttempts: 3, maxHints: 5
  });

  const query = useQuery({
    queryKey: ['assignments', 'manager'],
    queryFn: () => assignmentsService.getAssignments(),
  });

  const repsQ = useQuery({ queryKey: ['manager', 'reps'], queryFn: () => analyticsService.getReps() });
  const scenariosQ = useQuery({ queryKey: ['scenarios'], queryFn: () => scenariosService.findAll() });

  const createMut = useMutation({
    mutationFn: () => assignmentsService.createAssignments({
      repIds: [formData.repId],
      scenarioId: formData.scenarioId,
      deadline: formData.deadline || new Date().toISOString(),
      priority: formData.priority,
      maxAttempts: formData.maxAttempts,
      maxHints: formData.maxHints
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', 'manager'] });
      setShowForm(false);
      setFormData({ repId: '', scenarioId: '', deadline: '', priority: 'Medium', maxAttempts: 3, maxHints: 5 });
    }
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => assignmentsService.deleteAssignment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', 'manager'] });
      alert('Assignment removed successfully.');
    }
  });

  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorCard message={(query.error as Error)?.message} onRetry={() => query.refetch()} />;

  const assignments = query.data || [];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Assignments</h1>
          <p className="text-sm text-gray-500">Manage AI training assignments for your team.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : 'Assign Training'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900">New Assignment</h2>
          <div className="grid grid-cols-2 gap-4">
            <select value={formData.repId} onChange={e => setFormData({...formData, repId: e.target.value})} className="rounded-xl border p-2 text-sm">
              <option value="">Select Rep...</option>
              {repsQ.data?.map((r: any) => <option key={r.id} value={r.id}>{r.name || r.email}</option>)}
            </select>
            <select value={formData.scenarioId} onChange={e => setFormData({...formData, scenarioId: e.target.value})} className="rounded-xl border p-2 text-sm">
              <option value="">Select Scenario...</option>
              {scenariosQ.data?.map((s: any) => <option key={s.id} value={s.id}>{s.persona_name} ({s.difficulty})</option>)}
            </select>
            <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="rounded-xl border p-2 text-sm" />
            <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="rounded-xl border p-2 text-sm">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Max Attempts</label>
              <input type="number" min="1" value={formData.maxAttempts} onChange={e => setFormData({...formData, maxAttempts: parseInt(e.target.value) || 3})} className="rounded-xl border p-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Max Hints</label>
              <input type="number" min="1" value={formData.maxHints} onChange={e => setFormData({...formData, maxHints: parseInt(e.target.value) || 5})} className="rounded-xl border p-2 text-sm" />
            </div>
          </div>
          <button 
            onClick={() => createMut.mutate()} 
            disabled={createMut.isPending || !formData.repId || !formData.scenarioId} 
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Assign
          </button>
        </div>
      )}

      {assignments.length === 0 ? (
        <EmptyState title="No assignments found" description="Assign a scenario to a rep to get started." />
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rep</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scenario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.rep?.name || 'Unknown Rep'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.scenario?.persona_name || 'Unknown Scenario'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.best_score ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    {a.status === 'Completed' && (
                      <Link href="/manager/reviews" className="text-indigo-600 hover:text-indigo-900 mr-2">Action Required →</Link>
                    )}
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to unassign this training?')) {
                          deleteMut.mutate(a.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Unassign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
