import { useState, useEffect, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, Paperclip, ExternalLink } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { useSuppliers } from '../../hooks/useSuppliers';
import { usePayments } from '../../hooks/usePayments';
import { useCurrency } from '../../hooks/useCurrency';
import type { PaymentEntry, PaymentInstallment, PaymentMap } from '../../types/payment';

// ── Types ─────────────────────────────────────────────────────────────────────

type InstallmentKey = 'down' | 'second' | 'final' | 'additional';

const INSTALLMENTS: { key: InstallmentKey; label: string; color: string }[] = [
  { key: 'down',       label: 'Down Payment', color: 'bg-brand-primary/80' },
  { key: 'second',     label: '2nd Payment',  color: 'bg-brand-primary/65' },
  { key: 'final',      label: 'Final Payment',color: 'bg-brand-primary/50' },
  { key: 'additional', label: 'Additional',   color: 'bg-brand-primary/35' },
];

// ── Defaults ──────────────────────────────────────────────────────────────────

function defaultInstallment(): PaymentInstallment {
  return { amount: 0, date: '' };
}

function defaultEntry(): PaymentEntry {
  return {
    down: defaultInstallment(),
    second: defaultInstallment(),
    final: defaultInstallment(),
    additional: defaultInstallment(),
    notes: '',
    rating: 0,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────


function totalPaid(e: PaymentEntry) {
  return e.down.amount + e.second.amount + e.final.amount + e.additional.amount;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const TD  = 'p-0 border-r border-b border-app-border/40';
const TH2 = 'px-2 py-2 text-xs font-semibold border-r border-b border-white/20 bg-ink/85 text-white whitespace-nowrap';

const numInput  = 'w-full px-2 py-[7px] text-xs text-right bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-inset focus:ring-brand-primary/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';
const txtInput  = 'w-full px-2 py-[7px] text-xs bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-inset focus:ring-brand-primary/30 placeholder:text-app-border';
const dateInput = 'w-full px-2 py-[7px] text-xs bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-inset focus:ring-brand-primary/30';

// ── Star rating ───────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-0.5 py-[5px]">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          className={`text-sm leading-none transition-colors ${
            star <= value ? 'text-brand-secondary' : 'text-app-border hover:text-brand-secondary/50'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Installment cell group (returns 3 <td> cells) ─────────────────────────────

function InstallmentCells({
  itemId, instKey, value, onUpdate,
}: {
  itemId: string;
  instKey: InstallmentKey;
  value: PaymentInstallment;
  onUpdate: (itemId: string, k: InstallmentKey, f: keyof PaymentInstallment, v: string | number) => void;
}) {
  const [localAmount, setLocalAmount] = useState<string>(value.amount ? String(value.amount) : '');
  const [localDate, setLocalDate] = useState(value.date);
  const amountFocused = useRef(false);
  const dateFocused = useRef(false);

  useEffect(() => {
    if (!amountFocused.current) setLocalAmount(value.amount ? String(value.amount) : '');
  }, [value.amount]);

  useEffect(() => {
    if (!dateFocused.current) setLocalDate(value.date);
  }, [value.date]);

  return (
    <>
      {/* Amount */}
      <td className={TD}>
        <input
          type="number" min="0" placeholder="0"
          value={localAmount}
          onChange={e => setLocalAmount(e.target.value)}
          onFocus={() => { amountFocused.current = true; }}
          onBlur={() => {
            amountFocused.current = false;
            onUpdate(itemId, instKey, 'amount', parseFloat(localAmount) || 0);
          }}
          className={numInput + ' min-w-[80px]'}
        />
      </td>
      {/* Date */}
      <td className={TD}>
        <input
          type="date"
          value={localDate}
          onChange={e => setLocalDate(e.target.value)}
          onFocus={() => { dateFocused.current = true; }}
          onBlur={() => {
            dateFocused.current = false;
            onUpdate(itemId, instKey, 'date', localDate);
          }}
          className={dateInput + ' min-w-[120px]'}
        />
      </td>
      {/* File attachment — coming soon (blurred) */}
      <td className={TD + ' min-w-[44px]'}>
        <div className="relative overflow-hidden flex items-center justify-center">
          <button
            type="button"
            disabled
            className="flex items-center justify-center w-full py-[7px] px-2 text-ink-muted/40"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>
          <div className="absolute inset-0 backdrop-blur-[2px] bg-app-bg/50 flex items-center justify-center pointer-events-none">
            <Lock className="w-3 h-3 text-ink-muted/50" />
          </div>
        </div>
      </td>
    </>
  );
}

// ── Lazy cells (update only on blur to avoid lag) ─────────────────────────────

function TotalPriceCell({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [local, setLocal] = useState(value ? String(value) : '');
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setLocal(value ? String(value) : '');
  }, [value]);
  return (
    <td className={TD}>
      <input
        type="number" min="0" placeholder="0"
        value={local}
        onChange={e => setLocal(e.target.value)}
        onFocus={() => { focused.current = true; }}
        onBlur={() => { focused.current = false; onCommit(parseFloat(local) || 0); }}
        className={numInput}
      />
    </td>
  );
}

function NotesCell({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setLocal(value);
  }, [value]);
  return (
    <td className={TD}>
      <input
        type="text"
        value={local}
        onChange={e => setLocal(e.target.value)}
        onFocus={() => { focused.current = true; }}
        onBlur={() => { focused.current = false; onCommit(local); }}
        className={txtInput}
      />
    </td>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Payments() {
  const navigate = useNavigate();
  const { categories, save: budgetSave } = useBudget();
  const { suppliers, save: supplierSave } = useSuppliers();
  const { entries, loading, save } = usePayments();
  const { fmt } = useCurrency();

  const [local, setLocal]           = useState<PaymentMap>({});
  const [initialized, setInit]      = useState(false);
  const pending       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const budgetPending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && !initialized) {
      setLocal(entries);
      setInit(true);
    }
  }, [loading, entries, initialized]);

  // All categories with items
  const filtered = categories.filter(cat => cat.items.length > 0);

  // Map itemId → supplier (first match)
  const supplierByItem = new Map<string, (typeof suppliers)[number]>();
  for (const sup of suppliers) {
    for (const id of sup.itemIds) {
      if (!supplierByItem.has(id)) supplierByItem.set(id, sup);
    }
  }

  // ── State helpers ──────────────────────────────────────────────────────────

  function getEntry(itemId: string): PaymentEntry {
    return local[itemId] ?? defaultEntry();
  }

  function scheduleSave(next: PaymentMap) {
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(() => save(JSON.parse(JSON.stringify(next))), 800);
  }

  function updateField(itemId: string, field: 'notes' | 'rating', value: string | number) {
    setLocal(prev => {
      const next = { ...prev, [itemId]: { ...(prev[itemId] ?? defaultEntry()), [field]: value } };
      scheduleSave(next);
      return next;
    });
  }

  function updateActual(itemId: string, value: number) {
    const updated = categories.map(cat => ({
      ...cat,
      items: cat.items.map(item =>
        item.id === itemId ? { ...item, actual: value } : item
      ),
    }));
    if (budgetPending.current) clearTimeout(budgetPending.current);
    budgetPending.current = setTimeout(() => budgetSave(updated), 800);
  }

  function updateInstallment(itemId: string, k: InstallmentKey, f: keyof PaymentInstallment, value: string | number) {
    setLocal(prev => {
      const entry = prev[itemId] ?? defaultEntry();
      const next: PaymentMap = {
        ...prev,
        [itemId]: { ...entry, [k]: { ...entry[k], [f]: value } },
      };
      scheduleSave(next);
      return next;
    });
  }

  function assignSupplier(itemId: string, supplierId: string) {
    const updated = suppliers.map(s => {
      const has = s.itemIds.includes(itemId);
      if (s.id === supplierId) {
        return has ? s : { ...s, itemIds: [...s.itemIds, itemId] };
      }
      return has ? { ...s, itemIds: s.itemIds.filter(id => id !== itemId) } : s;
    });
    supplierSave(updated);
  }

  // ── Grand totals ───────────────────────────────────────────────────────────

  const allItems = filtered.flatMap(c => c.items);

  const grand = allItems.reduce(
    (acc, item) => {
      const e    = getEntry(item.id);
      const paid = totalPaid(e);
      return {
        totalPrice:  acc.totalPrice  + item.actual,
        down:        acc.down        + e.down.amount,
        second:      acc.second      + e.second.amount,
        final:       acc.final       + e.final.amount,
        additional:  acc.additional  + e.additional.amount,
        balance:     acc.balance     + (item.actual - paid),
      };
    },
    { totalPrice: 0, down: 0, second: 0, final: 0, additional: 0, balance: 0 },
  );
  const grandPaid = grand.down + grand.second + grand.final + grand.additional;

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-ink-muted text-sm">Loading payments…</p>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (filtered.length === 0) {
    return (
      <div className="bg-app-bg font-sans">
        <PageHeader grandTotal={0} grandPaid={0} grandBalance={0} />
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
            <CreditCard className="w-7 h-7 text-brand-primary" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-ink mb-2">No budget items yet</h2>
          <p className="text-sm text-ink-muted max-w-sm">
            Add items in the <strong>Budget</strong> page — they'll appear here for payment tracking.
          </p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-app-bg font-sans">
      <PageHeader
        grandTotal={grand.totalPrice}
        grandPaid={grandPaid}
        grandBalance={grand.balance}
      />

      <div className="p-4 lg:p-6">
        <div className="border border-app-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">

              {/* ── Header ── */}
              <thead>
                {/* Row 1 — group labels */}
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-20 bg-ink px-4 py-2.5 text-left text-xs font-semibold text-white border-r border-b border-white/20 min-w-[180px] whitespace-nowrap"
                  >
                    Item
                  </th>

                  {/* Details group */}
                  <th
                    colSpan={2}
                    className="bg-accent/75 text-white text-center text-xs font-semibold px-3 py-2.5 border-r border-b border-white/20"
                  >
                    Details
                  </th>

                  {/* Payment sub-groups */}
                  {INSTALLMENTS.map(inst => (
                    <th
                      key={inst.key}
                      colSpan={3}
                      className={`${inst.color} text-white text-center text-xs font-semibold px-3 py-2.5 border-r border-b border-white/20`}
                    >
                      {inst.label}
                    </th>
                  ))}

                  {/* Balance / Notes / Rating */}
                  <th rowSpan={2} className={TH2 + ' text-right min-w-[90px]'}>Balance</th>
                  <th rowSpan={2} className={TH2 + ' min-w-[150px]'}>Notes</th>
                  <th rowSpan={2} className={TH2 + ' text-center min-w-[90px]'}>★</th>
                </tr>

                {/* Row 2 — column labels */}
                <tr>
                  {/* Details sub-columns */}
                  {(['Supplier', 'Total Price'] as const).map((col, i) => (
                    <th
                      key={col}
                      className={[
                        TH2,
                        i === 0 ? 'min-w-[150px]' : '',
                        i === 1 ? 'text-right min-w-[90px]' : '',
                      ].join(' ')}
                    >
                      {col}
                    </th>
                  ))}

                  {/* Installment sub-columns ×3 */}
                  {INSTALLMENTS.map(inst =>
                    (['Amt', 'Date', 'File'] as const).map(col => (
                      <th
                        key={`${inst.key}-${col}`}
                        className={[
                          TH2,
                          col === 'Amt'  ? 'text-right min-w-[80px]'  : '',
                          col === 'Date' ? 'min-w-[120px]'             : '',
                          col === 'File' ? 'text-center min-w-[44px]'  : '',
                        ].join(' ')}
                      >
                        {col === 'File' ? (
                          <span className="flex items-center justify-center gap-0.5">
                            <Paperclip className="w-3 h-3" />
                            <Lock className="w-2.5 h-2.5 opacity-60" />
                          </span>
                        ) : col}
                      </th>
                    ))
                  )}
                </tr>
              </thead>

              {/* ── Body ── */}
              <tbody>
                {filtered.map(cat => (
                  <Fragment key={cat.id}>
                    {/* Category header */}
                    <tr className="bg-brand-primary/8">
                      <td className="sticky left-0 z-10 bg-brand-primary/8 px-4 py-2 text-xs font-semibold font-serif text-ink border-b border-r border-app-border/40 uppercase tracking-wider whitespace-nowrap">
                        {cat.name}
                      </td>
                      {/* 2 (details) + 12 (installments 4×3) + 3 (balance/notes/★) = 17 remaining cols */}
                      <td colSpan={17} className="bg-brand-primary/8 border-b border-app-border/40" />
                    </tr>

                    {/* Item rows */}
                    {cat.items.map(item => {
                      const e   = getEntry(item.id);
                      const sup = supplierByItem.get(item.id);
                      const balance = item.actual - totalPaid(e);

                      return (
                        <tr key={item.id} className="bg-app-surface hover:bg-app-bg/50 transition-colors">

                          {/* Sticky item name */}
                          <td className="sticky left-0 z-10 bg-app-surface px-4 py-0 text-xs text-ink border-b border-r border-app-border/40 whitespace-nowrap">
                            <span className="block py-[7px]">{item.name}</span>
                          </td>

                          {/* Supplier — assignable dropdown */}
                          <td className={TD}>
                            <div className="flex items-center gap-1 pr-1">
                              <select
                                value={sup?.id ?? ''}
                                onChange={e => assignSupplier(item.id, e.target.value)}
                                className={[
                                  'flex-1 px-2 py-[7px] text-xs bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-inset focus:ring-brand-primary/30 cursor-pointer min-w-0',
                                  sup ? 'text-brand-primary font-medium' : 'text-ink-muted',
                                ].join(' ')}
                              >
                                <option value="">— none —</option>
                                {suppliers.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                              {sup && (
                                <button
                                  type="button"
                                  onClick={() => navigate('/suppliers', { state: { openSupplierId: sup.id } })}
                                  className="flex-shrink-0 p-1 text-ink-muted/40 hover:text-brand-primary transition-colors"
                                  title="View supplier"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Total Price — mirrors budget item.actual; editing here updates the budget */}
                          <TotalPriceCell
                            value={item.actual}
                            onCommit={v => updateActual(item.id, v)}
                          />

                          {/* Installment cells ×4 */}
                          {INSTALLMENTS.map(inst => (
                            <InstallmentCells
                              key={inst.key}
                              itemId={item.id}
                              instKey={inst.key}
                              value={e[inst.key]}
                              onUpdate={updateInstallment}
                            />
                          ))}

                          {/* Balance (calculated) */}
                          <td className={[
                            TD,
                            'px-2 py-[7px] text-xs text-right font-medium tabular-nums',
                            item.actual === 0
                              ? 'text-app-border'
                              : balance <= 0
                                ? 'text-positive'
                                : 'text-danger',
                          ].join(' ')}>
                            {item.actual === 0 ? '—' : fmt(balance)}
                          </td>

                          {/* Notes */}
                          <NotesCell
                            value={e.notes}
                            onCommit={v => updateField(item.id, 'notes', v)}
                          />

                          {/* Rating */}
                          <td className={`${TD} px-1`}>
                            <StarRating
                              value={e.rating}
                              onChange={v => updateField(item.id, 'rating', v)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>

              {/* ── Footer totals ── */}
              <tfoot>
                <tr className="bg-brand-primary/10">
                  <td className="sticky left-0 z-10 bg-brand-primary/10 px-4 py-3 text-xs font-bold text-ink uppercase tracking-wider border-t-2 border-app-border whitespace-nowrap">
                    TOTAL
                  </td>
                  {/* Supplier */}
                  <td className="border-t-2 border-app-border border-r border-app-border/40" />
                  {/* Total Price */}
                  <td className="px-2 py-3 text-xs text-right font-bold text-ink tabular-nums border-t-2 border-app-border border-r border-app-border/40">
                    {grand.totalPrice > 0 ? fmt(grand.totalPrice) : '—'}
                  </td>
                  {/* Down amount + skip date/file */}
                  <td className="px-2 py-3 text-xs text-right font-bold text-ink tabular-nums border-t-2 border-app-border border-r border-app-border/40">
                    {grand.down > 0 ? fmt(grand.down) : '—'}
                  </td>
                  <td colSpan={2} className="border-t-2 border-app-border border-r border-app-border/40" />
                  {/* 2nd */}
                  <td className="px-2 py-3 text-xs text-right font-bold text-ink tabular-nums border-t-2 border-app-border border-r border-app-border/40">
                    {grand.second > 0 ? fmt(grand.second) : '—'}
                  </td>
                  <td colSpan={2} className="border-t-2 border-app-border border-r border-app-border/40" />
                  {/* Final */}
                  <td className="px-2 py-3 text-xs text-right font-bold text-ink tabular-nums border-t-2 border-app-border border-r border-app-border/40">
                    {grand.final > 0 ? fmt(grand.final) : '—'}
                  </td>
                  <td colSpan={2} className="border-t-2 border-app-border border-r border-app-border/40" />
                  {/* Additional */}
                  <td className="px-2 py-3 text-xs text-right font-bold text-ink tabular-nums border-t-2 border-app-border border-r border-app-border/40">
                    {grand.additional > 0 ? fmt(grand.additional) : '—'}
                  </td>
                  <td colSpan={2} className="border-t-2 border-app-border border-r border-app-border/40" />
                  {/* Balance */}
                  <td className={[
                    'px-2 py-3 text-xs text-right font-bold tabular-nums border-t-2 border-app-border border-r border-app-border/40',
                    grand.balance > 0 ? 'text-danger' : 'text-positive',
                  ].join(' ')}>
                    {grand.totalPrice > 0 ? fmt(grand.balance) : '—'}
                  </td>
                  {/* Notes + Rating */}
                  <td colSpan={2} className="border-t-2 border-app-border" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────

function PageHeader({ grandTotal, grandPaid, grandBalance }: {
  grandTotal: number;
  grandPaid: number;
  grandBalance: number;
}) {
  const { fmt } = useCurrency();
  return (
    <header className="bg-app-surface border-b border-app-border sticky top-0 z-10">
      <div className="px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <CreditCard className="text-brand-primary w-5 h-5" />
          <span className="font-serif text-lg font-semibold text-ink tracking-wide">
            Payment Tracker
          </span>
        </div>
        {grandTotal > 0 && (
          <div className="hidden sm:flex items-center gap-5 text-xs text-ink-muted flex-shrink-0">
            <span>Total <strong className="text-ink">{fmt(grandTotal)}</strong></span>
            <span>Paid <strong className="text-positive">{fmt(grandPaid)}</strong></span>
            <span>Balance <strong className={grandBalance > 0 ? 'text-danger' : 'text-positive'}>{fmt(grandBalance)}</strong></span>
          </div>
        )}
      </div>
    </header>
  );
}
