import React, { useState, useEffect, FormEvent, ReactNode } from 'react';
import {
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import {
  Sparkles, User, Lock, Trash2,
  AlertTriangle, CheckCircle, Eye, EyeOff, Palette, Check, Globe,
} from 'lucide-react';
import { auth, db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useWeddingDetails } from '../../hooks/useWeddingDetails';
import { useTheme, THEME_PRESETS, darkenHex } from '../../contexts/ThemeContext';
import { CURRENCIES, LOCATIONS } from '../../hooks/useCurrency';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

// ── Flash-success hook ────────────────────────────────────────────────────────

function useSuccess(): [Record<string, boolean>, (key: string) => void] {
  const [map, setMap] = useState<Record<string, boolean>>({});
  function flash(key: string) {
    setMap((m) => ({ ...m, [key]: true }));
    setTimeout(() => setMap((m) => ({ ...m, [key]: false })), 3500);
  }
  return [map, flash];
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Settings() {
  const { currentUser } = useAuth();
  const { profile, saveProfile } = useUserProfile();
  const { details: weddingDetails } = useWeddingDetails();
  const { themeId, setTheme } = useTheme();

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: '', nickname: '' });
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Region form
  const [regionForm, setRegionForm] = useState({ currency: 'PHP', location: '' });
  const [regionLoading, setRegionLoading] = useState(false);

  // Password form
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePw, setShowDeletePw] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [success, flash] = useSuccess();

  // Seed form from loaded auth + firestore profile
  useEffect(() => {
    setProfileForm({
      name: currentUser?.displayName ?? '',
      nickname: profile.nickname ?? '',
    });
  }, [currentUser?.displayName, profile.nickname]);

  useEffect(() => {
    setRegionForm({
      currency: profile.currency ?? 'PHP',
      location: profile.location ?? '',
    });
  }, [profile.currency, profile.location]);

  const initials = currentUser?.displayName
    ? currentUser.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (currentUser?.email?.[0] ?? 'P').toUpperCase();

  // ── Profile save ──────────────────────────────────────────────────────────

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const name = profileForm.name.trim();
    if (!name) { setProfileError('Display name cannot be empty.'); return; }
    try {
      setProfileError('');
      setProfileLoading(true);
      await Promise.all([
        updateProfile(user, { displayName: name }),
        saveProfile({ nickname: profileForm.nickname.trim() || undefined }),
      ]);
      flash('profile');
    } catch {
      setProfileError('Failed to save profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  }

  // ── Password update ───────────────────────────────────────────────────────

  async function handlePasswordUpdate(e: FormEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !user.email) return;
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    try {
      setPasswordError('');
      setPasswordLoading(true);
      const cred = EmailAuthProvider.credential(user.email, passwordForm.current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, passwordForm.newPass);
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      flash('password');
    } catch (err: any) {
      const wrongPw = ['auth/wrong-password', 'auth/invalid-credential'].includes(err.code);
      setPasswordError(wrongPw ? 'Current password is incorrect.' : 'Failed to update password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  }

  // ── Delete account ────────────────────────────────────────────────────────

  async function handleDeleteAccount() {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, cred);
      // Delete Firestore data while we still have valid auth
      await Promise.allSettled([
        deleteDoc(doc(db, 'budgets', user.uid)),
        deleteDoc(doc(db, 'users', user.uid)),
      ]);
      // deleteUser() triggers onAuthStateChanged(null) → PrivateRoute redirects to /login.
      // Do NOT navigate manually or update state after this point — the component
      // will unmount naturally and calling setState on it causes the "message channel
      // closed" error from browser extensions + React unmount warnings.
      await deleteUser(user);
    } catch (err: any) {
      const wrongPw = ['auth/wrong-password', 'auth/invalid-credential'].includes(err.code);
      setDeleteError(wrongPw ? 'Incorrect password.' : 'Failed to delete account. Please try again.');
      setDeleteLoading(false); // only reset on error; on success the component unmounts
    }
  }

  // ── Region save ───────────────────────────────────────────────────────────

  async function handleRegionSave(e: FormEvent) {
    e.preventDefault();
    setRegionLoading(true);
    try {
      await saveProfile({ currency: regionForm.currency, location: regionForm.location || undefined });
      flash('region');
    } finally {
      setRegionLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-app-bg font-sans">
      {/* Header */}
      <header className="bg-app-surface border-b border-app-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-3">
          <Sparkles className="text-brand-primary w-5 h-5" />
          <span className="font-serif text-lg font-semibold text-ink tracking-wide">
            Account Settings
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* User identity */}
        <div className="flex items-center gap-4 px-1">
          <div className="w-14 h-14 rounded-full bg-brand-primary flex items-center justify-center text-white text-xl font-semibold flex-shrink-0 select-none">
            {initials}
          </div>
          <div>
            <p className="font-serif text-base font-semibold text-ink">
              {currentUser?.displayName ?? '—'}
            </p>
            <p className="text-sm text-ink-muted">{currentUser?.email}</p>
          </div>
        </div>

        {/* Profile */}
        <SettingsCard icon={<User className="w-4 h-4" />} title="Profile">
          <form onSubmit={handleProfileSave} className="space-y-4">
            <Input
              label="Display Name"
              placeholder="Your full name"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              required
            />
            <div>
              <Input
                label="Nickname"
                placeholder="e.g. Jane"
                value={profileForm.nickname}
                onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })}
              />
              <p className="mt-1.5 text-xs text-ink-muted">
                Shown on the dashboard instead of your first name.
              </p>
            </div>

            {profileError && <ErrorBanner msg={profileError} />}
            {success.profile && <SuccessBanner msg="Profile saved successfully." />}

            <Button type="submit" isLoading={profileLoading} size="sm">
              Save Profile
            </Button>
          </form>
        </SettingsCard>

        {/* Password */}
        <SettingsCard icon={<Lock className="w-4 h-4" />} title="Change Password">
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <PasswordField
              label="Current Password"
              value={passwordForm.current}
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
              onChange={(v) => setPasswordForm({ ...passwordForm, current: v })}
              placeholder="Your current password"
            />
            <PasswordField
              label="New Password"
              value={passwordForm.newPass}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              onChange={(v) => setPasswordForm({ ...passwordForm, newPass: v })}
              placeholder="At least 6 characters"
            />
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  required
                  className="w-full pl-4 pr-10 py-3 text-sm bg-app-surface border border-app-border rounded-xl text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordError && <ErrorBanner msg={passwordError} />}
            {success.password && <SuccessBanner msg="Password updated successfully." />}

            <Button type="submit" isLoading={passwordLoading} size="sm">
              Update Password
            </Button>
          </form>
        </SettingsCard>

        {/* Region & Currency */}
        <SettingsCard icon={<Globe className="w-4 h-4" />} title="Region & Currency">
          <form onSubmit={handleRegionSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Currency</label>
              <select
                value={regionForm.currency}
                onChange={e => setRegionForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full px-4 py-3 text-sm bg-app-surface border border-app-border rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-ink-muted">Used for all monetary values across the app.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Location</label>
              <select
                value={regionForm.location}
                onChange={e => setRegionForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-4 py-3 text-sm bg-app-surface border border-app-border rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all"
              >
                <option value="">— Select your country —</option>
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-ink-muted">Helps tailor supplier and venue suggestions.</p>
            </div>

            {success.region && <SuccessBanner msg="Region settings saved." />}

            <Button type="submit" isLoading={regionLoading} size="sm">
              Save Region
            </Button>
          </form>
        </SettingsCard>

        {/* Appearance */}
        <SettingsCard icon={<Palette className="w-4 h-4" />} title="Appearance">
          <div className="space-y-5">

            {/* Preset themes */}
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Preset Themes</p>
              <div className="flex flex-wrap gap-3">
                {THEME_PRESETS.map(preset => {
                  const active = themeId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setTheme(preset.id, preset.primary, preset.hover)}
                      className="flex flex-col items-center gap-1.5 group"
                      title={preset.name}
                    >
                      <span
                        className="relative w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center"
                        style={{
                          backgroundColor: preset.primary,
                          borderColor: active ? preset.primary : 'transparent',
                          boxShadow: active ? `0 0 0 3px ${preset.primary}30` : undefined,
                        }}
                      >
                        {active && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                      </span>
                      <span className={`text-[10px] font-medium leading-tight text-center max-w-[48px] ${active ? 'text-ink' : 'text-ink-muted'}`}>
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Motif colors */}
            {weddingDetails.motifColors.length > 0 && (
              <div className="pt-4 border-t border-app-border">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">From Your Wedding Motif</p>
                <p className="text-xs text-ink-muted mb-3">Use one of your motif colors as the app accent.</p>
                <div className="flex flex-wrap gap-3">
                  {weddingDetails.motifColors.map((mc, i) => {
                    const motifId = `motif-${i}`;
                    const active  = themeId === motifId;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTheme(motifId, mc.hex, darkenHex(mc.hex))}
                        className="flex flex-col items-center gap-1.5"
                        title={mc.name || mc.hex}
                      >
                        <span
                          className="relative w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center"
                          style={{
                            backgroundColor: mc.hex,
                            borderColor: active ? mc.hex : 'transparent',
                            boxShadow: active ? `0 0 0 3px ${mc.hex}30` : undefined,
                          }}
                        >
                          {active && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                        </span>
                        <span className={`text-[10px] font-medium leading-tight text-center max-w-[48px] truncate ${active ? 'text-ink' : 'text-ink-muted'}`}>
                          {mc.name || mc.hex}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {weddingDetails.motifColors.length === 0 && (
              <p className="text-xs text-ink-muted pt-2 border-t border-app-border">
                Add motif colors in <strong className="text-ink">Wedding Details</strong> to use them as your app accent color.
              </p>
            )}
          </div>
        </SettingsCard>

        {/* Danger zone */}
        <div className="rounded-2xl border border-danger/30 bg-app-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-danger/20 bg-danger/5 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <h2 className="text-sm font-semibold text-danger">Danger Zone</h2>
          </div>
          <div className="px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink mb-0.5">Delete your account</p>
              <p className="text-xs text-ink-muted">
                Permanently removes your account and all wedding planning data.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              className="flex-shrink-0"
              onClick={() => { setDeletePassword(''); setDeleteError(''); setDeleteOpen(true); }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Account
            </Button>
          </div>
        </div>
      </main>

      {/* Delete confirmation modal */}
      {deleteOpen && (
        <Modal title="Delete Account" onClose={() => setDeleteOpen(false)} size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-danger/8 border border-danger/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink leading-relaxed">
                This will permanently delete your account and all your data including your budget.
                <strong className="block mt-1">This cannot be undone.</strong>
              </p>
            </div>

            <PasswordField
              label="Enter your password to confirm"
              value={deletePassword}
              show={showDeletePw}
              onToggle={() => setShowDeletePw((v) => !v)}
              onChange={setDeletePassword}
              placeholder="Your password"
            />

            {deleteError && <ErrorBanner msg={deleteError} />}

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" fullWidth onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                isLoading={deleteLoading}
                disabled={!deletePassword}
                onClick={handleDeleteAccount}
              >
                Delete My Account
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Reusable sub-components ───────────────────────────────────────────────────

function SettingsCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-app-border bg-brand-primary/5 flex items-center gap-2.5">
        <span className="text-brand-primary">{icon}</span>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

function PasswordField({
  label, value, show, onToggle, onChange, placeholder,
}: {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-4 pr-10 py-3 text-sm bg-app-surface border border-app-border rounded-xl text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-danger/8 border border-danger/20 rounded-xl text-danger text-sm">
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      {msg}
    </div>
  );
}

function SuccessBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-positive/10 border border-positive/20 rounded-xl text-positive text-sm">
      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      {msg}
    </div>
  );
}
