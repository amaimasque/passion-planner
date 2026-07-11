import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, Sparkles,
  AlertTriangle, Phone, Mail, Globe, User, Tag,
  Building2, CreditCard, Paperclip, Upload, FileText, ExternalLink,
} from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useBudget } from '../../hooks/useBudget';
import { useGuests } from '../../hooks/useGuests';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../firebase';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import type { Supplier, SupplierAttachment } from '../../types/supplier';
import { contactDisplayName } from '../../types/supplier';
import type { Guest } from '../../types/guest';

// ── Modal state ───────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'add' }
  | { type: 'edit'; supplier: Supplier }
  | { type: 'confirmDelete'; supplier: Supplier }
  | { type: 'confirmDeleteAttachment'; supplier: Supplier; attachment: SupplierAttachment }
  | null;

const EMPTY_FORM = {
  name: '',
  contactFirstName: '', contactMiddleInitial: '', contactLastName: '', contactSuffix: '',
  contactAddToGuest: false,
  phone: '', email: '', website: '',
  bankName: '', bankAccountName: '', bankAccountNumber: '',
  notes: '',
  itemIds: [] as string[],
};

// ── Main component ────────────────────────────────────────────────────────────

export default function Suppliers() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { currentUser } = useAuth();
  const { suppliers, loading, save } = useSuppliers();
  const { categories } = useBudget();
  const { guests, save: saveGuests } = useGuests();

  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadingFile, setUploadingFile] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadError, setUploadError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auto-open modal from navigation state (e.g. from Payments page) ──────

  useEffect(() => {
    const id = (location.state as { openSupplierId?: string } | null)?.openSupplierId;
    if (!id || loading) return;
    const target = suppliers.find(s => s.id === id);
    if (target) {
      openEdit(target);
      navigate(location.pathname, { replace: true, state: {} });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, suppliers, loading]);

  // ── Form helpers ──────────────────────────────────────────────────────────

  function openAdd() {
    setForm(EMPTY_FORM);
    setModal({ type: 'add' });
  }

  function openEdit(s: Supplier) {
    setForm({
      name: s.name,
      contactFirstName:     s.contactFirstName     ?? '',
      contactMiddleInitial: s.contactMiddleInitial ?? '',
      contactLastName:      s.contactLastName      ?? '',
      contactSuffix:        s.contactSuffix        ?? '',
      contactAddToGuest: !!s.contactGuestId,
      phone:  s.phone  ?? '',
      email:  s.email  ?? '',
      website: s.website ?? '',
      bankName: s.bankName ?? '',
      bankAccountName:   s.bankAccountName   ?? '',
      bankAccountNumber: s.bankAccountNumber ?? '',
      notes: s.notes ?? '',
      itemIds: s.itemIds,
    });
    setUploadError('');
    setModal({ type: 'edit', supplier: s });
  }

  function toggleItem(id: string) {
    setForm(f => ({
      ...f,
      itemIds: f.itemIds.includes(id)
        ? f.itemIds.filter(i => i !== id)
        : [...f.itemIds, id],
    }));
  }

  async function doSave(updated: Supplier[]) {
    setSaving(true);
    try { await save(updated); } finally { setSaving(false); }
  }

  async function submitSupplier() { // saving state managed internally
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      // ── Guest sync ────────────────────────────────────────────────────────
      let contactGuestId: string | undefined =
        modal?.type === 'edit' ? modal.supplier.contactGuestId : undefined;

      const hasContactName = form.contactFirstName.trim() || form.contactLastName.trim();

      if (form.contactAddToGuest && hasContactName) {
        const existingIdx = contactGuestId
          ? guests.findIndex(g => g.id === contactGuestId)
          : -1;

        if (existingIdx >= 0) {
          // Update existing linked guest
          const updatedGuests = [...guests];
          updatedGuests[existingIdx] = {
            ...updatedGuests[existingIdx],
            firstName:     form.contactFirstName.trim(),
            middleInitial: form.contactMiddleInitial.trim(),
            lastName:      form.contactLastName.trim(),
            suffix:        form.contactSuffix.trim(),
            email: form.email.trim() || updatedGuests[existingIdx].email,
            phone: form.phone.trim() || updatedGuests[existingIdx].phone,
          };
          await saveGuests(JSON.parse(JSON.stringify(updatedGuests)));
        } else {
          // Create new guest entry for this contact
          const newId = crypto.randomUUID();
          const newGuest: Guest = {
            id: newId,
            firstName:     form.contactFirstName.trim(),
            middleInitial: form.contactMiddleInitial.trim(),
            lastName:      form.contactLastName.trim(),
            suffix:        form.contactSuffix.trim(),
            email: form.email.trim() || undefined,
            phone: form.phone.trim() || undefined,
            rsvp: 'pending', meal: 'standard', group: 'work', slots: 1,
          };
          await saveGuests(JSON.parse(JSON.stringify([...guests, newGuest])));
          contactGuestId = newId;
        }
      } else if (!form.contactAddToGuest) {
        // Unlink (do NOT delete the guest record itself)
        contactGuestId = undefined;
      }

      // ── Save supplier ─────────────────────────────────────────────────────
      const data: Omit<Supplier, 'id' | 'attachments'> = {
        name: form.name.trim(),
        itemIds: form.itemIds,
        contactFirstName:     form.contactFirstName.trim()     || undefined,
        contactMiddleInitial: form.contactMiddleInitial.trim() || undefined,
        contactLastName:      form.contactLastName.trim()      || undefined,
        contactSuffix:        form.contactSuffix.trim()        || undefined,
        contactGuestId,
        phone:   form.phone.trim()   || undefined,
        email:   form.email.trim()   || undefined,
        website: form.website.trim() || undefined,
        bankName:          form.bankName.trim()          || undefined,
        bankAccountName:   form.bankAccountName.trim()   || undefined,
        bankAccountNumber: form.bankAccountNumber.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (modal?.type === 'add') {
        await save([...suppliers, { id: crypto.randomUUID(), ...data, attachments: [] }]);
      } else if (modal?.type === 'edit') {
        const id = modal.supplier.id;
        await save(suppliers.map(s => s.id === id ? { ...s, ...data } : s));
      }
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteSupplier() {
    if (modal?.type !== 'confirmDelete') return;
    await doSave(suppliers.filter(s => s.id !== modal.supplier.id));
    setModal(null);
  }

  // ── File upload ───────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUser || modal?.type !== 'edit') return;
    const supplierId = modal.supplier.id;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File must be under 10 MB.');
      e.target.value = '';
      return;
    }

    setUploadError('');
    setUploadingFile(true);
    try {
      const attachmentId = crypto.randomUUID();
      const path = `suppliers/${currentUser.uid}/${supplierId}/${attachmentId}_${file.name}`;
      const fileRef = storageRef(storage, path);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      const attachment: SupplierAttachment = {
        id: attachmentId,
        name: file.name,
        url,
        contentType: file.type,
        storagePath: path,
        uploadedAt: Date.now(),
      };
      const updated = suppliers.map(s =>
        s.id === supplierId
          ? { ...s, attachments: [...(s.attachments ?? []), attachment] }
          : s
      );
      await save(updated);
      // Refresh modal's supplier reference so the list updates
      const refreshed = updated.find(s => s.id === supplierId)!;
      setModal({ type: 'edit', supplier: refreshed });
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  }

  async function confirmDeleteAttachment() {
    if (modal?.type !== 'confirmDeleteAttachment') return;
    const { supplier, attachment } = modal;
    setSaving(true);
    try {
      try {
        await deleteObject(storageRef(storage, attachment.storagePath));
      } catch {} // ignore if already gone
      const updated = suppliers.map(s =>
        s.id === supplier.id
          ? { ...s, attachments: (s.attachments ?? []).filter(a => a.id !== attachment.id) }
          : s
      );
      await save(updated);
      const refreshed = updated.find(s => s.id === supplier.id)!;
      setModal({ type: 'edit', supplier: refreshed });
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-ink-muted text-sm">Loading suppliers…</p>
      </div>
    );
  }

  return (
    <div className="bg-app-bg font-sans">
      {/* Header */}
      <header className="bg-app-surface border-b border-app-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-brand-primary w-5 h-5" />
            <span className="font-serif text-lg font-semibold text-ink tracking-wide">
              Suppliers
            </span>
          </div>
          <Button onClick={openAdd} size="sm">
            <Plus className="w-3.5 h-3.5" />
            Add Supplier
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {suppliers.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {suppliers.map(s => {
              const assignedLabels: { key: string; category: string; item: string }[] = [];
              for (const cat of categories) {
                for (const item of cat.items) {
                  if (s.itemIds.includes(item.id)) {
                    assignedLabels.push({ key: item.id, category: cat.name, item: item.name });
                  }
                }
              }
              return (
                <SupplierCard
                  key={s.id}
                  supplier={s}
                  assignedLabels={assignedLabels}
                  onEdit={() => openEdit(s)}
                  onDelete={() => setModal({ type: 'confirmDelete', supplier: s })}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* ── Add / Edit modal ── */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <Modal
          title={modal.type === 'add' ? 'Add Supplier' : 'Edit Supplier'}
          onClose={() => setModal(null)}
        >
          <div className="space-y-5">
            {/* Basic info */}
            <Input
              label="Supplier Name"
              placeholder="e.g. Bloom & Co. Florist"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              autoFocus
              required
            />

            {/* Category > Item multi-select */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Assigned Items
                <span className="text-ink-muted font-normal ml-1">(select all that apply)</span>
              </label>
              {categories.filter(c => c.items.length > 0).length === 0 ? (
                <p className="text-xs text-ink-muted italic">
                  No budget items yet — add some in the Budget page first.
                </p>
              ) : (
                <div className="border border-app-border rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  {categories.map((cat, ci) =>
                    cat.items.length === 0 ? null : (
                      <div key={cat.id} className={ci > 0 ? 'border-t border-app-border' : ''}>
                        <div className="px-3 py-2 bg-app-bg flex items-center gap-1.5 sticky top-0">
                          <Tag className="w-3 h-3 text-brand-primary flex-shrink-0" />
                          <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                            {cat.name}
                          </span>
                        </div>
                        {cat.items.map(item => (
                          <label
                            key={item.id}
                            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-brand-primary/5 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={form.itemIds.includes(item.id)}
                              onChange={() => toggleItem(item.id)}
                              className="w-4 h-4 rounded border-app-border accent-brand-primary flex-shrink-0"
                            />
                            <span className="text-sm text-ink">{item.name}</span>
                          </label>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2.5">Contact Person</p>
              <div className="space-y-3">
                {/* Split name row */}
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-end">
                  <Input
                    label="First Name"
                    placeholder="First"
                    value={form.contactFirstName}
                    onChange={e => setForm({ ...form, contactFirstName: e.target.value })}
                  />
                  <div className="w-16">
                    <label className="block text-xs font-medium text-ink-muted mb-1">MI</label>
                    <input
                      type="text"
                      value={form.contactMiddleInitial}
                      onChange={e => setForm({ ...form, contactMiddleInitial: e.target.value })}
                      placeholder="M"
                      maxLength={3}
                      className="w-full px-3 py-2 text-sm border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/25 text-ink placeholder:text-ink-muted/50"
                    />
                  </div>
                  <Input
                    label="Last Name"
                    placeholder="Last"
                    value={form.contactLastName}
                    onChange={e => setForm({ ...form, contactLastName: e.target.value })}
                  />
                  <div className="w-20">
                    <label className="block text-xs font-medium text-ink-muted mb-1">Suffix</label>
                    <input
                      type="text"
                      value={form.contactSuffix}
                      onChange={e => setForm({ ...form, contactSuffix: e.target.value })}
                      placeholder="Jr."
                      className="w-full px-3 py-2 text-sm border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/25 text-ink placeholder:text-ink-muted/50"
                    />
                  </div>
                </div>

                {/* Add to guest list checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
                  <input
                    type="checkbox"
                    checked={form.contactAddToGuest}
                    onChange={e => setForm({ ...form, contactAddToGuest: e.target.checked })}
                    className="w-4 h-4 rounded border-app-border accent-brand-primary flex-shrink-0"
                  />
                  <span className="text-sm text-ink-muted group-hover:text-ink transition-colors select-none">
                    Add contact person to guest list
                  </span>
                  {modal?.type === 'edit' && modal.supplier.contactGuestId && (
                    <span className="text-[11px] px-1.5 py-0.5 bg-positive/10 text-positive rounded-full font-medium">
                      linked
                    </span>
                  )}
                </label>

                {/* Phone / Email / Website */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Phone"
                    placeholder="+63 9XX XXX XXXX"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                  <Input
                    label="Email"
                    placeholder="supplier@email.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <Input
                  label="Website"
                  placeholder="www.example.com"
                  value={form.website}
                  onChange={e => setForm({ ...form, website: e.target.value })}
                />
              </div>
            </div>

            {/* Bank details */}
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Bank Details
              </p>
              <div className="space-y-3">
                <Input
                  label="Bank Name"
                  placeholder="e.g. BDO, BPI, Metrobank"
                  value={form.bankName}
                  onChange={e => setForm({ ...form, bankName: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Account Name"
                    placeholder="As it appears on the account"
                    value={form.bankAccountName}
                    onChange={e => setForm({ ...form, bankAccountName: e.target.value })}
                  />
                  <Input
                    label="Account Number"
                    placeholder="XXXX XXXX XXXX"
                    value={form.bankAccountNumber}
                    onChange={e => setForm({ ...form, bankAccountNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Notes <span className="text-ink-muted font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Packages, pricing notes, availability…"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-3 text-sm bg-app-surface border border-app-border rounded-xl text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all resize-none"
              />
            </div>

            {/* Attachments — edit mode only (paid plan) */}
            {modal.type === 'edit' && (
              <div className="relative">
                {/* Blurred content */}
                <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    Receipts & Files
                  </p>
                  <ul className="space-y-1.5 mb-3">
                    {['receipt-sample.pdf', 'invoice-jan.jpg'].map(name => (
                      <li key={name} className="flex items-center gap-2 px-3 py-2 bg-app-bg border border-app-border rounded-xl">
                        <FileText className="w-3.5 h-3.5 text-brand-secondary flex-shrink-0" />
                        <span className="text-xs text-ink flex-1 truncate">{name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 px-4 py-2.5 w-full border border-dashed border-app-border rounded-xl text-sm text-ink-muted">
                    <Upload className="w-4 h-4 flex-shrink-0" />
                    <span>Upload receipt or file</span>
                    <span className="ml-auto text-xs text-ink-muted/60">Max 10 MB</span>
                  </div>
                </div>

                {/* Lock overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-app-surface border border-brand-secondary/40 rounded-xl shadow-sm">
                    <span className="text-base">🔒</span>
                    <div>
                      <p className="text-xs font-semibold text-ink leading-tight">Coming soon</p>
                      <p className="text-xs text-ink-muted leading-tight">File uploads coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button variant="ghost" fullWidth onClick={() => setModal(null)}>Cancel</Button>
              <Button
                fullWidth
                isLoading={saving}
                onClick={submitSupplier}
                disabled={!form.name.trim()}
              >
                {modal.type === 'add' ? 'Add Supplier' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm delete supplier ── */}
      {modal?.type === 'confirmDelete' && (
        <Modal title="Delete Supplier" onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-danger/8 border border-danger/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink">
                Delete <span className="font-semibold">{modal.supplier.name}</span>? All attached files will also be removed. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger" fullWidth isLoading={saving} onClick={confirmDeleteSupplier}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm delete attachment ── */}
      {modal?.type === 'confirmDeleteAttachment' && (
        <Modal title="Remove File" onClose={() => setModal({ type: 'edit', supplier: modal.supplier })} size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-danger/8 border border-danger/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink">
                Remove <span className="font-semibold">{modal.attachment.name}</span>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setModal({ type: 'edit', supplier: modal.supplier })}>Cancel</Button>
              <Button variant="danger" fullWidth isLoading={saving} onClick={confirmDeleteAttachment}>Remove</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FileIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith('image/')) {
    return <Paperclip className="w-3.5 h-3.5 text-accent flex-shrink-0" />;
  }
  return <FileText className="w-3.5 h-3.5 text-brand-secondary flex-shrink-0" />;
}

function SupplierCard({
  supplier, assignedLabels, onEdit, onDelete,
}: {
  supplier: Supplier;
  assignedLabels: { key: string; category: string; item: string }[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasBank = supplier.bankName || supplier.bankAccountName || supplier.bankAccountNumber;
  const attachmentCount = supplier.attachments?.length ?? 0;

  return (
    <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden hover:shadow-sm hover:border-brand-primary/20 transition-all duration-200">
      {/* Card header */}
      <div className="flex items-start justify-between px-5 py-4 bg-brand-primary/5 border-b border-app-border">
        <div className="min-w-0">
          <h3 className="font-serif text-sm font-semibold text-ink leading-tight truncate">
            {supplier.name}
          </h3>
          {contactDisplayName(supplier) && (
            <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
              <User className="w-3 h-3 flex-shrink-0" />
              {contactDisplayName(supplier)}
              {supplier.contactGuestId && (
                <span className="ml-1 text-[10px] px-1 py-0.5 bg-positive/10 text-positive rounded-full font-medium">guest</span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 ml-3 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-app-border rounded-lg transition-all"
            title="Edit supplier"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-ink-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
            title="Delete supplier"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-3">
        {/* Category > Item badges */}
        {assignedLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {assignedLabels.map(({ key, category, item }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-medium"
              >
                <Tag className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="text-ink-muted font-normal">{category}</span>
                <span className="text-ink-muted font-normal mx-0.5">›</span>
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Contact links */}
        {(supplier.phone || supplier.email || supplier.website) && (
          <div className="space-y-1.5">
            {supplier.phone && (
              <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink transition-colors">
                <Phone className="w-3.5 h-3.5 flex-shrink-0 text-brand-primary/60" />
                {supplier.phone}
              </a>
            )}
            {supplier.email && (
              <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink transition-colors truncate">
                <Mail className="w-3.5 h-3.5 flex-shrink-0 text-brand-primary/60" />
                {supplier.email}
              </a>
            )}
            {supplier.website && (
              <a
                href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink transition-colors truncate"
              >
                <Globe className="w-3.5 h-3.5 flex-shrink-0 text-brand-primary/60" />
                {supplier.website}
              </a>
            )}
          </div>
        )}

        {/* Bank details */}
        {hasBank && (
          <div className="border-t border-app-border pt-3 space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider">
              <Building2 className="w-3 h-3" /> Bank Details
            </p>
            {supplier.bankName && (
              <p className="text-xs text-ink pl-4">{supplier.bankName}</p>
            )}
            {supplier.bankAccountName && (
              <p className="text-xs text-ink pl-4">{supplier.bankAccountName}</p>
            )}
            {supplier.bankAccountNumber && (
              <p className="text-xs text-ink pl-4 flex items-center gap-1.5">
                <CreditCard className="w-3 h-3 text-ink-muted flex-shrink-0" />
                {maskAccountNumber(supplier.bankAccountNumber)}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        {supplier.notes && (
          <p className="text-xs text-ink-muted italic border-t border-app-border pt-3 line-clamp-3">
            {supplier.notes}
          </p>
        )}

        {/* Attachments summary */}
        {attachmentCount > 0 && (
          <div
            className="border-t border-app-border pt-3 flex items-center gap-1.5 cursor-pointer text-xs text-ink-muted hover:text-ink transition-colors"
            onClick={onEdit}
            title="Open to manage files"
          >
            <Paperclip className="w-3.5 h-3.5 text-brand-primary/60 flex-shrink-0" />
            <span>{attachmentCount} file{attachmentCount !== 1 ? 's' : ''} attached</span>
          </div>
        )}
      </div>
    </div>
  );
}

function maskAccountNumber(acct: string): string {
  const clean = acct.replace(/\s/g, '');
  if (clean.length <= 4) return acct;
  return '•••• ' + clean.slice(-4);
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
        <Sparkles className="w-7 h-7 text-brand-primary" />
      </div>
      <h2 className="font-serif text-xl font-semibold text-ink mb-2">No suppliers yet</h2>
      <p className="text-sm text-ink-muted mb-6 max-w-xs">
        Add your vendors and suppliers — florists, caterers, photographers, and more.
      </p>
      <Button onClick={onAdd}>
        <Plus className="w-4 h-4" />
        Add First Supplier
      </Button>
    </div>
  );
}
