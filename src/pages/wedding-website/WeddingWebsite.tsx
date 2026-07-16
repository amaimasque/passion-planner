import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronDown } from 'lucide-react';
import { db } from '../../firebase';
import type { WeddingWebsiteData, PublicAttireSet, PublicGuestAttire } from '../../types/weddingWebsite';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt12h(time: string) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function fmtDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

const SECTION_LABEL: Record<string, string> = {
  ceremony: 'Ceremony',
  cocktail: 'Cocktail Hour',
  reception: 'Reception',
};
const SECTIONS = ['ceremony', 'cocktail', 'reception'] as const;

function hasSet(a: PublicAttireSet) {
  return !!(a?.top || a?.bottom || a?.shoes);
}
function hasAttire(a: PublicGuestAttire) {
  return a?.genderSplit ? (hasSet(a.men) || hasSet(a.women)) : hasSet(a?.unisex);
}

// ── Hero sparkles ─────────────────────────────────────────────────────────────

const SPARKLE_CSS = `
  @keyframes floatSparkle {
    0%   { opacity: 0;   transform: translateY(0px)    scale(0.3); }
    15%  { opacity: 0.9; transform: translateY(-18px)  scale(1);   }
    70%  { opacity: 0.4; transform: translateY(-75px)  scale(0.75);}
    100% { opacity: 0;   transform: translateY(-120px) scale(0.2); }
  }
  .hero-sparkle { animation: floatSparkle ease-in-out infinite; border-radius: 50%; position: absolute; pointer-events: none; }
`;

const SPARKLES = [
  { left: '8%',  bottom: '18%', size: 3, dur: '4.2s',  del: '0s'   },
  { left: '20%', bottom: '32%', size: 2, dur: '5.1s',  del: '0.9s' },
  { left: '35%', bottom: '14%', size: 4, dur: '3.8s',  del: '1.6s' },
  { left: '50%', bottom: '42%', size: 2, dur: '4.7s',  del: '0.4s' },
  { left: '65%', bottom: '22%', size: 3, dur: '5.4s',  del: '1.3s' },
  { left: '80%', bottom: '36%', size: 2, dur: '4.0s',  del: '2.1s' },
  { left: '14%', bottom: '58%', size: 2, dur: '6.0s',  del: '0.6s' },
  { left: '76%', bottom: '52%', size: 3, dur: '5.0s',  del: '1.9s' },
  { left: '42%', bottom: '62%', size: 2, dur: '4.6s',  del: '2.6s' },
  { left: '58%', bottom: '68%', size: 3, dur: '3.9s',  del: '0.8s' },
  { left: '90%', bottom: '28%', size: 2, dur: '5.3s',  del: '3.2s' },
  { left: '28%', bottom: '75%', size: 2, dur: '4.4s',  del: '1.1s' },
];

// ── Scroll animation ──────────────────────────────────────────────────────────

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function FadeUp({ children, delay = 0, className = '' }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(28px)',
      }}
    >
      {children}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function FloralDivider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center py-5">
      <svg viewBox="0 0 320 52" className="w-64 sm:w-80 h-12" aria-hidden="true">
        {/* Left branch */}
        <line x1="0" y1="26" x2="108" y2="26" stroke={color} strokeWidth="0.6" opacity="0.35" />
        <ellipse cx="36"  cy="17" rx="14" ry="5"   fill={color} fillOpacity="0.18" transform="rotate(-28 36 17)"  />
        <ellipse cx="36"  cy="35" rx="14" ry="5"   fill={color} fillOpacity="0.11" transform="rotate(28 36 35)"   />
        <ellipse cx="66"  cy="15" rx="11" ry="4"   fill={color} fillOpacity="0.15" transform="rotate(-20 66 15)"  />
        <ellipse cx="66"  cy="37" rx="11" ry="4"   fill={color} fillOpacity="0.09" transform="rotate(20 66 37)"   />
        <ellipse cx="90"  cy="17" rx="8"  ry="3.5" fill={color} fillOpacity="0.12" transform="rotate(-14 90 17)"  />
        <ellipse cx="90"  cy="35" rx="8"  ry="3.5" fill={color} fillOpacity="0.07" transform="rotate(14 90 35)"   />
        {/* Center ornament */}
        <path d="M160 17 L167 26 L160 35 L153 26Z" fill={color} fillOpacity="0.32" />
        <circle cx="146" cy="26" r="2"   fill={color} fillOpacity="0.5"  />
        <circle cx="174" cy="26" r="2"   fill={color} fillOpacity="0.5"  />
        {/* Right branch (mirrored) */}
        <line x1="320" y1="26" x2="212" y2="26" stroke={color} strokeWidth="0.6" opacity="0.35" />
        <ellipse cx="284" cy="17" rx="14" ry="5"   fill={color} fillOpacity="0.18" transform="rotate(28 284 17)"  />
        <ellipse cx="284" cy="35" rx="14" ry="5"   fill={color} fillOpacity="0.11" transform="rotate(-28 284 35)" />
        <ellipse cx="254" cy="15" rx="11" ry="4"   fill={color} fillOpacity="0.15" transform="rotate(20 254 15)"  />
        <ellipse cx="254" cy="37" rx="11" ry="4"   fill={color} fillOpacity="0.09" transform="rotate(-20 254 37)" />
        <ellipse cx="230" cy="17" rx="8"  ry="3.5" fill={color} fillOpacity="0.12" transform="rotate(14 230 17)"  />
        <ellipse cx="230" cy="35" rx="8"  ry="3.5" fill={color} fillOpacity="0.07" transform="rotate(-14 230 35)" />
      </svg>
    </div>
  );
}

