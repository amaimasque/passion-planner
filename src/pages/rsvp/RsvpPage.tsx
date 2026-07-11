import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, functions, httpsCallable } from '../../firebase';
import { Sparkles, Heart, Check, X, ChevronDown } from 'lucide-react';

type Phase = 'loading' | 'form' | 'submitting' | 'done' | 'error';

const MEAL_OPTIONS = [
  { value: 'standard',   label: 'Standard' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan',      label: 'Vegan' },
  { value: 'halal',      label: 'Halal' },
  { value: 'other',      label: 'Other / Please advise' },
];

export default function RsvpPage() {
  const { token } = useParams<{ token: string }>();

  const [phase, setPhase]           = useState<Phase>('loading');
  const [errorMsg, setErrorMsg]     = useState('');
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName,  setGuestLastName]  = useState('');
  const [slots, setSlots] = useState(1);
  const [weddingInfo, setWeddingInfo]       = useState<Record<string, string>>({});
  const [status, setStatus]         = useState<'confirmed' | 'declined' | ''>('');
  const [meal, setMeal]             = useState('standard');
  const [doneMsg, setDoneMsg]       = useState('');

  // Load token info from Firestore (public read allowed)
  useEffect(() => {
    if (!token) { setPhase('error'); setErrorMsg('No RSVP token provided.'); return; }

    getDoc(doc(db, 'rsvpTokens', token))
      .then(snap => {
        if (!snap.exists()) {
          setPhase('error');
          setErrorMsg('This RSVP link is invalid or has already expired.');
          return;
        }
        const d = snap.data();
        if (d.expiresAt <= Date.now()) {
          setPhase('error');
          setErrorMsg('This RSVP link has expired. Please contact the couple directly.');
          return;
        }
        setGuestFirstName(d.guestFirstName ?? '');
        setGuestLastName(d.guestLastName   ?? '');
        setSlots(d.slots ?? 1);
        setWeddingInfo({
          date:               d.weddingDate        ?? '',
          ceremonyTime:       d.ceremonyTime        ?? '',
          churchAndAddress:   d.churchAndAddress    ?? '',
          receptionVenue:     d.receptionVenue      ?? '',
          receptionStartTime: d.receptionStartTime  ?? '',
        });
        setPhase('form');
      })
      .catch(() => {
        setPhase('error');
        setErrorMsg('Failed to load RSVP info. Please try again.');
      });
  }, [token]);

  async function submit() {
    if (!status || !token) return;
    setPhase('submitting');
    try {
      const fn = httpsCallable<unknown, { guestName: string; weddingDate: string }>(
        functions, 'submitRsvp'
      );
      const result = await fn({ token, status, meal: status === 'confirmed' ? meal : undefined });
      setDoneMsg(
        status === 'confirmed'
          ? `Thank you, ${result.data.guestName}! We're so excited to celebrate with you! 🎉`
          : `Thank you for letting us know, ${result.data.guestName}. We'll miss you on our special day.`
      );
      setPhase('done');
    } catch (err: any) {
      setPhase('error');
      setErrorMsg(err?.message ?? 'Something went wrong. Please try again.');
    }
  }

  const guestName = [guestFirstName, guestLastName].filter(Boolean).join(' ');
  const dateStr   = weddingInfo.date
    ? new Date(weddingInfo.date + 'T00:00:00').toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-app-bg font-sans flex flex-col items-center justify-center px-4 py-12">

      {/* Brand mark */}
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-5 h-5 text-brand-primary" />
        <span className="font-serif text-base font-semibold text-ink tracking-wide">Passion Planner</span>
      </div>

      <div className="w-full max-w-md">

        {/* Loading */}
        {phase === 'loading' && (
          <div className="text-center py-12">
            <p className="text-ink-muted text-sm animate-pulse">Loading your invitation…</p>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="bg-app-surface border border-app-border rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-danger" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-ink mb-2">Link unavailable</h2>
            <p className="text-sm text-ink-muted">{errorMsg}</p>
          </div>
        )}

        {/* Done */}
        {phase === 'done' && (
          <div className="bg-app-surface border border-app-border rounded-2xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-positive/10 flex items-center justify-center mx-auto mb-5">
              <Check className="w-7 h-7 text-positive" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-ink mb-3">RSVP Received!</h2>
            <p className="text-sm text-ink-muted leading-relaxed">{doneMsg}</p>
            <div className="mt-6 pt-5 border-t border-app-border">
              <Heart className="w-5 h-5 text-brand-primary mx-auto" />
            </div>
          </div>
        )}

        {/* Form */}
        {(phase === 'form' || phase === 'submitting') && (
          <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">

            {/* Header */}
            <div className="bg-brand-primary px-8 py-7 text-center">
              <p className="text-white/75 text-xs tracking-widest uppercase mb-1">You're invited</p>
              <h1 className="font-serif text-2xl font-bold text-white">
                {guestName ? `Dear ${guestName}` : "You're Invited!"}
              </h1>
            </div>

            {/* Wedding info */}
            {(dateStr || weddingInfo.churchAndAddress || weddingInfo.receptionVenue) && (
              <div className="px-8 py-5 bg-app-bg/60 border-b border-app-border space-y-1.5 text-sm text-ink-muted">
                {dateStr && (
                  <p><span className="mr-2">📅</span><strong className="text-ink">{dateStr}</strong></p>
                )}
                {weddingInfo.ceremonyTime && (
                  <p><span className="mr-2">⏰</span>Ceremony at <strong className="text-ink">{weddingInfo.ceremonyTime}</strong></p>
                )}
                {weddingInfo.churchAndAddress && (
                  <p><span className="mr-2">⛪</span><strong className="text-ink">{weddingInfo.churchAndAddress}</strong></p>
                )}
                {weddingInfo.receptionVenue && (
                  <p>
                    <span className="mr-2">🥂</span>Reception at <strong className="text-ink">{weddingInfo.receptionVenue}</strong>
                    {weddingInfo.receptionStartTime && `, ${weddingInfo.receptionStartTime}`}
                  </p>
                )}
                <div className="mt-3 pt-3 border-t border-app-border">
                  <p className="inline-flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                    🎟️ <span>{slots} {slots === 1 ? 'seat' : 'seats'} reserved for you</span>
                  </p>
                </div>
              </div>
            )}

            {/* RSVP form */}
            <div className="px-8 py-7 space-y-6">
              <div>
                <p className="text-sm font-semibold text-ink mb-3 text-center">Will you be joining us?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('confirmed')}
                    className={[
                      'flex flex-col items-center gap-2 py-5 rounded-xl border-2 transition-all font-medium text-sm',
                      status === 'confirmed'
                        ? 'border-positive bg-positive/10 text-positive'
                        : 'border-app-border text-ink-muted hover:border-positive/40 hover:text-positive',
                    ].join(' ')}
                  >
                    <Check className="w-6 h-6" />
                    Attending
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('declined')}
                    className={[
                      'flex flex-col items-center gap-2 py-5 rounded-xl border-2 transition-all font-medium text-sm',
                      status === 'declined'
                        ? 'border-danger bg-danger/10 text-danger'
                        : 'border-app-border text-ink-muted hover:border-danger/40 hover:text-danger',
                    ].join(' ')}
                  >
                    <X className="w-6 h-6" />
                    Not Attending
                  </button>
                </div>
              </div>

              {/* Meal preference (only if attending) */}
              {status === 'confirmed' && (
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Meal Preference</label>
                  <div className="relative">
                    <select
                      value={meal}
                      onChange={e => setMeal(e.target.value)}
                      className="w-full appearance-none pl-4 pr-8 py-3 text-sm border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-ink bg-app-surface cursor-pointer"
                    >
                      {MEAL_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={!status || phase === 'submitting'}
                className={[
                  'w-full py-3.5 rounded-xl text-sm font-semibold transition-all',
                  !status
                    ? 'bg-app-border text-ink-muted cursor-not-allowed'
                    : phase === 'submitting'
                      ? 'bg-brand-primary/70 text-white cursor-wait'
                      : 'bg-brand-primary text-white hover:bg-brand-hover active:scale-[0.98]',
                ].join(' ')}
              >
                {phase === 'submitting' ? 'Submitting…' : 'Submit RSVP'}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-ink-muted text-center">Powered by Passion Planner</p>
    </div>
  );
}
