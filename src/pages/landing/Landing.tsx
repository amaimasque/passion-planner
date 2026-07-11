import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Heart,
  Users,
  DollarSign,
  CheckSquare,
  Calendar,
  MapPin,
  Camera,
  ArrowRight,
  ExternalLink,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

const FEATURES = [
  { icon: DollarSign,  label: 'Budget Tracker',   desc: 'Track every expense, category by category, with real-time totals.' },
  { icon: Users,       label: 'Guest List & RSVP', desc: 'Manage invitations and collect RSVPs with a shareable link.' },
  { icon: MapPin,      label: 'Seating Planner',   desc: 'Drag-and-drop table arrangements for a stress-free reception.' },
  { icon: CheckSquare, label: 'Checklist',          desc: 'Never miss a detail with a fully customisable planning checklist.' },
  { icon: Calendar,    label: 'Suppliers',          desc: 'Keep all vendor contacts, quotes, and contracts in one place.' },
  { icon: Camera,      label: 'Media Gallery',      desc: 'Collect inspiration photos and share a mood board with vendors.' },
];

// Pexels free-to-use photos (auto-compressed via Pexels CDN)
const HERO_PHOTO   = 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=1';
const PLAN_PHOTO   = 'https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=800&h=560&dpr=1';
const COUPLE_PHOTO = 'https://images.pexels.com/photos/1128784/pexels-photo-1128784.jpeg?auto=compress&cs=tinysrgb&w=800&h=560&dpr=1';

