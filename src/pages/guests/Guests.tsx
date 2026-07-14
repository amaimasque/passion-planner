import { useState, useRef } from 'react';
import { Users, Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp, AlertTriangle, UtensilsCrossed, Phone, Mail, Send, Link2, Copy, Check, Download, Share2, LayoutGrid, List, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useGuests } from '../../hooks/useGuests';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import type { Guest, RsvpStatus, MealPreference, GuestGroup } from '../../types/guest';
import { guestDisplayName } from '../../types/guest';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { useAuth } from '../../contexts/AuthContext';
import { useWeddingDetails } from '../../hooks/useWeddingDetails';

// ── Constants ─────────────────────────────────────────────────────────────────

const RSVP_LABELS: Record<RsvpStatus, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  declined:  'Declined',
};

const RSVP_STYLES: Record<RsvpStatus, string> = {
  pending:   'bg-caution/10 text-caution',
  confirmed: 'bg-positive/10 text-positive',
  declined:  'bg-danger/10 text-danger',
};

const MEAL_LABELS: Record<MealPreference, string> = {
  standard:   'Standard',
  vegetarian: 'Vegetarian',
  vegan:      'Vegan',
  halal:      'Halal',
  other:      'Other',
};

const GROUP_LABELS: Record<GuestGroup, string> = {
  family:  'Family',
  friends: 'Friends',
  work:    'Work',
  church:  'Church',
  other:   'Other',
};

const GROUP_STYLES: Record<GuestGroup, string> = {
  family:  'bg-brand-primary/10 text-brand-primary',
  friends: 'bg-accent/10 text-accent',
  work:    'bg-brand-secondary/20 text-ink',
  church:  'bg-positive/10 text-positive',
  other:   'bg-app-border/50 text-ink-muted',
};

// ── Modal state ───────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'add' }
  | { type: 'edit'; guest: Guest }
  | { type: 'confirmDelete'; guest: Guest }
  | { type: 'rsvp'; guest: Guest }
  | null;

