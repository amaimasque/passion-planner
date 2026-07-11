import { useState, useRef, useEffect, Fragment } from 'react';
import {
  ListMusic, Plus, Pencil, Trash2, GripVertical,
  AlertTriangle, ChevronDown, Search, Check, Printer,
} from 'lucide-react';
import { useProcessional } from '../../hooks/useProcessional';
import { useGuests } from '../../hooks/useGuests';
import { useWeddingDetails } from '../../hooks/useWeddingDetails';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import type { ProcessionalRole, ProcessionalMember, ProcessionalPair, ProcessionalLayout } from '../../types/processional';
import type { Guest } from '../../types/guest';
import { guestDisplayName } from '../../types/guest';

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Default prefilled roles ────────────────────────────────────────────────────

function buildPrefillRoles(
  officiantGuestId: string,
  groomGuestId: string,
  brideGuestId: string,
): ProcessionalRole[] {
  function mkId() { return uid(); }

  function single(
    name: string,
    subtitle = '',
    remarks = '',
    members: ProcessionalMember[] = [],
  ): ProcessionalRole {
    return { id: mkId(), name, subtitle, remarks, layout: 'single', leftLabel: '', rightLabel: '', members, pairs: [] };
  }

  function paired(
    name: string,
    leftLabel: string,
    rightLabel: string,
    subtitle = '',
    remarks = '',
    pairs: ProcessionalPair[] = [],
  ): ProcessionalRole {
    return { id: mkId(), name, subtitle, remarks, layout: 'paired', leftLabel, rightLabel, members: [], pairs };
  }

  function member(guestId: string, name = '', remarks = ''): ProcessionalMember {
    return { id: mkId(), guestId, name, remarks };
  }

  function pair(leftGuestId: string, leftName: string, rightGuestId: string, rightName: string, remarks = ''): ProcessionalPair {
    return { id: mkId(), leftGuestId, leftName, rightGuestId, rightName, remarks };
  }

  return [
    single(
      'Officiating Pastor / Priest', '', '',
      officiantGuestId ? [member(officiantGuestId)] : [],
    ),
    single('Best Men'),
    paired('Parents of the Groom', 'Father', 'Mother'),
    paired('Principal Sponsors', 'Ninong', 'Ninang', '', 'Boutonniere | Corsage'),
    paired('Veil Sponsors',   'Ninong', 'Ninang', 'Secondary Sponsors'),
    paired('Cord Sponsors',   'Ninong', 'Ninang', 'Secondary Sponsors'),
    paired('Candle Sponsors', 'Ninong', 'Ninang', 'Secondary Sponsors'),
    single('Bible Bearer'),
    single('Coin Bearer'),
    single('Ring Bearer'),
    single('Flower Girls'),
    single('Groomsmen'),
    single('Bridesmaids'),
    single('Maid of Honor'),
    paired('Parents of the Bride', 'Father', 'Mother'),
    paired(
      'Bride and Groom', 'Groom', 'Bride', '', '',
      (groomGuestId || brideGuestId) ? [pair(groomGuestId, '', brideGuestId, '')] : [],
    ),
  ];
}

function guestName(guests: Guest[], guestId: string, fallback: string) {
  if (!guestId) return fallback;
  const g = guests.find(g => g.id === guestId);
  return g ? guestDisplayName(g) : fallback;
}

function guestPhone(guests: Guest[], guestId: string) {
  if (!guestId) return '';
  return guests.find(g => g.id === guestId)?.phone ?? '';
}

// ── Guest combobox (single-select) ────────────────────────────────────────────