export default function Landing() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.emailVerified ? '/dashboard' : '/verify-email', { replace: true });
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#FCF9F6', color: '#2F2F33' }}>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-sm border-b"
        style={{ backgroundColor: 'rgba(252,249,246,0.92)', borderColor: '#E8DDD3' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5" style={{ color: '#C97B84' }} fill="#C97B84" />
            <span className="font-serif text-xl font-semibold tracking-wide" style={{ color: '#2F2F33' }}>
              Passion Planner
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#C97B84' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FDF0F1')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: '#C97B84' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#B66A74')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C97B84')}
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: '#C97B84' }} />
        <div className="pointer-events-none absolute top-10 -right-24 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: '#D9B382' }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          {/* text */}
          <div>
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6 border"
              style={{ color: '#C97B84', borderColor: '#E8C5CA', backgroundColor: '#FDF0F1' }}
            >
              <Heart className="w-3 h-3" fill="#C97B84" /> Your complete wedding planning companion
            </span>

            <h1 className="font-serif text-5xl sm:text-6xl font-bold leading-tight mb-6" style={{ color: '#2F2F33' }}>
              Plan your perfect
              <br />
              <span style={{ color: '#C97B84' }}>forever begins here.</span>
            </h1>

            <p className="text-lg leading-relaxed mb-10 max-w-md" style={{ color: '#6D6A70' }}>
              From budget to bouquets, Passion Planner brings every detail of your
              wedding together in one elegant, easy-to-use dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                style={{ backgroundColor: '#C97B84' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#B66A74')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C97B84')}
              >
                Start planning for free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold border transition-all hover:bg-white"
                style={{ color: '#2F2F33', borderColor: '#E8DDD3' }}
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* hero photo */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 rounded-3xl translate-x-3 translate-y-3" style={{ backgroundColor: '#E8C5CA' }} />
            <img
              src={HERO_PHOTO}
              alt="Wedding bouquet"
              className="relative rounded-3xl object-cover w-full h-[460px] shadow-xl"
              loading="eager"
            />
            {/* floating pill */}
            <div
              className="absolute -bottom-5 -left-6 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E8DDD3' }}
            >
              <Heart className="w-5 h-5 flex-shrink-0" style={{ color: '#C97B84' }} fill="#C97B84" />
              <div>
                <p className="text-xs font-semibold" style={{ color: '#2F2F33' }}>All-in-one planner</p>
                <p className="text-xs" style={{ color: '#6D6A70' }}>Budget · Guests · Vendors</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          {/* photo */}
          <div className="relative hidden lg:block order-last lg:order-first">
            <div className="absolute inset-0 rounded-3xl -translate-x-3 translate-y-3" style={{ backgroundColor: '#F5EFE8' }} />
            <img
              src={PLAN_PHOTO}
              alt="Couple planning their wedding"
              className="relative rounded-3xl object-cover w-full h-[440px] shadow-lg"
              loading="lazy"
            />
          </div>

          {/* grid */}
          <div>
            <h2 className="font-serif text-4xl font-bold mb-3" style={{ color: '#2F2F33' }}>
              Everything you need,
              <br />nothing you don't
            </h2>
            <p className="text-base mb-10" style={{ color: '#6D6A70' }}>
              Six powerful tools in one dashboard — designed to turn wedding planning from overwhelming to joyful.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="p-4 rounded-2xl border transition-shadow hover:shadow-md"
                  style={{ backgroundColor: '#FCF9F6', borderColor: '#E8DDD3' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: '#FDF0F1' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: '#C97B84' }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: '#2F2F33' }}>{label}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#6D6A70' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── YEAR GLANCE COMPANION APP ────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl overflow-hidden border shadow-sm grid lg:grid-cols-2" style={{ borderColor: '#E8DDD3', backgroundColor: '#FFFFFF' }}>
            {/* photo half */}
            <div className="relative min-h-[300px] lg:min-h-0">
              <img
                src={COUPLE_PHOTO}
                alt="Happy couple"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(201,123,132,0.35) 0%, transparent 60%)' }} />
            </div>

            {/* text half */}
            <div className="p-10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: '#FDF0F1', color: '#C97B84' }}
                >
                  <Sparkles className="w-3 h-3" /> Recommended
                </span>
                <span className="text-xs" style={{ color: '#6D6A70' }}>Companion app</span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#FDF0F1' }}
                >
                  <CalendarDays className="w-6 h-6" style={{ color: '#C97B84' }} />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold" style={{ color: '#2F2F33' }}>Year Glance</h2>
                  <p className="text-sm" style={{ color: '#6D6A70' }}>Year-at-a-glance calendar planner</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-6" style={{ color: '#6D6A70' }}>
                See your entire wedding year on a single, beautiful page. Map out every milestone,
                vendor deadline, and celebration across all 12 months — the perfect complement
                to Passion Planner for couples who love to see the big picture.
              </p>

              <ul className="space-y-2 mb-8">
                {[
                  'Visual 12-month overview at a glance',
                  'Mark key dates, deadlines & celebrations',
                  'Share with your partner or wedding party',
                ].map(point => (
                  <li key={point} className="flex items-start gap-2 text-sm" style={{ color: '#6D6A70' }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#C97B84' }} />
                    {point}
                  </li>
                ))}
              </ul>

              <a
                href="https://app.yearglance.com/auth/register?ref=emmanuelsantos010242"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 self-start px-6 py-3 rounded-xl text-sm font-semibold text-white shadow transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ backgroundColor: '#C97B84' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#B66A74')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C97B84')}
              >
                Try Year Glance free <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div
          className="max-w-4xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
          style={{ backgroundColor: '#C97B84' }}
        >
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: '#D9B382' }} />
          <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: '#2F2F33' }} />

          <Heart className="w-10 h-10 mx-auto mb-6 opacity-80" fill="white" color="white" />
          <h2 className="font-serif text-4xl font-bold text-white mb-4">
            Your big day deserves the best planning.
          </h2>
          <p className="text-white/80 text-base max-w-md mx-auto mb-8">
            Join couples who planned their dream wedding with Passion Planner — for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold bg-white transition-all hover:bg-neutral-50 hover:-translate-y-0.5 shadow-lg"
              style={{ color: '#C97B84' }}
            >
              Create your free account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold border border-white/40 text-white transition-all hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t py-10 px-6" style={{ borderColor: '#E8DDD3' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4" style={{ color: '#C97B84' }} fill="#C97B84" />
            <span className="font-serif font-semibold" style={{ color: '#2F2F33' }}>Passion Planner</span>
          </div>
          <p className="text-xs" style={{ color: '#6D6A70' }}>Made with love for couples everywhere.</p>
          <div className="flex gap-4 text-xs" style={{ color: '#6D6A70' }}>
            <Link to="/login" className="hover:underline">Sign in</Link>
            <Link to="/register" className="hover:underline">Register</Link>
            <a
              href="https://app.yearglance.com/auth/register?ref=emmanuelsantos010242"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Year Glance
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
