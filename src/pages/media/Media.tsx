import { useState, useEffect } from 'react';
import { Image, Upload, Globe, QrCode, Gift, Video, Sparkles, Clock, CalendarDays, ExternalLink, Copy, Check, RefreshCw } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useWeddingDetails } from '../../hooks/useWeddingDetails';
import { useProgramFlow } from '../../hooks/useProgramFlow';
import { useSeating } from '../../hooks/useSeating';
import { useAttire, EMPTY_ROLE_ATTIRE } from '../../hooks/useAttire';
import { useGuests } from '../../hooks/useGuests';
import { useProcessional } from '../../hooks/useProcessional';
import { guestDisplayName } from '../../types/guest';
import type { WeddingWebsiteData } from '../../types/weddingWebsite';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(hashtag: string, fallback: string): string {
  const cleaned = hashtag.replace(/^#/, '').trim().replace(/\s+/g, '').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
  return cleaned || fallback;
}

function fmtPublishedAt(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ── Coming-soon feature definitions ──────────────────────────────────────────

const FEATURES = [
  {
    icon: Upload,
    label: 'Wedding Logo',
    description: 'Upload your custom wedding monogram or logo. Used across invitations, menus, and printed materials.',
    preview: (
      <div className="flex flex-col items-center justify-center gap-3 h-full">
        <div className="w-20 h-20 rounded-full border-2 border-dashed border-app-border flex items-center justify-center">
          <Upload className="w-8 h-8 text-app-border" />
        </div>
        <div className="space-y-1.5 w-full max-w-[140px]">
          <div className="h-2 rounded-full bg-app-border w-full" />
          <div className="h-2 rounded-full bg-app-border w-3/4 mx-auto" />
        </div>
      </div>
    ),
  },
  {
    icon: Image,
    label: 'Photo Gallery',
    description: 'Upload and organize your engagement photos, pre-nuptial shots, and wedding day pictures.',
    preview: (
      <div className="grid grid-cols-3 gap-1.5 p-1">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className={`rounded-lg bg-app-border aspect-square ${i === 4 ? 'scale-105' : 'opacity-60'}`}
          />
        ))}
      </div>
    ),
  },
  {
    icon: Sparkles,
    label: 'Digital Invitation',
    description: 'Design and share a beautiful animated digital invitation with your wedding theme and motif colors.',
    preview: (
      <div className="flex flex-col items-center gap-2">
        <div className="w-28 rounded-xl border border-app-border bg-app-bg overflow-hidden shadow-sm">
          <div className="h-10 bg-brand-primary/20" />
          <div className="p-2 space-y-1">
            <div className="h-2 rounded-full bg-app-border w-full" />
            <div className="h-2 rounded-full bg-app-border w-4/5 mx-auto" />
            <div className="h-2 rounded-full bg-app-border w-3/5 mx-auto" />
            <div className="mt-2 h-5 rounded-lg bg-brand-primary/30" />
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Clock,
    label: 'Save the Date',
    description: 'Send a digital "Save the Date" card to your guests weeks before the formal invitation goes out.',
    preview: (
      <div className="flex flex-col items-center gap-2">
        <div className="w-36 rounded-xl border border-app-border bg-app-bg p-3 shadow-sm text-center space-y-1">
          <div className="h-2 rounded-full bg-brand-primary/30 w-3/4 mx-auto" />
          <div className="h-6 rounded-lg bg-app-border w-full" />
          <div className="h-2 rounded-full bg-app-border w-1/2 mx-auto" />
          <div className="h-2 rounded-full bg-app-border w-2/3 mx-auto" />
        </div>
      </div>
    ),
  },
  {
    icon: QrCode,
    label: 'Table QR Menus',
    description: 'Generate QR codes for each table linking to your digital menu. Perfect for paperless receptions.',
    preview: (
      <div className="flex items-center justify-center gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex flex-col items-center gap-1 ${i === 1 ? 'scale-110' : 'opacity-50'}`}>
            <div className="w-12 h-12 rounded-lg border border-app-border grid grid-cols-3 gap-0.5 p-1">
              {[...Array(9)].map((_, j) => (
                <div key={j} className={`rounded-sm ${[0,2,6,8,4].includes(j) ? 'bg-ink' : 'bg-transparent'}`} />
              ))}
            </div>
            <div className="h-1.5 w-10 rounded-full bg-app-border" />
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Gift,
    label: 'Gift Registry',
    description: 'Link your gift registry or wishlist so guests can easily find and purchase meaningful gifts.',
    preview: (
      <div className="space-y-1.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-app-border bg-app-bg">
            <div className="w-6 h-6 rounded bg-app-border flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-1.5 rounded-full bg-app-border w-3/4" />
              <div className="h-1.5 rounded-full bg-app-border w-1/2" />
            </div>
            <div className="w-8 h-4 rounded bg-brand-primary/20 flex-shrink-0" />
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Video,
    label: 'Video Highlights',
    description: 'Upload your SDE (Same Day Edit) and wedding video highlights to relive and share your special day.',
    preview: (
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-36 aspect-video rounded-lg border border-app-border bg-app-border overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
              <Video className="w-4 h-4 text-ink-muted" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

// ── Pexels helper ─────────────────────────────────────────────────────────────

async function fetchPexelsHeroPhoto(theme: string, motifNames: string[]): Promise<string> {
  const key = process.env.REACT_APP_PEXELS_API_KEY;
  if (!key) return '';
  const terms = [theme, ...motifNames, 'wedding'].filter(Boolean).join(' ') || 'elegant wedding';
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(terms)}&per_page=1&orientation=landscape&size=large`,
      { headers: { Authorization: key } },
    );
    const json = await res.json();
    return json.photos?.[0]?.src?.large2x ?? '';
  } catch {
    return '';
  }
}

// ── Wedding Website section ───────────────────────────────────────────────────

function hasSet(a: { top: string; bottom: string; shoes: string }) {
  return !!(a.top || a.bottom || a.shoes);
}

function WeddingWebsiteSection() {
  const { currentUser } = useAuth();
  const { details, loading: detailsLoading } = useWeddingDetails();
  const { items: programItems, loading: programLoading } = useProgramFlow();
  const { tables, loading: seatingLoading } = useSeating();
  const { data: attireData, loading: attireLoading } = useAttire();
  const { guests, loading: guestsLoading } = useGuests();
  const { roles: processionalRoles, loading: processionalLoading } = useProcessional();

  const [published, setPublished] = useState<WeddingWebsiteData | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  const slug = currentUser ? toSlug(details.eventHashtag, currentUser.uid) : '';
  const websiteUrl = slug ? `${window.location.origin}/wedding/${slug}` : '';

  useEffect(() => {
    if (!slug) return;
    const ref = doc(db, 'weddingWebsites', slug);
    const unsub = onSnapshot(ref, snap => {
      setPublished(snap.exists() ? (snap.data() as WeddingWebsiteData) : null);
    });
    return unsub;
  }, [slug]);

  async function handlePublish() {
    if (!currentUser || !slug) return;
    setPublishing(true);
    try {
      // Resolve seating: replace guestIds with display names
      const resolvedSeating = tables
        .filter(t => t.guestIds.length > 0)
        .map(t => ({
          name: t.name,
          notes: t.notes,
          guestNames: t.guestIds
            .map(id => guests.find(g => g.id === id))
            .filter((g): g is NonNullable<typeof g> => !!g)
            .map(g => guestDisplayName(g)),
        }));

      // Default guest attire snapshot
      const ra = { ...EMPTY_ROLE_ATTIRE, ...attireData.defaultGuestAttire };
      const guestAttire = {
        genderSplit: ra.genderSplit,
        unisex:  { top: ra.unisex.top  || '', bottom: ra.unisex.bottom  || '', shoes: ra.unisex.shoes  || '' },
        men:     { top: ra.men.top     || '', bottom: ra.men.bottom     || '', shoes: ra.men.shoes     || '' },
        women:   { top: ra.women.top   || '', bottom: ra.women.bottom   || '', shoes: ra.women.shoes   || '' },
      };

      // Per-role attires (from Attire page)
      const roleAttires = processionalRoles
        .map(role => {
          const r = { ...EMPTY_ROLE_ATTIRE, ...(attireData.roleAttire[role.id] ?? {}) };
          const anySet = r.genderSplit
            ? (hasSet(r.men) || hasSet(r.women))
            : hasSet(r.unisex);
          if (!anySet) return null;
          return {
            roleName: role.name,
            attire: {
              genderSplit: r.genderSplit,
              unisex: { top: r.unisex.top || '', bottom: r.unisex.bottom || '', shoes: r.unisex.shoes || '' },
              men:    { top: r.men.top    || '', bottom: r.men.bottom    || '', shoes: r.men.shoes    || '' },
              women:  { top: r.women.top  || '', bottom: r.women.bottom  || '', shoes: r.women.shoes  || '' },
            },
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      // Processional with resolved guest names
      const resolvedProcessional = processionalRoles
        .map(role => {
          const members = role.members
            .map(m => {
              const g = m.guestId ? guests.find(g => g.id === m.guestId) : undefined;
              return { name: g ? guestDisplayName(g) : m.name, remarks: m.remarks };
            })
            .filter(m => m.name);
          const pairs = role.pairs
            .map(p => {
              const lg = p.leftGuestId  ? guests.find(g => g.id === p.leftGuestId)  : undefined;
              const rg = p.rightGuestId ? guests.find(g => g.id === p.rightGuestId) : undefined;
              return {
                leftName:  lg ? guestDisplayName(lg) : p.leftName,
                rightName: rg ? guestDisplayName(rg) : p.rightName,
                remarks: p.remarks,
              };
            })
            .filter(p => p.leftName || p.rightName);
          if (!members.length && !pairs.length) return null;
          return {
            name: role.name, subtitle: role.subtitle, remarks: role.remarks,
            layout: role.layout, leftLabel: role.leftLabel, rightLabel: role.rightLabel,
            members, pairs,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      // Pexels hero photo
      const motifNames = details.motifColors.map(c => c.name).filter(Boolean);
      const heroPhotoUrl = await fetchPexelsHeroPhoto(details.theme, motifNames);

      const data: WeddingWebsiteData = {
        uid: currentUser.uid,
        slug,
        groomFirstName: details.groom.firstName,
        groomLastName: details.groom.lastName,
        groomNickname: details.groom.nickname || '',
        brideFirstName: details.bride.firstName,
        brideLastName: details.bride.lastName,
        brideNickname: details.bride.nickname || '',
        date: details.date,
        ceremonyTime: details.ceremonyTime,
        churchAndAddress: details.churchAndAddress,
        receptionVenue: details.receptionVenue,
        receptionStartTime: details.receptionStartTime,
        motifColors: details.motifColors,
        theme: details.theme,
        eventHashtag: details.eventHashtag,
        attire: details.attire,
        guestAttire,
        roleAttires,
        foodServiceType: details.foodServiceType,
        programFlow: programItems.map(({ time, title, description, section }) => ({
          time, title, section,
          ...(description ? { description } : {}),
        })),
        processional: resolvedProcessional,
        seating: resolvedSeating,
        heroPhotoUrl,
        publishedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'weddingWebsites', slug), data);
    } finally {
      setPublishing(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(websiteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const loading = detailsLoading || programLoading || seatingLoading || attireLoading || guestsLoading;

  return (
    <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-app-border bg-brand-primary/4">
        <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
          <Globe className="w-4.5 h-4.5 text-brand-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">Wedding Website</p>
          <p className="text-xs text-ink-muted">A public page with your wedding details, motif, and program</p>
        </div>
        {published && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-positive bg-positive/10 px-2 py-1 rounded-full flex-shrink-0">
            <Check className="w-3 h-3" /> Published
          </span>
        )}
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* URL bar */}
        <div className="flex items-center gap-2 bg-app-bg border border-app-border rounded-xl px-3 py-2">
          <span className="text-xs text-ink-muted flex-shrink-0">🔗</span>
          <span className="flex-1 text-xs text-ink font-mono truncate min-w-0">{websiteUrl}</span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!websiteUrl}
            className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors flex-shrink-0 px-2 py-1 rounded-lg hover:bg-app-border/40"
          >
            {copied ? <Check className="w-3 h-3 text-positive" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${publishing ? 'animate-spin' : ''}`} />
            {publishing ? 'Publishing…' : published ? 'Update Website' : 'Publish Website'}
          </button>
          {published && (
            <a
              href={`/wedding/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-app-border text-xs font-medium text-ink hover:bg-app-bg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Website
            </a>
          )}
        </div>

        {/* Published info */}
        {published?.publishedAt && (
          <p className="text-[11px] text-ink-muted">
            Last published {fmtPublishedAt(published.publishedAt)}
          </p>
        )}

        {/* Templates note */}
        <div className="flex items-center gap-2 bg-caution/5 border border-caution/20 rounded-xl px-3 py-2.5">
          <Clock className="w-3.5 h-3.5 text-caution flex-shrink-0" />
          <p className="text-xs text-ink-muted">
            <span className="font-medium text-caution">Templates coming soon</span> — custom themes and layouts are in development.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Media() {
  return (
    <div className="bg-app-bg font-sans min-h-screen">

      {/* Header */}
      <header className="bg-app-surface border-b border-app-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image className="text-brand-primary w-5 h-5" />
            <span className="font-serif text-lg font-semibold text-ink tracking-wide">Media &amp; Branding</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caution/10 text-caution text-xs font-semibold">
            <Clock className="w-3 h-3" /> Most features coming soon
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Intro banner */}
        <div className="relative overflow-hidden bg-app-surface border border-app-border rounded-2xl px-6 py-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-brand-primary" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink mb-2">Your Wedding, Your Brand</h1>
          <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
            Publish your wedding website now. Upload your logo, manage photos, share digital invitations, and more — coming soon.
          </p>
        </div>

        {/* Live: Wedding Website */}
        <WeddingWebsiteSection />

        {/* Coming-soon feature cards grid */}
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-4">Coming Soon</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, label, description, preview }) => (
              <div
                key={label}
                className="group bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm flex flex-col"
              >
                {/* Preview area */}
                <div className="relative h-36 bg-app-bg flex items-center justify-center p-4 overflow-hidden border-b border-app-border">
                  {preview}
                  <div className="absolute inset-0 backdrop-blur-[3px] bg-app-bg/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-caution/10 border border-caution/20 text-caution text-[11px] font-semibold">
                      <Clock className="w-3 h-3" /> Coming Soon
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-caution/10 text-caution text-[10px] font-medium">
                      <Clock className="w-2.5 h-2.5" /> Soon
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-brand-primary" />
                    </div>
                    <p className="text-sm font-semibold text-ink">{label}</p>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
                </div>

                <div className="px-4 pb-4">
                  <div className="w-full py-2 rounded-xl border border-app-border text-xs text-ink-muted text-center cursor-not-allowed select-none">
                    Available soon
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Year Glance partner promo */}
        <div className="bg-app-surface border border-brand-primary/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-brand-primary/8 px-6 py-3 border-b border-brand-primary/20 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
            <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider">Recommended Tool</span>
          </div>
          <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-6 h-6 text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink mb-0.5">Year Glance — Calendar Planner</p>
              <p className="text-xs text-ink-muted leading-relaxed">
                Need to plan your wedding timeline across the year? Year Glance gives you a beautiful year-at-a-glance calendar to map out every event, milestone, and deadline at a glance.
              </p>
            </div>
            <a
              href="https://app.yearglance.com/auth/register?ref=emmanuelsantos010242"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-xs font-semibold rounded-xl hover:bg-brand-hover transition-colors whitespace-nowrap flex-shrink-0"
            >
              Open Year Glance <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-ink-muted pb-4">
          More features are on the way. Stay tuned!
        </p>
      </div>
    </div>
  );
}
