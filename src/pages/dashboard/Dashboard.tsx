import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, Clock, UserX, Wallet,
  ClipboardList, Store, Circle, CheckCircle2, ArrowRight,
  CalendarDays, ExternalLink, Baby,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useCurrency } from '../../hooks/useCurrency';
import { useBudget } from '../../hooks/useBudget';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useGuests } from '../../hooks/useGuests';
import { useChecklist } from '../../hooks/useChecklist';
import type { ChecklistStatus } from '../../types/checklist';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}

// Guest stats are built dynamically in the component using live data


const CATEGORY_LABELS: Record<string, string> = {
  documents: 'Documents',
  ceremony:  'Ceremony',
  reception: 'Reception',
};

const CATEGORY_CLS: Record<string, string> = {
  documents: 'bg-accent/10 text-accent',
  ceremony:  'bg-brand-primary/10 text-brand-primary',
  reception: 'bg-brand-secondary/20 text-ink',
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { profile } = useUserProfile();
  const { fmt } = useCurrency();
  const { categories } = useBudget();
  const { suppliers } = useSuppliers();
  const { guests } = useGuests();
  const { items: checklistItems, save: saveChecklist } = useChecklist();

  const grandEst = categories.reduce((s, c) => s + c.items.reduce((a, i) => a + i.estimated, 0), 0);
  const grandAct = categories.reduce((s, c) => s + c.items.reduce((a, i) => a + i.actual, 0), 0);

  const totalHeads = guests.reduce((s, g) => s + (g.slots ?? 1), 0);
  const confirmed  = guests.filter(g => g.rsvp === 'confirmed').length;
  const pending    = guests.filter(g => g.rsvp === 'pending').length;
  const declined   = guests.filter(g => g.rsvp === 'declined').length;
  const totalKids  = guests.filter(g => g.isChild).length;

  const totalCheckDone  = checklistItems.filter(it => it.status === 'done').length;
  const totalCheckItems = checklistItems.length;

  // Pending / in-progress items sorted by deadline (soonest first)
  const todoItems = checklistItems
    .filter(it => it.status === 'pending' || it.status === 'in_progress')
    .sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    })
    .slice(0, 10);

  function toggleDone(id: string) {
    const updated = checklistItems.map(it =>
      it.id === id
        ? { ...it, status: (it.status === 'done' ? 'pending' : 'done') as ChecklistStatus }
        : it
    );
    saveChecklist(updated);
  }

  const today = new Date().toISOString().slice(0, 10);

  const firstName = profile.nickname || currentUser?.displayName?.split(' ')[0] || 'Planner';

  return (
    <div className="bg-app-bg font-sans">
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl font-bold text-ink mb-1.5">
            Welcome back, {firstName}
            <span className="text-brand-secondary ml-2">✦</span>
          </h1>
          <p className="text-ink-muted text-sm">
            Here's an overview of your wedding planning progress.
          </p>
        </div>

        {/* Stat cards — guest stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <StatCard icon={Users}     label="Guests Invited" value={totalHeads > 0 ? String(totalHeads) : '—'} iconBg="bg-brand-primary/10"  iconColor="text-brand-primary" href="/guests" />
          <StatCard icon={UserCheck} label="Confirmed"      value={confirmed  > 0 ? String(confirmed)  : '—'} iconBg="bg-positive/10"        iconColor="text-positive"      href="/guests" />
          <StatCard icon={Clock}     label="Pending"        value={pending    > 0 ? String(pending)    : '—'} iconBg="bg-caution/10"         iconColor="text-caution"       href="/guests" />
          <StatCard icon={UserX}     label="Declined"       value={declined   > 0 ? String(declined)   : '—'} iconBg="bg-danger/10"          iconColor="text-danger"        href="/guests" />
          <StatCard icon={Baby}      label="Total Kids"     value={totalKids  > 0 ? String(totalKids)  : '—'} iconBg="bg-accent/10"          iconColor="text-accent"        href="/guests" />
        </div>

        {/* Stat cards — 2 column wide */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={Wallet}
            label="Budget"
            value={`${fmt(grandAct)} / ${fmt(grandEst)}`}
            iconBg="bg-accent/10"
            iconColor="text-accent"
            wide
            href="/budget"
          />
          <StatCard
            icon={Store}
            label="Suppliers"
            value={suppliers.length === 0 ? '—' : String(suppliers.length)}
            iconBg="bg-brand-secondary/20"
            iconColor="text-brand-primary"
            wide
            href="/suppliers"
          />
          <StatCard
            icon={ClipboardList}
            label="Tasks Completed"
            value={totalCheckItems === 0 ? '—' : `${totalCheckDone} / ${totalCheckItems}`}
            iconBg="bg-brand-primary/10"
            iconColor="text-brand-primary"
            wide
            href="/checklist"
          />
        </div>

        {/* ── Year Glance promo ── */}
        <a
          href="https://app.yearglance.com/auth/register?ref=emmanuelsantos010242"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-app-surface border border-brand-primary/40 rounded-2xl px-6 py-5 mb-8 shadow-sm hover:shadow-md hover:border-brand-primary/60 transition-all duration-200 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-6 h-6 text-brand-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-ink">Year Glance — Calendar Planner</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-semibold uppercase tracking-wide">Recommended</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Plan your wedding timeline across the year with a beautiful year-at-a-glance calendar. Map every event, milestone, and deadline at a glance.
            </p>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-xs font-semibold rounded-xl group-hover:bg-brand-hover transition-colors whitespace-nowrap flex-shrink-0">
            Open Year Glance <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </a>

        {/* ── TODO section ── */}
        <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">

          {/* Header */}
          <div className="px-5 py-4 border-b border-app-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="w-4 h-4 text-brand-primary" />
              <span className="font-serif text-base font-semibold text-ink tracking-wide">To Do</span>
              {todoItems.length > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-medium bg-caution/10 text-caution rounded-full">
                  {todoItems.length} remaining
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Progress bar */}
              {totalCheckItems > 0 && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-28 h-1.5 rounded-full bg-app-border overflow-hidden">
                    <div
                      className="h-full bg-positive rounded-full transition-all"
                      style={{ width: `${Math.round((totalCheckDone / totalCheckItems) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-ink-muted tabular-nums">
                    {Math.round((totalCheckDone / totalCheckItems) * 100)}%
                  </span>
                </div>
              )}
              <Link
                to="/checklist"
                className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-hover font-medium transition-colors"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Item list */}
          {todoItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-positive mb-2" />
              <p className="text-sm font-medium text-ink mb-0.5">All caught up!</p>
              <p className="text-xs text-ink-muted">No pending tasks on your checklist.</p>
            </div>
          ) : (
            <ul className="divide-y divide-app-border/60">
              {todoItems.map(item => {
                const isOverdue = item.deadline && item.deadline < today;
                const isDueSoon = item.deadline && item.deadline >= today && item.deadline <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-app-bg/60 transition-colors group"
                  >
                    {/* Toggle button */}
                    <button
                      type="button"
                      onClick={() => toggleDone(item.id)}
                      className="flex-shrink-0 text-ink-muted hover:text-positive transition-colors"
                      title="Mark as done"
                    >
                      {item.status === 'in_progress'
                        ? <Circle className="w-4 h-4 text-accent fill-accent/20" />
                        : <Circle className="w-4 h-4" />
                      }
                    </button>

                    {/* Item name */}
                    <span className="flex-1 text-sm text-ink truncate">{item.name}</span>

                    {/* Category badge */}
                    <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${CATEGORY_CLS[item.category] ?? 'bg-app-border/50 text-ink-muted'}`}>
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>

                    {/* Deadline */}
                    {item.deadline && (
                      <span className={`text-[11px] flex-shrink-0 font-medium tabular-nums ${isOverdue ? 'text-danger' : isDueSoon ? 'text-caution' : 'text-ink-muted'}`}>
                        {isOverdue ? '⚠ ' : ''}
                        {new Date(item.deadline + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer link if more items exist */}
          {checklistItems.filter(it => it.status === 'pending' || it.status === 'in_progress').length > 10 && (
            <div className="px-5 py-3 border-t border-app-border/60 text-center">
              <Link to="/checklist" className="text-xs text-brand-primary hover:text-brand-hover font-medium transition-colors">
                +{checklistItems.filter(it => it.status === 'pending' || it.status === 'in_progress').length - 10} more items →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  wide = false,
  href,
}: StatCardProps & { wide?: boolean; href?: string }) {
  const inner = (
    <>
      <div className={`flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl ${iconBg} ${wide ? '' : 'mb-4'}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-ink">{value}</p>
      </div>
    </>
  );

  const cls = [
    'bg-app-surface border border-app-border rounded-2xl p-5',
    'hover:shadow-sm hover:border-brand-primary/20 transition-all duration-200',
    wide ? 'flex items-center gap-5' : '',
    href ? 'cursor-pointer' : '',
  ].join(' ');

  if (href) {
    return <Link to={href} className={cls}>{inner}</Link>;
  }
  return <div className={cls}>{inner}</div>;
}
