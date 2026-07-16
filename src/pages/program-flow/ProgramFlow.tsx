import { useState, useRef } from 'react';
import {
  Presentation, Plus, Pencil, Trash2,
  AlertTriangle, Check, ExternalLink, GripVertical, X,
  Wand2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProgramFlow, BUILT_IN_SECTIONS } from '../../hooks/useProgramFlow';
import type { ProgramItem } from '../../hooks/useProgramFlow';
import { useWeddingDetails } from '../../hooks/useWeddingDetails';
import { generateProgramFlow } from '../../services/geminiEstimator';
import type { ProgramFlowItem } from '../../services/geminiEstimator';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import AiCooldownButton, { useAiCooldown } from '../../components/ui/AiCooldownButton';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt12h(time: string) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const SECTION_META: Record<string, { label: string; color: string }> = {
  ceremony:  { label: 'Ceremony',      color: 'bg-brand-primary'   },
  cocktail:  { label: 'Cocktail Hour', color: 'bg-brand-secondary' },
  reception: { label: 'Reception',     color: 'bg-accent'          },
};

const CUSTOM_COLORS = [
  'bg-positive', 'bg-caution', 'bg-danger',
  'bg-[#9b7ea3]', 'bg-[#5c8f7f]', 'bg-[#7a6e9e]',
];

function getSectionMeta(section: string, customSections: string[]) {
  if (SECTION_META[section]) return SECTION_META[section];
  const idx = customSections.indexOf(section);
  return { label: section, color: CUSTOM_COLORS[idx % CUSTOM_COLORS.length] };
}

