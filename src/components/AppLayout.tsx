import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles, LayoutDashboard, Wallet, Store, CreditCard, Users, Heart, ListMusic,
  ClipboardList, LayoutGrid, Settings, LogOut, Menu, X, ChevronsLeft, ChevronsRight,
  Moon, Sun, Image, Presentation, CalendarDays, ExternalLink, Smartphone,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/wedding',      icon: Heart,            label: 'Wedding Details' },
  { to: '/budget',       icon: Wallet,           label: 'Budget Tracker' },
  { to: '/payments',     icon: CreditCard,       label: 'Payments Tracker' },
  { to: '/suppliers',    icon: Store,            label: 'Suppliers' },
  { to: '/guests',       icon: Users,            label: 'Guests' },
  { to: '/processional', icon: ListMusic,        label: 'Processional' },
  { to: '/seating',      icon: LayoutGrid,       label: 'Seating' },
  { to: '/checklist',    icon: ClipboardList,    label: 'Checklist' },
  { to: '/media',        icon: Image,            label: 'Media & Branding' },
  { to: '/program-flow', icon: Presentation, label: 'Program Flow', soon: true, desc: 'Manage text scripts for your event program. Link multiple program flows — entrance, ceremonies, speeches, and more — directly to your Passion Planner.' },
  { to: '/mobile-app',   icon: Smartphone,   label: 'Mobile App',   soon: true, desc: 'Passion Planner for iOS & Android — plan on the go, get deadline notifications, and sync with your partner in real time.' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem('sidebar-collapsed') === 'true'
  );

  const location  = useLocation();
  const navigate  = useNavigate();
  const { currentUser, logout } = useAuth();
  const { isDark, toggleDark } = useTheme();

  const initials = currentUser?.displayName
    ? currentUser.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (currentUser?.email?.[0] ?? 'P').toUpperCase();

  function toggleCollapsed() {
    setCollapsed(c => {
      const next = !c;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function navCls(to: string, isCollapsed: boolean) {
    const active = location.pathname === to;
    return [
      'flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all',
      isCollapsed ? 'justify-center px-0' : 'px-3',
      active
        ? 'bg-brand-primary/10 text-brand-primary'
        : 'text-ink-muted hover:text-ink hover:bg-app-bg',
    ].join(' ');
  }

  function iconBtnCls(isCollapsed: boolean, danger = false) {
    return [
      'w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all',
      isCollapsed ? 'justify-center px-0' : 'px-3',
      danger
        ? 'text-ink-muted hover:text-danger hover:bg-danger/5'
        : 'text-ink-muted hover:text-ink hover:bg-app-bg',
    ].join(' ');
  }

  // Sidebar JSX — reused for both desktop and mobile overlay
  function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
    return (
      <div className="bg-app-surface border-r border-app-border flex flex-col h-full w-full">
        {/* Logo */}
        <div className={[
          'h-16 flex items-center border-b border-app-border flex-shrink-0',
          isCollapsed ? 'justify-center px-4' : 'px-5 gap-2.5',
        ].join(' ')}>
          <Sparkles className="text-brand-primary w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="font-serif text-base font-semibold text-ink tracking-wide flex-1 truncate whitespace-nowrap">
              Passion Planner
            </span>
          )}
          {/* Mobile close button */}
          {!isCollapsed && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 text-ink-muted hover:text-ink rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary nav */}
        <nav className={['flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden', isCollapsed ? 'px-2' : 'px-3'].join(' ')}>
          {NAV_ITEMS.map(({ to, icon: Icon, label, soon, desc }) =>
            soon ? (
              <div
                key={to}
                title={isCollapsed ? label : undefined}
                className={[
                  'group rounded-xl cursor-not-allowed select-none',
                  isCollapsed ? 'px-0' : '',
                ].join(' ')}
              >
                <div className={[
                  'flex items-center gap-3 py-2.5 text-sm font-medium text-ink-muted/50',
                  isCollapsed ? 'justify-center px-0' : 'px-3',
                ].join(' ')}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="flex-1 whitespace-nowrap">{label}</span>
                  )}
                  {!isCollapsed && (
                    <span className="px-1.5 py-0.5 rounded-full bg-caution/10 text-caution text-[9px] font-semibold uppercase tracking-wide">
                      Soon
                    </span>
                  )}
                </div>
                {!isCollapsed && desc && (
                  <div className="max-h-0 overflow-hidden group-hover:max-h-24 transition-all duration-200 ease-in-out">
                    <p className="text-[10px] text-ink-muted leading-relaxed px-3 pb-2.5">
                      {desc}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={to}
                to={to}
                title={isCollapsed ? label : undefined}
                onClick={() => setMobileOpen(false)}
                className={navCls(to, isCollapsed)}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
              </Link>
            )
          )}

          {/* Year Glance external link */}
          <div className="group rounded-xl">
            <a
              href="https://app.yearglance.com/auth/register?ref=emmanuelsantos010242"
              target="_blank"
              rel="noopener noreferrer"
              title={isCollapsed ? 'Year Glance — Year-at-a-glance calendar planner' : undefined}
              className={[
                'flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isCollapsed ? 'justify-center px-0' : 'px-3',
                'text-brand-primary hover:bg-brand-primary/5',
              ].join(' ')}
            >
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 whitespace-nowrap">Year Glance</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60" />
                </>
              )}
            </a>
            {!isCollapsed && (
              <div className="max-h-0 overflow-hidden group-hover:max-h-24 transition-all duration-200 ease-in-out">
                <p className="text-[10px] text-ink-muted leading-relaxed px-3 pb-2.5">
                  Plan your wedding timeline with a beautiful year-at-a-glance calendar. Map every event, milestone, and deadline across the year — all in one view.
                </p>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom section */}
        <div className={['py-3 border-t border-app-border space-y-0.5', isCollapsed ? 'px-2' : 'px-3'].join(' ')}>
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={iconBtnCls(isCollapsed)}
          >
            {isDark
              ? <Sun  className="w-4 h-4 flex-shrink-0" />
              : <Moon className="w-4 h-4 flex-shrink-0" />}
            {!isCollapsed && (
              <span className="whitespace-nowrap">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={toggleCollapsed}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`${iconBtnCls(isCollapsed)} hidden lg:flex`}
          >
            {isCollapsed
              ? <ChevronsRight className="w-4 h-4 flex-shrink-0" />
              : <ChevronsLeft  className="w-4 h-4 flex-shrink-0" />}
            {!isCollapsed && <span className="whitespace-nowrap">Collapse</span>}
          </button>

          <Link
            to="/settings"
            title={isCollapsed ? 'Settings' : undefined}
            onClick={() => setMobileOpen(false)}
            className={navCls('/settings', isCollapsed)}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Settings</span>}
          </Link>

          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Sign out' : undefined}
            className={iconBtnCls(isCollapsed, true)}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Sign out</span>}
          </button>

          {/* User chip */}
          <div className={[
            'flex items-center pt-3 mt-1 border-t border-app-border',
            isCollapsed ? 'justify-center' : 'gap-2.5 px-3',
          ].join(' ')}>
            <div
              className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 select-none"
              title={isCollapsed ? (currentUser?.displayName ?? '') : undefined}
            >
              {initials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink truncate">{currentUser?.displayName ?? '—'}</p>
                <p className="text-xs text-ink-muted truncate">{currentUser?.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg font-sans flex">
      {/* Desktop sidebar */}
      <div
        className={[
          'hidden lg:block print:hidden fixed inset-y-0 left-0 z-20 overflow-hidden',
          'transition-[width] duration-200 ease-in-out',
          collapsed ? 'w-16' : 'w-60',
        ].join(' ')}
      >
        <Sidebar isCollapsed={collapsed} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-20 bg-ink/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-30 w-60">
            <Sidebar isCollapsed={false} />
          </div>
        </>
      )}

      {/* Main content */}
      <div
        className={[
          'flex-1 min-w-0 flex flex-col',
          'transition-[margin-left] duration-200 ease-in-out',
          collapsed ? 'lg:ml-16 print:ml-0' : 'lg:ml-60 print:ml-0',
        ].join(' ')}
      >
        {/* Mobile top bar */}
        <div className="lg:hidden print:hidden sticky top-0 z-10 flex items-center gap-3 px-4 h-14 bg-app-surface border-b border-app-border flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-app-border rounded-lg transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Sparkles className="text-brand-primary w-4 h-4" />
          <span className="font-serif text-base font-semibold text-ink">Passion Planner</span>
        </div>

        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
