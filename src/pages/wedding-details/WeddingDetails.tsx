import { useState, useRef, useEffect } from 'react';
import { Heart, Plus, X, Check, ChevronDown, Search } from 'lucide-react';
import { useWeddingDetails } from '../../hooks/useWeddingDetails';
import { useGuests } from '../../hooks/useGuests';
import type { WeddingDetails as IWeddingDetails, BrideGroomInfo } from '../../types/weddingDetails';
import type { MotifColor } from '../../types/weddingDetails';
import type { Guest } from '../../types/guest';
import { guestDisplayName } from '../../types/guest';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt12h(time: string) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function composeName(info: BrideGroomInfo): string {
  const parts = [info.firstName.trim()];
  if (info.middleInitial.trim()) parts.push(info.middleInitial.trim() + '.');
  parts.push(info.lastName.trim());
  const base = parts.filter(Boolean).join(' ');
  return info.suffix.trim() ? `${base}, ${info.suffix.trim()}` : base;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function syncPersonToGuests(
  info: BrideGroomInfo,
  current: Guest[],
): { guestId: string; list: Guest[] } {
  const displayName = composeName(info);
  if (!displayName) return { guestId: info.guestId, list: current };

  const idx = info.guestId ? current.findIndex(g => g.id === info.guestId) : -1;
  if (idx >= 0) {
    const updated = [...current];
    updated[idx] = {
      ...updated[idx],
      firstName:     info.firstName.trim(),
      middleInitial: info.middleInitial.trim(),
      lastName:      info.lastName.trim(),
      suffix:        info.suffix.trim(),
      email: info.email.trim() || undefined,
      phone: info.phone.trim() || undefined,
    };
    return { guestId: info.guestId, list: updated };
  }
  const newId = uid();
  return {
    guestId: newId,
    list: [...current, {
      id: newId,
      firstName:     info.firstName.trim(),
      middleInitial: info.middleInitial.trim(),
      lastName:      info.lastName.trim(),
      suffix:        info.suffix.trim(),
      email: info.email.trim() || undefined,
      phone: info.phone.trim() || undefined,
      rsvp: 'confirmed', meal: 'standard', group: 'family', slots: 1,
    }],
  };
}

// ── Searchable guest combobox ─────────────────────────────────────────────────

function GuestCombobox({ guests, value, onChange, placeholder }: {
  guests: Guest[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = guests.find(g => g.id === value);
  const filtered = guests.filter(g =>
    !search || guestDisplayName(g).toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function select(id: string) {
    onChange(id);
    setOpen(false);
    setSearch('');
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs border border-app-border rounded-xl bg-app-surface hover:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-colors text-left"
      >
        <span className={selected ? 'text-ink font-medium' : 'text-ink-muted'}>
          {selected ? guestDisplayName(selected) : (placeholder ?? 'Select from guest list…')}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-app-surface border border-app-border rounded-xl shadow-lg overflow-hidden">
          {/* Search input */}
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
          <div className="max-h-48 overflow-y-auto">
            {/* Clear option */}
            {value && (
              <button
                type="button"
                onClick={() => select('')}
                className="w-full px-3 py-2 text-xs text-left text-ink-muted hover:bg-app-bg transition-colors italic"
              >
                — Clear selection
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-ink-muted text-center">No guests found</p>
            ) : (
              filtered.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => select(g.id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left hover:bg-app-bg transition-colors"
                >
                  <span className={g.id === value ? 'font-semibold text-brand-primary' : 'text-ink'}>{guestDisplayName(g)}</span>
                  {g.id === value && <Check className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Multi-select guest combobox ───────────────────────────────────────────────

function GuestMultiCombobox({ guests, values, onChange, placeholder }: {
  guests: Guest[];
  values: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = guests.filter(g => values.includes(g.id));
  const filtered = guests.filter(g =>
    !search || guestDisplayName(g).toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggle(id: string) {
    onChange(values.includes(id) ? values.filter(v => v !== id) : [...values, id]);
  }

  function removeSelected(id: string) {
    onChange(values.filter(v => v !== id));
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(g => (
            <span key={g.id} className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-medium">
              {guestDisplayName(g)}
              <button type="button" onClick={() => removeSelected(g.id)} className="hover:text-danger transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs border border-app-border rounded-xl bg-app-surface hover:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-colors text-left"
      >
        <span className="text-ink-muted">{placeholder ?? 'Select guests…'}</span>
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
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-ink-muted text-center">No guests found</p>
            ) : (
              filtered.map(g => {
                const checked = values.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggle(g.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left hover:bg-app-bg transition-colors"
                  >
                    <span className={checked ? 'font-semibold text-brand-primary' : 'text-ink'}>{guestDisplayName(g)}</span>
                    {checked && <Check className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />}
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

// ── Motif color picker ────────────────────────────────────────────────────────

function MotifPicker({ colors, onChange }: {
  colors: MotifColor[];
  onChange: (colors: MotifColor[]) => void;
}) {
  const [adding, setAdding]   = useState(false);
  const [hex, setHex]         = useState('#C97B84');
  const [name, setName]       = useState('');

  function addColor() {
    onChange([...colors, { hex, name: name.trim() }]);
    setHex('#C97B84');
    setName('');
    setAdding(false);
  }

  function removeColor(i: number) {
    onChange(colors.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      {/* Existing swatches */}
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-app-bg border border-app-border rounded-full pl-1 pr-2 py-1">
            <span
              className="w-4 h-4 rounded-full border border-white shadow-sm flex-shrink-0"
              style={{ background: c.hex }}
            />
            {c.name && <span className="text-[11px] text-ink font-medium">{c.name}</span>}
            <span className="text-[10px] text-ink-muted font-mono">{c.hex}</span>
            <button
              type="button"
              onClick={() => removeColor(i)}
              className="ml-0.5 text-ink-muted hover:text-danger transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-brand-primary border border-dashed border-brand-primary/40 rounded-full hover:bg-brand-primary/5 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add color
          </button>
        )}
      </div>

      {/* Add color form */}
      {adding && (
        <div className="flex items-end gap-2 p-3 bg-app-bg border border-app-border rounded-xl">
          <div>
            <label className="block text-[10px] font-medium text-ink-muted mb-1">Color</label>
            <input
              type="color"
              value={hex}
              onChange={e => setHex(e.target.value)}
              className="w-9 h-9 rounded-lg border border-app-border cursor-pointer p-0.5 bg-app-surface"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-ink-muted mb-1">Name (optional)</label>
            <input
              type="text"
              placeholder="e.g. Royal Blue"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addColor()}
              className="w-full px-2.5 py-1.5 text-xs border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink placeholder:text-ink-muted bg-app-surface"
            />
          </div>
          <button
            type="button"
            onClick={addColor}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Add
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="p-1.5 text-ink-muted hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Bride / Groom card ────────────────────────────────────────────────────────

function BrideGroomCard({ role, info, onChange }: {
  role: 'Bride' | 'Groom';
  info: BrideGroomInfo;
  onChange: (updated: BrideGroomInfo) => void;
}) {
  const initial = (info.firstName.trim() || info.lastName.trim() || role)[0].toUpperCase();
  const isBride = role === 'Bride';
  const headerCls = isBride
    ? 'bg-brand-primary'
    : 'bg-accent';

  function setField<K extends keyof BrideGroomInfo>(k: K, v: BrideGroomInfo[K]) {
    onChange({ ...info, [k]: v });
  }

  const fieldCls = 'w-full px-3 py-2 text-xs border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink placeholder:text-ink-muted/50 bg-app-surface';

  return (
    <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden">
      <div className={`${headerCls} px-4 py-2.5 flex items-center gap-2.5`}>
        <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initial}
        </div>
        <span className="text-sm font-bold text-white tracking-wide uppercase">{role}</span>
      </div>
      <div className="p-4 space-y-3">
        {/* Name row */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-end">
          <div>
            <label className="block text-[10px] font-medium text-ink-muted mb-1">First Name *</label>
            <input type="text" value={info.firstName} onChange={e => setField('firstName', e.target.value)}
              placeholder="First" className={fieldCls} />
          </div>
          <div className="w-16">
            <label className="block text-[10px] font-medium text-ink-muted mb-1">MI</label>
            <input type="text" value={info.middleInitial} onChange={e => setField('middleInitial', e.target.value)}
              placeholder="M" maxLength={3} className={fieldCls} />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-ink-muted mb-1">Last Name *</label>
            <input type="text" value={info.lastName} onChange={e => setField('lastName', e.target.value)}
              placeholder="Last" className={fieldCls} />
          </div>
          <div className="w-20">
            <label className="block text-[10px] font-medium text-ink-muted mb-1">Suffix</label>
            <input type="text" value={info.suffix} onChange={e => setField('suffix', e.target.value)}
              placeholder="Jr." className={fieldCls} />
          </div>
        </div>

        {/* Contact row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-ink-muted mb-1">Phone</label>
            <input type="tel" value={info.phone} onChange={e => setField('phone', e.target.value)}
              placeholder="+63 9XX XXX XXXX" className={fieldCls} />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-ink-muted mb-1">Email</label>
            <input type="email" value={info.email} onChange={e => setField('email', e.target.value)}
              placeholder="email@example.com" className={fieldCls} />
          </div>
        </div>

        {/* Composed name preview */}
        {composeName(info) && (
          <p className="text-[11px] text-ink-muted">
            Will appear as: <span className="font-medium text-ink">{composeName(info)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── Row component ─────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[200px_1fr] border-b border-app-border/60 last:border-b-0">
      <div className="px-5 py-3.5 flex items-center">
        <span className="text-sm text-ink">{label}</span>
      </div>
      <div className="px-5 py-2.5 border-l border-app-border/60 flex items-center min-h-[48px]">
        {children}
      </div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm text-ink bg-transparent focus:outline-none placeholder:text-app-border"
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WeddingDetails() {
  const { details, loading, save } = useWeddingDetails();
  const { guests, save: saveGuests } = useGuests();
  const [form, setForm]   = useState<IWeddingDetails | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]  = useState(false);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize form once loaded; seed guestCount from guest list if not yet set
  useEffect(() => {
    if (!loading && form === null) {
      const totalSlots = guests.reduce((sum, g) => sum + (g.slots ?? 1), 0);
      setForm({
        ...details,
        guestCount: details.guestCount > 0 ? details.guestCount : totalSlots,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, details, form]);

  if (loading || form === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-ink-muted text-sm">Loading…</p>
      </div>
    );
  }

  // Live guest list total (for the sync hint)
  const totalSlots = guests.reduce((sum, g) => sum + (g.slots ?? 1), 0);

  // Debounced auto-save
  function update<K extends keyof IWeddingDetails>(key: K, value: IWeddingDetails[K]) {
    const next = { ...form, [key]: value };
    setForm(next as IWeddingDetails);
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(async () => {
      setSaving(true);
      await save(next as IWeddingDetails);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }

  function updateBrideGroom(role: 'bride' | 'groom', info: BrideGroomInfo) {
    const next = { ...form, [role]: info } as IWeddingDetails;
    setForm(next);
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(async () => {
      setSaving(true);
      try {
        // Sync bride then groom into the guest list
        const brideResult = syncPersonToGuests(next.bride, guests);
        const groomResult = syncPersonToGuests(next.groom, brideResult.list);
        const finalNext: IWeddingDetails = {
          ...next,
          bride: { ...next.bride, guestId: brideResult.guestId },
          groom: { ...next.groom, guestId: groomResult.guestId },
        };
        await Promise.all([
          save(finalNext),
          saveGuests(JSON.parse(JSON.stringify(groomResult.list))),
        ]);
        setForm(finalNext);
      } finally {
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    }, 800);
  }

  const officiant      = guests.find(g => g.id === form.officiantGuestId);
  const receptionHost  = guests.find(g => g.id === form.receptionHostGuestId);

  return (
    <div className="bg-app-bg font-sans min-h-screen">

      {/* Header */}
      <header className="bg-app-surface border-b border-app-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="text-brand-primary w-5 h-5" />
            <span className="font-serif text-lg font-semibold text-ink tracking-wide">Wedding Details</span>
          </div>
          <span className={`text-xs transition-opacity duration-300 ${saving ? 'text-ink-muted opacity-100' : saved ? 'text-positive opacity-100' : 'opacity-0'}`}>
            {saving ? 'Saving…' : 'Saved'}
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

        {/* ── Bride & Groom cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BrideGroomCard
            role="Bride"
            info={form.bride}
            onChange={info => updateBrideGroom('bride', info)}
          />
          <BrideGroomCard
            role="Groom"
            info={form.groom}
            onChange={info => updateBrideGroom('groom', info)}
          />
        </div>

        <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">

          {/* Table header */}
          <div className="bg-ink px-5 py-3">
            <h2 className="text-center text-sm font-bold text-white tracking-wide">Wedding Details</h2>
          </div>

          {/* Rows */}
          <div>
            {/* Date */}
            <Row label="Date">
              <TextInput
                type="date"
                value={form.date}
                onChange={v => update('date', v)}
              />
            </Row>

            {/* Number of Guests — editable; seeded from guest list total */}
            <Row label="Number of Guests">
              <div className="flex items-center gap-3 w-full">
                <input
                  type="number"
                  min="0"
                  value={form.guestCount || ''}
                  onChange={e => update('guestCount', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 text-sm font-bold text-brand-primary bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                {totalSlots > 0 && (
                  <span className="text-xs text-ink-muted">
                    Guest list total: {totalSlots}
                    {totalSlots !== form.guestCount && (
                      <button
                        type="button"
                        onClick={() => update('guestCount', totalSlots)}
                        className="ml-1.5 text-brand-primary hover:underline"
                      >
                        Sync
                      </button>
                    )}
                  </span>
                )}
              </div>
            </Row>

            {/* Motif */}
            <Row label="Motif">
              <MotifPicker
                colors={form.motifColors}
                onChange={v => update('motifColors', v)}
              />
            </Row>

            {/* Theme */}
            <Row label="Theme">
              <TextInput
                value={form.theme}
                onChange={v => update('theme', v)}
                placeholder="e.g. Bohemian Beach"
              />
            </Row>

            {/* Church and Address */}
            <Row label="Church and Address">
              <TextInput
                value={form.churchAndAddress}
                onChange={v => update('churchAndAddress', v)}
                placeholder="e.g. St. Peter's Cathedral, Manila"
              />
            </Row>

            {/* Ceremony Time */}
            <Row label="Ceremony Time">
              <div className="flex items-center gap-3 w-full">
                <input
                  type="time"
                  value={form.ceremonyTime}
                  onChange={e => update('ceremonyTime', e.target.value)}
                  className="text-sm text-ink bg-transparent focus:outline-none"
                />
                {form.ceremonyTime && (
                  <span className="text-sm font-medium text-brand-primary">{fmt12h(form.ceremonyTime)}</span>
                )}
              </div>
            </Row>

            {/* Officiating Pastor / Priest */}
            <Row label="Officiating Pastor / Priest">
              <div className="w-full max-w-sm">
                <GuestCombobox
                  guests={guests}
                  value={form.officiantGuestId}
                  onChange={v => update('officiantGuestId', v)}
                  placeholder="Select from guest list…"
                />
                {officiant && (
                  <p className="mt-1 text-xs text-ink-muted">{officiant.email || officiant.phone || ''}</p>
                )}
              </div>
            </Row>

            {/* Reception Venue */}
            <Row label="Reception Venue">
              <TextInput
                value={form.receptionVenue}
                onChange={v => update('receptionVenue', v)}
                placeholder="e.g. The Grand Ballroom"
              />
            </Row>

            {/* Reception Start Time */}
            <Row label="Start Time">
              <div className="flex items-center gap-3 w-full">
                <input
                  type="time"
                  value={form.receptionStartTime}
                  onChange={e => update('receptionStartTime', e.target.value)}
                  className="text-sm text-ink bg-transparent focus:outline-none"
                />
                {form.receptionStartTime && (
                  <span className="text-sm font-medium text-brand-primary">{fmt12h(form.receptionStartTime)}</span>
                )}
              </div>
            </Row>

            {/* Food Service Type */}
            <Row label="Food Service Type">
              <TextInput
                value={form.foodServiceType}
                onChange={v => update('foodServiceType', v)}
                placeholder="e.g. Buffet, Plated, Food Stations"
              />
            </Row>

            {/* Reception Host */}
            <Row label="Reception Host">
              <div className="w-full max-w-sm">
                <GuestCombobox
                  guests={guests}
                  value={form.receptionHostGuestId}
                  onChange={v => update('receptionHostGuestId', v)}
                  placeholder="Select from guest list…"
                />
                {receptionHost && (
                  <p className="mt-1 text-xs text-ink-muted">{receptionHost.email || receptionHost.phone || ''}</p>
                )}
              </div>
            </Row>

            {/* Coordination Team */}
            <Row label="Coordination Team">
              <div className="w-full max-w-sm">
                <GuestMultiCombobox
                  guests={guests}
                  values={form.coordinatorGuestIds}
                  onChange={v => update('coordinatorGuestIds', v)}
                  placeholder="Add team members…"
                />
              </div>
            </Row>

            {/* Wedding Website */}
            <Row label="Wedding Website">
              <TextInput
                value={form.weddingWebsite}
                onChange={v => update('weddingWebsite', v)}
                placeholder="e.g. ourstory.com/juan-maria"
              />
            </Row>

            {/* Event Hashtag */}
            <Row label="Event Hashtag">
              <div className="flex items-center gap-1 w-full">
                <span className="text-ink-muted text-sm">#</span>
                <input
                  type="text"
                  value={form.eventHashtag.replace(/^#/, '')}
                  onChange={e => update('eventHashtag', e.target.value.replace(/^#/, ''))}
                  placeholder="YourWeddingHashtag"
                  className="flex-1 text-sm text-ink bg-transparent focus:outline-none placeholder:text-app-border"
                />
              </div>
            </Row>

            {/* Attire */}
            <Row label="Attire">
              <TextInput
                value={form.attire}
                onChange={v => update('attire', v)}
                placeholder="e.g. Formal / Smart Casual"
              />
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
}
