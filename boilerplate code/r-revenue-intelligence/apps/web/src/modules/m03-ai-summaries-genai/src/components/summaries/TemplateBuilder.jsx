import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus, ArrowLeft, Eye, Loader2, X } from "lucide-react";

// ── Shared input style ────────────────────────────────────────────────────────

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 13,
  color: "#111827",
  background: "#fff",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 5,
};

// ── Sortable Section Card ─────────────────────────────────────────────────────

function SortableSection({ section, updateSection, removeSection }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [focused, setFocused] = useState(null);

  const fieldStyle = (name) => ({
    ...inputStyle,
    borderColor: focused === name ? "#4f46e5" : "#d1d5db",
    boxShadow: focused === name ? "0 0 0 2px rgba(79,70,229,0.1)" : "none",
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        marginBottom: 12,
        display: "flex",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          width: 36, background: "#f9fafb", borderRight: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "grab", color: "#9ca3af", flexShrink: 0,
        }}
      >
        <GripVertical size={16} />
      </div>

      {/* Section content */}
      <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Section name row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <input
            type="text"
            value={section.section_name}
            onChange={e => updateSection(section.id, { section_name: e.target.value })}
            placeholder="Section Name (e.g. Open Risks)"
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
            style={{
              flex: 1, fontSize: 14, fontWeight: 600, color: "#111827",
              background: "transparent", border: "none", outline: "none",
              fontFamily: "inherit", padding: 0,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: "#6b7280", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={section.enabled}
                onChange={e => updateSection(section.id, { enabled: e.target.checked })}
                style={{ accentColor: "#4f46e5" }}
              />
              Enabled
            </label>
            <button
              onClick={() => removeSection(section.id)}
              style={{
                width: 26, height: 26, borderRadius: 6, border: "1px solid #fecaca",
                background: "#fef2f2", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", color: "#ef4444",
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* AI Question + Instructions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>AI Question</label>
            <input
              type="text"
              value={section.ai_question}
              onChange={e => updateSection(section.id, { ai_question: e.target.value })}
              placeholder="What risks could block deal progression?"
              onFocus={() => setFocused("q")}
              onBlur={() => setFocused(null)}
              style={fieldStyle("q")}
            />
          </div>
          <div>
            <label style={labelStyle}>Instructions</label>
            <textarea
              value={section.instructions}
              onChange={e => updateSection(section.id, { instructions: e.target.value })}
              placeholder="Focus heavily on pricing and competitor concerns."
              onFocus={() => setFocused("ins")}
              onBlur={() => setFocused(null)}
              rows={1}
              style={{
                ...fieldStyle("ins"),
                resize: "none", height: 38,
                borderColor: focused === "ins" ? "#4f46e5" : "#d1d5db",
                boxShadow: focused === "ins" ? "0 0 0 2px rgba(79,70,229,0.1)" : "none",
              }}
            />
          </div>
        </div>

        {/* Data sources */}
        <div>
          <label style={labelStyle}>Allowed Data Sources</label>
          <div style={{ display: "flex", gap: 16 }}>
            {["calls", "emails", "activities", "notes"].map(src => (
              <label key={src} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#374151", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={section.data_sources?.[src] || false}
                  onChange={e => updateSection(section.id, { data_sources: { ...section.data_sources, [src]: e.target.checked } })}
                  style={{ accentColor: "#4f46e5" }}
                />
                <span style={{ textTransform: "capitalize" }}>{src}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Preview Modal ─────────────────────────────────────────────────────────────

function PreviewModal({ template, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 640, maxHeight: "85vh",
        background: "#fff", borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid #e5e7eb",
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Prompt Section Structure Preview</p>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, border: "1px solid #e5e7eb",
              background: "#f9fafb", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "#6b7280",
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f9fafb" }}>
          <pre style={{
            fontSize: 11, color: "#374151", fontFamily: "monospace",
            whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0,
          }}>
            {template.sections.filter(s => s.enabled).map((s, i) =>
              `[SECTION ${i + 1}]: ${s.section_name}\n\nQuestion: ${s.ai_question}\nInstructions: ${s.instructions}\nAllowed Sources: ${Object.keys(s.data_sources || {}).filter(k => s.data_sources[k]).join(", ")}\n\n`
            ).join("\n")}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ── Main TemplateBuilder ──────────────────────────────────────────────────────

export function TemplateBuilder({ initialData, onSaveComplete, onCancel }) {
  const [template, setTemplate] = useState(initialData || {
    template_name: "",
    entity_type: "call",
    description: "",
    is_active: true,
    sections: [],
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);
  const [saveError,     setSaveError]     = useState(null);
  const [focused,       setFocused]       = useState(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTemplate(prev => {
        const oldIdx = prev.sections.findIndex(s => s.id === active.id);
        const newIdx = prev.sections.findIndex(s => s.id === over.id);
        return { ...prev, sections: arrayMove(prev.sections, oldIdx, newIdx) };
      });
    }
  };

  const addSection = () => {
    setTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, {
        id: `sec-${Date.now()}`,
        section_name: "New Section",
        ai_question: "",
        instructions: "",
        enabled: true,
        required: false,
        data_sources: { calls: true, emails: true, notes: true, activities: true },
      }],
    }));
  };

  const updateSection = (id, updates) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  };

  const removeSection = (id) => {
    setTemplate(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== id) }));
  };

  const handleSave = async () => {
    if (!template.template_name.trim()) {
      setSaveError("Please enter a template name.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const url    = template.id ? `/api/admin/templates/${template.id}` : "/api/admin/templates";
      const method = template.id ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
      if (!res.ok) throw new Error("Failed to save template");
      if (!template.id) {
        const created = await res.json();
        await fetch(`/api/admin/templates/${created.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...created, sections: template.sections }),
        });
      }
      if (onSaveComplete) onSaveComplete();
    } catch (err) {
      setSaveError(err.message || "Error saving template.");
    } finally {
      setIsSaving(false);
    }
  };

  const fieldBorder = (name) => focused === name ? "#4f46e5" : "#d1d5db";
  const fieldShadow = (name) => focused === name ? "0 0 0 2px rgba(79,70,229,0.1)" : "none";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f0f2f7",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── Top action bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 32px",
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        flexShrink: 0,
      }}>
        {/* Back */}
        <button
          onClick={onCancel}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600, color: "#374151",
            background: "none", border: "none", cursor: "pointer",
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Right side buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setIsPreviewOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", fontSize: 13, fontWeight: 600,
              color: "#374151", background: "#fff",
              border: "1px solid #d1d5db", borderRadius: 8,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <Eye size={13} />
            Preview Prompt
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 18px", fontSize: 13, fontWeight: 700,
              color: "#fff",
              background: isSaving ? "#6366f1" : "linear-gradient(135deg, #4f46e5, #4338ca)",
              border: "none", borderRadius: 8,
              cursor: isSaving ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(79,70,229,0.3)",
              transition: "all 0.15s",
            }}
          >
            {isSaving
              ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Template</>
            }
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", maxWidth: 780, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

        {/* Error banner */}
        {saveError && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
            padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          }}>
            <p style={{ fontSize: 12, color: "#dc2626" }}>{saveError}</p>
            <button onClick={() => setSaveError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── Template Details Card ── */}
        <div style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: "22px 24px",
          marginBottom: 22,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 18 }}>
            Template Details
          </p>

          {/* Template Name + Entity Type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Template Name</label>
              <input
                type="text"
                value={template.template_name}
                onChange={e => setTemplate(p => ({ ...p, template_name: e.target.value }))}
                placeholder="e.g. Executive QBR Review"
                onFocus={() => setFocused("tname")}
                onBlur={() => setFocused(null)}
                style={{
                  ...inputStyle,
                  borderColor: fieldBorder("tname"),
                  boxShadow: fieldShadow("tname"),
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Entity Type</label>
              <select
                value={template.entity_type}
                onChange={e => setTemplate(p => ({ ...p, entity_type: e.target.value }))}
                onFocus={() => setFocused("etype")}
                onBlur={() => setFocused(null)}
                style={{
                  ...inputStyle,
                  borderColor: fieldBorder("etype"),
                  boxShadow: fieldShadow("etype"),
                  appearance: "auto",
                }}
              >
                <option value="call">Call Brief</option>
                <option value="deal">Deal Brief</option>
                <option value="account">Account Brief</option>
                <option value="contact">Contact Brief</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <input
              type="text"
              value={template.description}
              onChange={e => setTemplate(p => ({ ...p, description: e.target.value }))}
              placeholder="Template description..."
              onFocus={() => setFocused("desc")}
              onBlur={() => setFocused(null)}
              style={{
                ...inputStyle,
                borderColor: fieldBorder("desc"),
                boxShadow: fieldShadow("desc"),
              }}
            />
          </div>
        </div>

        {/* ── Sections ── */}
        <div>
          {/* Sections header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Sections ({template.sections.length})
            </p>
            <button
              onClick={addSection}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 13, fontWeight: 600, color: "#4f46e5",
                background: "none", border: "none", cursor: "pointer",
              }}
            >
              <Plus size={15} />
              Add Section
            </button>
          </div>

          {/* DnD section list */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={template.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {template.sections.map(section => (
                <SortableSection
                  key={section.id}
                  section={section}
                  updateSection={updateSection}
                  removeSection={removeSection}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Empty state */}
          {template.sections.length === 0 && (
            <div style={{
              padding: "36px 20px",
              border: "2px dashed #d1d5db",
              borderRadius: 12,
              background: "#fff",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}>
              <p style={{ fontSize: 13, color: "#9ca3af" }}>No sections added yet.</p>
              <button
                onClick={addSection}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", fontSize: 13, fontWeight: 600, color: "#374151",
                  background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <Plus size={13} />
                Add First Section
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <PreviewModal template={template} onClose={() => setIsPreviewOpen(false)} />
      )}
    </div>
  );
}
