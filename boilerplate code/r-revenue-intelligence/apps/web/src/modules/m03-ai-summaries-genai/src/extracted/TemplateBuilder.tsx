"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus, ArrowLeft, Save, Eye } from "lucide-react";

export interface TemplateSection {
  id: string; // Used for UI state
  section_name: string;
  ai_question: string;
  instructions: string;
  enabled: boolean;
  required: boolean;
  data_sources: {
    calls?: boolean;
    emails?: boolean;
    activities?: boolean;
    notes?: boolean;
    transcripts?: boolean;
    deals?: boolean;
    contacts?: boolean;
  };
}

export interface Template {
  id?: string;
  template_name: string;
  entity_type: string;
  description: string;
  is_active: boolean;
  sections: TemplateSection[];
}

// ── Sortable Section Component ──────────────────────────────────────────────
function SortableSection({
  section,
  updateSection,
  removeSection,
}: {
  section: TemplateSection;
  updateSection: (id: string, updates: Partial<TemplateSection>) => void;
  removeSection: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg mb-4 flex overflow-hidden">
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="w-10 bg-[var(--background)]/50 border-r border-[var(--border)] flex items-center justify-center cursor-grab hover:bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
        <GripVertical size={20} />
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={section.section_name}
              onChange={(e) => updateSection(section.id, { section_name: e.target.value })}
              placeholder="Section Name (e.g. Open Risks)"
              className="w-full bg-transparent border-none text-xl font-semibold text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-0 p-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={section.enabled}
                onChange={(e) => updateSection(section.id, { enabled: e.target.checked })}
                className="rounded border-[var(--border)] bg-[var(--background)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              Enabled
            </label>
            <button
              onClick={() => removeSection(section.id)}
              className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">AI Question</label>
            <input
              type="text"
              value={section.ai_question}
              onChange={(e) => updateSection(section.id, { ai_question: e.target.value })}
              placeholder="What risks could block deal progression?"
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Instructions</label>
            <textarea
              value={section.instructions}
              onChange={(e) => updateSection(section.id, { instructions: e.target.value })}
              placeholder="Focus heavily on pricing and competitor concerns."
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] h-20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Allowed Data Sources</label>
            <div className="flex flex-wrap gap-3">
              {['calls', 'emails', 'activities', 'notes'].map((src) => (
                <label key={src} className="flex items-center gap-2 text-sm text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={section.data_sources[src as keyof typeof section.data_sources] || false}
                    onChange={(e) => updateSection(section.id, {
                      data_sources: { ...section.data_sources, [src]: e.target.checked }
                    })}
                    className="rounded border-[var(--border)] bg-[var(--background)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <span className="capitalize">{src}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Builder Component ────────────────────────────────────────────────────
export function TemplateBuilder({ initialData }: { initialData?: Template }) {
  const router = useRouter();
  const [template, setTemplate] = useState<Template>(initialData || {
    template_name: "",
    entity_type: "call",
    description: "",
    is_active: true,
    sections: []
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setTemplate((prev) => {
        const oldIndex = prev.sections.findIndex((s) => s.id === active.id);
        const newIndex = prev.sections.findIndex((s) => s.id === over.id);
        return { ...prev, sections: arrayMove(prev.sections, oldIndex, newIndex) };
      });
    }
  };

  const addSection = () => {
    setTemplate((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `sec-${Date.now()}`,
          section_name: "New Section",
          ai_question: "",
          instructions: "",
          enabled: true,
          required: false,
          data_sources: { calls: true, emails: true, notes: true, activities: true }
        }
      ]
    }));
  };

  const updateSection = (id: string, updates: Partial<TemplateSection>) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...updates } : s))
    }));
  };

  const removeSection = (id: string) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = template.id ? `/api/admin/templates/${template.id}` : "/api/admin/templates";
      const method = template.id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template)
      });
      
      if (!res.ok) throw new Error("Failed to save template");
      
      if (!template.id) {
        // If creating, the response will have the new template ID. We need to save sections now.
        const created = await res.json();
        await fetch(`/api/admin/templates/${created.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...created, sections: template.sections })
        });
      }
      
      router.push("/admin/templates");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error saving template.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-[var(--background)] py-4 z-10 border-b border-[var(--border)]">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-md hover:bg-[var(--background)] transition-colors text-sm font-medium"
          >
            <Eye size={16} /> Preview Prompt
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-opacity-90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Save size={16} /> {isSaving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>

      {/* Template Metadata */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Template Details</h2>
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Template Name</label>
            <input
              type="text"
              value={template.template_name}
              onChange={(e) => setTemplate((p) => ({ ...p, template_name: e.target.value }))}
              placeholder="e.g. Executive QBR Review"
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Entity Type</label>
            <select
              value={template.entity_type}
              onChange={(e) => setTemplate((p) => ({ ...p, entity_type: e.target.value }))}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="call">Call Brief</option>
              <option value="deal">Deal Brief</option>
              <option value="account">Account Brief</option>
              <option value="contact">Contact Brief</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Description</label>
          <input
            type="text"
            value={template.description}
            onChange={(e) => setTemplate((p) => ({ ...p, description: e.target.value }))}
            placeholder="Template description..."
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {/* Sections Builder */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">Sections ({template.sections.length})</h2>
          <button
            onClick={addSection}
            className="flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            <Plus size={16} /> Add Section
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={template.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {template.sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                updateSection={updateSection}
                removeSection={removeSection}
              />
            ))}
          </SortableContext>
        </DndContext>
        
        {template.sections.length === 0 && (
          <div className="p-12 border-2 border-dashed border-[var(--border)] rounded-lg text-center">
            <p className="text-[var(--text-muted)] mb-4">No sections added yet.</p>
            <button onClick={addSection} className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-md hover:bg-[var(--background)] transition-colors text-sm font-medium mx-auto">
              <Plus size={16} /> Add First Section
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--text)]">Prompt Preview</h3>
              <button onClick={() => setIsPreviewOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-[var(--text-muted)] bg-[var(--background)]">
              <pre className="whitespace-pre-wrap">
{template.sections.filter(s => s.enabled).map((s, i) => `[SECTION ${i + 1}]: ${s.section_name}

Question: ${s.ai_question}
Instructions: ${s.instructions}
Allowed Sources: ${Object.keys(s.data_sources).filter(k => (s.data_sources as any)[k]).join(', ')}

`).join('\n')}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
