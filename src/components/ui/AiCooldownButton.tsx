import { useEffect, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { getSecondsRemaining, stampCooldown } from '../../services/geminiEstimator';

const COOLDOWN = 60;
const SIZE = 16;
const STROKE = 1.5;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAiCooldown(feature: string) {
  const [cooldown, setCooldown] = useState(() => getSecondsRemaining(feature));

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      const rem = getSecondsRemaining(feature);
      setCooldown(rem);
      if (rem <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [feature, cooldown]);

  function stamp() {
    stampCooldown(feature);
    setCooldown(COOLDOWN);
  }

  return { cooldown, stamp };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  cooldown: number;
  label: string;
  loadingLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  onClick: () => void;
}

export default function AiCooldownButton({
  cooldown,
  label,
  loadingLabel = 'Generating…',
  isLoading = false,
  disabled = false,
  size = 'sm',
  onClick,
}: Props) {
  const isCooling = cooldown > 0;
  const isDisabled = disabled || isCooling || isLoading;
  const progress = isCooling ? (COOLDOWN - cooldown) / COOLDOWN : 1;
  const dashoffset = CIRCUMFERENCE * (1 - progress);

  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-xs gap-1.5' : 'px-4 py-2 text-sm gap-2';

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={isCooling ? `Available in ${cooldown}s` : label}
      className={[
        'inline-flex items-center font-semibold rounded-xl',
        'text-brand-primary bg-brand-primary/8 hover:bg-brand-primary/15',
        'transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed',
        sizeClasses,
      ].join(' ')}
    >
      {/* Icon: spinner / ring / wand */}
      <span className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
        {isLoading ? (
          <span
            className="absolute inset-0 rounded-full border border-brand-primary border-t-transparent animate-spin"
          />
        ) : isCooling ? (
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="absolute inset-0"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={STROKE}
            />
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none" stroke="currentColor" strokeWidth={STROKE}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
        ) : (
          <Wand2 className="absolute inset-0 w-4 h-4" />
        )}
      </span>

      <span>{isLoading ? loadingLabel : isCooling ? `${cooldown}s` : label}</span>
    </button>
  );
}
