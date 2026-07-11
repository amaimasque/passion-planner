import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';
import { MailCheck, RefreshCw, LogOut, Sparkles } from 'lucide-react';
import { auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';

export default function VerifyEmail() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleResend() {
    const user = auth.currentUser;
    if (!user) return;
    setResendLoading(true);
    setError('');
    try {
      await sendEmailVerification(user);
      setResendSent(true);
      setTimeout(() => setResendSent(false), 5000);
    } catch {
      setError('Too many requests. Please wait a moment before resending.');
    } finally {
      setResendLoading(false);
    }
  }

  async function handleCheckVerified() {
    const user = auth.currentUser;
    if (!user) return;
    setCheckLoading(true);
    setError('');
    try {
      await user.reload();
      if (auth.currentUser?.emailVerified) {
        navigate('/dashboard');
      } else {
        setError('Your email hasn\'t been verified yet. Please check your inbox and click the link.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setCheckLoading(false);
    }
  }

  async function handleSignOut() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center px-6 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Sparkles className="text-brand-primary w-5 h-5" />
          <span className="text-brand-primary font-serif text-xl font-semibold">Passion Planner</span>
        </div>

        <div className="bg-app-surface border border-app-border rounded-2xl p-8 shadow-sm text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-5">
            <MailCheck className="w-8 h-8 text-brand-primary" />
          </div>

          <h1 className="font-serif text-2xl font-bold text-ink mb-2">Verify your email</h1>
          <p className="text-sm text-ink-muted leading-relaxed mb-1">
            We sent a verification link to
          </p>
          <p className="text-sm font-semibold text-ink mb-5">
            {currentUser?.email}
          </p>
          <p className="text-xs text-ink-muted leading-relaxed mb-7">
            Click the link in the email to activate your account. Check your spam folder if you don't see it.
          </p>

          {error && (
            <div className="mb-5 p-3 bg-danger/8 border border-danger/20 rounded-xl text-danger text-xs text-left">
              {error}
            </div>
          )}

          {resendSent && (
            <div className="mb-5 p-3 bg-positive/10 border border-positive/20 rounded-xl text-positive text-xs">
              Verification email resent! Check your inbox.
            </div>
          )}

          <div className="space-y-3">
            <Button fullWidth onClick={handleCheckVerified} isLoading={checkLoading}>
              <RefreshCw className="w-4 h-4" />
              I've verified my email
            </Button>

            <Button
              fullWidth
              variant="ghost"
              onClick={handleResend}
              isLoading={resendLoading}
              disabled={resendSent}
            >
              Resend verification email
            </Button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-ink-muted hover:text-danger transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out and use a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
