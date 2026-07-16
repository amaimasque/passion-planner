import { useState } from 'react';
import { Shirt, Pencil, Users, Check } from 'lucide-react';
import { useAttire, EMPTY_ROLE_ATTIRE } from '../../hooks/useAttire';
import { useProcessional } from '../../hooks/useProcessional';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import type { AttireSet, RoleAttire } from '../../types/attire';
import type { ProcessionalRole } from '../../types/processional';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasSet(a: AttireSet) {
  return !!(a.top || a.bottom || a.shoes);
}

function hasAttire(a: RoleAttire) {
  return a.genderSplit ? (hasSet(a.men) || hasSet(a.women)) : hasSet(a.unisex);
}

// ── Attire input group (top / bottom / shoes) ─────────────────────────────────

function AttireFields({
  value, onChange,
  menPlaceholders = false,
}: {
  value: AttireSet;
  onChange: (v: AttireSet) => void;
  menPlaceholders?: boolean;
}) {
  const placeholders: Record<keyof AttireSet, string> = menPlaceholders
    ? { top: 'e.g. White barong', bottom: 'e.g. Black slacks', shoes: 'e.g. Black leather' }
    : { top: 'e.g. Floral dress', bottom: 'e.g. Nude heels', shoes: 'e.g. White pumps' };

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {(['top', 'bottom', 'shoes'] as const).map(field => (
        <div key={field}>
          <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5 capitalize">
            {field}
          </label>
          <input
            type="text"
            value={value[field]}
            onChange={e => onChange({ ...value, [field]: e.target.value })}
            placeholder={placeholders[field]}
            className="w-full px-3 py-2 text-xs border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink placeholder:text-ink-muted bg-app-surface"
          />
        </div>
      ))}
    </div>
  );
}

// ── Attire display chips ──────────────────────────────────────────────────────

function SetChips({ attire, label }: { attire: AttireSet; label?: string }) {
  if (!hasSet(attire)) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {label && (
        <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mr-0.5">{label}:</span>
      )}
      {(['top', 'bottom', 'shoes'] as const).map(field =>
        attire[field] ? (
          <span
            key={field}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-primary/8 text-brand-primary text-[11px] font-medium"
          >
            <span className="text-ink-muted capitalize">{field}:</span>
            {attire[field]}
          </span>
        ) : null
      )}
    </div>
  );
}

function AttireDisplay({ attire }: { attire: RoleAttire }) {
  if (!hasAttire(attire)) {
    return <span className="text-xs text-ink-muted italic">Not set</span>;
  }
  if (attire.genderSplit) {
    return (
      <div className="space-y-1.5">
        <SetChips attire={attire.men} label="Men" />
        <SetChips attire={attire.women} label="Women" />
      </div>
    );
  }
  return <SetChips attire={attire.unisex} />;
}

// ── Modal state ───────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'editDefault' }
  | { type: 'editRole'; role: ProcessionalRole }
  | null;

// ── Main component ────────────────────────────────────────────────────────────