// Required wedding detail fields for gating AI
interface RequiredField { key: string; label: string; value: string | number }

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProgramFlow() {
  const { items, customSections, sectionOrder, loading, save, saveCustomSections, saveSectionOrder } = useProgramFlow();
  const { details, loading: detailsLoading } = useWeddingDetails();

  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<
    | { type: 'addItem'; section: string }
    | { type: 'editItem'; item: ProgramItem }
    | { type: 'confirmDelete'; item: ProgramItem }
    | { type: 'confirmDeleteSection'; section: string }
    | { type: 'aiPreview'; generated: ProgramItem[] }
    | null
  >(null);

  const [itemForm, setItemForm] = useState({ time: '', title: '', description: '', section: 'ceremony' });
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [sectionError, setSectionError] = useState('');

  // Item drag-to-reorder
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Section drag-to-reorder
  const sectionDragIdx = useRef<number | null>(null);
  const [sectionOverIdx, setSectionOverIdx] = useState<number | null>(null);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState('');
  const { cooldown, stamp: stampAi } = useAiCooldown('program-flow');

  // Required fields check
  const requiredFields: RequiredField[] = [
    { key: 'date',            label: 'Wedding Date',      value: details.date },
    { key: 'ceremonyTime',    label: 'Ceremony Time',     value: details.ceremonyTime },
    { key: 'churchAndAddress',label: 'Church & Address',  value: details.churchAndAddress },
    { key: 'receptionVenue',  label: 'Reception Venue',   value: details.receptionVenue },
    { key: 'foodServiceType', label: 'Food Service Type', value: details.foodServiceType },
  ];
  const missingFields = requiredFields.filter(f => !f.value);
  const canGenerate = missingFields.length === 0;

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async function doSave(updated: ProgramItem[], sections?: string[]) {
    setSaving(true);
    try { await save(updated, sections); } finally { setSaving(false); }
  }

  function openAddItem(section: string) {
    setItemForm({ time: '', title: '', description: '', section });
    setModal({ type: 'addItem', section });
  }

  function openEditItem(item: ProgramItem) {
    setItemForm({
      time: item.time,
      title: item.title,
      description: item.description ?? '',
      section: item.section,
    });
    setModal({ type: 'editItem', item });
  }

  async function addCustomSection() {
    const name = newSectionName.trim();
    if (!name) return;
    const lower = name.toLowerCase();
    if (BUILT_IN_SECTIONS.includes(lower) ||
        Object.values(SECTION_META).some(m => m.label.toLowerCase() === lower)) {
      setSectionError('That section already exists.');
      return;
    }
    if (customSections.some(s => s.toLowerCase() === lower)) {
      setSectionError('A custom section with that name already exists.');
      return;
    }
    setSaving(true);
    try {
      await saveCustomSections([...customSections, name]);
      setNewSectionName('');
      setAddingSection(false);
      setSectionError('');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomSection(section: string) {
    const newItems = items.filter(i => i.section !== section);
    const newSections = customSections.filter(s => s !== section);
    await doSave(newItems, newSections);
    setModal(null);
  }

  async function submitItem() {
    if (!itemForm.title.trim()) return;
    const description = itemForm.description.trim();
    const patch: Omit<ProgramItem, 'id'> = {
      time: itemForm.time,
      title: itemForm.title.trim(),
      section: itemForm.section,
      ...(description ? { description } : {}),
    };
    if (modal?.type === 'addItem') {
      await doSave([...items, { id: crypto.randomUUID(), ...patch }]);
    } else if (modal?.type === 'editItem') {
      const { description: _d, ...rest } = modal.item;
      await doSave(items.map(i =>
        i.id === modal.item.id ? { ...rest, ...patch } : i
      ));
    }
    setModal(null);
  }

  async function confirmDelete() {
    if (modal?.type !== 'confirmDelete') return;
    await doSave(items.filter(i => i.id !== modal.item.id));
    setModal(null);
  }

  // ── Drag ───────────────────────────────────────────────────────────────────

  function handleDragStart(index: number) { dragIndex.current = index; }
  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (overIndex !== index) setOverIndex(index);
  }
  function handleDrop(index: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    setOverIndex(null);
    if (from === null || from === index) return;
    const reordered = [...items];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);
    doSave(reordered);
  }
  function handleDragEnd() { dragIndex.current = null; setOverIndex(null); }

  // ── Section drag ───────────────────────────────────────────────────────────

  function handleSectionDragStart(e: React.DragEvent, idx: number) {
    e.stopPropagation();
    sectionDragIdx.current = idx;
  }
  function handleSectionDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.stopPropagation();
    if (sectionOverIdx !== idx) setSectionOverIdx(idx);
  }
  async function handleSectionDrop(e: React.DragEvent, idx: number) {
    e.stopPropagation();
    const from = sectionDragIdx.current;
    sectionDragIdx.current = null;
    setSectionOverIdx(null);
    if (from === null || from === idx) return;
    const reordered = [...sectionOrder];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(idx, 0, moved);
    await saveSectionOrder(reordered);
  }
  function handleSectionDragEnd() { sectionDragIdx.current = null; setSectionOverIdx(null); }

  // ── AI ─────────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!canGenerate || cooldown > 0 || aiLoading) return;
    setAiError('');
    setAiLoading(true);
    try {
      const brideName = [details.bride.firstName, details.bride.lastName].filter(Boolean).join(' ');
      const groomName = [details.groom.firstName, details.groom.lastName].filter(Boolean).join(' ');
      const generated: ProgramFlowItem[] = await generateProgramFlow({
        brideName,
        groomName,
        date: details.date,
        ceremonyTime: fmt12h(details.ceremonyTime),
        church: details.churchAndAddress,
        receptionVenue: details.receptionVenue,
        foodServiceType: details.foodServiceType,
        theme: details.theme,
        guestCount: details.guestCount,
        attire: details.attire,
      });
      const mapped: ProgramItem[] = generated.map(g => ({
        id: crypto.randomUUID(),
        time: g.time,
        title: g.title,
        section: g.section,
        ...(g.description ? { description: g.description } : {}),
      }));
      setModal({ type: 'aiPreview', generated: mapped });
      stampAi();
    } catch (err: any) {
      setAiError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }

  async function applyGenerated(generated: ProgramItem[], replace: boolean) {
    await doSave(replace ? generated : [...items, ...generated]);
    setModal(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading || detailsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-ink-muted text-sm">Loading…</p>
      </div>
    );
  }

  const sectionIndex = (item: ProgramItem) => items.findIndex(i => i.id === item.id);

  return (
    <div className="bg-app-bg font-sans min-h-screen">

      {/* Header */}
      <header className="bg-app-surface border-b border-app-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Presentation className="text-brand-primary w-5 h-5" />
            <span className="font-serif text-lg font-semibold text-ink tracking-wide">Program Flow</span>
          </div>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-ink-muted">Saving…</span>}
            <AiCooldownButton
              cooldown={cooldown}
              label="Generate with AI"
              isLoading={aiLoading}
              disabled={!canGenerate}
              onClick={handleGenerate}
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* AI error */}
        {aiError && (
          <div className="flex items-start gap-3 p-4 bg-danger/8 border border-danger/20 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{aiError}</p>
          </div>
        )}

        {/* Missing details banner */}
        {missingFields.length > 0 && (
          <div className="p-4 bg-caution/8 border border-caution/25 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-caution flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">
                  {canGenerate ? 'All details complete' : 'Complete these details to enable AI generation'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {requiredFields.map(f => (
                    <span
                      key={f.key}
                      className={[
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                        f.value
                          ? 'bg-positive/10 text-positive'
                          : 'bg-caution/10 text-caution',
                      ].join(' ')}
                    >
                      {f.value ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {f.label}
                    </span>
                  ))}
                </div>
                {missingFields.length > 0 && (
                  <Link
                    to="/wedding"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-brand-primary hover:underline font-medium"
                  >
                    Fill in Wedding Details
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wedding date + venue summary */}
        {canGenerate && (
          <div className="flex flex-wrap gap-4 px-5 py-3.5 bg-app-surface border border-app-border rounded-2xl text-sm">
            <span className="text-ink-muted">
              <span className="font-medium text-ink">{new Date(details.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </span>
            <span className="text-app-border">·</span>
            <span className="text-ink-muted">Ceremony at <span className="font-medium text-ink">{fmt12h(details.ceremonyTime)}</span></span>
            <span className="text-app-border">·</span>
            <span className="text-ink-muted truncate">{details.churchAndAddress}</span>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
              <Presentation className="w-7 h-7 text-brand-primary" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-ink mb-2">No program yet</h2>
            <p className="text-sm text-ink-muted mb-6 max-w-xs">
              {canGenerate
                ? 'Click "Generate with AI" to create your full wedding day program, or add items manually.'
                : 'Fill in your wedding details above, then use AI to generate the full program.'}
            </p>
            <Button onClick={() => openAddItem('ceremony')} variant="ghost">
              <Plus className="w-4 h-4" />
              Add First Item
            </Button>
          </div>
        )}

        {/* Sections — in sectionOrder */}
        {sectionOrder.map((section, secIdx) => {
          const isCustom = !BUILT_IN_SECTIONS.includes(section);
          const meta = getSectionMeta(section, customSections);
          const secItems = items.filter(i => i.section === section);

          // Hide built-in sections when they have no items
          if (secItems.length === 0 && !isCustom) return null;

          const isSectionDragging = sectionDragIdx.current === secIdx;
          const isSectionOver = sectionOverIdx === secIdx && sectionDragIdx.current !== secIdx;

          return (
            <div
              key={section}
              draggable
              onDragStart={e => handleSectionDragStart(e, secIdx)}
              onDragOver={e => handleSectionDragOver(e, secIdx)}
              onDrop={e => handleSectionDrop(e, secIdx)}
              onDragEnd={handleSectionDragEnd}
              className={[
                'bg-app-surface border border-app-border rounded-2xl overflow-hidden transition-all',
                isSectionDragging ? 'opacity-40 scale-[0.99]' : '',
                isSectionOver ? 'ring-2 ring-brand-primary' : '',
              ].join(' ')}
            >
              {/* Section header */}
              <div className={`${meta.color} px-5 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-white/50 hover:text-white cursor-grab active:cursor-grabbing transition-colors flex-shrink-0" />
                  <span className="text-sm font-bold text-white tracking-wide uppercase">{meta.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddItem(section)}
                    className="flex items-center gap-1 text-white/80 hover:text-white text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                  {isCustom && (
                    <button
                      onClick={() => setModal({ type: 'confirmDeleteSection', section })}
                      className="p-0.5 text-white/60 hover:text-white transition-colors"
                      title="Delete section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Items */}
              {secItems.length > 0 ? (
                <div className="divide-y divide-app-border/60">
                  {secItems.map((item) => {
                    const globalIdx = sectionIndex(item);
                    const isDragging = dragIndex.current === globalIdx;
                    const isOver = overIndex === globalIdx && dragIndex.current !== globalIdx;
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(globalIdx)}
                        onDragOver={e => handleDragOver(e, globalIdx)}
                        onDrop={() => handleDrop(globalIdx)}
                        onDragEnd={handleDragEnd}
                        className={[
                          'group flex items-start gap-3 px-5 py-4 transition-all',
                          isDragging ? 'opacity-40 bg-brand-primary/5' : 'hover:bg-app-bg/50',
                          isOver ? 'border-t-2 border-brand-primary' : '',
                        ].join(' ')}
                      >
                        <GripVertical className="w-4 h-4 text-ink-muted/30 hover:text-ink-muted cursor-grab active:cursor-grabbing flex-shrink-0 mt-0.5 transition-colors" />
                        <div className="w-20 flex-shrink-0 pt-0.5">
                          <span className="text-xs font-semibold text-brand-primary tabular-nums">
                            {item.time || '—'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => openEditItem(item)}
                            className="p-1.5 text-ink-muted hover:text-ink hover:bg-app-border rounded-lg transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setModal({ type: 'confirmDelete', item })}
                            className="p-1.5 text-ink-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-5 py-6 text-center">
                  <p className="text-xs text-ink-muted">No items yet</p>
                </div>
              )}

              {/* Add item footer */}
              <div className="px-5 py-3 border-t border-app-border/60">
                <button
                  onClick={() => openAddItem(section)}
                  className="flex items-center gap-1.5 text-xs font-medium text-brand-primary hover:text-brand-hover transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add {meta.label} Item
                </button>
              </div>
            </div>
          );
        })}

        {/* Add section / quick-add buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {items.length > 0 && sectionOrder
            .filter(s => !items.some(i => i.section === s) && BUILT_IN_SECTIONS.includes(s))
            .map(section => (
              <button
                key={section}
                onClick={() => openAddItem(section)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-dashed border-app-border rounded-xl text-ink-muted hover:text-ink hover:border-ink-muted transition-all"
              >
                <Plus className="w-3 h-3" />
                Add to {getSectionMeta(section, customSections).label}
              </button>
            ))}

          {/* New custom section */}
          {addingSection ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Section name…"
                    value={newSectionName}
                    onChange={e => { setNewSectionName(e.target.value); setSectionError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') addCustomSection(); if (e.key === 'Escape') { setAddingSection(false); setNewSectionName(''); setSectionError(''); } }}
                    className="px-3 py-1.5 text-xs border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink placeholder:text-ink-muted/50 bg-app-surface w-40"
                  />
                  <button
                    onClick={addCustomSection}
                    disabled={!newSectionName.trim() || saving}
                    className="p-1.5 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setAddingSection(false); setNewSectionName(''); setSectionError(''); }}
                    className="p-1.5 text-ink-muted hover:text-ink rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {sectionError && <p className="text-[11px] text-danger px-1">{sectionError}</p>}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingSection(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-dashed border-brand-primary/40 rounded-xl text-brand-primary hover:bg-brand-primary/5 transition-all"
            >
              <Plus className="w-3 h-3" />
              New Section
            </button>
          )}
        </div>
      </main>

      {/* ── Add / Edit Item Modal ── */}
      {(modal?.type === 'addItem' || modal?.type === 'editItem') && (
        <Modal
          title={modal.type === 'addItem' ? `Add ${getSectionMeta(modal.section, customSections).label} Item` : 'Edit Item'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Time</label>
                <input
                  type="text"
                  placeholder="e.g. 4:30 PM"
                  value={itemForm.time}
                  onChange={e => setItemForm({ ...itemForm, time: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-app-surface border border-app-border rounded-xl text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Section</label>
                <select
                  value={itemForm.section}
                  onChange={e => setItemForm({ ...itemForm, section: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-app-surface border border-app-border rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all"
                >
                  {BUILT_IN_SECTIONS.map(s => (
                    <option key={s} value={s}>{SECTION_META[s].label}</option>
                  ))}
                  {customSections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Title</label>
              <input
                type="text"
                placeholder="e.g. Bridal Entrance"
                value={itemForm.title}
                autoFocus
                onChange={e => setItemForm({ ...itemForm, title: e.target.value })}
                className="w-full px-4 py-3 text-sm bg-app-surface border border-app-border rounded-xl text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Script / Notes <span className="text-ink-muted font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="What happens during this part of the program…"
                value={itemForm.description}
                onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                className="w-full px-4 py-3 text-sm bg-app-surface border border-app-border rounded-xl text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="ghost" fullWidth onClick={() => setModal(null)}>Cancel</Button>
              <Button fullWidth onClick={submitItem} isLoading={saving} disabled={!itemForm.title.trim()}>
                {modal.type === 'addItem' ? 'Add Item' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm Delete Section Modal ── */}
      {modal?.type === 'confirmDeleteSection' && (() => {
        const count = items.filter(i => i.section === modal.section).length;
        return (
          <Modal title="Delete Section" onClose={() => setModal(null)} size="sm">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-danger/8 border border-danger/20 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-ink">
                  Delete <span className="font-semibold">"{modal.section}"</span>?
                  {count > 0 && (
                    <> This will also delete the <span className="font-semibold">{count} item{count !== 1 ? 's' : ''}</span> inside it.</>
                  )}
                  {count === 0 && ' This section is empty.'}
                  {' '}This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" fullWidth onClick={() => setModal(null)}>Cancel</Button>
                <Button variant="danger" fullWidth isLoading={saving} onClick={() => deleteCustomSection(modal.section)}>
                  Delete
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ── Confirm Delete Modal ── */}
      {modal?.type === 'confirmDelete' && (
        <Modal title="Delete Item" onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-danger/8 border border-danger/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink">
                Delete <span className="font-semibold">{modal.item.title}</span>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger" fullWidth isLoading={saving} onClick={confirmDelete}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── AI Preview Modal ── */}
      {modal?.type === 'aiPreview' && (
        <Modal title="AI-Generated Program Flow" onClose={() => setModal(null)} size="lg">
          <div className="space-y-4">
            <div className="p-3.5 bg-brand-primary/5 border border-brand-primary/15 rounded-xl flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
              <p className="text-xs text-ink-muted">
                {modal.generated.length} items generated across {new Set(modal.generated.map(i => i.section)).size} sections. Review below, then apply.
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-1 pr-1">
              {[...new Set(modal.generated.map(i => i.section))].map(section => {
                const secItems = modal.generated.filter(i => i.section === section);
                if (secItems.length === 0) return null;
                const meta = getSectionMeta(section, customSections);
                return (
                  <div key={section}>
                    <div className={`${meta.color} px-3 py-1.5 rounded-lg mb-1`}>
                      <span className="text-xs font-bold text-white uppercase tracking-wide">{meta.label}</span>
                    </div>
                    {secItems.map(item => (
                      <div key={item.id} className="flex gap-3 px-3 py-2.5 rounded-lg hover:bg-app-bg transition-colors">
                        <span className="text-xs font-semibold text-brand-primary w-16 flex-shrink-0 tabular-nums pt-0.5">{item.time || '—'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-ink-muted/70">AI-generated content — review and edit times or scripts as needed after applying.</p>

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" fullWidth onClick={() => setModal(null)}>Cancel</Button>
              {items.length > 0 && (
                <Button variant="ghost" fullWidth onClick={() => applyGenerated(modal.generated, false)} isLoading={saving}>
                  Append
                </Button>
              )}
              <Button fullWidth onClick={() => applyGenerated(modal.generated, true)} isLoading={saving}>
                {items.length > 0 ? 'Replace All' : 'Apply'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
