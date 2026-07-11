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
  Smartphone,
  Bell,
  Wifi,
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

      {/* ── MOBILE APP COMING SOON ───────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">

          {/* Text side */}
          <div>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-5"
              style={{ backgroundColor: '#FDF0F1', color: '#C97B84', border: '1px solid #E8C5CA' }}
            >
              <Smartphone className="w-3 h-3" /> Coming Soon
            </span>

            <h2 className="font-serif text-4xl font-bold mb-4 leading-tight" style={{ color: '#2F2F33' }}>
              Passion Planner,<br />
              <span style={{ color: '#C97B84' }}>in your pocket.</span>
            </h2>

            <p className="text-base leading-relaxed mb-8" style={{ color: '#6D6A70' }}>
              The full wedding planning experience — coming to iOS and Android. Get push notifications for deadlines, manage your guest list on the go, and share updates with your partner in real time.
            </p>

            <ul className="space-y-3 mb-10">
              {[
                { icon: Bell,       text: 'Push notifications for upcoming deadlines & tasks' },
                { icon: Wifi,       text: 'Offline access — plan anywhere, sync when connected' },
                { icon: Smartphone, text: 'Native iOS & Android experience' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm" style={{ color: '#6D6A70' }}>
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#FDF0F1' }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: '#C97B84' }} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            {/* Store badges — coming soon */}
            <div className="flex flex-wrap gap-3">
              {/* App Store */}
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-xl border opacity-60 cursor-not-allowed select-none"
                style={{ borderColor: '#E8DDD3', backgroundColor: '#FAF7F4' }}
                title="Coming soon"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0" fill="#2F2F33">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <div className="text-[9px] font-medium uppercase tracking-wide" style={{ color: '#6D6A70' }}>Coming soon on</div>
                  <div className="text-sm font-semibold leading-tight" style={{ color: '#2F2F33' }}>App Store</div>
                </div>
              </div>

              {/* Google Play */}
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-xl border opacity-60 cursor-not-allowed select-none"
                style={{ borderColor: '#E8DDD3', backgroundColor: '#FAF7F4' }}
                title="Coming soon"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0" fill="#2F2F33">
                  <path d="M3.18 23.76c.3.17.64.24.99.2l12.49-7.19-2.7-2.7-10.78 9.69zm16.21-9.33L16.22 12l3.17-2.43L5.8.22C5.47.05 5.1-.02 4.75.01L15.54 10.8l3.85 3.63zm2.04-5.51c-.42-.25-.9-.25-1.32 0L17.84 11l-2.31-2.31L16.78 8l-1.25-1.24L3.18.24C2.9.07 2.55.02 2.24.18 1.5.58 1.5 1.66 1.5 1.66v20.68s0 1.08.74 1.48c.31.17.67.21 1 .06l13.16-7.63-1.25-1.24 1.25-.95 2.26 2.26 2.27-1.31c.42-.25.57-.78.32-1.2z"/>
                </svg>
                <div>
                  <div className="text-[9px] font-medium uppercase tracking-wide" style={{ color: '#6D6A70' }}>Coming soon on</div>
                  <div className="text-sm font-semibold leading-tight" style={{ color: '#2F2F33' }}>Google Play</div>
                </div>
              </div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center items-center">
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 rounded-[40px] blur-3xl opacity-20 scale-90" style={{ backgroundColor: '#C97B84' }} />

              {/* Phone shell */}
              <div
                className="relative w-52 rounded-[36px] border-[6px] shadow-2xl overflow-hidden"
                style={{ borderColor: '#2F2F33', backgroundColor: '#2F2F33', aspectRatio: '9/19' }}
              >
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full z-10" style={{ backgroundColor: '#2F2F33' }} />

                {/* Screen */}
                <div className="w-full h-full rounded-[30px] overflow-hidden" style={{ backgroundColor: '#FCF9F6' }}>
                  {/* Status bar */}
                  <div className="px-5 pt-7 pb-2 flex items-center justify-between">
                    <span className="text-[8px] font-semibold" style={{ color: '#2F2F33' }}>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-1.5 rounded-sm border" style={{ borderColor: '#2F2F33' }}>
                        <div className="w-2/3 h-full rounded-sm" style={{ backgroundColor: '#6D9E7F' }} />
                      </div>
                    </div>
                  </div>

                  {/* App header */}
                  <div className="px-4 pt-1 pb-3 flex items-center gap-2 border-b" style={{ borderColor: '#E8DDD3' }}>
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C97B84' }} />
                    <span className="text-[10px] font-semibold" style={{ color: '#2F2F33', fontFamily: 'serif' }}>Passion Planner</span>
                  </div>

                  {/* Skeleton content */}
                  <div className="px-4 py-3 space-y-3">
                    {/* Welcome */}
                    <div className="h-2.5 rounded-full w-3/4" style={{ backgroundColor: '#E8DDD3' }} />
                    <div className="h-2 rounded-full w-1/2" style={{ backgroundColor: '#F0E8E0' }} />

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {['#FDF0F1','#F0EFF8','#EFF5EE','#FDF0F1'].map((bg, i) => (
                        <div key={i} className="rounded-xl p-2.5" style={{ backgroundColor: bg }}>
                          <div className="h-1.5 rounded-full w-2/3 mb-1.5" style={{ backgroundColor: '#E8DDD3' }} />
                          <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: '#C97B84', opacity: 0.3 + i * 0.1 }} />
                        </div>
                      ))}
                    </div>

                    {/* List items */}
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl p-2" style={{ backgroundColor: '#F7F3EF' }}>
                        <div className="w-6 h-6 rounded-lg flex-shrink-0" style={{ backgroundColor: '#E8C5CA' }} />
                        <div className="flex-1 space-y-1">
                          <div className="h-1.5 rounded-full" style={{ backgroundColor: '#E8DDD3', width: `${60 + i * 15}%` }} />
                          <div className="h-1 rounded-full w-2/5" style={{ backgroundColor: '#F0E8E0' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coming soon badge on phone */}
              <div
                className="absolute -top-3 -right-4 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-md border"
                style={{ backgroundColor: '#C97B84', color: 'white', borderColor: '#B66A74' }}
              >
                Coming Soon
              </div>
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