function GuestCombobox({ guests, value, onChange, placeholder }: {
  guests: Guest[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = guests.find(g => g.id === value);
  const filtered = guests.filter(g => !search || guestDisplayName(g).toLowerCase().includes(search.toLowerCase()));

  function handleBlur(e: React.FocusEvent) {
    if (!ref.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
      setSearch('');
    }
  }

  function select(id: string) {
    onChange(id);
    setOpen(false);
    setSearch('');
  }

  return (
    <div ref={ref} className="relative" onBlur={handleBlur}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs border border-app-border rounded-xl bg-app-surface hover:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-left"
      >
        <span className={selected ? 'text-ink font-medium' : 'text-ink-muted'}>
          {selected ? guestDisplayName(selected) : (placeholder ?? 'Select from guest list…')}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-app-surface border border-app-border rounded-xl shadow-lg overflow-hidden">
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
          <div className="max-h-44 overflow-y-auto">
            {value && (
              <button type="button" onClick={() => select('')}
                className="w-full px-3 py-2 text-xs text-left text-ink-muted hover:bg-app-bg italic">
                — Clear
              </button>
            )}
            {filtered.length === 0
              ? <p className="px-3 py-3 text-xs text-ink-muted text-center">No guests found</p>
              : filtered.map(g => (
                <button
                  key={g.id} type="button" onClick={() => select(g.id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left hover:bg-app-bg"
                >
                  <span className={g.id === value ? 'font-semibold text-brand-primary' : 'text-ink'}>{guestDisplayName(g)}</span>
                  {g.id === value && <Check className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />}
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal state ───────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'addRole' }
  | { type: 'editRole'; role: ProcessionalRole }
  | { type: 'deleteRole'; role: ProcessionalRole }
  | { type: 'addMember'; role: ProcessionalRole }
  | { type: 'editMember'; role: ProcessionalRole; member: ProcessionalMember }
  | { type: 'deleteMember'; role: ProcessionalRole; member: ProcessionalMember }
  | { type: 'addPair'; role: ProcessionalRole }
  | { type: 'editPair'; role: ProcessionalRole; pair: ProcessionalPair }
  | { type: 'deletePair'; role: ProcessionalRole; pair: ProcessionalPair }
  | null;

const EMPTY_ROLE_FORM = {
  name: '', subtitle: '', remarks: '',
  layout: 'single' as ProcessionalLayout,
  leftLabel: '', rightLabel: '',
};

const EMPTY_MEMBER_FORM = { guestId: '', name: '', remarks: '' };
const EMPTY_PAIR_FORM   = { leftGuestId: '', leftName: '', rightGuestId: '', rightName: '', remarks: '' };

// ── Main component ────────────────────────────────────────────────────────────

export default function Processional() {
  const { roles, loading, save } = useProcessional();
  const { guests } = useGuests();
  const { details, loading: weddingLoading } = useWeddingDetails();

  const [modal, setModal]         = useState<ModalState>(null);
  const [roleForm, setRoleForm]   = useState(EMPTY_ROLE_FORM);
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER_FORM);
  const [pairForm, setPairForm]   = useState(EMPTY_PAIR_FORM);
  const [saving, setSaving]       = useState(false);

  // Drag-to-reorder
  const dragIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  // Auto-prefill default roles when the page is first visited with no roles
  const prefillDone = useRef(false);
  useEffect(() => {
    if (loading || weddingLoading) return;
    if (roles.length > 0) return;
    if (prefillDone.current) return;
    prefillDone.current = true;
    save(buildPrefillRoles(
      details.officiantGuestId,
      details.groom.guestId,
      details.bride.guestId,
    ));
  }, [loading, weddingLoading, roles.length, details, save]);

  // ── Save helpers ────────────────────────────────────────────────────────────

  async function doSave(updated: ProcessionalRole[]) {
    setSaving(true);
    try { await save(updated); } finally { setSaving(false); }
  }

  // ── Role CRUD ───────────────────────────────────────────────────────────────

  async function submitRole() {
    if (!roleForm.name.trim()) return;
    if (modal?.type === 'addRole') {
      const newRole: ProcessionalRole = {
        id: uid(),
        name: roleForm.name.trim(),
        subtitle: roleForm.subtitle.trim(),
        remarks: roleForm.remarks.trim(),
        layout: roleForm.layout,
        leftLabel: roleForm.leftLabel.trim(),
        rightLabel: roleForm.rightLabel.trim(),
        members: [],
        pairs: [],
      };
      await doSave([...roles, newRole]);
    } else if (modal?.type === 'editRole') {
      await doSave(roles.map(r =>
        r.id === modal.role.id
          ? { ...r, name: roleForm.name.trim(), subtitle: roleForm.subtitle.trim(),
              remarks: roleForm.remarks.trim(), layout: roleForm.layout,
              leftLabel: roleForm.leftLabel.trim(), rightLabel: roleForm.rightLabel.trim() }
          : r
      ));
    }
    setModal(null);
  }

  async function deleteRole() {
    if (modal?.type !== 'deleteRole') return;
    await doSave(roles.filter(r => r.id !== modal.role.id));
    setModal(null);
  }

  // ── Member CRUD (single layout) ─────────────────────────────────────────────

  async function submitMember() {
    const foundGuest = memberForm.guestId ? guests.find(g => g.id === memberForm.guestId) : undefined;
    const displayName = foundGuest ? guestDisplayName(foundGuest) : memberForm.name.trim();
    if (!displayName) return;
    if (modal?.type === 'addMember') {
      const newMember: ProcessionalMember = {
        id: uid(),
        guestId: memberForm.guestId,
        name: memberForm.guestId ? '' : memberForm.name.trim(),
        remarks: memberForm.remarks.trim(),
      };
      await doSave(roles.map(r =>
        r.id === modal.role.id ? { ...r, members: [...r.members, newMember] } : r
      ));
    } else if (modal?.type === 'editMember') {
      await doSave(roles.map(r =>
        r.id === modal.role.id
          ? { ...r, members: r.members.map(m =>
              m.id === modal.member.id
                ? { ...m, guestId: memberForm.guestId, name: memberForm.guestId ? '' : memberForm.name.trim(), remarks: memberForm.remarks.trim() }
                : m
            )}
          : r
      ));
    }
    setModal(null);
  }

  async function deleteMember() {
    if (modal?.type !== 'deleteMember') return;
    await doSave(roles.map(r =>
      r.id === modal.role.id ? { ...r, members: r.members.filter(m => m.id !== modal.member.id) } : r
    ));
    setModal(null);
  }

  // ── Pair CRUD (paired layout) ───────────────────────────────────────────────

  async function submitPair() {
    const leftGuest  = pairForm.leftGuestId  ? guests.find(g => g.id === pairForm.leftGuestId)  : undefined;
    const rightGuest = pairForm.rightGuestId ? guests.find(g => g.id === pairForm.rightGuestId) : undefined;
    const leftDisplay  = leftGuest  ? guestDisplayName(leftGuest)  : pairForm.leftName.trim();
    const rightDisplay = rightGuest ? guestDisplayName(rightGuest) : pairForm.rightName.trim();
    if (!leftDisplay && !rightDisplay) return;
    if (modal?.type === 'addPair') {
      const newPair: ProcessionalPair = {
        id: uid(),
        leftGuestId: pairForm.leftGuestId, leftName: pairForm.leftGuestId ? '' : pairForm.leftName.trim(),
        rightGuestId: pairForm.rightGuestId, rightName: pairForm.rightGuestId ? '' : pairForm.rightName.trim(),
        remarks: pairForm.remarks.trim(),
      };
      await doSave(roles.map(r =>
        r.id === modal.role.id ? { ...r, pairs: [...r.pairs, newPair] } : r
      ));
    } else if (modal?.type === 'editPair') {
      await doSave(roles.map(r =>
        r.id === modal.role.id
          ? { ...r, pairs: r.pairs.map(p =>
              p.id === modal.pair.id
                ? { ...p, leftGuestId: pairForm.leftGuestId, leftName: pairForm.leftGuestId ? '' : pairForm.leftName.trim(),
                    rightGuestId: pairForm.rightGuestId, rightName: pairForm.rightGuestId ? '' : pairForm.rightName.trim(),
                    remarks: pairForm.remarks.trim() }
                : p
            )}
          : r
      ));
    }
    setModal(null);
  }

  async function deletePair() {
    if (modal?.type !== 'deletePair') return;
    await doSave(roles.map(r =>
      r.id === modal.role.id ? { ...r, pairs: r.pairs.filter(p => p.id !== modal.pair.id) } : r
    ));
    setModal(null);
  }

  // ── Drag reorder ────────────────────────────────────────────────────────────

  function onDragStart(i: number) { dragIdx.current = i; }
  function onDragOver(e: React.DragEvent, i: number) { e.preventDefault(); if (overIdx !== i) setOverIdx(i); }
  function onDrop(i: number) {
    const from = dragIdx.current;
    dragIdx.current = null;
    setOverIdx(null);
    if (from === null || from === i) return;
    const r = [...roles];
    const [moved] = r.splice(from, 1);
    r.splice(i, 0, moved);
    doSave(r);
  }
  function onDragEnd() { dragIdx.current = null; setOverIdx(null); }

  // ── Open modals ─────────────────────────────────────────────────────────────

  function openAddRole() { setRoleForm(EMPTY_ROLE_FORM); setModal({ type: 'addRole' }); }
  function openEditRole(role: ProcessionalRole) {
    setRoleForm({ name: role.name, subtitle: role.subtitle, remarks: role.remarks,
      layout: role.layout, leftLabel: role.leftLabel, rightLabel: role.rightLabel });
    setModal({ type: 'editRole', role });
  }
  function openAddMember(role: ProcessionalRole) { setMemberForm(EMPTY_MEMBER_FORM); setModal({ type: 'addMember', role }); }
  function openEditMember(role: ProcessionalRole, member: ProcessionalMember) {
    setMemberForm({ guestId: member.guestId, name: member.name, remarks: member.remarks });
    setModal({ type: 'editMember', role, member });
  }
  function openAddPair(role: ProcessionalRole) { setPairForm(EMPTY_PAIR_FORM); setModal({ type: 'addPair', role }); }
  function openEditPair(role: ProcessionalRole, pair: ProcessionalPair) {
    setPairForm({ leftGuestId: pair.leftGuestId, leftName: pair.leftName,
      rightGuestId: pair.rightGuestId, rightName: pair.rightName, remarks: pair.remarks });
    setModal({ type: 'editPair', role, pair });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-ink-muted text-sm">Loading processional…</p>
      </div>
    );
  }

  return (
    <div className="bg-app-bg font-sans min-h-screen">

      {/* Header */}
      <header className="bg-app-surface border-b border-app-border sticky top-0 z-10 print:hidden">
        <div className="px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ListMusic className="text-brand-primary w-5 h-5" />
            <span className="font-serif text-lg font-semibold text-ink tracking-wide">Processional</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" /> Print
            </Button>
            <Button variant="primary" size="sm" onClick={openAddRole}>
              <Plus className="w-4 h-4 mr-1" /> Add Role
            </Button>
          </div>
        </div>
      </header>

      {/* Print title */}
      <div className="hidden print:block text-center pt-6 pb-3">
        <h1 className="font-serif text-2xl font-bold text-ink">Processional Order</h1>
      </div>

      <div className="p-4 lg:p-6">
        {roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
              <ListMusic className="w-7 h-7 text-brand-primary" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-ink mb-2">No roles yet</h2>
            <p className="text-sm text-ink-muted mb-5">Add roles like "Best Men", "Principal Sponsors", "Flower Girls", etc.</p>
            <Button variant="primary" size="sm" onClick={openAddRole}>
              <Plus className="w-4 h-4 mr-1" /> Add First Role
            </Button>
          </div>
        ) : (
          <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-ink">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white w-[60%]">Role &amp; Names</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-secondary border-l border-white/20">Remarks | Contact Number</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role, idx) => (
                  <Fragment key={role.id}>
                    {/* Spacer between roles */}
                    {idx > 0 && (
                      <tr>
                        <td colSpan={2} className="h-2 bg-app-bg/50" />
                      </tr>
                    )}

                    {/* Role header row */}
                    <tr
                      draggable
                      onDragStart={() => onDragStart(idx)}
                      onDragOver={e => onDragOver(e, idx)}
                      onDrop={() => onDrop(idx)}
                      onDragEnd={onDragEnd}
                      className={[
                        'group transition-all',
                        dragIdx.current === idx ? 'opacity-40' : '',
                        overIdx === idx && dragIdx.current !== idx ? 'ring-2 ring-inset ring-brand-primary/40' : '',
                      ].join(' ')}
                    >
                      <td className="border border-app-border/50 bg-app-bg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-ink-muted/30 group-hover:text-ink-muted cursor-grab flex-shrink-0 transition-colors print:hidden" />
                          <span className="flex-1 text-center text-sm font-bold text-ink">{role.name}</span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                            <button type="button" onClick={() => openEditRole(role)}
                              className="p-1 text-ink-muted hover:text-ink rounded transition-colors" title="Edit role">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button type="button" onClick={() => setModal({ type: 'deleteRole', role })}
                              className="p-1 text-ink-muted hover:text-danger rounded transition-colors" title="Delete role">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="border border-app-border/50 px-3 py-2 text-xs text-ink-muted italic text-center border-l border-app-border/50">
                        {role.remarks}
                      </td>
                    </tr>

                    {/* Subtitle row */}
                    {role.subtitle && (
                      <tr>
                        <td className="border border-app-border/50 px-4 py-1.5 text-center text-xs italic text-ink-muted">
                          {role.subtitle}
                        </td>
                        <td className="border border-app-border/50 border-l border-app-border/50" />
                      </tr>
                    )}

                    {/* Paired layout: column labels */}
                    {role.layout === 'paired' && (role.leftLabel || role.rightLabel) && (
                      <tr>
                        <td className="border border-app-border/50 px-4 py-1">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-center text-[11px] font-semibold text-ink-muted uppercase tracking-wider italic">
                              {role.leftLabel}
                            </span>
                            <span className="text-center text-[11px] font-semibold text-ink-muted uppercase tracking-wider italic">
                              {role.rightLabel}
                            </span>
                          </div>
                        </td>
                        <td className="border border-app-border/50 border-l border-app-border/50" />
                      </tr>
                    )}

                    {/* Single layout members */}
                    {role.layout === 'single' && role.members.map(m => {
                      const displayName = guestName(guests, m.guestId, m.name);
                      const phone = guestPhone(guests, m.guestId);
                      return (
                        <tr key={m.id} className="group/row hover:bg-brand-primary/3 transition-colors">
                          <td className="border border-app-border/30 px-4 py-1.5">
                            <div className="flex items-center gap-2">
                              <span className="flex-1 text-center text-sm text-ink">{displayName}</span>
                              <div className="flex gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity print:hidden">
                                <button type="button" onClick={() => openEditMember(role, m)}
                                  className="p-0.5 text-ink-muted hover:text-ink rounded transition-colors">
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button type="button" onClick={() => setModal({ type: 'deleteMember', role, member: m })}
                                  className="p-0.5 text-ink-muted hover:text-danger rounded transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="border border-app-border/30 px-3 py-1.5 text-xs text-ink-muted italic border-l border-app-border/50">
                            {[m.remarks, phone].filter(Boolean).join(' | ')}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Paired layout pairs */}
                    {role.layout === 'paired' && role.pairs.map(p => {
                      const left  = guestName(guests, p.leftGuestId,  p.leftName);
                      const right = guestName(guests, p.rightGuestId, p.rightName);
                      const lPhone = guestPhone(guests, p.leftGuestId);
                      const rPhone = guestPhone(guests, p.rightGuestId);
                      const phones = [lPhone, rPhone].filter(Boolean).join(' / ');
                      return (
                        <tr key={p.id} className="group/row hover:bg-brand-primary/3 transition-colors">
                          <td className="border border-app-border/30 px-4 py-1.5">
                            <div className="grid grid-cols-2 gap-2 items-center">
                              <span className="text-center text-sm text-ink">{left}</span>
                              <div className="flex items-center gap-2">
                                <span className="flex-1 text-center text-sm text-ink">{right}</span>
                                <div className="flex gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity print:hidden">
                                  <button type="button" onClick={() => openEditPair(role, p)}
                                    className="p-0.5 text-ink-muted hover:text-ink rounded transition-colors">
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button type="button" onClick={() => setModal({ type: 'deletePair', role, pair: p })}
                                    className="p-0.5 text-ink-muted hover:text-danger rounded transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="border border-app-border/30 px-3 py-1.5 text-xs text-ink-muted italic border-l border-app-border/50">
                            {[p.remarks, phones].filter(Boolean).join(' | ')}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Add member / pair button */}
                    <tr className="print:hidden">
                      <td className="border border-app-border/30 px-4 py-1.5" colSpan={2}>
                        <button
                          type="button"
                          onClick={() => role.layout === 'single' ? openAddMember(role) : openAddPair(role)}
                          className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-hover transition-colors mx-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {role.layout === 'single' ? 'Add member' : 'Add pair'}
                        </button>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Role Modal ── */}
      {(modal?.type === 'addRole' || modal?.type === 'editRole') && (
        <Modal
          title={modal.type === 'addRole' ? 'Add Role' : 'Edit Role'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <Input
              label="Role Name *"
              value={roleForm.name}
              onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Best Men, Flower Girls, Officiating Pastor"
            />
            <Input
              label="Subtitle"
              value={roleForm.subtitle}
              onChange={e => setRoleForm(f => ({ ...f, subtitle: e.target.value }))}
              placeholder="e.g. TO CARRY OUR SYMBOL OF UNITY"
            />
            <Input
              label="Group Remarks"
              value={roleForm.remarks}
              onChange={e => setRoleForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="e.g. Ninongs: Boutonniere | Ninangs: Corsage"
            />

            {/* Layout toggle */}
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-2">Layout</label>
              <div className="flex gap-2">
                {(['single', 'paired'] as ProcessionalLayout[]).map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setRoleForm(f => ({ ...f, layout: l }))}
                    className={[
                      'flex-1 py-2 px-3 text-xs rounded-xl border transition-all capitalize',
                      roleForm.layout === l
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-app-surface text-ink border-app-border hover:border-brand-primary/40',
                    ].join(' ')}
                  >
                    {l === 'single' ? 'Single column' : 'Paired (two columns)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Labels for paired */}
            {roleForm.layout === 'paired' && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Left Column Label"
                  value={roleForm.leftLabel}
                  onChange={e => setRoleForm(f => ({ ...f, leftLabel: e.target.value }))}
                  placeholder="e.g. TEAM GROOM"
                />
                <Input
                  label="Right Column Label"
                  value={roleForm.rightLabel}
                  onChange={e => setRoleForm(f => ({ ...f, rightLabel: e.target.value }))}
                  placeholder="e.g. TEAM BRIDE"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={submitRole} isLoading={saving} disabled={!roleForm.name.trim()}>
                {modal.type === 'addRole' ? 'Add Role' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Role Modal ── */}
      {modal?.type === 'deleteRole' && (
        <Modal title="Delete Role" onClose={() => setModal(null)}>
          <div className="flex gap-3 items-start mb-5">
            <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-danger" />
            </div>
            <div>
              <p className="text-sm text-ink font-medium">Delete <strong>{modal.role.name}</strong> and all its members?</p>
              <p className="text-xs text-ink-muted mt-1">This cannot be undone.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={deleteRole} isLoading={saving}>Delete</Button>
          </div>
        </Modal>
      )}

      {/* ── Add / Edit Member Modal (single layout) ── */}
      {(modal?.type === 'addMember' || modal?.type === 'editMember') && (
        <Modal
          title={modal.type === 'addMember' ? `Add Member — ${modal.role.name}` : 'Edit Member'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">From Guest List</label>
              <GuestCombobox
                guests={guests}
                value={memberForm.guestId}
                onChange={id => setMemberForm(f => ({ ...f, guestId: id, name: id ? '' : f.name }))}
              />
            </div>
            {!memberForm.guestId && (
              <Input
                label="Or Enter Name"
                value={memberForm.name}
                onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Free-text name"
              />
            )}
            <Input
              label="Remarks"
              value={memberForm.remarks}
              onChange={e => setMemberForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="e.g. Boutonniere, To carry the candle"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button
                variant="primary" size="sm" onClick={submitMember} isLoading={saving}
                disabled={!memberForm.guestId && !memberForm.name.trim()}
              >
                {modal.type === 'addMember' ? 'Add' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Member Modal ── */}
      {modal?.type === 'deleteMember' && (
        <Modal title="Remove Member" onClose={() => setModal(null)}>
          <div className="flex gap-3 items-start mb-5">
            <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-danger" />
            </div>
            <p className="text-sm text-ink">
              Remove <strong>{guestName(guests, modal.member.guestId, modal.member.name)}</strong> from <strong>{modal.role.name}</strong>?
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={deleteMember} isLoading={saving}>Remove</Button>
          </div>
        </Modal>
      )}

      {/* ── Add / Edit Pair Modal (paired layout) ── */}
      {(modal?.type === 'addPair' || modal?.type === 'editPair') && (
        <Modal
          title={modal.type === 'addPair' ? `Add Pair — ${modal.role.name}` : 'Edit Pair'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            {/* Left */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                {modal.role.leftLabel || 'Left'}
              </p>
              <GuestCombobox
                guests={guests}
                value={pairForm.leftGuestId}
                onChange={id => setPairForm(f => ({ ...f, leftGuestId: id, leftName: id ? '' : f.leftName }))}
                placeholder="Select from guest list…"
              />
              {!pairForm.leftGuestId && (
                <input
                  type="text"
                  value={pairForm.leftName}
                  onChange={e => setPairForm(f => ({ ...f, leftName: e.target.value }))}
                  placeholder="Or enter name"
                  className="w-full px-3 py-2 text-xs border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink placeholder:text-ink-muted"
                />
              )}
            </div>

            {/* Right */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                {modal.role.rightLabel || 'Right'}
              </p>
              <GuestCombobox
                guests={guests}
                value={pairForm.rightGuestId}
                onChange={id => setPairForm(f => ({ ...f, rightGuestId: id, rightName: id ? '' : f.rightName }))}
                placeholder="Select from guest list…"
              />
              {!pairForm.rightGuestId && (
                <input
                  type="text"
                  value={pairForm.rightName}
                  onChange={e => setPairForm(f => ({ ...f, rightName: e.target.value }))}
                  placeholder="Or enter name"
                  className="w-full px-3 py-2 text-xs border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink placeholder:text-ink-muted"
                />
              )}
            </div>

            <Input
              label="Remarks"
              value={pairForm.remarks}
              onChange={e => setPairForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="e.g. Boutonniere | Corsage"
            />

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button
                variant="primary" size="sm" onClick={submitPair} isLoading={saving}
                disabled={!pairForm.leftGuestId && !pairForm.leftName.trim() && !pairForm.rightGuestId && !pairForm.rightName.trim()}
              >
                {modal.type === 'addPair' ? 'Add' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Pair Modal ── */}
      {modal?.type === 'deletePair' && (
        <Modal title="Remove Pair" onClose={() => setModal(null)}>
          <div className="flex gap-3 items-start mb-5">
            <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-danger" />
            </div>
            <p className="text-sm text-ink">Remove this pair from <strong>{modal.role.name}</strong>?</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={deletePair} isLoading={saving}>Remove</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
