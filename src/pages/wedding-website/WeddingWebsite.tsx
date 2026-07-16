import { useState, useEffect } from 'react';
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

// ── Section divider ───────────────────────────────────────────────────────────

function Divider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <div className="h-px flex-1 max-w-[80px]" style={{ background: color + '30' }} />
      <span style={{ color: color + '60' }} className="text-sm select-none">✦</span>
      <div className="h-px flex-1 max-w-[80px]" style={{ background: color + '30' }} />
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

function ProcessionalRoleCard({ role, color1 }: { role: WeddingWebsiteData['processional'][number]; color1: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8ddd3] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e8ddd3]" style={{ background: color1 + '0d' }}>
        <p style={{ fontFamily: 'Playfair Display, serif', color: color1 }} className="font-bold text-base">
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

      <WebsiteNav coupleName={coupleName} color1={color1} />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
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
            <p className="text-white/45 text-sm tracking-[0.3em] uppercase">{data.eventHashtag}</p>
          )}

          {/* Bottom ornament */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <div className="h-px w-12 bg-white/25" />
            <span className="text-white/30 text-sm">✦</span>
            <div className="h-px w-12 bg-white/25" />
          </div>
        </div>

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
            <p
              style={{ fontFamily: 'Playfair Display, serif', color: color1 }}
              className="text-center text-3xl font-bold mb-2"
            >
              The Wedding Day
            </p>
            <p className="text-center text-xs tracking-[0.25em] uppercase text-[#9a8c7e] mb-10">
              Save these details
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {data.churchAndAddress && (
                <div className="bg-white rounded-2xl p-7 text-center shadow-sm border border-[#e8ddd3] space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9a8c7e]">Ceremony</p>
                  {data.ceremonyTime && (
                    <p style={{ fontFamily: 'Playfair Display, serif', color: color1 }} className="text-3xl font-bold">
                      {fmt12h(data.ceremonyTime)}
                    </p>
                  )}
                  <p className="text-sm text-[#4a3f35] leading-relaxed">{data.churchAndAddress}</p>
                </div>
              )}
              {data.receptionVenue && (
                <div className="bg-white rounded-2xl p-7 text-center shadow-sm border border-[#e8ddd3] space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9a8c7e]">Reception</p>
                  {data.receptionStartTime && (
                    <p style={{ fontFamily: 'Playfair Display, serif', color: color1 }} className="text-3xl font-bold">
                      {fmt12h(data.receptionStartTime)}
                    </p>
                  )}
                  <p className="text-sm text-[#4a3f35] leading-relaxed">{data.receptionVenue}</p>
                </div>
              )}
            </div>

            {/* Extra details */}
            {(data.foodServiceType) && (
              <div className="flex justify-center gap-8 mt-6">
                {data.foodServiceType && (
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a8c7e] mb-1">Dining</p>
                    <p className="text-sm text-[#4a3f35]">{data.foodServiceType}</p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Processional ── */}
        {hasProcessional && (
          <>
            <Divider color={color1} />
            <section id="section-processional" className="py-14">
              <p
                style={{ fontFamily: 'Playfair Display, serif', color: color1 }}
                className="text-center text-3xl font-bold mb-2"
              >
                Processional
              </p>
              <p className="text-center text-xs tracking-[0.25em] uppercase text-[#9a8c7e] mb-10">
                Order of entrance
              </p>
              <div className="space-y-4">
                {(data.processional ?? []).map((role, i) => (
                  <ProcessionalRoleCard key={i} role={role} color1={color1} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Attire ── */}
        {showAttire && (
          <>
            <Divider color={color1} />
            <section id="section-attire" className="py-14">
              <p
                style={{ fontFamily: 'Playfair Display, serif', color: color1 }}
                className="text-center text-3xl font-bold mb-2"
              >
                What to Wear
              </p>
              <p className="text-center text-xs tracking-[0.25em] uppercase text-[#9a8c7e] mb-10">
                Dress code
              </p>

              <div className="space-y-4">
                {/* Default guest attire */}
                {(data.attire || hasAttire(data.guestAttire)) && (
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
                )}

                {/* Per-role attires */}
                {(data.roleAttires ?? []).filter(ra => hasAttire(ra.attire)).map((ra, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#e8ddd3] shadow-sm p-6 space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: color1 }}>
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
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Program Flow ── */}
        {hasProgramFlow && (
          <>
            <Divider color={color1} />
            <section id="section-program" className="py-14">
              <p
                style={{ fontFamily: 'Playfair Display, serif', color: color1 }}
                className="text-center text-3xl font-bold mb-2"
              >
                Program
              </p>
              <p className="text-center text-xs tracking-[0.25em] uppercase text-[#9a8c7e] mb-10">
                The order of events
              </p>

              <div className="space-y-10">
                {SECTIONS.map(sec => {
                  const items = programBySec[sec];
                  if (!items?.length) return null;
                  return (
                    <div key={sec}>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="h-px flex-1" style={{ background: color1 + '20' }} />
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: color1 }}>
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
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* ── Seating ── */}
        {hasSeating && (
          <>
            <Divider color={color1} />
            <section id="section-seating" className="py-14">
              <p
                style={{ fontFamily: 'Playfair Display, serif', color: color1 }}
                className="text-center text-3xl font-bold mb-2"
              >
                Find Your Seat
              </p>
              <p className="text-center text-xs tracking-[0.25em] uppercase text-[#9a8c7e] mb-10">
                Seating arrangement
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(data.seating ?? []).filter(t => t.guestNames.length > 0).map((table, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#e8ddd3] shadow-sm overflow-hidden">
                    {/* Table header */}
                    <div className="px-5 py-3 border-b border-[#e8ddd3]" style={{ background: color1 + '10' }}>
                      <p
                        style={{ fontFamily: 'Playfair Display, serif', color: color1 }}
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
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Theme & Motif ── */}
        {(data.theme || data.motifColors.length > 0) && (
          <>
            <Divider color={color1} />
            <section id="section-motif" className="py-14 text-center space-y-8">
              {data.theme && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9a8c7e] mb-2">Theme</p>
                  <p style={{ fontFamily: 'Playfair Display, serif', color: color1 }} className="text-2xl font-bold">
                    {data.theme}
                  </p>
                </div>
              )}

              {data.motifColors.length > 0 && (
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
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16" style={{ background: color1 + '30' }} />
          <span style={{ color: color1 + '50' }} className="text-sm">✦</span>
          <div className="h-px w-16" style={{ background: color1 + '30' }} />
        </div>

        {data.eventHashtag && (
          <p style={{ fontFamily: 'Playfair Display, serif', color: color1 }} className="text-3xl font-bold mb-2">
            {data.eventHashtag}
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
      </footer>
    </div>
  );
}
