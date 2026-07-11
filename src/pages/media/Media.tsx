import { Image, Upload, Globe, QrCode, Gift, Video, Sparkles, Clock, CalendarDays, ExternalLink } from 'lucide-react';

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
    icon: Globe,
    label: 'Wedding Website',
    description: 'Generate a personalized wedding website with your story, venue map, schedule, and RSVP integration.',
    preview: (
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-40 rounded-lg border border-app-border bg-app-bg overflow-hidden shadow-sm">
          <div className="flex items-center gap-1 px-2 py-1 border-b border-app-border bg-app-surface">
            <div className="flex gap-0.5">
              {[...Array(3)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-app-border" />)}
            </div>
            <div className="flex-1 h-2 rounded-full bg-app-border mx-1" />
          </div>
          <div className="p-2 space-y-1">
            <div className="h-8 rounded bg-brand-primary/20" />
            <div className="h-1.5 rounded-full bg-app-border w-full" />
            <div className="h-1.5 rounded-full bg-app-border w-4/5" />
          </div>
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
            <Clock className="w-3 h-3" /> Coming Soon
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Intro banner */}
        <div className="relative overflow-hidden bg-app-surface border border-app-border rounded-2xl px-6 py-8 text-center shadow-sm">
          <div className="absolute inset-0 pointer-events-none opacity-5"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--tw-gradient-from) 0%, transparent 70%)' }}
          />
          <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-brand-primary" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink mb-2">Your Wedding, Your Brand</h1>
          <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
            These features are in development and will be available soon. Upload your logo, manage photos, share digital invitations, and more — all in one place.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, label, description, preview }) => (
            <div
              key={label}
              className="group bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm flex flex-col"
            >
              {/* Preview area */}
              <div className="relative h-36 bg-app-bg flex items-center justify-center p-4 overflow-hidden border-b border-app-border">
                {preview}
                {/* Blur + coming soon overlay */}
                <div className="absolute inset-0 backdrop-blur-[3px] bg-app-bg/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-caution/10 border border-caution/20 text-caution text-[11px] font-semibold">
                    <Clock className="w-3 h-3" /> Coming Soon
                  </span>
                </div>
                {/* Always-visible soft badge */}
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

              {/* Locked CTA */}
              <div className="px-4 pb-4">
                <div className="w-full py-2 rounded-xl border border-app-border text-xs text-ink-muted text-center cursor-not-allowed select-none">
                  Available soon
                </div>
              </div>
            </div>
          ))}
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
