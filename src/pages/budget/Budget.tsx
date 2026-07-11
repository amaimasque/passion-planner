import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Sparkles, AlertTriangle, GripVertical } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { useBudget } from '../../hooks/useBudget';
import { useCurrency } from '../../hooks/useCurrency';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import type { BudgetCategory, BudgetItem } from '../../types/budget';

const CHART_COLORS = [
  '#C97B84', '#D9B382', '#7B9CBF', '#6D9E7F', '#9B7FBF',
  '#BF9B7F', '#7FBFB0', '#BF7F9B', '#A0B87F', '#BF7F7F',
  '#7F9BBF', '#C4A882',
];


function categoryTotals(cat: BudgetCategory) {
  const estimated = cat.items.reduce((s, i) => s + i.estimated, 0);
  const actual    = cat.items.reduce((s, i) => s + i.actual, 0);
  return { estimated, actual, overUnder: estimated - actual };
}

// ── Modal state union ─────────────────────────────────────────────────────────

type ModalState =
  | { type: 'addCategory' }
  | { type: 'editCategory'; category: BudgetCategory }
  | { type: 'addItem'; categoryId: string }
  | { type: 'editItem'; categoryId: string; item: BudgetItem }
  | { type: 'confirmDeleteCategory'; category: BudgetCategory }
  | { type: 'confirmDeleteItem'; categoryId: string; item: BudgetItem }
  | null;

// ── Main component ────────────────────────────────────────────────────────────