const EMPTY_FORM = {
  firstName: '',
  middleInitial: '',
  lastName: '',
  suffix: '',
  email: '',
  phone: '',
  rsvp: 'pending' as RsvpStatus,
  meal: 'standard' as MealPreference,
  group: 'friends' as GuestGroup,
  slots: 1,
  notes: '',
  isChild: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Guests() {
  const { guests, loading, save } = useGuests();
  const { currentUser } = useAuth();
  const { details: weddingDetails } = useWeddingDetails();

  const [modal, setModal]   = useState<ModalState>(null);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRsvp, setFilterRsvp]   = useState<RsvpStatus | 'all'>('all');
  const [filterGroup, setFilterGroup] = useState<GuestGroup | 'all'>('all');
  const [sortBy, setSortBy]   = useState<'firstName' | 'lastName'>('lastName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpResult, setRsvpResult]   = useState<{ rsvpUrl: string } | null>(null);
  const [rsvpError, setRsvpError]     = useState('');
  const [copied, setCopied]           = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);

  // ── RSVP helpers ────────────────────────────────────────────────────────────

  function openRsvp(g: Guest) {
    setRsvpResult(null);
    setRsvpError('');
    setCopied(false);
    setModal({ type: 'rsvp', guest: g });
  }

  async function handleRsvpAction(guest: Guest, sendEmail: boolean) {
    if (!currentUser) return;
    setRsvpLoading(true);
    setRsvpError('');
    try {
      // Generate token client-side
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const rsvpUrl = `${window.location.origin}/rsvp/${token}`;

      // Write token to Firestore (publicly readable, so the RSVP page can load it)
      await setDoc(doc(db, 'rsvpTokens', token), {
        guestId:            guest.id,
        userId:             currentUser.uid,
        guestFirstName:     guest.firstName,
        guestLastName:      guest.lastName,
        slots:              guest.slots ?? 1,
        weddingDate:        weddingDetails.date,
        ceremonyTime:       weddingDetails.ceremonyTime,
        churchAndAddress:   weddingDetails.churchAndAddress,
        receptionVenue:     weddingDetails.receptionVenue,
        receptionStartTime: weddingDetails.receptionStartTime,
        expiresAt:          Date.now() + 90 * 24 * 60 * 60 * 1000,
      });

      // Update guest record
      const now = Date.now();
      await save(guests.map(g =>
        g.id === guest.id
          ? { ...g, rsvpToken: token, rsvpEmailSentAt: sendEmail ? now : g.rsvpEmailSentAt }
          : g
      ));

      // Send email via EmailJS
      if (sendEmail && guest.email) {
        const dateStr = weddingDetails.date
          ? new Date(weddingDetails.date + 'T00:00:00').toLocaleDateString('en-PH', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })
          : '';
        const coupleNames =
          [weddingDetails.bride.firstName, weddingDetails.groom.firstName].filter(Boolean).join(' & ')
          || 'The Couple';

        await emailjs.send(
          'service_ztc7fed',
          'template_p090q1p',
          {
            to_email:            guest.email,
            guest_name:          guestDisplayName(guest),
            couple_names:        coupleNames,
            wedding_date:        dateStr,
            ceremony_time:       weddingDetails.ceremonyTime,
            church_and_address:  weddingDetails.churchAndAddress,
            reception_venue:     weddingDetails.receptionVenue,
            reception_start_time: weddingDetails.receptionStartTime,
            slots:               guest.slots ?? 1,
            slots_label:         (guest.slots ?? 1) === 1 ? 'seat' : 'seats',
            rsvp_url:            rsvpUrl,
          },
          'bfZ3kxwFt6deR2j7x'
        );
      }

      setRsvpResult({ rsvpUrl });
    } catch (err: any) {
      setRsvpError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function downloadQr(guestName: string) {
    const canvas = qrRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `rsvp-${guestName.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
  }

  async function shareRsvp(url: string, guestName: string) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RSVP Invitation',
          text: `Hi ${guestName}! You're invited. Please RSVP using the link below:`,
          url,
        });
      } catch {}
    } else {
      copyLink(url);
    }
  }

  // ── Form helpers ────────────────────────────────────────────────────────────

  function openAdd() {
    setForm(EMPTY_FORM);
    setModal({ type: 'add' });
  }

  function openEdit(g: Guest) {
    setForm({
      firstName:     g.firstName,
      middleInitial: g.middleInitial,
      lastName:      g.lastName,
      suffix:        g.suffix,
      email: g.email ?? '',
      phone: g.phone ?? '',
      rsvp:  g.rsvp,
      meal:  g.meal,
      group: g.group,
      slots: g.slots ?? 1,
      notes: g.notes ?? '',
      isChild: g.isChild ?? false,
    });
    setModal({ type: 'edit', guest: g });
  }

  function set<K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  // ── Save / delete ───────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setSaving(true);
    try {
      if (modal?.type === 'add') {
        const newGuest: Guest = {
          id:            uid(),
          firstName:     form.firstName.trim(),
          middleInitial: form.middleInitial.trim(),
          lastName:      form.lastName.trim(),
          suffix:        form.suffix.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          rsvp:  form.rsvp,
          meal:  form.meal,
          group: form.group,
          slots: Math.max(1, form.slots),
          notes: form.notes.trim() || undefined,
          isChild: form.isChild || undefined,
        };
        await save([...guests, newGuest]);
      } else if (modal?.type === 'edit') {
        const updated = guests.map(g =>
          g.id === modal.guest.id
            ? {
                ...g,
                firstName:     form.firstName.trim(),
                middleInitial: form.middleInitial.trim(),
                lastName:      form.lastName.trim(),
                suffix:        form.suffix.trim(),
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
                rsvp:  form.rsvp,
                meal:  form.meal,
                group: form.group,
                slots: Math.max(1, form.slots),
                notes: form.notes.trim() || undefined,
                isChild: form.isChild || undefined,
              }
            : g
        );
        await save(updated);
      }
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (modal?.type !== 'confirmDelete') return;
    setSaving(true);
    try {
      await save(guests.filter(g => g.id !== modal.guest.id));
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  // ── Filtering + sorting ─────────────────────────────────────────────────────

  function toggleSort(field: 'firstName' | 'lastName') {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  }

  const visible = guests
    .filter(g => {
      const q = search.toLowerCase();
      if (q && !guestDisplayName(g).toLowerCase().includes(q) && !(g.email ?? '').toLowerCase().includes(q)) return false;
      if (filterRsvp  !== 'all' && g.rsvp  !== filterRsvp)  return false;
      if (filterGroup !== 'all' && g.group !== filterGroup) return false;
      return true;
    })
    .sort((a, b) => {
      const va = (a[sortBy] ?? '').toLowerCase();
      const vb = (b[sortBy] ?? '').toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  // ── Print ───────────────────────────────────────────────────────────────────

  function handlePrint() {
    document.body.classList.add('printing-guests');
    window.print();
    document.body.classList.remove('printing-guests');
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  const totalHeads  = guests.reduce((sum, g) => sum + (g.slots ?? 1), 0);
  const confirmed   = guests.filter(g => g.rsvp === 'confirmed').length;
  const pending     = guests.filter(g => g.rsvp === 'pending').length;
  const declined    = guests.filter(g => g.rsvp === 'declined').length;
  const totalKids   = guests.filter(g => g.isChild).length;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-ink-muted text-sm">Loading guests…</p>
      </div>
    );
  }

  return (
    <div className="bg-app-bg font-sans min-h-screen">

      {/* ── Header ── */}
      <header className="bg-app-surface border-b border-app-border sticky top-0 z-10 no-print">
        <div className="px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="text-brand-primary w-5 h-5" />
            <span className="font-serif text-lg font-semibold text-ink tracking-wide">Guest List</span>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center gap-0.5 bg-app-bg border border-app-border rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                title="Card view"
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-app-surface text-brand-primary shadow-sm' : 'text-ink-muted hover:text-ink'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="List view"
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-app-surface text-brand-primary shadow-sm' : 'text-ink-muted hover:text-ink'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              title="Print guest list"
              className="p-2 rounded-xl border border-app-border bg-app-surface text-ink-muted hover:text-brand-primary hover:border-brand-primary/30 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <Button variant="primary" size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Add Guest
            </Button>
          </div>
        </div>
      </header>

      <div id="guest-print-root" className="p-4 lg:p-6 space-y-5">

        {/* ── Print-only title ── */}
        <div className="print-only hidden">
          <h1 className="font-serif text-2xl font-bold text-ink mb-1">Guest List</h1>
          <p className="text-xs text-ink-muted mb-4">
            {guests.length} guests · {totalHeads} total heads · {confirmed} confirmed · {pending} pending · {declined} declined · {totalKids} kids
          </p>
        </div>

        {/* ── Stats row ── */}
        <div className="no-print grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Heads',  value: totalHeads, cls: 'text-ink' },
            { label: 'Confirmed',    value: confirmed,  cls: 'text-positive' },
            { label: 'Pending',      value: pending,    cls: 'text-caution' },
            { label: 'Declined',     value: declined,   cls: 'text-danger' },
            { label: 'Total Kids',   value: totalKids,  cls: 'text-accent' },
          ].map(s => (
            <div key={s.label} className="bg-app-surface rounded-2xl border border-app-border px-4 py-3">
              <p className="text-xs text-ink-muted mb-0.5">{s.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${s.cls}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Search + filters ── */}
        <div className="no-print flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search guests…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-app-surface border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink placeholder:text-ink-muted"
            />
          </div>

          <SelectFilter
            value={filterRsvp}
            onChange={v => setFilterRsvp(v as RsvpStatus | 'all')}
            options={[
              { value: 'all',       label: 'All RSVP' },
              { value: 'pending',   label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'declined',  label: 'Declined' },
            ]}
          />

          <SelectFilter
            value={filterGroup}
            onChange={v => setFilterGroup(v as GuestGroup | 'all')}
            options={[
              { value: 'all',     label: 'All Groups' },
              { value: 'family',  label: 'Family' },
              { value: 'friends', label: 'Friends' },
              { value: 'work',    label: 'Work' },
              { value: 'other',   label: 'Other' },
            ]}
          />

          {/* Sort buttons */}
          <div className="flex items-center gap-1 bg-app-surface border border-app-border rounded-xl px-2 py-1.5">
            <span className="text-[10px] text-ink-muted mr-0.5 whitespace-nowrap">Sort:</span>
            {(['firstName', 'lastName'] as const).map(field => (
              <button
                key={field}
                type="button"
                onClick={() => toggleSort(field)}
                className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
                  sortBy === field
                    ? 'bg-brand-primary text-white'
                    : 'text-ink-muted hover:text-ink hover:bg-app-bg'
                }`}
              >
                {field === 'firstName' ? 'First' : 'Last'}
                {sortBy === field && (
                  sortDir === 'asc'
                    ? <ChevronUp className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Guest count ── */}
        {guests.length > 0 && (
          <p className="no-print text-xs text-ink-muted">
            Showing <strong className="text-ink">{visible.length}</strong> of <strong className="text-ink">{guests.length}</strong> guests
          </p>
        )}

        {/* ── Empty state ── */}
        {guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-brand-primary" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-ink mb-2">No guests yet</h2>
            <p className="text-sm text-ink-muted mb-5">Start building your guest list by adding your first guest.</p>
            <Button variant="primary" size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Add Guest
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-ink-muted">No guests match your filters.</p>
            <button
              type="button"
              onClick={() => { setSearch(''); setFilterRsvp('all'); setFilterGroup('all'); }}
              className="mt-2 text-xs text-brand-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* ── Card view ── */}
            {viewMode === 'card' && (
              <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {visible.map(g => (
                  <GuestCard
                    key={g.id}
                    guest={g}
                    onEdit={() => openEdit(g)}
                    onDelete={() => setModal({ type: 'confirmDelete', guest: g })}
                    onRsvp={() => openRsvp(g)}
                  />
                ))}
              </div>
            )}

            {/* ── List view ── */}
            {viewMode === 'list' && (
              <div className="no-print bg-app-surface border border-app-border rounded-2xl overflow-hidden">
                <GuestTable
                  guests={visible}
                  onEdit={g => openEdit(g)}
                  onDelete={g => setModal({ type: 'confirmDelete', guest: g })}
                  onRsvp={g => openRsvp(g)}
                />
              </div>
            )}

            {/* ── Print table (always rendered, visible only when printing) ── */}
            <div className="print-only hidden">
              <table id="guest-print-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Group</th>
                    <th>RSVP</th>
                    <th>Meal</th>
                    <th>Slots</th>
                    <th>Child</th>
                    <th>Email</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((g, i) => (
                    <tr key={g.id}>
                      <td>{i + 1}</td>
                      <td>{guestDisplayName(g)}</td>
                      <td>{GROUP_LABELS[g.group]}</td>
                      <td>{RSVP_LABELS[g.rsvp]}</td>
                      <td>{MEAL_LABELS[g.meal]}</td>
                      <td>{g.slots ?? 1}</td>
                      <td>{g.isChild ? 'Yes' : ''}</td>
                      <td>{g.email ?? ''}</td>
                      <td>{g.phone ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <Modal
          title={modal.type === 'add' ? 'Add Guest' : 'Edit Guest'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-end">
              <Input
                label="First Name *"
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                placeholder="First"
              />
              <div className="w-16">
                <label className="block text-xs font-medium text-ink-muted mb-1">MI</label>
                <input
                  type="text"
                  value={form.middleInitial}
                  onChange={e => set('middleInitial', e.target.value)}
                  placeholder="M"
                  maxLength={3}
                  className="w-full px-3 py-2 text-xs border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink placeholder:text-ink-muted"
                />
              </div>
              <Input
                label="Last Name *"
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                placeholder="Last"
              />
              <div className="w-20">
                <label className="block text-xs font-medium text-ink-muted mb-1">Suffix</label>
                <input
                  type="text"
                  value={form.suffix}
                  onChange={e => set('suffix', e.target.value)}
                  placeholder="Jr."
                  className="w-full px-3 py-2 text-xs border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink placeholder:text-ink-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Email */}
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="email@example.com"
              />
              {/* Phone */}
              <Input
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+63 9XX XXX XXXX"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* RSVP */}
              <LabeledSelect label="RSVP Status" value={form.rsvp} onChange={v => set('rsvp', v as RsvpStatus)}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
              </LabeledSelect>

              {/* Group */}
              <LabeledSelect label="Group" value={form.group} onChange={v => set('group', v as GuestGroup)}>
                <option value="family">Family</option>
                <option value="friends">Friends</option>
                <option value="work">Work</option>
                <option value="church">Church</option>
                <option value="other">Other</option>
              </LabeledSelect>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Meal */}
              <LabeledSelect label="Meal Preference" value={form.meal} onChange={v => set('meal', v as MealPreference)}>
                <option value="standard">Standard</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="halal">Halal</option>
                <option value="other">Other</option>
              </LabeledSelect>

              {/* Slots */}
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Slots Allocated</label>
                <input
                  type="number"
                  min="1"
                  value={form.slots}
                  onChange={e => set('slots', Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-xs border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <p className="text-[10px] text-ink-muted mt-1">Includes the guest (e.g. 2 = guest + 1)</p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Dietary restrictions, special requests…"
                className="w-full px-3 py-2 text-xs border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none text-ink placeholder:text-ink-muted"
              />
            </div>

            {/* Is Child */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isChild}
                onChange={e => set('isChild', e.target.checked)}
                className="w-4 h-4 rounded border-app-border accent-brand-primary"
              />
              <span className="text-xs text-ink">This guest is a child</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving} disabled={!form.firstName.trim() || !form.lastName.trim()}>
                {modal.type === 'add' ? 'Add Guest' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── RSVP Modal ── */}
      {modal?.type === 'rsvp' && (() => {
        const g = modal.guest;
        const name = guestDisplayName(g);
        const sentAt = g.rsvpEmailSentAt
          ? new Date(g.rsvpEmailSentAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
          : null;
        return (
          <Modal title="Send RSVP Invitation" onClose={() => setModal(null)}>
            <div className="space-y-4">
              {/* Guest info */}
              <div className="flex items-center gap-3 p-3 bg-app-bg rounded-xl border border-app-border">
                <div className="w-9 h-9 rounded-full bg-brand-primary/15 flex items-center justify-center text-brand-primary text-xs font-semibold flex-shrink-0">
                  {((g.firstName?.[0] ?? '') + (g.lastName?.[0] ?? '')).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{name}</p>
                  {g.email && <p className="text-xs text-ink-muted">{g.email}</p>}
                  {!g.email && <p className="text-xs text-caution">No email address on file</p>}
                </div>
              </div>

              {sentAt && (
                <p className="text-xs text-ink-muted flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Invite email last sent on <strong className="text-ink">{sentAt}</strong>
                </p>
              )}

              {rsvpError && (
                <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{rsvpError}</p>
              )}

              {/* Result: QR + link */}
              {rsvpResult && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-positive flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> RSVP link is ready
                  </p>

                  {/* QR code */}
                  <div className="flex flex-col items-center gap-2 py-3 bg-white rounded-2xl border border-app-border">
                    <QRCodeCanvas
                      ref={qrRef}
                      value={rsvpResult.rsvpUrl}
                      size={180}
                      bgColor="#FFFFFF"
                      fgColor="#2F2F33"
                      level="M"
                    />
                    <p className="text-[10px] text-ink-muted">Scan to open the RSVP page</p>
                  </div>

                  {/* Copyable URL */}
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={rsvpResult.rsvpUrl}
                      className="flex-1 min-w-0 px-3 py-2 text-[11px] border border-app-border rounded-xl bg-app-bg text-ink-muted truncate"
                    />
                    <button
                      type="button"
                      onClick={() => copyLink(rsvpResult.rsvpUrl)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-app-border hover:bg-app-bg transition-colors text-ink whitespace-nowrap"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-positive" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  {/* Download + Share */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => downloadQr(name)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl border border-app-border hover:bg-app-bg transition-colors text-ink"
                    >
                      <Download className="w-3.5 h-3.5" /> Download QR
                    </button>
                    <button
                      type="button"
                      onClick={() => shareRsvp(rsvpResult.rsvpUrl, name)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl bg-brand-primary text-white hover:bg-brand-hover transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share Link
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!rsvpResult && (
                <div className="space-y-2">
                  {g.email && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={rsvpLoading}
                      onClick={() => handleRsvpAction(g, true)}
                      className="w-full justify-center"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Send RSVP Email
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    isLoading={rsvpLoading}
                    onClick={() => handleRsvpAction(g, false)}
                    className="w-full justify-center"
                  >
                    <Link2 className="w-3.5 h-3.5 mr-1.5" />
                    Generate Link Only
                  </Button>
                </div>
              )}

              {rsvpResult && (
                <div className="flex justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRsvpAction(g, false)}
                    isLoading={rsvpLoading}
                  >
                    Regenerate
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setModal(null)}>Done</Button>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* ── Confirm Delete Modal ── */}
      {modal?.type === 'confirmDelete' && (
        <Modal
          title="Remove Guest"
          onClose={() => setModal(null)}
        >
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-danger" />
            </div>
            <div>
              <p className="text-sm text-ink font-medium mb-1">Remove <strong>{guestDisplayName(modal.guest)}</strong>?</p>
              <p className="text-xs text-ink-muted">This will permanently remove them from your guest list.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={saving}>Remove</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Guest Table (list view) ────────────────────────────────────────────────────

function GuestTable({ guests, onEdit, onDelete, onRsvp }: {
  guests: Guest[];
  onEdit: (g: Guest) => void;
  onDelete: (g: Guest) => void;
  onRsvp: (g: Guest) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-app-border bg-app-bg">
            <th className="text-left px-4 py-2.5 font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">#</th>
            <th className="text-left px-4 py-2.5 font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Name</th>
            <th className="text-left px-4 py-2.5 font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Group</th>
            <th className="text-left px-4 py-2.5 font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">RSVP</th>
            <th className="text-left px-4 py-2.5 font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Meal</th>
            <th className="text-left px-4 py-2.5 font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Slots</th>
            <th className="text-left px-4 py-2.5 font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Child</th>
            <th className="text-left px-4 py-2.5 font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">Contact</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-app-border/60">
          {guests.map((g, i) => (
            <tr key={g.id} className="hover:bg-app-bg/60 transition-colors group">
              <td className="px-4 py-2.5 text-ink-muted tabular-nums">{i + 1}</td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-brand-primary/15 flex items-center justify-center text-brand-primary text-[10px] font-semibold flex-shrink-0 select-none">
                    {((g.firstName?.[0] ?? '') + (g.lastName?.[0] ?? '')).toUpperCase() || '?'}
                  </div>
                  <span className="font-medium text-ink whitespace-nowrap">{guestDisplayName(g)}</span>
                </div>
              </td>
              <td className="px-4 py-2.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${GROUP_STYLES[g.group]}`}>
                  {GROUP_LABELS[g.group]}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${RSVP_STYLES[g.rsvp]}`}>
                  {RSVP_LABELS[g.rsvp]}
                </span>
              </td>
              <td className="px-4 py-2.5 text-ink-muted whitespace-nowrap">
                {g.meal !== 'standard' ? (
                  <span className="flex items-center gap-1">
                    <UtensilsCrossed className="w-3 h-3" />{MEAL_LABELS[g.meal]}
                  </span>
                ) : (
                  <span className="text-ink-muted/50">Standard</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-ink tabular-nums">{g.slots ?? 1}</td>
              <td className="px-4 py-2.5">
                {g.isChild && (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent">Child</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-ink-muted">
                <div className="space-y-0.5">
                  {g.email && (
                    <a href={`mailto:${g.email}`} className="flex items-center gap-1 hover:text-brand-primary transition-colors truncate max-w-[160px]">
                      <Mail className="w-3 h-3 flex-shrink-0" />{g.email}
                    </a>
                  )}
                  {g.phone && (
                    <a href={`tel:${g.phone}`} className="flex items-center gap-1 hover:text-brand-primary transition-colors">
                      <Phone className="w-3 h-3 flex-shrink-0" />{g.phone}
                    </a>
                  )}
                </div>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => onRsvp(g)} className="p-1.5 rounded-lg text-ink-muted hover:text-brand-primary hover:bg-brand-primary/5 transition-colors" title="Send RSVP">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => onEdit(g)} className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-app-bg transition-colors" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => onDelete(g)} className="p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-danger/5 transition-colors" title="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Guest Card ─────────────────────────────────────────────────────────────────

function GuestCard({ guest: g, onEdit, onDelete, onRsvp }: { guest: Guest; onEdit: () => void; onDelete: () => void; onRsvp: () => void }) {
  const initials = ((g.firstName?.[0] ?? '') + (g.lastName?.[0] ?? '')).toUpperCase() || '?';

  return (
    <div className="bg-app-surface border border-app-border rounded-2xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      {/* Top row: avatar + name + actions */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-primary/15 flex items-center justify-center text-brand-primary text-xs font-semibold flex-shrink-0 select-none">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{guestDisplayName(g)}</p>
          <p className="text-xs text-ink-muted">{g.slots ?? 1} {(g.slots ?? 1) === 1 ? 'slot' : 'slots'}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onRsvp}
            className="p-1.5 rounded-lg text-ink-muted hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
            title="Send RSVP Invite"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-app-bg transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-danger/5 transition-colors"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${RSVP_STYLES[g.rsvp]}`}>
          {RSVP_LABELS[g.rsvp]}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${GROUP_STYLES[g.group]}`}>
          {GROUP_LABELS[g.group]}
        </span>
        {g.meal !== 'standard' && (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-app-border/50 text-ink-muted">
            <UtensilsCrossed className="w-2.5 h-2.5" />
            {MEAL_LABELS[g.meal]}
          </span>
        )}
        {g.isChild && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent">
            Child
          </span>
        )}
        {g.rsvpEmailSentAt && (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent">
            <Mail className="w-2.5 h-2.5" />
            Invited
          </span>
        )}
      </div>

      {/* Contact info */}
      {(g.email || g.phone) && (
        <div className="space-y-1 border-t border-app-border pt-2">
          {g.email && (
            <a href={`mailto:${g.email}`} className="flex items-center gap-1.5 text-[11px] text-ink-muted hover:text-brand-primary transition-colors truncate">
              <Mail className="w-3 h-3 flex-shrink-0" />{g.email}
            </a>
          )}
          {g.phone && (
            <a href={`tel:${g.phone}`} className="flex items-center gap-1.5 text-[11px] text-ink-muted hover:text-brand-primary transition-colors">
              <Phone className="w-3 h-3 flex-shrink-0" />{g.phone}
            </a>
          )}
        </div>
      )}

      {/* Notes */}
      {g.notes && (
        <p className="text-[11px] text-ink-muted italic border-t border-app-border pt-2 line-clamp-2">{g.notes}</p>
      )}
    </div>
  );
}

// ── Small reusable select ──────────────────────────────────────────────────────

function SelectFilter({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-2 text-xs bg-app-surface border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-muted pointer-events-none" />
    </div>
  );
}

function LabeledSelect({ label, value, onChange, children }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-muted mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none pl-3 pr-7 py-2 text-xs bg-app-surface border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink cursor-pointer"
        >
          {children}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-muted pointer-events-none" />
      </div>
    </div>
  );
}
