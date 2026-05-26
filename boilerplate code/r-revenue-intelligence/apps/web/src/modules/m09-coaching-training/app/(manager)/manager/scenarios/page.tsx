'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scenariosService } from '@/services/scenarios.service';
import { sessionsService } from '@/services/sessions.service';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Upload, FileText, CheckCircle2, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { enrichPersonaDraft } from '@/lib/enrichPersona';
import { CreateScenarioDto, PersonaDraft } from '@/types/scenarios.types';

type WizardStep = 'select_source' | 'generating' | 'scenario_review' | 'manual_form';

const emptyPersona = (): PersonaDraft => ({
  persona_name: '',
  persona_type: 'Skeptical Buyer',
  difficulty: 'intermediate',
  context_text: '',
  objectives: '',
  goals: '',
  custom_prompt: '',
  evaluation_focus: '',
  target_skills: [],
  objection_style: '',
  personality_traits: '',
});

const defaultVoiceId = 'Xb7hH8MSUJpSbSDYk0k2';

export default function ScenariosPage() {
  const qc = useQueryClient();
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState<WizardStep>('select_source');
  const [transcript, setTranscript] = useState('');
  const [rawTranscript, setRawTranscript] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [persona, setPersona] = useState<PersonaDraft>(emptyPersona());
  const [voiceId, setVoiceId] = useState(defaultVoiceId);
  const [source, setSource] = useState<'audio' | 'text' | 'manual'>('manual');

  const query = useQuery({ queryKey: ['scenarios'], queryFn: () => scenariosService.findAll() });
  const voicesQuery = useQuery({ queryKey: ['voices'], queryFn: () => sessionsService.getVoices() });

  const createMut = useMutation({
    mutationFn: (payload: CreateScenarioDto) => scenariosService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scenarios'] });
      resetWizard();
    },
  });

  const analyzeAudioMut = useMutation({
    mutationFn: (file: File) => scenariosService.analyzeAudio(file),
    onSuccess: (data) => {
      setRawTranscript(data.raw_transcript || '');
      setTranscript(data.transcript || '');
      setPersona(enrichPersonaDraft(data.persona, data.transcript));
      setStep('scenario_review');
    },
    onError: () => setStep('select_source'),
  });

  const generatePersonaMut = useMutation({
    mutationFn: (text: string) => scenariosService.generatePersona(text),
    onSuccess: (data) => {
      setPersona(enrichPersonaDraft(data, transcript));
      setStep('scenario_review');
    },
    onError: () => setStep(source === 'text' ? 'scenario_review' : 'select_source'),
  });

  function resetWizard() {
    setShowWizard(false);
    setStep('select_source');
    setTranscript('');
    setRawTranscript('');
    setSelectedFileName('');
    setPersona(emptyPersona());
    setVoiceId(defaultVoiceId);
    setSource('manual');
  }

  function applyPersonaField<K extends keyof PersonaDraft>(key: K, value: PersonaDraft[K]) {
    setPersona((prev) => ({ ...prev, [key]: value }));
  }

  function fillAllFields() {
    setPersona((prev) => enrichPersonaDraft(prev, transcript));
  }

  function buildCreatePayload(): CreateScenarioDto {
    const skills = Array.isArray(persona.target_skills)
      ? persona.target_skills
      : String(persona.target_skills || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

    return {
      persona_name: persona.persona_name.trim(),
      persona_type: persona.persona_type,
      difficulty: persona.difficulty,
      context_text: persona.context_text.trim(),
      custom_prompt: persona.custom_prompt.trim(),
      voice_id: voiceId,
      objectives: persona.objectives.trim(),
      goals: persona.goals.trim(),
      source_transcript: transcript.trim(),
      evaluation_focus: persona.evaluation_focus.trim(),
      objection_style: persona.objection_style.trim(),
      personality_traits: persona.personality_traits.trim(),
      target_skills: skills,
    };
  }

  function handleCreateScenario() {
    const payload = buildCreatePayload();
    if (!payload.persona_name || !payload.context_text) {
      alert('Persona name and context are required.');
      return;
    }
    createMut.mutate(payload);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSource('audio');
    setSelectedFileName(file.name);
    setStep('generating');
    analyzeAudioMut.mutate(file);
  }

  function handleGenerateFromTranscript() {
    if (!transcript.trim()) {
      alert('Paste or edit the transcript first.');
      return;
    }
    setStep('generating');
    generatePersonaMut.mutate(transcript);
  }

  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorCard message={(query.error as Error)?.message} onRetry={() => query.refetch()} />;

  const scenarios = query.data || [];
  const voices = voicesQuery.data || [];
  const isGenerating = analyzeAudioMut.isPending || generatePersonaMut.isPending;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Scenarios</h1>
          <p className="text-sm text-gray-500">Manage and create AI training scenarios for your team.</p>
        </div>
        <button
          onClick={() => (showWizard ? resetWizard() : setShowWizard(true))}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          {showWizard ? 'Cancel Creation' : 'Create Scenario'}
        </button>
      </div>

      {showWizard && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {step === 'select_source' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">How would you like to create this persona?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <button
                  onClick={() => {
                    setSource('manual');
                    setPersona(enrichPersonaDraft(emptyPersona()));
                    setStep('manual_form');
                  }}
                  className="p-6 border rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left group"
                >
                  <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Manual Entry</h3>
                  <p className="text-sm text-gray-500 mt-1">Build a persona from scratch by filling out the details.</p>
                </button>

                <label className="p-6 border rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left cursor-pointer group">
                  <input type="file" accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg" className="hidden" onChange={handleFileUpload} />
                  <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900">From Call Audio</h3>
                  <p className="text-sm text-gray-500 mt-1">Upload a recording — we transcribe it and extract an editable training scenario.</p>
                </label>

                <button
                  onClick={() => {
                    setSource('text');
                    setTranscript('');
                    setPersona(emptyPersona());
                    setStep('scenario_review');
                  }}
                  className="p-6 border rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left group"
                >
                  <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900">From Transcript Text</h3>
                  <p className="text-sm text-gray-500 mt-1">Paste a transcript and generate editable persona fields.</p>
                </button>
              </div>
            </div>
          )}

          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
              <h2 className="text-lg font-bold text-gray-900">
                {analyzeAudioMut.isPending
                  ? 'Transcribing call audio...'
                  : 'Extracting persona, objectives, and goals...'}
              </h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md">
                {selectedFileName
                  ? `Processing "${selectedFileName}". This may take up to a minute for longer calls.`
                  : 'Analyzing your transcript. Please wait.'}
              </p>
            </div>
          )}

          {step === 'scenario_review' && (
            <ScenarioReviewForm
              source={source}
              transcript={transcript}
              rawTranscript={rawTranscript}
              persona={persona}
              voiceId={voiceId}
              voices={voices}
              isGenerating={isGenerating}
              generateError={(generatePersonaMut.error || analyzeAudioMut.error) as Error | null}
              createError={createMut.error as Error | null}
              isSaving={createMut.isPending}
              onTranscriptChange={setTranscript}
              onPersonaChange={applyPersonaField}
              onVoiceChange={setVoiceId}
              onBack={() => setStep('select_source')}
              onRegenerate={source === 'text' ? handleGenerateFromTranscript : undefined}
              onFillAll={fillAllFields}
              onCreate={handleCreateScenario}
            />
          )}

          {step === 'manual_form' && (
            <ScenarioReviewForm
              source="manual"
              transcript=""
              rawTranscript=""
              persona={persona}
              voiceId={voiceId}
              voices={voices}
              isGenerating={false}
              generateError={null}
              createError={createMut.error as Error | null}
              isSaving={createMut.isPending}
              onTranscriptChange={setTranscript}
              onPersonaChange={applyPersonaField}
              onVoiceChange={setVoiceId}
              onBack={() => setStep('select_source')}
              onFillAll={fillAllFields}
              onCreate={handleCreateScenario}
            />
          )}
        </div>
      )}

      {!showWizard &&
        (scenarios.length === 0 ? (
          <EmptyState title="No scenarios found" description="Create a scenario to get started." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="font-bold text-gray-900">{scenario.persona_name}</h2>
                <p className="text-sm text-gray-500">
                  {scenario.persona_type} —{' '}
                  {scenario.difficulty === 'beginner' ? 'Level 1' : scenario.difficulty === 'advanced' ? 'Level 3' : 'Level 2'}
                </p>
                <p className="mt-4 text-sm text-gray-700 line-clamp-3 leading-relaxed">
                  {scenario.context_text?.replace(/\[SCENARIO_METADATA:.*?\]/s, '').trim()}
                </p>
              </div>
            ))}
          </div>
        ))}
    </section>
  );
}

