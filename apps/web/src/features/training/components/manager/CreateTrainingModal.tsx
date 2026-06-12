'use client';

import { useState } from 'react';
import { X, Calendar, User, Briefcase, Target, MessageSquare } from 'lucide-react';
import { createTrainingAction } from '@training/actions/trainingCreate.actions';
import { CreateTrainingRequest } from '@training/types/trainingCreate.types';

interface CreateTrainingModalProps {
  onClose: () => void;
}

export default function CreateTrainingModal({ onClose }: CreateTrainingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTrainingRequest>({
    trainingTitle: '',
    dueDateIso: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 1 week
    repId: '00000000-0000-0000-0000-000000000003',
    persona: {
      name: '',
      jobTitle: '',
      company: '',
      motivations: '',
      communicationStyle: '',
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('persona.')) {
      const personaField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        persona: { ...prev.persona, [personaField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // dueDateIso should be a full ISO string for backend, currently it's just YYYY-MM-DD from input
      const fullIsoDate = new Date(formData.dueDateIso).toISOString();
      await createTrainingAction({ ...formData, dueDateIso: fullIsoDate });
      onClose();
    } catch (error) {
      console.error('Failed to create training', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" style={{ animation: 'fadeIn 150ms ease-out' }}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Create New Training</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          <form id="create-training-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Target size={16} className="text-indigo-600" />
                Training Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Training Title</label>
                  <input
                    required
                    type="text"
                    name="trainingTitle"
                    value={formData.trainingTitle}
                    onChange={handleChange}
                    placeholder="e.g. Q3 Discovery Call Practice"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To Rep</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      name="repId"
                      value={formData.repId}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm appearance-none bg-white"
                    >
                      <option value="00000000-0000-0000-0000-000000000003">Alex Chen</option>
                      <option value="rep-002">Jordan Lee</option>
                      <option value="rep-003">Sam Taylor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      type="date"
                      name="dueDateIso"
                      value={formData.dueDateIso}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Persona Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase size={16} className="text-blue-600" />
                Contact Persona
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Persona Name</label>
                  <input
                    required
                    type="text"
                    name="persona.name"
                    value={formData.persona.name}
                    onChange={handleChange}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    required
                    type="text"
                    name="persona.jobTitle"
                    value={formData.persona.jobTitle}
                    onChange={handleChange}
                    placeholder="e.g. VP of Engineering"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    required
                    type="text"
                    name="persona.company"
                    value={formData.persona.company}
                    onChange={handleChange}
                    placeholder="e.g. TechCorp Solutions"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivations / Pain Points</label>
                  <textarea
                    required
                    name="persona.motivations"
                    value={formData.persona.motivations}
                    onChange={handleChange}
                    placeholder="What keeps them up at night?"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-gray-400" />
                    Communication Style
                  </label>
                  <textarea
                    required
                    name="persona.communicationStyle"
                    value={formData.persona.communicationStyle}
                    onChange={handleChange}
                    placeholder="e.g. Direct, data-driven, little small talk."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                  />
                </div>
              </div>
            </div>
            
            {/* Note about uneditable fields */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs text-blue-800 leading-relaxed">
                <span className="font-semibold">Note:</span> The underlying Coaching Playbook and meeting context will automatically inherit from the default template.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-training-form"
            disabled={isLoading}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              'Create & Assign'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