export default function Budget() {
  const { categories, loading, save } = useBudget();
  const { fmt, fmtOu, currency } = useCurrency();

  const [modal, setModal]       = useState<ModalState>(null);
  const [catForm, setCatForm]   = useState({ name: '', note: '' });
  const [itemForm, setItemForm] = useState({ name: '', estimated: '', actual: '' });
  const [saving, setSaving]     = useState(false);

  // ── Drag-to-reorder ────────────────────────────────────────────────────────
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (overIndex !== index) setOverIndex(index);
  }

  function handleDrop(index: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    setOverIndex(null);
    if (from === null || from === index) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);
    doSave(reordered);
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setOverIndex(null);
  }

  // ── Grand totals ──
  const grandEst = categories.reduce((s, c) => s + categoryTotals(c).estimated, 0);
  const grandAct = categories.reduce((s, c) => s + categoryTotals(c).actual, 0);
  const grandOu  = grandEst - grandAct;

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function doSave(updated: BudgetCategory[]) {
    setSaving(true);
    try { await save(updated); } finally { setSaving(false); }
  }

  function openAddCategory() {
    setCatForm({ name: '', note: '' });
    setModal({ type: 'addCategory' });
  }

  function openEditCategory(cat: BudgetCategory) {
    setCatForm({ name: cat.name, note: cat.note ?? '' });
    setModal({ type: 'editCategory', category: cat });
  }

  async function submitCategory() {
    if (!catForm.name.trim()) return;
    if (modal?.type === 'addCategory') {
      const newCat: BudgetCategory = {
        id: crypto.randomUUID(),
        name: catForm.name.trim(),
        note: catForm.note.trim() || undefined,
        items: [],
      };
      await doSave([...categories, newCat]);
    } else if (modal?.type === 'editCategory') {
      const id = modal.category.id;
      await doSave(categories.map(c =>
        c.id === id ? { ...c, name: catForm.name.trim(), note: catForm.note.trim() || undefined } : c
      ));
    }
    setModal(null);
  }

  async function confirmDeleteCategory() {
    if (modal?.type !== 'confirmDeleteCategory') return;
    await doSave(categories.filter(c => c.id !== modal.category.id));
    setModal(null);
  }

  function openAddItem(categoryId: string) {
    setItemForm({ name: '', estimated: '', actual: '' });
    setModal({ type: 'addItem', categoryId });
  }

  function openEditItem(categoryId: string, item: BudgetItem) {
    setItemForm({
      name: item.name,
      estimated: item.estimated === 0 ? '' : item.estimated.toString(),
      actual:    item.actual    === 0 ? '' : item.actual.toString(),
    });
    setModal({ type: 'editItem', categoryId, item });
  }

  async function submitItem() {
    if (!itemForm.name.trim()) return;
    const patch: Partial<BudgetItem> = {
      name:      itemForm.name.trim(),
      estimated: parseFloat(itemForm.estimated) || 0,
      actual:    parseFloat(itemForm.actual)    || 0,
    };
    if (modal?.type === 'addItem') {
      const newItem: BudgetItem = { id: crypto.randomUUID(), ...patch } as BudgetItem;
      await doSave(categories.map(c =>
        c.id === modal.categoryId ? { ...c, items: [...c.items, newItem] } : c
      ));
    } else if (modal?.type === 'editItem') {
      const { categoryId, item } = modal;
      await doSave(categories.map(c =>
        c.id === categoryId
          ? { ...c, items: c.items.map(i => i.id === item.id ? { ...i, ...patch } : i) }
          : c
      ));
    }
    setModal(null);
  }

  async function confirmDeleteItem() {
    if (modal?.type !== 'confirmDeleteItem') return;
    const { categoryId, item } = modal;
    await doSave(categories.map(c =>
      c.id === categoryId ? { ...c, items: c.items.filter(i => i.id !== item.id) } : c
    ));
    setModal(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-ink-muted text-sm">Loading budget…</p>
      </div>
    );
  }

  const ouGrand = fmtOu(grandOu);

  return (
    <div className="bg-app-bg font-sans">
      {/* ── Header ── */}
      <header className="bg-app-surface border-b border-app-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-brand-primary w-5 h-5" />
            <span className="font-serif text-lg font-semibold text-ink tracking-wide">
              Budget Tracker
            </span>
          </div>
          <Button onClick={openAddCategory} size="sm">
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* ── Grand totals ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <SummaryCard label="Total Estimated" value={fmt(grandEst)} />
          <SummaryCard label="Total Spent"     value={fmt(grandAct)} />
          <SummaryCard
            label="Over / Under"
            value={ouGrand.text}
            valueClass={ouGrand.cls}
            note={grandOu < 0 ? 'Over budget' : grandOu > 0 ? 'Under budget' : undefined}
          />
        </div>

        {/* ── Charts ── */}
        {categories.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <BudgetDonutChart categories={categories} grandAct={grandAct} />
              <BudgetBarChart   categories={categories} />
            </div>

            {/* Summary table — full width */}
            <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden mb-8">
              <div className="px-5 py-4 border-b border-app-border">
                <h2 className="font-serif text-base font-semibold text-ink">Summary by Category</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-app-border text-xs text-ink-muted uppercase tracking-wider">
                      <th className="text-left px-5 py-3 font-medium">Category</th>
                      <th className="text-right px-5 py-3 font-medium">Estimated</th>
                      <th className="text-right px-5 py-3 font-medium">Actual</th>
                      <th className="px-5 py-3 font-medium w-40">Progress</th>
                      <th className="text-right px-5 py-3 font-medium">Over / Under</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {categories.map((cat, i) => {
                      const t   = categoryTotals(cat);
                      const ou  = fmtOu(t.overUnder);
                      const pct = t.estimated > 0 ? (t.actual / t.estimated) * 100 : 0;
                      const over = t.actual > t.estimated && t.estimated > 0;
                      const barColor = over ? '#C8645B' : pct >= 80 ? '#D9A441' : '#6D9E7F';
                      const dotColor = CHART_COLORS[i % CHART_COLORS.length];
                      return (
                        <tr key={cat.id} className="hover:bg-app-bg/50 transition-colors">
                          <td className="px-5 py-3 text-ink">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                              {cat.name}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right text-ink-muted tabular-nums">{fmt(t.estimated)}</td>
                          <td className="px-5 py-3 text-right text-ink-muted tabular-nums">{fmt(t.actual)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-app-border overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
                                />
                              </div>
                              <span className="text-[10px] tabular-nums text-ink-muted w-8 text-right flex-shrink-0">
                                {t.estimated > 0 ? `${Math.round(pct)}%` : '—'}
                              </span>
                            </div>
                          </td>
                          <td className={`px-5 py-3 text-right font-medium tabular-nums ${ou.cls}`}>{ou.text}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-app-border bg-brand-primary/5">
                      <td className="px-5 py-3 text-sm font-semibold text-ink">Total</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-ink tabular-nums">{fmt(grandEst)}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-ink tabular-nums">{fmt(grandAct)}</td>
                      <td className="px-5 py-3">
                        {grandEst > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-app-border overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min((grandAct / grandEst) * 100, 100)}%`,
                                  backgroundColor: grandAct > grandEst ? '#C8645B' : '#C97B84',
                                }}
                              />
                            </div>
                            <span className="text-[10px] tabular-nums text-ink-muted w-8 text-right flex-shrink-0">
                              {Math.round((grandAct / grandEst) * 100)}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className={`px-5 py-3 text-right text-sm font-semibold tabular-nums ${ouGrand.cls}`}>{ouGrand.text}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── Category cards ── */}
        {categories.length === 0 ? (
          <EmptyState onAdd={openAddCategory} />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {categories.map((cat, index) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                isDragging={dragIndex.current === index}
                isOver={overIndex === index && dragIndex.current !== index}
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                onEdit={() => openEditCategory(cat)}
                onDelete={() => setModal({ type: 'confirmDeleteCategory', category: cat })}
                onAddItem={() => openAddItem(cat.id)}
                onEditItem={(item) => openEditItem(cat.id, item)}
                onDeleteItem={(item) => setModal({ type: 'confirmDeleteItem', categoryId: cat.id, item })}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modals ── */}

      {/* Add / Edit Category */}
      {(modal?.type === 'addCategory' || modal?.type === 'editCategory') && (
        <Modal
          title={modal.type === 'addCategory' ? 'Add Category' : 'Edit Category'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <Input
              label="Category Name"
              placeholder="e.g. Reception, Apparel"
              value={catForm.name}
              onChange={e => setCatForm({ ...catForm, name: e.target.value })}
              autoFocus
            />
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Note <span className="text-ink-muted font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. * Excludes entertainment and decorations"
                value={catForm.note}
                onChange={e => setCatForm({ ...catForm, note: e.target.value })}
                className="w-full px-4 py-3 text-sm bg-app-surface border border-app-border rounded-xl text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="ghost" fullWidth onClick={() => setModal(null)}>Cancel</Button>
              <Button
                fullWidth
                isLoading={saving}
                onClick={submitCategory}
                disabled={!catForm.name.trim()}
              >
                {modal.type === 'addCategory' ? 'Add Category' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Item */}
      {(modal?.type === 'addItem' || modal?.type === 'editItem') && (
        <Modal
          title={modal.type === 'addItem' ? 'Add Item' : 'Edit Item'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <Input
              label="Item Name"
              placeholder="e.g. Wedding gown, Venue, Cake"
              value={itemForm.name}
              onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Estimated ({currency.code})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={itemForm.estimated}
                  onChange={e => setItemForm({ ...itemForm, estimated: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-app-surface border border-app-border rounded-xl text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Actual ({currency.code})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={itemForm.actual}
                  onChange={e => setItemForm({ ...itemForm, actual: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-app-surface border border-app-border rounded-xl text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all"
                />
              </div>
            </div>
            {/* Live over/under preview */}
            {(itemForm.estimated || itemForm.actual) && (() => {
              const est = parseFloat(itemForm.estimated) || 0;
              const act = parseFloat(itemForm.actual) || 0;
              const ou  = fmtOu(est - act);
              return (
                <div className="flex items-center justify-between px-4 py-2.5 bg-app-bg rounded-xl text-sm">
                  <span className="text-ink-muted">Over / Under</span>
                  <span className={`font-semibold ${ou.cls}`}>{ou.text}</span>
                </div>
              );
            })()}
            <div className="flex gap-3 pt-1">
              <Button variant="ghost" fullWidth onClick={() => setModal(null)}>Cancel</Button>
              <Button
                fullWidth
                isLoading={saving}
                onClick={submitItem}
                disabled={!itemForm.name.trim()}
              >
                {modal.type === 'addItem' ? 'Add Item' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm delete category */}
      {modal?.type === 'confirmDeleteCategory' && (
        <Modal title="Delete Category" onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-danger/8 border border-danger/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink">
                Delete <span className="font-semibold">{modal.category.name}</span> and all its{' '}
                {modal.category.items.length} item{modal.category.items.length !== 1 ? 's' : ''}?
                This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger" fullWidth isLoading={saving} onClick={confirmDeleteCategory}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm delete item */}
      {modal?.type === 'confirmDeleteItem' && (
        <Modal title="Delete Item" onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-danger/8 border border-danger/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink">
                Delete <span className="font-semibold">{modal.item.name}</span>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger" fullWidth isLoading={saving} onClick={confirmDeleteItem}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, valueClass = 'text-ink', note,
}: {
  label: string; value: string; valueClass?: string; note?: string;
}) {
  return (
    <div className="bg-app-surface border border-app-border rounded-2xl p-5">
      <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      {note && <p className={`text-xs mt-1 ${valueClass}`}>{note}</p>}
    </div>
  );
}

function CategoryCard({
  category, isDragging, isOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onEdit, onDelete, onAddItem, onEditItem, onDeleteItem,
}: {
  category: BudgetCategory;
  isDragging: boolean;
  isOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddItem: () => void;
  onEditItem: (item: BudgetItem) => void;
  onDeleteItem: (item: BudgetItem) => void;
}) {
  const { fmt, fmtOu } = useCurrency();
  const totals = categoryTotals(category);
  const ou = fmtOu(totals.overUnder);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={[
        'bg-app-surface rounded-2xl overflow-hidden transition-all duration-150 select-none',
        isDragging ? 'opacity-40 shadow-lg scale-[0.98] border-2 border-brand-primary/30' : 'border border-app-border',
        isOver     ? 'ring-2 ring-brand-primary/50 border-brand-primary/40 shadow-md'     : '',
      ].join(' ')}
    >
      {/* Category header */}
      <div className="flex items-start justify-between px-5 py-4 bg-brand-primary/5 border-b border-app-border">
        <div className="flex items-start gap-2 min-w-0">
          <GripVertical className="w-4 h-4 text-ink-muted/40 hover:text-ink-muted cursor-grab active:cursor-grabbing flex-shrink-0 mt-0.5 transition-colors" />
          <div className="min-w-0">
            <h3 className="font-serif text-sm font-semibold text-ink leading-tight">{category.name}</h3>
            {category.note && (
              <p className="text-xs text-ink-muted mt-0.5 italic">{category.note}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 ml-3 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-app-border rounded-lg transition-all"
            title="Edit category"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-ink-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
            title="Delete category"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 pb-4 pt-3">
        {category.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-ink-muted uppercase tracking-wider border-b border-app-border">
                  <th className="text-left pb-2 font-medium">Item</th>
                  <th className="text-right pb-2 font-medium">Est.</th>
                  <th className="text-right pb-2 font-medium">Actual</th>
                  <th className="text-right pb-2 font-medium">+/−</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border/60">
                {category.items.map(item => {
                  const iou = fmtOu(item.estimated - item.actual);
                  return (
                    <tr key={item.id} className="group">
                      <td className="py-2 text-ink pr-2">{item.name}</td>
                      <td className="py-2 text-right text-ink-muted tabular-nums text-xs">{fmt(item.estimated)}</td>
                      <td className="py-2 text-right text-ink-muted tabular-nums text-xs">{fmt(item.actual)}</td>
                      <td className={`py-2 text-right tabular-nums text-xs font-medium ${iou.cls}`}>{iou.text}</td>
                      <td className="py-2 pl-2">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-1 text-ink-muted hover:text-ink rounded transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item)}
                            className="p-1 text-ink-muted hover:text-danger rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-app-border">
                  <td className="pt-2.5 text-xs font-semibold text-ink uppercase tracking-wider">Total</td>
                  <td className="pt-2.5 text-right text-xs font-semibold text-ink tabular-nums">{fmt(totals.estimated)}</td>
                  <td className="pt-2.5 text-right text-xs font-semibold text-ink tabular-nums">{fmt(totals.actual)}</td>
                  <td className={`pt-2.5 text-right text-xs font-semibold tabular-nums ${ou.cls}`}>{ou.text}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-xs text-ink-muted py-3 text-center">No items yet — add one below</p>
        )}

        <button
          onClick={onAddItem}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand-primary hover:text-brand-hover transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Item
        </button>
      </div>
    </div>
  );
}

function BudgetDonutChart({ categories, grandAct }: { categories: BudgetCategory[]; grandAct: number }) {
  const { fmt } = useCurrency();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = categories
    .map((cat, i) => ({
      name: cat.name,
      value: categoryTotals(cat).actual,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
    .filter(d => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);
  const activeEntry = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-app-border">
        <h2 className="font-serif text-base font-semibold text-ink">Spending by Category</h2>
        <p className="text-xs text-ink-muted mt-0.5">Actual amounts spent per category</p>
      </div>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
          <p className="text-sm text-ink-muted">No actual spending recorded yet.</p>
          <p className="text-xs text-ink-muted mt-1">Enter actual amounts on your items to see the chart.</p>
        </div>
      ) : (
        <div className="px-5 py-5">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                    opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                    style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    const { cx, cy } = viewBox as { cx: number; cy: number };
                    const display = activeEntry ?? { name: 'Total Spent', value: grandAct };
                    const pct = activeEntry && total > 0
                      ? `${((activeEntry.value / total) * 100).toFixed(1)}%`
                      : null;
                    return (
                      <g>
                        <text x={cx} y={cy - (pct ? 10 : 6)} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#6D6A70">
                          {activeEntry ? activeEntry.name.length > 12 ? activeEntry.name.slice(0, 12) + '…' : activeEntry.name : 'Total Spent'}
                        </text>
                        <text x={cx} y={cy + (pct ? 8 : 10)} textAnchor="middle" dominantBaseline="middle" fontSize={15} fontWeight={700} fill="#2F2F33">
                          {fmt(display.value)}
                        </text>
                        {pct && (
                          <text x={cx} y={cy + 26} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#6D6A70">
                            {pct} of total
                          </text>
                        )}
                      </g>
                    );
                  }}
                />
              </Pie>
              <Tooltip
                formatter={(value) => [fmt(Number(value)), 'Actual']}
                contentStyle={{
                  background: 'var(--color-app-surface, #fff)',
                  border: '1px solid #E8DDD3',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#2F2F33',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {data.map((entry, i) => {
              const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
              return (
                <li
                  key={entry.name}
                  className="flex items-center gap-2 text-xs cursor-default"
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-ink truncate flex-1">{entry.name}</span>
                  <span className="text-ink-muted tabular-nums flex-shrink-0">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function BudgetBarChart({ categories }: { categories: BudgetCategory[] }) {
  const { fmt } = useCurrency();

  const data = categories.map((cat, i) => ({
    name: cat.name.length > 12 ? cat.name.slice(0, 11) + '…' : cat.name,
    fullName: cat.name,
    Estimated: categoryTotals(cat).estimated,
    Actual: categoryTotals(cat).actual,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const hasData = data.some(d => d.Estimated > 0 || d.Actual > 0);

  return (
    <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-app-border">
        <h2 className="font-serif text-base font-semibold text-ink">Estimated vs Actual</h2>
        <p className="text-xs text-ink-muted mt-0.5">Budget allocation compared to real spending</p>
      </div>
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
          <p className="text-sm text-ink-muted">Add estimated or actual amounts to see the comparison.</p>
        </div>
      ) : (
        <div className="px-4 py-5">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} barCategoryGap="30%" barGap={3} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DDD3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#6D6A70' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-40}
                textAnchor="end"
                height={70}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6D6A70' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={n => fmt(n)}
                width={72}
              />
              <Tooltip
                formatter={(value, name) => [fmt(Number(value)), name]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                contentStyle={{
                  background: 'var(--color-app-surface, #fff)',
                  border: '1px solid #E8DDD3',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#2F2F33',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                cursor={{ fill: 'rgba(201,123,132,0.05)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value) => <span style={{ color: '#6D6A70' }}>{value}</span>}
              />
              <Bar dataKey="Estimated" fill="#C97B84" fillOpacity={0.25} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual"    fill="#C97B84" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
        <Sparkles className="w-7 h-7 text-brand-primary" />
      </div>
      <h2 className="font-serif text-xl font-semibold text-ink mb-2">Start your budget</h2>
      <p className="text-sm text-ink-muted mb-6 max-w-xs">
        Add categories like Reception, Apparel, or Photography, then fill in the items.
      </p>
      <Button onClick={onAdd}>
        <Plus className="w-4 h-4" />
        Add First Category
      </Button>
    </div>
  );
}