// ── Attire display ────────────────────────────────────────────────────────────

function AttireRow({ attire, label }: { attire: PublicAttireSet; label?: string }) {
  if (!hasSet(attire)) return null;
  return (
    <div>
      {label && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a8c7e] mb-2">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {(['top', 'bottom', 'shoes'] as const).map(f =>
          attire[f] ? (
            <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#e8ddd3] bg-white text-xs text-[#4a3f35]">
              <span className="text-[#9a8c7e] capitalize">{f}:</span>
              <span className="font-medium">{attire[f]}</span>
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}

// ── Color utilities ───────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const full = hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3');
  const n = parseInt(full, 16);
  let r = ((n >> 16) & 255) / 255;
  let g = ((n >> 8) & 255) / 255;
  let b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let hh = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hh = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hh = ((b - r) / d + 2) / 6;
    else hh = ((r - g) / d + 4) / 6;
  }
  return [hh * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return '#' + [h + 1 / 3, h, h - 1 / 3]
    .map(t => Math.round(hue2rgb(t) * 255).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Returns a version of `hex` that is readable as text on a light background.
 * If the color is too light (high lightness), it darkens it while preserving hue.
 */
function readableOnLight(hex: string): string {
  if (!hex || !/^#[0-9a-fA-F]{3,6}$/.test(hex)) return '#4a3f35';
  const [h, s, l] = hexToHsl(hex);
  return l > 55 ? hslToHex(h, Math.max(s, 30), 38) : hex;
}

// ── Sticky navigation ─────────────────────────────────────────────────────────

const NAV_LINKS = [
  { id: 'section-day', label: 'The Day' },
  { id: 'section-processional', label: 'Processional' },
  { id: 'section-attire', label: 'Attire' },
  { id: 'section-program', label: 'Program' },
  { id: 'section-seating', label: 'Seating' },
  { id: 'section-motif', label: 'Colors' },
];

function WebsiteNav({ coupleName, color1 }: { coupleName: string; color1: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
        <span
          style={{
            fontFamily: 'Playfair Display, serif',
            color: scrolled ? color1 : 'rgba(255,255,255,0.9)',
          }}
          className="font-bold text-sm truncate shrink-0 transition-colors duration-300"
        >
          {coupleName}
        </span>
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto">
          {NAV_LINKS.map(link => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-[9px] sm:text-[10px] font-semibold tracking-[0.15em] uppercase whitespace-nowrap px-2 py-1 rounded transition-colors duration-300"
              style={{ color: scrolled ? '#6b5e55' : 'rgba(255,255,255,0.65)' }}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ── Processional role card ────────────────────────────────────────────────────

function ProcessionalRoleCard({ role, color1, textColor1 }: { role: WeddingWebsiteData['processional'][number]; color1: string, textColor1: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8ddd3] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e8ddd3]" style={{ background: color1 + '0d' }}>
        <p style={{ fontFamily: 'Playfair Display, serif', color: textColor1 }} className="font-bold text-base">
          {role.name}
        </p>
        {role.subtitle && <p className="text-xs text-[#9a8c7e] mt-0.5">{role.subtitle}</p>}
        {role.remarks && <p className="text-xs text-[#b0a89f] mt-1 italic">{role.remarks}</p>}
      </div>

      {role.layout === 'paired' && role.pairs.length > 0 ? (
        <div className="px-5 py-3">
          {(role.leftLabel || role.rightLabel) && (
            <div className="grid grid-cols-2 gap-4 mb-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#9a8c7e]">{role.leftLabel}</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#9a8c7e]">{role.rightLabel}</p>
            </div>
          )}
          <div className="space-y-2">
            {role.pairs.map((pair, i) => (
              <div key={i} className="grid grid-cols-2 gap-4">
                <p className="text-sm text-[#4a3f35]">{pair.leftName}</p>
                <p className="text-sm text-[#4a3f35]">{pair.rightName}</p>
              </div>
            ))}
          </div>
          {role.pairs.some(p => p.remarks) && (
            <div className="mt-2 space-y-1">
              {role.pairs.filter(p => p.remarks).map((p, i) => (
                <p key={i} className="text-xs text-[#b0a89f] italic">{p.remarks}</p>
              ))}
            </div>
          )}
        </div>
      ) : role.members.length > 0 ? (
        <ul className="px-5 py-3 space-y-1.5">
          {role.members.map((m, i) => (
            <li key={i} className="flex items-start gap-2">
              <span style={{ color: color1 + '60' }} className="text-xs mt-0.5">✦</span>
              <div>
                <span className="text-sm text-[#4a3f35]">{m.name}</span>
                {m.remarks && <span className="text-xs text-[#9a8c7e] ml-2">— {m.remarks}</span>}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WeddingWebsite() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<WeddingWebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getDoc(doc(db, 'weddingWebsites', slug)).then(snap => {
      if (snap.exists()) setData(snap.data() as WeddingWebsiteData);
      else setNotFound(true);
      setLoading(false);
    });
  }, [slug]);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f4] flex flex-col items-center justify-center gap-5" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#c97b84]/20 border-t-[#c97b84] animate-spin" />
        {slug && slug.length < 50 && (
          <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl text-[#9a8c7e] tracking-wide">
            #{slug}
          </p>
        )}
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-[#faf7f4] flex items-center justify-center text-center px-6" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="space-y-3">
          <p className="text-4xl">💍</p>
          <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl text-[#2f2f33]">Wedding not found</p>
          <p className="text-sm text-[#9a8c7e] max-w-xs mx-auto">
            This wedding website may have been unpublished or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  // ── Derive colors ──────────────────────────────────────────────────────────

  const color1 = data.motifColors[0]?.hex ?? '#C97B84';
  const color2 = data.motifColors[1]?.hex ?? '#D9B382';
  // Readable version of color1 for text on the light page background
  const textColor1 = readableOnLight(color1);

  const programBySec = SECTIONS.reduce<Record<string, typeof data.programFlow>>((acc, s) => {
    acc[s] = (data.programFlow ?? []).filter(i => i.section === s);
    return acc;
  }, {} as Record<string, typeof data.programFlow>);
  const hasProgramFlow = (data.programFlow ?? []).length > 0;
  const hasSeating = (data.seating ?? []).some(t => t.guestNames.length > 0);
  const showAttire = hasAttire(data.guestAttire) || !!data.attire || (data.roleAttires ?? []).length > 0;
  const hasProcessional = (data.processional ?? []).length > 0;
  const groomDisplay = data.groomNickname || data.groomFirstName;
  const brideDisplay = data.brideNickname || data.brideFirstName;
  const coupleName = `${groomDisplay} & ${brideDisplay}`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#faf7f4]" style={{ fontFamily: 'Inter, sans-serif' }}>

      <WebsiteNav coupleName={coupleName} color1={textColor1} />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <style>{SPARKLE_CSS}</style>
      <section
        id="section-hero"
        className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden"
        style={
          data.heroPhotoUrl
            ? {
                backgroundImage: `url(${data.heroPhotoUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {
                background: `linear-gradient(135deg, ${color1}ee, ${color2}dd)`,
              }
        }
      >
        {/* Overlays */}
        {data.heroPhotoUrl && (
          <>
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 opacity-25" style={{ background: `linear-gradient(135deg, ${color1}, ${color2})` }} />
          </>
        )}

        {/* Content */}
        <div className="relative z-10 px-8 max-w-2xl mx-auto">
          {/* Top ornament */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px w-20 bg-white/30" />
            <span className="text-white/50 text-xs tracking-[0.5em] uppercase">We're Getting Married</span>
            <div className="h-px w-20 bg-white/30" />
          </div>

          {/* Names */}
          <h1
            style={{ fontFamily: 'Playfair Display, serif' }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.1] mb-3"
          >
            {groomDisplay}
          </h1>
          <p className="text-white/50 text-2xl mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            &amp;
          </p>
          <h1
            style={{ fontFamily: 'Playfair Display, serif' }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.1] mb-6"
          >
            {brideDisplay}
          </h1>

          {/* Full names */}
          {(data.groomLastName || data.brideLastName) && (
            <p className="text-white/50 text-xs tracking-[0.3em] uppercase mb-6">
              {[data.groomFirstName, data.groomLastName].filter(Boolean).join(' ')}
              &nbsp;·&nbsp;
              {[data.brideFirstName, data.brideLastName].filter(Boolean).join(' ')}
            </p>
          )}

          {/* Date */}
          {data.date && (
            <p className="text-white/85 text-lg font-light mb-3">{fmtDate(data.date)}</p>
          )}

          {/* Hashtag */}
          {data.eventHashtag && (
            <p className="text-white/45 text-sm tracking-[0.3em] uppercase">#{data.eventHashtag}</p>
          )}

          {/* Bottom ornament */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <div className="h-px w-12 bg-white/25" />
            <span className="text-white/30 text-sm">✦</span>
            <div className="h-px w-12 bg-white/25" />
          </div>
        </div>

        {/* Sparkle particles */}
        {SPARKLES.map((s, i) => (
          <div
            key={i}
            className="hero-sparkle"
            style={{
              left: s.left,
              bottom: s.bottom,
              width: s.size,
              height: s.size,
              background: i % 2 === 0
                ? (data.heroPhotoUrl ? 'rgba(255,255,255,0.7)' : color2 + 'cc')
                : (data.heroPhotoUrl ? 'rgba(255,255,255,0.5)' : color1 + 'cc'),
              animationDuration: s.dur,
              animationDelay: s.del,
            }}
          />
        ))}

        {/* Scroll arrow */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce">
          <ChevronDown className="w-5 h-5 text-white/40" />
        </div>
      </section>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-5">

        {/* ── Ceremony & Reception ── */}
        {(data.churchAndAddress || data.receptionVenue) && (
          <section id="section-day" className="py-16">
            <FadeUp>
              <p
                style={{ fontFamily: 'Playfair Display, serif', color: textColor1 }}
                className="text-center text-3xl font-bold mb-2"
              >
                The Wedding Day
              </p>
              <p className="text-center text-xs tracking-[0.25em] uppercase text-[#9a8c7e] mb-10">
                Save these details
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {data.churchAndAddress && (
                <FadeUp delay={100}>
                  <div className="bg-white rounded-2xl p-7 text-center shadow-sm border border-[#e8ddd3] space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9a8c7e]">Ceremony</p>
                    {data.ceremonyTime && (
                      <p style={{ fontFamily: 'Playfair Display, serif', color: textColor1 }} className="text-3xl font-bold">
                        {fmt12h(data.ceremonyTime)}
                      </p>
                    )}
                    <p className="text-sm text-[#4a3f35] leading-relaxed">{data.churchAndAddress}</p>
                  </div>
                </FadeUp>
              )}
              {data.receptionVenue && (
                <FadeUp delay={200}>
                  <div className="bg-white rounded-2xl p-7 text-center shadow-sm border border-[#e8ddd3] space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9a8c7e]">Reception</p>
                    {data.receptionStartTime && (
                      <p style={{ fontFamily: 'Playfair Display, serif', color: textColor1 }} className="text-3xl font-bold">
                        {fmt12h(data.receptionStartTime)}
                      </p>
                    )}
                    <p className="text-sm text-[#4a3f35] leading-relaxed">{data.receptionVenue}</p>
                  </div>
                </FadeUp>
              )}
            </div>

            {(data.foodServiceType) && (
              <FadeUp delay={300}>
                <div className="flex justify-center gap-8 mt-6">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a8c7e] mb-1">Dining</p>
                    <p className="text-sm text-[#4a3f35]">{data.foodServiceType}</p>
                  </div>
                </div>
              </FadeUp>
            )}
          </section>
        )}

        {/* ── Processional ── */}
        {hasProcessional && (
          <>
            <FloralDivider color={color1} />
            <section id="section-processional" className="py-14">
              <FadeUp>
                <p
                  style={{ fontFamily: 'Playfair Display, serif', color: textColor1 }}
                  className="text-center text-3xl font-bold mb-2"
                >
                  Processional
                </p>
                <p className="text-center text-xs tracking-[0.25em] uppercase text-[#9a8c7e] mb-10">
                  Order of entrance
                </p>
              </FadeUp>
              <div className="space-y-4">
                {(data.processional ?? []).map((role, i) => (
                  <FadeUp key={i} delay={i * 80}>
                    <ProcessionalRoleCard role={role} color1={color1} textColor1={textColor1} />
                  </FadeUp>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Attire ── */}
        {showAttire && (
          <>
            <FloralDivider color={color1} />
            <section id="section-attire" className="py-14">
              <FadeUp>
                <p
                  style={{ fontFamily: 'Playfair Display, serif', color: textColor1 }}
                  className="text-center text-3xl font-bold mb-2"
                >
                  What to Wear
                </p>
                <p className="text-center text-xs tracking-[0.25em] uppercase text-[#9a8c7e] mb-10">
                  Dress code
                </p>
              </FadeUp>

              <div className="space-y-4">
                {(data.attire || hasAttire(data.guestAttire)) && (
                  <FadeUp delay={100}>
                    <div className="bg-white rounded-2xl border border-[#e8ddd3] shadow-sm p-6 space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a8c7e]">Guests</p>
                      {data.attire && (
                        <p className="text-sm text-[#4a3f35]">{data.attire}</p>
                      )}
                      {hasAttire(data.guestAttire) && (
                        data.guestAttire.genderSplit ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <AttireRow attire={data.guestAttire.men} label="Men" />
                            <AttireRow attire={data.guestAttire.women} label="Women" />
                          </div>
                        ) : (
                          <AttireRow attire={data.guestAttire.unisex} />
                        )
                      )}
                    </div>
                  </FadeUp>
                )}

                {(data.roleAttires ?? []).filter(ra => hasAttire(ra.attire)).map((ra, i) => (
                  <FadeUp key={i} delay={(i + 2) * 80}>
                    <div className="bg-white rounded-2xl border border-[#e8ddd3] shadow-sm p-6 space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: textColor1 }}>
                        {ra.roleName}
                      </p>
                      {ra.attire.genderSplit ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <AttireRow attire={ra.attire.men} label="Men" />
                          <AttireRow attire={ra.attire.women} label="Women" />
                        </div>
                      ) : (
                        <AttireRow attire={ra.attire.unisex} />
                      )}
                    </div>
                  </FadeUp>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Program Flow ── */}
        {hasProgramFlow && (
          <>
            <FloralDivider color={color1} />
            <section id="section-program" className="py-14">
              <FadeUp>
                <p
                  style={{ fontFamily: 'Playfair Display, serif', color: textColor1 }}
                  className="text-center text-3xl font-bold mb-2"
                >
                  Program
                </p>
                <p className="text-center text-xs tracking-[0.25em] uppercase text-[#9a8c7e] mb-10">
                  The order of events
                </p>
              </FadeUp>

              <div className="space-y-10">
                {SECTIONS.map(sec => {
                  const items = programBySec[sec];
                  if (!items?.length) return null;
                  return (
                    <FadeUp key={sec}>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="h-px flex-1" style={{ background: color1 + '20' }} />
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: textColor1 }}>
                          {SECTION_LABEL[sec]}
                        </p>
                        <div className="h-px flex-1" style={{ background: color1 + '20' }} />
                      </div>

                      <div className="relative pl-6 border-l-2" style={{ borderColor: color1 + '25' }}>
                        <div className="space-y-5">
                          {items.map((item, i) => (
                            <div key={i} className="relative">
                              <div
                                className="absolute -left-[25px] top-[5px] w-3 h-3 rounded-full border-2 bg-[#faf7f4]"
                                style={{ borderColor: color1 }}
                              />
                              <div className="flex items-start gap-4">
                                {item.time && (
                                  <span className="text-xs text-[#9a8c7e] font-mono w-16 flex-shrink-0 pt-0.5 tabular-nums">
                                    {fmt12h(item.time)}
                                  </span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-[#2f2f33]">{item.title}</p>
                                  {item.description && (
                                    <p className="text-xs text-[#9a8c7e] mt-0.5 leading-relaxed">{item.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </FadeUp>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* ── Seating ── */}
        {hasSeating && (
          <>
            <FloralDivider color={color1} />
            <section id="section-seating" className="py-14">
              <FadeUp>
                <p
                  style={{ fontFamily: 'Playfair Display, serif', color: textColor1 }}
                  className="text-center text-3xl font-bold mb-2"
                >
                  Find Your Seat
                </p>
                <p className="text-center text-xs tracking-[0.25em] uppercase text-[#9a8c7e] mb-10">
                  Seating arrangement
                </p>
              </FadeUp>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(data.seating ?? []).filter(t => t.guestNames.length > 0).map((table, i) => (
                  <FadeUp key={i} delay={i * 60}>
                  <div className="bg-white rounded-2xl border border-[#e8ddd3] shadow-sm overflow-hidden">
                    {/* Table header */}
                    <div className="px-5 py-3 border-b border-[#e8ddd3]" style={{ background: color1 + '10' }}>
                      <p
                        style={{ fontFamily: 'Playfair Display, serif', color: textColor1 }}
                        className="font-bold text-sm"
                      >
                        {table.name}
                      </p>
                      {table.notes && (
                        <p className="text-xs text-[#9a8c7e] mt-0.5">{table.notes}</p>
                      )}
                    </div>
                    {/* Guests */}
                    <ul className="px-5 py-3 space-y-1.5">
                      {table.guestNames.map((name, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-[#4a3f35]">
                          <span style={{ color: color1 + '60' }} className="text-xs">✦</span>
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  </FadeUp>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Theme & Motif ── */}
        {(data.theme || data.motifColors.length > 0) && (
          <>
            <FloralDivider color={color1} />
            <section id="section-motif" className="py-14 text-center space-y-8">
              <FadeUp>
                {data.theme && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9a8c7e] mb-2">Theme</p>
                    <p style={{ fontFamily: 'Playfair Display, serif', color: textColor1 }} className="text-2xl font-bold">
                      {data.theme}
                    </p>
                  </div>
                )}
              </FadeUp>

              {data.motifColors.length > 0 && (
                <FadeUp delay={100}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9a8c7e] mb-5">
                      Our Motif Colors
                    </p>
                    <div className="flex items-center justify-center gap-5 flex-wrap">
                      {data.motifColors.map((c, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <div
                            className="w-14 h-14 rounded-full shadow-md ring-4 ring-white"
                            style={{ background: c.hex }}
                          />
                          {c.name && <span className="text-xs text-[#9a8c7e]">{c.name}</span>}
                          <span className="text-[10px] text-[#b0a89f] font-mono">{c.hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeUp>
              )}
            </section>
          </>
        )}

      </div>

      {/* ── FOOTER ── */}
      <footer
        className="mt-8 py-16 text-center px-6"
        style={{ background: `linear-gradient(to bottom, transparent, ${color1}12)` }}
      >
        <FadeUp>
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16" style={{ background: color1 + '30' }} />
          <span style={{ color: color1 + '50' }} className="text-sm">✦</span>
          <div className="h-px w-16" style={{ background: color1 + '30' }} />
        </div>

        {data.eventHashtag && (
          <p style={{ fontFamily: 'Playfair Display, serif', color: textColor1 }} className="text-3xl font-bold mb-2">
            #{data.eventHashtag}
          </p>
        )}

        <p className="text-sm text-[#9a8c7e] mb-1">
          {[data.groomFirstName, data.groomLastName].filter(Boolean).join(' ')}
          {' & '}
          {[data.brideFirstName, data.brideLastName].filter(Boolean).join(' ')}
        </p>
        {data.date && (
          <p className="text-xs text-[#b0a89f]">{fmtDate(data.date)}</p>
        )}

        <p className="text-[11px] text-[#c4bbb4] mt-8">Planned with ♡ using Passion Planner</p>
        </FadeUp>
      </footer>
    </div>
  );
}
