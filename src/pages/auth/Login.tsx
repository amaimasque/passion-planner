import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Sparkles, Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface LoginForm {
  email: string;
  password: string;
}

const FEATURES = [
  'Guest list & RSVP tracking',
  'Budget & payment tracker',
  'Vendor management',
  'Digital invitations',
  'Timeline & checklist',
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const { user } = await login(form.email, form.password);
      navigate(user.emailVerified ? '/dashboard' : '/verify-email');
    } catch (err: any) {
      setError(getFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex w-5/12 bg-brand-primary flex-col justify-center px-14 py-16 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-8 w-20 h-20 bg-brand-secondary/25 rounded-full pointer-events-none" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <Sparkles className="text-brand-secondary w-6 h-6" />
            <span className="text-white font-serif text-2xl font-semibold tracking-wide">
              Passion Planner
            </span>
          </div>

          <h2 className="text-white font-serif text-4xl font-bold leading-snug mb-4">
            Your perfect day,<br />
            beautifully planned.
          </h2>
          <p className="text-white/70 text-base mb-10 leading-relaxed">
            Everything you need to plan your dream wedding — all in one elegant place.
          </p>

          <ul className="space-y-3.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-white/85 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-secondary/30 flex items-center justify-center">
                  <Check className="w-3 h-3 text-brand-secondary" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-app-bg">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <Sparkles className="text-brand-primary w-5 h-5" />
            <span className="text-brand-primary font-serif text-xl font-semibold">
              Passion Planner
            </span>
          </div>

          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-ink mb-2">Welcome back</h1>
            <p className="text-ink-muted text-sm">Sign in to continue planning your perfect day</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-danger/8 border border-danger/20 rounded-xl text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              leftIcon={<Mail className="w-4 h-4" />}
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Password"
              leftIcon={<Lock className="w-4 h-4" />}
              type="password"
              name="password"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={loading}
              className="mt-2 tracking-wide"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-ink-muted text-sm">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-brand-primary hover:text-brand-hover font-medium transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function getFirebaseError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'Failed to sign in. Please try again.';
  }
}
