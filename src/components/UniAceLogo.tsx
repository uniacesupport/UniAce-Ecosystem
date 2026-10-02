import React from 'react';

interface UniAceLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  textClassName?: string;
  badgeClassName?: string;
  className?: string;
  subtitle?: string;
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6', img: 'w-6 h-6', text: 'text-sm', sub: 'text-[9px]' },
  sm: { box: 'w-8 h-8', img: 'w-8 h-8', text: 'text-base', sub: 'text-[10px]' },
  md: { box: 'w-10 h-10', img: 'w-10 h-10', text: 'text-xl', sub: 'text-xs' },
  lg: { box: 'w-12 h-12', img: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
  xl: { box: 'w-16 h-16', img: 'w-16 h-16', text: 'text-3xl', sub: 'text-sm' },
  '2xl': { box: 'w-24 h-24', img: 'w-24 h-24', text: 'text-4xl', sub: 'text-base' },
};

/**
 * UniAce Prestige Academic Emblem Logo
 * Features the luxury 3D faceted white graduation cap, gold tassel, and metallic bezel
 * on deep royal emerald medallion.
 */
export const UniAceLogo: React.FC<UniAceLogoProps> = ({
  size = 'md',
  showText = false,
  textClassName = '',
  badgeClassName = '',
  className = '',
  subtitle
}) => {
  const config = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Luxury 3D Circular Emblem */}
      <div 
        className={`relative ${config.box} rounded-full overflow-hidden shrink-0 ring-1 sm:ring-2 ring-amber-400/60 dark:ring-amber-400/80 shadow-md shadow-emerald-950/20 bg-emerald-950 ${badgeClassName}`}
      >
        <img
          src="/uniace-logo.jpg"
          alt="UniAce Academic Emblem"
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // High-fidelity SVG fallback if image path ever misses
            const target = e.currentTarget;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-amber-300 font-bold border-2 border-amber-400/80 rounded-full">
                  🎓
                </div>
              `;
            }
          }}
        />
        {/* Subtle glass reflection highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-slate-900 dark:text-white ${config.text} ${textClassName}`}>
              UniAce
            </span>
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 dark:border-amber-400/20">
              Mastery Hub
            </span>
          </div>
          {subtitle && (
            <p className={`font-medium text-slate-500 dark:text-zinc-400 ${config.sub}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UniAceLogo;
