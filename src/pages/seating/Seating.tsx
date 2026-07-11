import { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid, Plus, Trash2, X, Search, Check,
  Printer, Users, Pencil, AlertTriangle,
} from 'lucide-react';
import { useSeating } from '../../hooks/useSeating';
import { useGuests } from '../../hooks/useGuests';
import { guestDisplayName } from '../../types/guest';
import { buildPrefillTables } from '../../types/seating';
import type { SeatingTable } from '../../types/seating';
import type { Guest } from '../../types/guest';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

// ── Helper ────────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Guest assign combobox (per table) ─────────────────────────────────────────

function GuestAssignCombobox({ tableId, guestIds, guests, tableMap, onToggle }: {
  tableId: string;
  guestIds: string[];
  guests: Guest[];
  tableMap: Map<string, string>; // guestId → table name (for guests in OTHER tables)
  onToggle: (guestId: string) => void;
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = guests.filter(g =>
    !search || guestDisplayName(g).toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs border border-dashed border-brand-primary/40 rounded-xl text-brand-primary hover:bg-brand-primary/5 hover:border-brand-primary transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        Assign guests…
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[220px] bg-app-surface border border-app-border rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-app-border">
            <Search className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search guests…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-xs bg-transparent focus:outline-none text-ink placeholder:text-ink-muted"
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-ink-muted text-center">No guests found</p>
            ) : (
              filtered.map(g => {
                const inThis  = guestIds.includes(g.id);
                const inOther = !inThis && tableMap.has(g.id);
                const otherName = inOther ? tableMap.get(g.id) : '';
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onToggle(g.id)}
                    className={[
                      'w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors',
                      inThis
                        ? 'bg-brand-primary/8 hover:bg-brand-primary/12'
                        : 'hover:bg-app-bg',
                    ].join(' ')}
                  >
                    {/* Checkmark / indicator */}
                    <span className="w-4 flex-shrink-0">
                      {inThis
                        ? <Check className="w-3.5 h-3.5 text-brand-primary" />
                        : inOther
                          ? <span className="block w-2 h-2 rounded-full bg-ink-muted/30 mx-auto" />
                          : null
                      }
                    </span>

                    {/* Name */}
                    <span className={`flex-1 ${inThis ? 'font-semibold text-brand-primary' : inOther ? 'text-ink-muted' : 'text-ink'}`}>
                      {guestDisplayName(g)}
                    </span>

                    {/* Other table label */}
                    {inOther && (
                      <span className="text-[10px] text-ink-muted italic truncate max-w-[80px]">{otherName}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Table card ─────────────────────────────────────────────────────────────────

function TableCard({
  table, guests, tableMap, onUpdate, onDelete, onToggleGuest,
}: {
  table: SeatingTable;
  guests: Guest[];
  tableMap: Map<string, string>;
  onUpdate: (patch: Partial<SeatingTable>) => void;
  onDelete: () => void;
  onToggleGuest: (guestId: string) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState(table.name);
  const nameRef = useRef<HTMLInputElement>(null);

  const assignedGuests = guests.filter(g => table.guestIds.includes(g.id));
  const filled = assignedGuests.length;
  const cap    = table.capacity;
  const pct    = cap > 0 ? Math.min(100, Math.round((filled / cap) * 100)) : null;
  const over   = cap > 0 && filled > cap;

  function saveName() {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== table.name) onUpdate({ name: trimmed });
    setEditingName(false);
  }

  function startEdit() {
    setNameInput(table.name);
    setEditingName(true);
    setTimeout(() => nameRef.current?.select(), 0);
  }

  return (
    <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col print:break-inside-avoid">

      {/* Card header */}
      <div className="bg-ink px-4 py-3 flex items-center gap-2">
        {editingName ? (
          <input
            ref={nameRef}
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
            className="flex-1 bg-transparent text-white text-sm font-bold focus:outline-none border-b border-white/40 min-w-0"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="flex-1 text-sm font-bold text-white text-left truncate hover:text-brand-secondary transition-colors group flex items-center gap-1.5 min-w-0"
          >
            <span className="truncate">{table.name}</span>
            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 flex-shrink-0 transition-opacity" />
          </button>
        )}

        {/* Seat count badge */}
        <span className={`text-xs font-medium flex-shrink-0 ${over ? 'text-danger' : 'text-white/60'}`}>
          {filled}{cap > 0 ? `/${cap}` : ''} {filled === 1 ? 'seat' : 'seats'}
        </span>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className="p-0.5 text-white/30 hover:text-danger flex-shrink-0 transition-colors print:hidden"
          title="Delete table"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Capacity progress bar (only if cap set) */}
      {cap > 0 && (
        <div className="h-1 bg-app-border">
          <div
            className={`h-full transition-all ${over ? 'bg-danger' : 'bg-positive'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Card body */}
      <div className="p-4 flex-1 flex flex-col gap-3">

        {/* Assigned guest pills */}
        {assignedGuests.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {assignedGuests.map(g => (
              <span
                key={g.id}
                className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full text-[11px] font-medium"
              >
                {guestDisplayName(g)}
                <button
                  type="button"
                  onClick={() => onToggleGuest(g.id)}
                  className="hover:text-danger transition-colors print:hidden"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-muted italic print:block hidden">No guests assigned</p>
        )}

        {/* Assign combobox (screen only) */}
        <div className="print:hidden">
          <GuestAssignCombobox
            tableId={table.id}
            guestIds={table.guestIds}
            guests={guests}
            tableMap={tableMap}
            onToggle={onToggleGuest}
          />
        </div>

        {/* Capacity input (screen only) */}
        <div className="flex items-center gap-2 print:hidden">
          <label className="text-[11px] text-ink-muted flex-shrink-0">Max seats:</label>
          <input
            type="number"
            min="0"
            value={table.capacity || ''}
            onChange={e => onUpdate({ capacity: parseInt(e.target.value) || 0 })}
            placeholder="Unlimited"
            className="w-20 text-xs text-ink border-b border-app-border focus:outline-none focus:border-brand-primary bg-transparent py-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        {/* Notes */}
        {(table.notes || !editingName) && (
          <input
            type="text"
            value={table.notes}
            onChange={e => onUpdate({ notes: e.target.value })}
            placeholder="Notes…"
            className="text-xs text-ink-muted bg-transparent border-b border-transparent hover:border-app-border focus:border-brand-primary focus:outline-none transition-colors placeholder:text-ink-muted/40 print:hidden"
          />
        )}
        {table.notes && (
          <p className="hidden print:block text-xs text-ink-muted italic">{table.notes}</p>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Seating() {
  const { tables, loading, save } = useSeating();
  const { guests } = useGuests();

  const [deleteTarget, setDeleteTarget] = useState<SeatingTable | null>(null);
  const [addModal, setAddModal]         = useState(false);
  const [newName, setNewName]           = useState('');
  const [saving, setSaving]             = useState(false);

  // Auto-prefill
  const prefillDone = useRef(false);
  useEffect(() => {
    if (loading || tables.length > 0 || prefillDone.current) return;
    prefillDone.current = true;
    save(buildPrefillTables());
  }, [loading, tables.length, save]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  // Map: guestId → table name (for guests assigned to a table)
  const tableMap = new Map<string, string>();
  tables.forEach(t => t.guestIds.forEach(gid => tableMap.set(gid, t.name)));

  const totalAssigned   = new Set(tables.flatMap(t => t.guestIds)).size;
  const totalGuests     = guests.length;
  const unassignedCount = totalGuests - totalAssigned;

  // ── Mutations ────────────────────────────────────────────────────────────────

  function updateTable(id: string, patch: Partial<SeatingTable>) {
    const updated = tables.map(t => t.id === id ? { ...t, ...patch } : t);
    save(updated);
  }

  function deleteTable(id: string) {
    save(tables.filter(t => t.id !== id));
    setDeleteTarget(null);
  }

  function toggleGuest(tableId: string, guestId: string) {
    const inThis = tables.find(t => t.id === tableId)?.guestIds.includes(guestId);
    const updated = tables.map(t => {
      // Remove from all tables first
      const base = { ...t, guestIds: t.guestIds.filter(id => id !== guestId) };
      // If toggling ON for this table, add it back
      if (t.id === tableId && !inThis) return { ...base, guestIds: [...base.guestIds, guestId] };
      return base;
    });
    save(updated);
  }

  async function handleAddTable() {
    const name = newName.trim() || `Table ${tables.length + 1}`;
    setSaving(true);
    try {
      await save([...tables, { id: uid(), name, capacity: 0, guestIds: [], notes: '' }]);
      setAddModal(false);
      setNewName('');
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-ink-muted text-sm">Loading seating…</p>
      </div>
    );
  }

  return (
    <div className="bg-app-bg font-sans min-h-screen">

      {/* ── Header ── */}
      <header className="bg-app-surface border-b border-app-border sticky top-0 z-10 print:hidden">
        <div className="px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="text-brand-primary w-5 h-5" />
            <span className="font-serif text-lg font-semibold text-ink tracking-wide">Seating</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" /> Print
            </Button>
            <Button variant="primary" size="sm" onClick={() => setAddModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Table
            </Button>
          </div>
        </div>
      </header>

      {/* ── Print title ── */}
      <div className="hidden print:block text-center pt-6 pb-3">
        <h1 className="font-serif text-2xl font-bold text-ink">Seating Arrangement</h1>
      </div>

      <div className="p-4 lg:p-6 space-y-5">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:hidden">
          {[
            { label: 'Tables',       value: tables.length,     cls: 'text-ink' },
            { label: 'Assigned',     value: totalAssigned,     cls: 'text-positive' },
            { label: 'Unassigned',   value: unassignedCount,   cls: unassignedCount > 0 ? 'text-caution' : 'text-ink-muted' },
          ].map(s => (
            <div key={s.label} className="bg-app-surface border border-app-border rounded-2xl px-4 py-3">
              <p className="text-xs text-ink-muted mb-0.5">{s.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${s.cls}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Unassigned guests chip list ── */}
        {unassignedCount > 0 && (
          <div className="bg-app-surface border border-app-border rounded-2xl p-4 print:hidden">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-3.5 h-3.5 text-caution" />
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Unassigned Guests ({unassignedCount})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {guests.filter(g => !tableMap.has(g.id)).map(g => (
                <span key={g.id} className="px-2.5 py-1 bg-caution/8 text-caution border border-caution/20 rounded-full text-[11px] font-medium">
                  {guestDisplayName(g)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Table grid ── */}
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
              <LayoutGrid className="w-7 h-7 text-brand-primary" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-ink mb-2">No tables yet</h2>
            <p className="text-sm text-ink-muted mb-5">Add tables and assign guests to each one.</p>
            <Button variant="primary" size="sm" onClick={() => setAddModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Table
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map(table => (
              <TableCard
                key={table.id}
                table={table}
                guests={guests}
                tableMap={tableMap}
                onUpdate={patch => updateTable(table.id, patch)}
                onDelete={() => setDeleteTarget(table)}
                onToggleGuest={guestId => toggleGuest(table.id, guestId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Add Table Modal ── */}
      {addModal && (
        <Modal title="Add Table" onClose={() => { setAddModal(false); setNewName(''); }}>
          <div className="space-y-4">
            <Input
              label="Table Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleAddTable()}
              placeholder={`e.g. Table ${tables.length + 1}`}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setAddModal(false); setNewName(''); }}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleAddTable} isLoading={saving}>Add Table</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm Delete Modal ── */}
      {deleteTarget && (
        <Modal title="Delete Table" onClose={() => setDeleteTarget(null)}>
          <div className="flex gap-3 items-start mb-5">
            <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-danger" />
            </div>
            <div>
              <p className="text-sm text-ink font-medium mb-1">
                Delete <strong>{deleteTarget.name}</strong>?
              </p>
              <p className="text-xs text-ink-muted">
                {deleteTarget.guestIds.length > 0
                  ? `${deleteTarget.guestIds.length} guest${deleteTarget.guestIds.length === 1 ? '' : 's'} will become unassigned.`
                  : 'This table has no guests assigned.'}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={() => deleteTable(deleteTarget.id)}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