function ScenarioReviewForm({
  source,
  transcript,
  rawTranscript,
  persona,
  voiceId,
  voices,
  isGenerating,
  generateError,
  createError,
  isSaving,
  onTranscriptChange,
  onPersonaChange,
  onVoiceChange,
  onBack,
  onRegenerate,
  onFillAll,
  onCreate,
}: {
  source: 'audio' | 'text' | 'manual';
  transcript: string;
  rawTranscript: string;
  persona: PersonaDraft;
  voiceId: string;
  voices: Array<{ id: string; name: string }>;
  isGenerating: boolean;
  generateError: Error | null;
  createError: Error | null;
  isSaving: boolean;
  onTranscriptChange: (v: string) => void;
  onPersonaChange: <K extends keyof PersonaDraft>(key: K, value: PersonaDraft[K]) => void;
  onVoiceChange: (v: string) => void;
  onBack: () => void;
  onRegenerate?: () => void;
  onFillAll: () => void;
  onCreate: () => void;
}) {
  const skillsText = Array.isArray(persona.target_skills) ? persona.target_skills.join(', ') : '';

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Review & Edit Scenario</h2>
          <p className="text-sm text-gray-500">
            {source === 'audio'
              ? 'Full transcription and AI-extracted fields — edit anything before saving.'
              : source === 'text'
              ? 'Paste transcript, generate fields, then edit before saving.'
              : 'Fill in all scenario details below.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {source !== 'manual' && persona.persona_name && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> AI extracted — all fields editable
            </span>
          )}
          <button
            type="button"
            onClick={onFillAll}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            Fill empty fields
          </button>
        </div>
      </div>

      {source !== 'manual' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Full Transcript</label>
            {rawTranscript && rawTranscript !== transcript && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-indigo-600">View raw transcription</summary>
                <p className="mt-2 rounded-lg bg-gray-50 p-3 font-mono text-xs leading-relaxed max-h-32 overflow-y-auto">{rawTranscript}</p>
              </details>
            )}
          </div>
          <textarea
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            placeholder="Rep: ...&#10;Client: ..."
            className="w-full min-h-[200px] rounded-xl border border-gray-200 p-4 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
          />
          {source === 'text' && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isGenerating || !transcript.trim()}
              className="rounded-xl bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-200 disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Fields from Transcript'}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Persona Name" required>
          <input
            value={persona.persona_name}
            onChange={(e) => onPersonaChange('persona_name', e.target.value)}
            placeholder="e.g., Budget-Constrained Bob"
            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>

        <Field label="Persona Type" required>
          <select
            value={persona.persona_type}
            onChange={(e) => onPersonaChange('persona_type', e.target.value)}
            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Skeptical Buyer">Skeptical Buyer</option>
            <option value="Budget Constrained">Budget Constrained</option>
            <option value="Technical Evaluator">Technical Evaluator</option>
            <option value="Champion">Champion</option>
            <option value="Blocker">Blocker</option>
            <option value="Tire Kicker">Tire Kicker</option>
          </select>
        </Field>

        <Field label="Training Level" required>
          <select
            value={persona.difficulty}
            onChange={(e) => onPersonaChange('difficulty', e.target.value)}
            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="beginner">Level 1 — Beginner</option>
            <option value="intermediate">Level 2 — Intermediate</option>
            <option value="advanced">Level 3 — Advanced</option>
          </select>
        </Field>

        <Field label="Voice">
          <select value={voiceId} onChange={(e) => onVoiceChange(e.target.value)} className="field-input">
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
            {voices.length === 0 && <option value={defaultVoiceId}>Default Voice</option>}
          </select>
        </Field>

        <Field label="Context & Background" className="md:col-span-2" required>
          <textarea
            value={persona.context_text}
            onChange={(e) => onPersonaChange('context_text', e.target.value)}
            placeholder="Who is this buyer, what is their situation, and what is at stake?"
            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>

        <Field label="Rep Objectives" className="md:col-span-2">
          <textarea
            value={persona.objectives}
            onChange={(e) => onPersonaChange('objectives', e.target.value)}
            placeholder="What should the rep practice and achieve in this scenario?"
            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm min-h-[88px] outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>

        <Field label="Buyer Goals" className="md:col-span-2">
          <textarea
            value={persona.goals}
            onChange={(e) => onPersonaChange('goals', e.target.value)}
            placeholder="What does the buyer want to accomplish or protect?"
            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm min-h-[88px] outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>

        <Field label="Evaluation Focus">
          <input
            value={persona.evaluation_focus}
            onChange={(e) => onPersonaChange('evaluation_focus', e.target.value)}
            placeholder="e.g., Discovery and objection handling"
            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>

        <Field label="Target Skills (comma-separated)">
          <input
            value={skillsText}
            onChange={(e) =>
              onPersonaChange(
                'target_skills',
                e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              )
            }
            placeholder="Discovery, Closing, Active listening"
            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>

        <Field label="Objection Style">
          <input
            value={persona.objection_style}
            onChange={(e) => onPersonaChange('objection_style', e.target.value)}
            placeholder="e.g., Budget and timing pushback"
            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>

        <Field label="Personality Traits">
          <input
            value={persona.personality_traits}
            onChange={(e) => onPersonaChange('personality_traits', e.target.value)}
            placeholder="e.g., Direct, analytical, impatient"
            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>

        <Field label="Custom LLM Instructions (Buyer Prompt)" className="md:col-span-2">
          <textarea
            value={persona.custom_prompt}
            onChange={(e) => onPersonaChange('custom_prompt', e.target.value)}
            placeholder="How the AI buyer should behave during roleplay..."
            className="w-full rounded-xl border border-gray-200 p-2.5 text-sm min-h-[120px] font-mono outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>
      </div>

      {(generateError || createError) && (
        <p className="text-sm text-red-600">{(generateError || createError)?.message}</p>
      )}

      <div className="flex justify-between gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={onBack} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          onClick={onCreate}
          disabled={isSaving || isGenerating}
          className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving ? 'Creating Scenario...' : 'Create Scenario'}
        </button>
      </div>

    </div>
  );
}

function Field({
  label,
  children,
  className = '',
  required,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