export default function Attire() {
  const { data, loading: attireLoading, saveDefaultAttire, saveRoleAttire } = useAttire();
  const { roles, loading: rolesLoading } = useProcessional();

  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState<RoleAttire>(EMPTY_ROLE_ATTIRE);
  const [saving, setSaving] = useState(false);

  const loading = attireLoading || rolesLoading;

  function openEditDefault() {
    setForm({ ...EMPTY_ROLE_ATTIRE, ...data.defaultGuestAttire });
    setModal({ type: 'editDefault' });
  }

  function openEditRole(role: ProcessionalRole) {
    setForm({ ...EMPTY_ROLE_ATTIRE, ...(data.roleAttire[role.id] ?? {}) });
    setModal({ type: 'editRole', role });
  }

  async function submit() {
    setSaving(true);
    try {
      if (modal?.type === 'editDefault') {
        await saveDefaultAttire(form);
      } else if (modal?.type === 'editRole') {
        await saveRoleAttire(modal.role.id, form);
      }
    } finally {
      setSaving(false);
    }
    setModal(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-ink-muted text-sm">Loading attire…</p>
      </div>
    );
  }

  return (
    <div className="bg-app-bg font-sans min-h-screen">

      {/* Header */}
      <header className="bg-app-surface border-b border-app-border sticky top-0 z-10">
        <div className="px-6 h-16 flex items-center gap-2">
          <Shirt className="text-brand-primary w-5 h-5" />
          <span className="font-serif text-lg font-semibold text-ink tracking-wide">Wedding Attire</span>
        </div>
      </header>

      <div className="p-4 lg:p-6 max-w-3xl space-y-4">

        {/* ── Default Guest Attire ── */}
        <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-secondary/15 flex items-center justify-center">
                <Users className="w-4 h-4 text-brand-secondary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Default Guest Attire</p>
                <p className="text-xs text-ink-muted">General dress code for all guests</p>
              </div>
            </div>
            <button
              type="button"
              onClick={openEditDefault}
              className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors px-2 py-1 rounded-lg hover:bg-app-bg"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          </div>
          <div className="px-5 py-4">
            <AttireDisplay attire={data.defaultGuestAttire} />
          </div>
        </div>

        {/* ── Per-Role Attire ── */}
        <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-app-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <Shirt className="w-4 h-4 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Processional Role Attire</p>
                <p className="text-xs text-ink-muted">Specific attire per role in the processional</p>
              </div>
            </div>
          </div>

          {roles.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-ink-muted">No processional roles found.</p>
              <p className="text-xs text-ink-muted mt-1">Add roles on the Processional page first.</p>
            </div>
          ) : (
            <div className="divide-y divide-app-border">
              {roles.map(role => {
                const attire: RoleAttire = { ...EMPTY_ROLE_ATTIRE, ...(data.roleAttire[role.id] ?? {}) };
                const isSet = hasAttire(attire);
                return (
                  <div key={role.id} className="flex items-start gap-4 px-5 py-4 group hover:bg-app-bg/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm font-medium text-ink">{role.name}</p>
                        {isSet && (
                          <span className="flex items-center gap-0.5 text-[10px] text-positive font-medium">
                            <Check className="w-3 h-3" /> Set
                          </span>
                        )}
                        {attire.genderSplit && isSet && (
                          <span className="text-[10px] text-ink-muted bg-app-bg px-1.5 py-0.5 rounded-full border border-app-border">
                            Split
                          </span>
                        )}
                      </div>
                      <AttireDisplay attire={attire} />
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditRole(role)}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors px-2 py-1 rounded-lg hover:bg-app-border/40 opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {modal && (
        <Modal
          title={
            modal.type === 'editDefault'
              ? 'Default Guest Attire'
              : `Attire — ${modal.role.name}`
          }
          onClose={() => setModal(null)}
        >
          <div className="space-y-5">
            {modal.type === 'editDefault' && (
              <p className="text-xs text-ink-muted">
                General dress code shown to all guests. Individual roles can override this.
              </p>
            )}

            {/* Gender split toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
              <div
                role="checkbox"
                aria-checked={form.genderSplit}
                onClick={() => setForm(f => ({ ...f, genderSplit: !f.genderSplit }))}
                className={[
                  'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0',
                  form.genderSplit
                    ? 'bg-brand-primary border-brand-primary'
                    : 'bg-app-surface border-app-border hover:border-brand-primary/50',
                ].join(' ')}
              >
                {form.genderSplit && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span className="text-sm text-ink">Separate men's &amp; women's attire</span>
            </label>

            {/* Fields */}
            {form.genderSplit ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-ink uppercase tracking-wider">Men</p>
                  <AttireFields
                    value={form.men}
                    onChange={men => setForm(f => ({ ...f, men }))}
                    menPlaceholders
                  />
                </div>
                <div className="border-t border-app-border pt-4 space-y-2">
                  <p className="text-xs font-semibold text-ink uppercase tracking-wider">Women</p>
                  <AttireFields
                    value={form.women}
                    onChange={women => setForm(f => ({ ...f, women }))}
                    menPlaceholders={false}
                  />
                </div>
              </div>
            ) : (
              <AttireFields
                value={form.unisex}
                onChange={unisex => setForm(f => ({ ...f, unisex }))}
                menPlaceholders
              />
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={submit} isLoading={saving}>
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
