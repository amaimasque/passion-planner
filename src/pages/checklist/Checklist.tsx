import React, { useState, useRef, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, Printer, Check, GripVertical, AlertTriangle, X } from 'lucide-react';
import { useChecklist } from '../../hooks/useChecklist';
import type { ChecklistItem, ChecklistStatus } from '../../types/checklist';
import { BUILT_IN_CATEGORIES, BUILT_IN_CATEGORY_LABELS, buildPrefillItems } from '../../types/checklist';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ChecklistStatus; label: string }[] = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done',        label: 'Done' },
  { value: 'na',          label: 'N/A' },
];

const STATUS_CLS: Record<ChecklistStatus, string> = {
  pending:     'text-caution',
  in_progress: 'text-accent',
  done:        'text-positive',
  na:          'text-ink-muted',
};

function categoryLabel(cat: string) {
  return BUILT_IN_CATEGORY_LABELS[cat] ?? cat;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Checklist() {
  const { items: remoteItems, customCategories, allCategories, loading, save, saveCustomCategories, saveAll } = useChecklist();

  const [localItems, setLocalItems]   = useState<ChecklistItem[]>([]);
  const [activeTab, setActiveTab]     = useState<string>('documents');
  const [addingCat, setAddingCat]     = useState(false);
  const [newCatName, setNewCatName]   = useState('');
  const [catError, setCatError]       = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // category to delete

  const initialized  = useRef(false);
  const prefillDone  = useRef(false);
  const saveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragItemId   = useRef<string | null>(null);
  const [overItemId, setOverItemId] = useState<string | null>(null);

  // ── Initial sync ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (loading || initialized.current) return;
    initialized.current = true;
    if (remoteItems.length === 0 && !prefillDone.current) {
      prefillDone.current = true;
      const prefilled = buildPrefillItems();
      setLocalItems(prefilled);
      save(prefilled);
    } else {
      setLocalItems(remoteItems);
    }
  }, [loading, remoteItems, save]);

  // ── Debounced save ──────────────────────────────────────────────────────────

  function scheduleSave(items: ChecklistItem[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(items), 800);
  }

  // ── Mutations ───────────────────────────────────────────────────────────────

  function update(id: string, patch: Partial<ChecklistItem>) {
    setLocalItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, ...patch } : it);
      scheduleSave(next);
      return next;
    });
  }

  function addItem(category: string) {
    const newItem: ChecklistItem = {
      id: uid(), category, name: '',
      qty: 0, targetDate: '', deadline: '',
      status: 'pending', notes: '',
    };
    setLocalItems(prev => {
      const next = [...prev, newItem];
      scheduleSave(next);
      return next;
    });
  }

  function removeItem(id: string) {
    setLocalItems(prev => {
      const next = prev.filter(it => it.id !== id);
      save(next);
      return next;
    });
  }

  // ── Custom categories ───────────────────────────────────────────────────────

  async function addCustomCategory() {
    const name = newCatName.trim();
    if (!name) return;
    const lower = name.toLowerCase();
    if (allCategories.some(c => c.toLowerCase() === lower)) {
      setCatError('A section with that name already exists.');
      return;
    }
    await saveCustomCategories([...customCategories, name]);
    setNewCatName('');
    setAddingCat(false);
    setCatError('');
    setActiveTab(name);
  }

  async function deleteCustomCategory(cat: string) {
    const newItems = localItems.filter(i => i.category !== cat);
    const newCats  = customCategories.filter(c => c !== cat);
    setLocalItems(newItems);
    await saveAll(newItems, newCats);
    setConfirmDelete(null);
    if (activeTab === cat) setActiveTab(BUILT_IN_CATEGORIES[0]);
  }

  // ── Drag-to-reorder ─────────────────────────────────────────────────────────

  function handleItemDragStart(id: string) { dragItemId.current = id; }
  function handleItemDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (overItemId !== id) setOverItemId(id);
  }
  function handleItemDrop(id: string) {
    const fromId = dragItemId.current;
    dragItemId.current = null;
    setOverItemId(null);
    if (!fromId || fromId === id) return;
    setLocalItems(prev => {
      const fromIdx = prev.findIndex(i => i.id === fromId);
      const toIdx   = prev.findIndex(i => i.id === id);
      if (fromIdx === -1 || toIdx === -1) return prev;
      if (prev[fromIdx].category !== prev[toIdx].category) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      save(next);
      return next;
    });
  }
  function handleItemDragEnd() { dragItemId.current = null; setOverItemId(null); }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const totalDone  = localItems.filter(it => it.status === 'done').length;
  const totalItems = localItems.length;
  const pct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-ink-muted text-sm">Loading checklist…</p>
      </div>
    );
  }

  return (
    <div className="bg-app-bg font-sans min-h-screen">

      {/* ── Header (hidden on print) ── */}
      <header className="bg-app-surface border-b border-app-border sticky top-0 z-10 print:hidden">
        <div className="px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-brand-primary w-5 h-5" />
            <span className="font-serif text-lg font-semibold text-ink tracking-wide">Checklist</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-32 h-1.5 rounded-full bg-app-border overflow-hidden">
                <div
                  className="h-full bg-positive rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-ink-muted tabular-nums">{totalDone}/{totalItems}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" /> Print
            </Button>
          </div>
        </div>
      </header>

      {/* ── Print-only title ── */}
      <div className="hidden print:block text-center pt-6 pb-3">
        <h1 className="font-serif text-2xl font-bold text-ink">Wedding Checklist</h1>
        <p className="text-sm text-ink-muted mt-1">{totalDone} of {totalItems} items completed</p>
      </div>

      <div className="p-4 lg:p-6 space-y-4">

        {/* ── Tab bar (hidden on print) ── */}
        <div className="flex flex-wrap gap-2 print:hidden">
          {allCategories.map(cat => {
            const catItems = localItems.filter(it => it.category === cat);
            const catDone  = catItems.filter(it => it.status === 'done').length;
            const isActive = activeTab === cat;
            const isCustom = !BUILT_IN_CATEGORIES.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-app-surface border border-app-border text-ink-muted hover:text-ink hover:border-brand-primary/40',
                ].join(' ')}
              >
                {catDone === catItems.length && catItems.length > 0 && (
                  <Check className="w-3.5 h-3.5" />
                )}
                {categoryLabel(cat)}
                <span className={`text-xs tabular-nums ${isActive ? 'opacity-75' : 'opacity-60'}`}>
                  {catDone}/{catItems.length}
                </span>
                {isCustom && (
                  <span
                    role="button"
                    onClick={e => { e.stopPropagation(); setConfirmDelete(cat); }}
                    className={[
                      'ml-0.5 p-0.5 rounded transition-colors',
                      isActive ? 'hover:bg-white/20' : 'hover:bg-danger/10 hover:text-danger',
                    ].join(' ')}
                    title="Delete section"
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}

          {/* Add section */}
          {addingCat ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  type="text"
                  placeholder="Section name…"
                  value={newCatName}
                  onChange={e => { setNewCatName(e.target.value); setCatError(''); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addCustomCategory();
                    if (e.key === 'Escape') { setAddingCat(false); setNewCatName(''); setCatError(''); }
                  }}
                  className="px-3 py-1.5 text-xs border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink placeholder:text-ink-muted/50 bg-app-surface w-36"
                />
                <button
                  onClick={addCustomCategory}
                  disabled={!newCatName.trim()}
                  className="p-1.5 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors disabled:opacity-40"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setAddingCat(false); setNewCatName(''); setCatError(''); }}
                  className="p-1.5 text-ink-muted hover:text-ink rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {catError && <p className="text-[11px] text-danger px-1">{catError}</p>}
            </div>
          ) : (
            <button
              onClick={() => setAddingCat(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-dashed border-brand-primary/40 text-brand-primary hover:bg-brand-primary/5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Section
            </button>
          )}
        </div>

        {/* ── Category sections ── */}
        {allCategories.map(cat => {
          const catItems = localItems.filter(it => it.category === cat);
          const isActive = activeTab === cat;
          const isCustom = !BUILT_IN_CATEGORIES.includes(cat);

          return (
            <div key={cat} className={isActive ? 'block' : 'hidden print:block'}>

              {/* Print-only section header */}
              <h2 className="hidden print:block text-base font-bold uppercase tracking-widest text-ink text-center mt-8 mb-2">
                {categoryLabel(cat)}
              </h2>

              <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm print:rounded-none print:shadow-none">

                {/* Section title bar */}
                <div className="bg-ink px-5 py-3 flex items-center justify-between print:bg-gray-100">
                  <h3 className="text-sm font-bold text-white tracking-wide print:text-ink">
                    {categoryLabel(cat)}
                    <span className="ml-2 text-xs font-normal opacity-60">
                      {catItems.filter(it => it.status === 'done').length}/{catItems.length} done
                    </span>
                  </h3>
                  {isCustom && (
                    <button
                      onClick={() => setConfirmDelete(cat)}
                      className="p-1 text-white/50 hover:text-white transition-colors print:hidden"
                      title="Delete section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm min-w-[700px]">
                    <thead>
                      <tr className="bg-app-bg print:bg-gray-50">
                        <th className="w-6 border-b border-app-border print:hidden" />
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-ink-muted uppercase tracking-wider border-b border-app-border w-12">Qty</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-ink-muted uppercase tracking-wider border-b border-app-border">Item</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-ink-muted uppercase tracking-wider border-b border-app-border w-28">Target Date</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-ink-muted uppercase tracking-wider border-b border-app-border w-28">Deadline</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-ink-muted uppercase tracking-wider border-b border-app-border w-28">Status</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-ink-muted uppercase tracking-wider border-b border-app-border">Notes</th>
                        <th className="w-8 border-b border-app-border print:hidden" />
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item, idx) => (
                        <ChecklistRow
                          key={item.id}
                          item={item}
                          zebra={idx % 2 !== 0}
                          isDragging={dragItemId.current === item.id}
                          isOver={overItemId === item.id}
                          onUpdate={patch => update(item.id, patch)}
                          onDelete={() => removeItem(item.id)}
                          onDragStart={() => handleItemDragStart(item.id)}
                          onDragOver={e => handleItemDragOver(e, item.id)}
                          onDrop={() => handleItemDrop(item.id)}
                          onDragEnd={handleItemDragEnd}
                        />
                      ))}
                      {catItems.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-5 py-6 text-center text-xs text-ink-muted">
                            No items yet
                          </td>
                        </tr>
                      )}
                      {/* Add row (screen only) */}
                      <tr className="print:hidden">
                        <td colSpan={8} className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => addItem(cat)}
                            className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-hover transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add item
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Confirm Delete Section Modal ── */}
      {confirmDelete && (() => {
        const count = localItems.filter(i => i.category === confirmDelete).length;
        return (
          <Modal title="Delete Section" onClose={() => setConfirmDelete(null)} size="sm">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-danger/8 border border-danger/20 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-ink">
                  Delete <span className="font-semibold">"{confirmDelete}"</span>?
                  {count > 0 && (
                    <> This will also delete the <span className="font-semibold">{count} item{count !== 1 ? 's' : ''}</span> inside it.</>
                  )}
                  {count === 0 && ' This section is empty.'}
                  {' '}This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" fullWidth onClick={() => setConfirmDelete(null)}>Cancel</Button>
                <Button variant="danger" fullWidth onClick={() => deleteCustomCategory(confirmDelete)}>
                  Delete
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

// ── Checklist row ──────────────────────────────────────────────────────────────

function ChecklistRow({
  item, zebra, isDragging, isOver, onUpdate, onDelete,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: {
  item: ChecklistItem;
  zebra: boolean;
  isDragging: boolean;
  isOver: boolean;
  onUpdate: (patch: Partial<ChecklistItem>) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const isDone = item.status === 'done';

  const cellInput = [
    'w-full bg-transparent focus:outline-none text-xs text-ink',
    'placeholder:text-ink-muted/40',
  ].join(' ');

  return (
    <tr
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={[
        'group/row transition-colors',
        isDone ? 'bg-positive/5' : zebra ? 'bg-app-bg/40' : '',
        isDragging ? 'opacity-40' : '',
        isOver ? 'border-t-2 border-brand-primary' : '',
      ].join(' ')}
    >

      {/* Drag handle */}
      <td className="pl-2 py-2 border-b border-app-border/30 print:hidden">
        <GripVertical className="w-3.5 h-3.5 text-ink-muted/25 hover:text-ink-muted cursor-grab active:cursor-grabbing transition-colors" />
      </td>

      {/* Qty */}
      <td className="px-3 py-2 border-b border-app-border/30">
        <input
          type="number"
          min="0"
          value={item.qty || ''}
          onChange={e => onUpdate({ qty: parseInt(e.target.value) || 0 })}
          placeholder="—"
          className={`${cellInput} w-10 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
      </td>

      {/* Item name */}
      <td className="px-3 py-2 border-b border-app-border/30">
        <input
          type="text"
          value={item.name}
          onChange={e => onUpdate({ name: e.target.value })}
          className={`${cellInput} ${isDone ? 'line-through text-ink-muted' : ''}`}
        />
      </td>

      {/* Target Date */}
      <td className="px-3 py-2 border-b border-app-border/30">
        <input
          type="date"
          value={item.targetDate}
          onChange={e => onUpdate({ targetDate: e.target.value })}
          className={`${cellInput} w-full`}
        />
      </td>

      {/* Deadline */}
      <td className="px-3 py-2 border-b border-app-border/30">
        <input
          type="date"
          value={item.deadline}
          onChange={e => onUpdate({ deadline: e.target.value })}
          className={`${cellInput} w-full`}
        />
      </td>

      {/* Status */}
      <td className="px-3 py-2 border-b border-app-border/30">
        <select
          value={item.status}
          onChange={e => onUpdate({ status: e.target.value as ChecklistStatus })}
          className={`bg-transparent focus:outline-none text-xs font-medium cursor-pointer ${STATUS_CLS[item.status]}`}
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </td>

      {/* Notes */}
      <td className="px-3 py-2 border-b border-app-border/30">
        <input
          type="text"
          value={item.notes}
          onChange={e => onUpdate({ notes: e.target.value })}
          placeholder="—"
          className={`${cellInput} text-ink-muted`}
        />
      </td>

      {/* Delete (screen only) */}
      <td className="px-2 py-2 border-b border-app-border/30 print:hidden">
        <button
          type="button"
          onClick={onDelete}
          className="opacity-0 group-hover/row:opacity-100 p-1 text-ink-muted hover:text-danger rounded transition-all"
          title="Remove item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}
