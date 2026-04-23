// @ts-nocheck
// Concatenated from the Claude Design prototype. Types are intentionally disabled
// here to preserve the original design 1:1 — incrementally tighten later.

import * as ReactNS from 'react';
const React = ReactNS;
import { api } from './api';

// Map UI category id → backend occasion key (modules/style_picker/catalog.py)
const CATEGORY_TO_OCCASION = {
  islamic: 'eid_al_fitr',
  celebration: 'birthday',
  seasonal: 'new_year',
  motivational: 'motivational',
  wedding: 'wedding',
  custom: 'custom',
};
const occasionFor = (category) => CATEGORY_TO_OCCASION[category] || 'custom';

const IMAGE_MODEL = 'imagen-3.0-generate-001';

const TWEAK_DEFAULTS = { theme: 'indigo', accentColor: '#E8C86A', fontScale: 13 };

// lawha-components.jsx — Shared UI primitives for Lawha

// ── Design Tokens ─────────────────────────────────────────────
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8C86A';
const GOLD_DIM = 'rgba(201,168,76,0.55)';
const TEXT_PRIMARY = '#EEE8D8';
const TEXT_SECONDARY = '#8A7FA0';
const TEXT_MUTED = '#4A445A';
const SURFACE = '#0D0B27';
const SURFACE_2 = '#141135';
const SURFACE_3 = '#1A1840';
const BORDER_GOLD = 'rgba(201,168,76,0.18)';
const BORDER_SUBTLE = 'rgba(255,255,255,0.05)';

// ── Wordmark ──────────────────────────────────────────────────
function LawhaWordmark({ scale = 1 }) {
  const w = 148 * scale, h = 38 * scale;
  return (
    <svg width={w} height={h} viewBox="0 0 148 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Diamond geometric mark */}
      <polygon points="15,2 25,12 15,22 5,12" fill="none" stroke={GOLD} strokeWidth="1.4"/>
      <polygon points="15,6 21,12 15,18 9,12" fill="none" stroke={GOLD} strokeWidth="0.5" opacity="0.4"/>
      <circle cx="15" cy="12" r="2.2" fill={GOLD}/>
      {/* Cross lines */}
      <line x1="15" y1="4.5" x2="15" y2="19.5" stroke={GOLD} strokeWidth="0.5" opacity="0.35"/>
      <line x1="7.5" y1="12" x2="22.5" y2="12" stroke={GOLD} strokeWidth="0.5" opacity="0.35"/>
      {/* LAWHA text */}
      <text x="33" y="18" fontFamily="Cinzel, serif" fontSize={14 * scale} fontWeight="600" fill={TEXT_PRIMARY} letterSpacing="5">LAWHA</text>
      {/* Arabic subtitle */}
      <text x="34" y="32" fontFamily="Amiri, serif" fontSize={11 * scale} fill={GOLD} opacity="0.72">لوحة</text>
    </svg>
  );
}

// ── Top Nav ───────────────────────────────────────────────────
const STEP_LABELS = ['Topic', 'Discover', 'Style', 'Refine', 'Variants', 'Animate', 'Share'];

function TopNav({ screenIndex, onBack, topic }) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', height: 62,
      borderBottom: `1px solid ${BORDER_GOLD}`,
      background: 'rgba(6,4,26,0.96)',
      backdropFilter: 'blur(16px)',
      position: 'sticky', top: 0, zIndex: 200, flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 120 }}>
        {screenIndex > 0 && (
          <button onClick={onBack} style={{
            background: 'transparent', border: `1px solid ${BORDER_GOLD}`,
            borderRadius: 8, color: TEXT_SECONDARY, padding: '6px 12px',
            cursor: 'pointer', fontSize: 12, fontFamily: 'Inter,sans-serif',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5
          }}>
            ← Back
          </button>
        )}
        <LawhaWordmark scale={0.78} />
      </div>

      <StepProgress current={screenIndex} total={7} labels={STEP_LABELS} />

      <div style={{ minWidth: 120, display: 'flex', justifyContent: 'flex-end' }}>
        {topic && (
          <div style={{
            padding: '4px 12px', borderRadius: 20,
            background: 'rgba(201,168,76,0.08)', border: `1px solid ${BORDER_GOLD}`,
            fontSize: 11, color: GOLD_DIM, maxWidth: 140,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'Inter,sans-serif'
          }}>{topic}</div>
        )}
      </div>
    </nav>
  );
}

// ── Step Progress ─────────────────────────────────────────────
function StepProgress({ current, total, labels }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current, active = i === current;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: active ? 26 : 8, height: 8, borderRadius: 4,
                background: done ? GOLD_DIM : active ? GOLD : 'rgba(201,168,76,0.15)',
                transition: 'all 0.3s ease'
              }}/>
              {labels && active && (
                <span style={{ fontSize: 9, color: GOLD, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>
                  {labels[i]}
                </span>
              )}
            </div>
            {i < total - 1 && (
              <div style={{ width: 18, height: 1, background: done ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.08)', marginBottom: labels && active ? 12 : 0 }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Gold Button ───────────────────────────────────────────────
function GoldButton({ children, onClick, variant = 'solid', size = 'md', disabled, icon, style: xStyle }) {
  const [hover, setHover] = React.useState(false);
  const pad = { sm: '7px 16px', md: '11px 24px', lg: '15px 36px' }[size] || '11px 24px';
  const fs = { sm: 12, md: 14, lg: 15 }[size] || 14;
  let btnStyle;
  if (variant === 'solid') btnStyle = {
    background: disabled ? GOLD_DIM : hover ? GOLD_LIGHT : GOLD,
    color: '#06041A', border: 'none',
    boxShadow: hover && !disabled ? '0 4px 22px rgba(201,168,76,0.38)' : '0 2px 10px rgba(201,168,76,0.16)'
  };
  else if (variant === 'outline') btnStyle = {
    background: hover ? 'rgba(201,168,76,0.1)' : 'transparent',
    color: hover ? GOLD_LIGHT : GOLD,
    border: `1px solid ${hover ? GOLD : BORDER_GOLD}`,
    boxShadow: hover ? '0 0 18px rgba(201,168,76,0.12)' : 'none'
  };
  else btnStyle = {
    background: hover ? 'rgba(255,255,255,0.05)' : 'transparent',
    color: hover ? TEXT_PRIMARY : TEXT_SECONDARY,
    border: `1px solid ${hover ? 'rgba(255,255,255,0.12)' : BORDER_SUBTLE}`,
    boxShadow: 'none'
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...btnStyle, padding: pad, fontSize: fs,
        borderRadius: 10, fontFamily: 'Inter,sans-serif', fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.2s ease',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        ...xStyle
      }}
    >{icon && <span style={{ fontSize: fs + 1 }}>{icon}</span>}{children}</button>
  );
}

// ── Tag Chip ──────────────────────────────────────────────────
function TagChip({ label, color = 'gold', size = 'sm', onClick, selected }) {
  const C = {
    gold: { bg: 'rgba(201,168,76,0.12)', bd: 'rgba(201,168,76,0.28)', tx: GOLD },
    purple: { bg: 'rgba(107,79,168,0.15)', bd: 'rgba(107,79,168,0.3)', tx: '#B09FD8' },
    muted: { bg: 'rgba(255,255,255,0.04)', bd: BORDER_SUBTLE, tx: TEXT_SECONDARY },
    green: { bg: 'rgba(76,168,100,0.12)', bd: 'rgba(76,168,100,0.25)', tx: '#7DC898' },
    pink: { bg: 'rgba(232,123,168,0.12)', bd: 'rgba(232,123,168,0.25)', tx: '#E87BA8' },
  }[color] || { bg: 'rgba(201,168,76,0.12)', bd: 'rgba(201,168,76,0.28)', tx: GOLD };
  const pad = size === 'sm' ? '3px 10px' : '5px 14px';
  const fs = size === 'sm' ? 11 : 13;
  return (
    <span onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', padding: pad,
      borderRadius: 20, fontSize: fs, fontFamily: 'Inter,sans-serif', fontWeight: 500,
      background: selected ? C.bg : 'rgba(255,255,255,0.03)',
      border: `1px solid ${selected ? C.bd : BORDER_SUBTLE}`,
      color: selected ? C.tx : TEXT_SECONDARY,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s', userSelect: 'none', whiteSpace: 'nowrap'
    }}>{label}</span>
  );
}

// ── Occasion Card Preview ─────────────────────────────────────
const CARD_CONFIGS = [
  { id: 1, bg: ['#0D0A2E','#2A1060'], textAr: 'عيد مبارك', textEn: 'Eid Mubarak', accent: '#C9A84C', styleTag: 'Islamic Geometric', occasion: 'Eid Al-Fitr', hasGeo: true },
  { id: 2, bg: ['#1A0820','#3D1540'], textAr: 'ميلاد سعيد', textEn: 'Happy Birthday', accent: '#E87BA8', styleTag: 'Floral Soft', occasion: 'Birthday', hasGeo: false },
  { id: 3, bg: ['#040418','#0A1245'], textAr: 'رمضان كريم', textEn: 'Ramadan Kareem', accent: '#C9A84C', styleTag: 'Ramadan Night', occasion: 'Ramadan', hasGeo: true },
  { id: 4, bg: ['#0A0A0C','#181820'], textAr: 'كل عام وأنتم بخير', textEn: '', accent: '#C9A84C', styleTag: 'Minimalist Gold', occasion: 'Any', hasGeo: false },
  { id: 5, bg: ['#030320','#08084A'], textAr: 'سنة سعيدة', textEn: 'Happy New Year', accent: '#7B6AE8', styleTag: 'Neon Glow', occasion: 'New Year', hasGeo: false },
  { id: 6, bg: ['#040C18','#0A2040'], textAr: 'مبروك', textEn: 'Congratulations', accent: '#5BB8D4', styleTag: 'Cinematic', occasion: 'Graduation', hasGeo: false },
  { id: 7, bg: ['#1A0D08','#3D2010'], textAr: 'بالرفاه والبنين', textEn: 'Best Wishes', accent: '#D4875B', styleTag: 'Watercolor', occasion: 'Wedding', hasGeo: false },
  { id: 8, bg: ['#0A1A0A','#12381A'], textAr: 'جمعة مباركة', textEn: 'Blessed Friday', accent: '#7DC898', styleTag: 'Islamic Geometric', occasion: 'Friday Dua', hasGeo: true },
  { id: 9, bg: ['#0D0A30','#1E1060'], textAr: 'عيد الأضحى مبارك', textEn: 'Eid Al-Adha', accent: '#C9A84C', styleTag: 'Islamic Geometric', occasion: 'Eid Al-Adha', hasGeo: true },
  { id: 10, bg: ['#050320','#100830'], textAr: 'ليلة القدر', textEn: 'Laylat Al-Qadr', accent: '#9B7FE8', styleTag: 'Ramadan Night', occasion: 'Ramadan', hasGeo: true },
  { id: 11, bg: ['#1A080D','#3A1020'], textAr: '', textEn: 'Happy Anniversary', accent: '#E87BA8', styleTag: 'Floral Soft', occasion: 'Anniversary', hasGeo: false },
  { id: 12, bg: ['#060420','#100840'], textAr: 'تَوَكَّلْ عَلَى اللَّه', textEn: 'Trust in Allah', accent: '#B09FD8', styleTag: 'Islamic Geometric', occasion: 'Motivational', hasGeo: true },
];

function OccasionCardPreview({ config, selected, width = 160, height = 200, onClick }) {
  const [hover, setHover] = React.useState(false);
  const { bg, textAr, textEn, accent, styleTag, id, hasGeo } = config;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width, height, borderRadius: 14, overflow: 'hidden', position: 'relative',
        background: `linear-gradient(160deg, ${bg[0]} 0%, ${bg[1]} 100%)`,
        border: `1px solid ${selected ? accent : hover ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
        boxShadow: selected ? `0 0 0 2px ${accent}, 0 0 28px ${accent}30` : hover ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
        cursor: 'pointer', flexShrink: 0,
        transition: 'all 0.25s ease',
        transform: selected ? 'scale(1.03)' : hover ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {/* Geometric pattern */}
      {hasGeo && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }} preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id={`gp${id}`} x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <rect x="4" y="4" width="24" height="24" fill="none" stroke={accent} strokeWidth="0.5"/>
              <rect x="4" y="4" width="24" height="24" fill="none" stroke={accent} strokeWidth="0.5" transform="rotate(45 16 16)"/>
              <circle cx="16" cy="16" r="5" fill="none" stroke={accent} strokeWidth="0.4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#gp${id})`}/>
        </svg>
      )}

      {/* Radial glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 45%, ${accent}1E 0%, transparent 65%)` }}/>

      {/* Arabic text */}
      {textAr && (
        <div style={{
          position: 'absolute', bottom: textEn ? '44%' : '30%', left: 0, right: 0,
          textAlign: 'center', fontFamily: 'Amiri, serif', fontSize: Math.round(width * 0.115),
          color: accent, direction: 'rtl', padding: '0 10px', lineHeight: 1.3,
          textShadow: `0 0 24px ${accent}55`
        }}>{textAr}</div>
      )}

      {/* English text */}
      {textEn && (
        <div style={{
          position: 'absolute', bottom: '28%', left: 0, right: 0,
          textAlign: 'center', fontFamily: 'Cinzel, serif', fontSize: Math.round(width * 0.062),
          color: 'rgba(255,255,255,0.55)', letterSpacing: 2, padding: '0 8px'
        }}>{textEn}</div>
      )}

      {/* Check badge */}
      {selected && (
        <div style={{
          position: 'absolute', top: 8, left: 8, width: 22, height: 22, borderRadius: '50%',
          background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: '#06041A', fontWeight: 700, boxShadow: `0 0 10px ${accent}66`
        }}>✓</div>
      )}

      {/* Bottom label */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 44,
        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
        display: 'flex', alignItems: 'flex-end', padding: '0 10px 8px'
      }}>
        <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter,sans-serif', fontWeight: 500 }}>{styleTag}</span>
      </div>
    </div>
  );
}

// ── Loading Dots ──────────────────────────────────────────────
function LoadingDots({ label = 'Analyzing...', color = GOLD }) {
  const [frame, setFrame] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % 8), 220);
    return () => clearInterval(t);
  }, []);
  const dots = '.'.repeat(frame % 4);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color, fontSize: 13, fontFamily: 'Inter,sans-serif', fontWeight: 500 }}>
      <svg width="15" height="15" viewBox="0 0 15 15" style={{ animation: 'lspin 1.1s linear infinite' }}>
        <circle cx="7.5" cy="7.5" r="5.5" fill="none" stroke={color} strokeWidth="1.4" strokeDasharray="26" strokeDashoffset="7" strokeLinecap="round"/>
      </svg>
      {label}{dots}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────
function SectionHeader({ title, subtitle, align = 'left', titleSize = 22 }) {
  return (
    <div style={{ textAlign: align, marginBottom: 24 }}>
      <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: titleSize, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: 0.5, marginBottom: 7 }}>{title}</h2>
      {subtitle && <p style={{ color: TEXT_SECONDARY, fontSize: 14, lineHeight: 1.65, fontFamily: 'Inter,sans-serif' }}>{subtitle}</p>}
    </div>
  );
}

// ── Gold Divider ──────────────────────────────────────────────
function GoldDivider({ my = 24 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: `${my}px 0` }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.12)' }}/>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, opacity: 0.35 }}/>
      <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.12)' }}/>
    </div>
  );
}

// ── Gemini Badge ──────────────────────────────────────────────
function GeminiBadge({ label = 'AI Analysis Complete' }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 20,
      background: 'rgba(107,79,168,0.15)', border: '1px solid rgba(107,79,168,0.3)',
      fontSize: 11, color: '#B09FD8', fontFamily: 'Inter,sans-serif', fontWeight: 500
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#9B7FE8', boxShadow: '0 0 6px #9B7FE8' }}/>
      {label}
    </div>
  );
}

Object.assign(window, {
  LawhaWordmark, TopNav, StepProgress, GoldButton, TagChip,
  OccasionCardPreview, CARD_CONFIGS, LoadingDots, SectionHeader,
  GoldDivider, GeminiBadge,
  GOLD, GOLD_LIGHT, GOLD_DIM, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
  SURFACE, SURFACE_2, SURFACE_3, BORDER_GOLD, BORDER_SUBTLE
});

// lawha-screens.jsx — All 7 screen components for Lawha

// ── OCCASION CATEGORIES ───────────────────────────────────────
const OCCASION_CATEGORIES = [
  { id: 'islamic', icon: '☪', label: 'Islamic Occasions', examples: 'Eid · Ramadan · Jumu\'ah', color: '#C9A84C' },
  { id: 'celebration', icon: '✦', label: 'Celebrations', examples: 'Birthday · Anniversary', color: '#E87BA8' },
  { id: 'seasonal', icon: '❄', label: 'Seasonal', examples: 'New Year · National Day', color: '#7B9FE8' },
  { id: 'motivational', icon: '◆', label: 'Motivational', examples: 'Quotes · Affirmations', color: '#9B7FE8' },
  { id: 'wedding', icon: '◇', label: 'Weddings & Events', examples: 'Wedding · Baby Shower', color: '#D4875B' },
  { id: 'custom', icon: '✎', label: 'Custom', examples: 'Your own topic', color: '#7DC898' },
];

// ── STYLE OPTIONS ─────────────────────────────────────────────
const STYLE_OPTIONS = [
  { id: 'same', label: 'Keep Original', desc: 'Preserve reference style', bg: ['#0D0B27','#1A1840'], accent: '#8A7FA0', tag: 'Reference' },
  { id: 'islamic_geometric', label: 'Islamic Geometric', desc: 'Arabesque · Gold · Jewel tones', bg: ['#0D0A2E','#2A1060'], accent: '#C9A84C', tag: 'Eid · Ramadan' },
  { id: 'floral_soft', label: 'Floral & Soft', desc: 'Watercolor florals · Pastels', bg: ['#1A0820','#3D1540'], accent: '#E87BA8', tag: 'Birthday · Wedding' },
  { id: 'minimalist_gold', label: 'Minimalist Gold', desc: 'Clean space · Gold accent', bg: ['#0A0A0C','#181820'], accent: '#C9A84C', tag: 'Formal' },
  { id: 'neon_glow', label: 'Neon Glow', desc: 'Dark bg · Vibrant light trails', bg: ['#030320','#08084A'], accent: '#7B6AE8', tag: 'Birthday · New Year' },
  { id: 'cinematic', label: 'Cinematic Dark', desc: 'Film grain · Side lighting', bg: ['#040C18','#0A2040'], accent: '#5BB8D4', tag: 'Motivational' },
  { id: 'watercolor', label: 'Watercolor', desc: 'Brush strokes · Earth tones', bg: ['#1A0D08','#3D2010'], accent: '#D4875B', tag: 'Any warm occasion' },
  { id: 'ramadan_lantern', label: 'Ramadan Night', desc: 'Indigo sky · Lantern glow', bg: ['#040418','#0A1245'], accent: '#C9A84C', tag: 'Ramadan' },
  { id: 'custom', label: 'Custom Style', desc: 'Describe your own vision', bg: ['#0D0B27','#1A1840'], accent: '#7DC898', tag: 'Open-ended' },
];

// ── SUGGESTION DATA ───────────────────────────────────────────
const SUGGESTION_ROUNDS = [
  {
    question: 'What tone fits your card best?',
    subtitle: 'We\'ll craft the text to match your intention',
    options: [
      { icon: '🕌', label: 'Spiritual', sublabel: 'Reflective · Devotional' },
      { icon: '💪', label: 'Energetic', sublabel: 'Bold · Uplifting' },
      { icon: '🌸', label: 'Gentle', sublabel: 'Warm · Tender' },
      { icon: '✨', label: 'Celebratory', sublabel: 'Joyful · Festive' },
    ]
  },
  {
    question: 'Choose your motivational text',
    subtitle: 'Select one or type your own',
    options: [
      { icon: '①', label: 'تَوَكَّلْ عَلَى اللَّه', sublabel: 'Trust in Allah', isArabic: true },
      { icon: '②', label: 'كُلُّ يَوْمٍ فُرْصَةٌ جَدِيدَة', sublabel: 'Every day is a new chance', isArabic: true },
      { icon: '③', label: 'الصَّبْرُ مِفْتَاحُ الْفَرَج', sublabel: 'Patience is key to relief', isArabic: true },
      { icon: '✏️', label: 'Type my own', sublabel: 'Custom text' },
    ]
  },
  {
    question: 'How should it appear on the card?',
    subtitle: 'Choose the language format',
    options: [
      { icon: 'ع', label: 'Arabic only', sublabel: 'Primary script' },
      { icon: 'A+ع', label: 'Arabic + English', sublabel: 'Bilingual' },
      { icon: 'A', label: 'English only', sublabel: 'Latin script' },
    ]
  },
];

// ── ANIMATION PLANS ───────────────────────────────────────────
const ANIMATION_PLANS = [
  {
    name: 'Celestial Float',
    icon: '✦',
    description: 'Background geometric pattern slowly rotates at 2°/sec. Crescent moon drifts right-to-left. Text pulses with a golden glow on a 2-second breathe cycle. Stars twinkle independently.',
    duration: 6, complexity: 'Medium', mood: 'Spiritual · Serene',
    accentColor: '#C9A84C'
  },
  {
    name: 'Golden Reveal',
    icon: '◎',
    description: 'Card fades from dark. Text sweeps up from below with a gold particle trail. Background pattern materialises outward from centre. Final frame holds with subtle shimmer.',
    duration: 4, complexity: 'High', mood: 'Celebratory · Elegant',
    accentColor: '#E8C86A'
  },
  {
    name: 'Calm Parallax',
    icon: '⊹',
    description: 'Three-layer parallax: background drifts at 0.3× speed, midground at 0.6×, foreground text stationary. Gives a depth illusion. Stars have 1–2 second random twinkle intervals.',
    duration: 8, complexity: 'Low', mood: 'Peaceful · Meditative',
    accentColor: '#9B7FE8'
  },
];

// ═══════════════════════════════════════════════════════════════
// 1. HOME SCREEN
// ═══════════════════════════════════════════════════════════════
function HomeScreen({ session, update, goTo }) {
  const [topic, setTopic] = React.useState(session.topic || '');
  const [category, setCategory] = React.useState(session.category || '');
  const [focused, setFocused] = React.useState(false);
  const canContinue = topic.trim().length > 2 && category;

  const handleContinue = () => {
    update({ topic: topic.trim(), category });
    goTo('discover');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '60px 24px 80px', position: 'relative', overflow: 'hidden'
    }}>
      {/* BG radial glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 25%, rgba(107,79,168,0.22) 0%, transparent 65%)'
      }}/>
      <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.055) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }}/>

      {/* Arabesque corner accents */}
      <svg style={{ position:'absolute', top: 0, left: 0, opacity:0.07, pointerEvents:'none', zIndex:0 }} width="220" height="220" viewBox="0 0 220 220">
        <circle cx="0" cy="0" r="180" fill="none" stroke={GOLD} strokeWidth="0.8"/>
        <circle cx="0" cy="0" r="140" fill="none" stroke={GOLD} strokeWidth="0.5"/>
        <circle cx="0" cy="0" r="100" fill="none" stroke={GOLD} strokeWidth="0.4"/>
        <line x1="0" y1="0" x2="220" y2="220" stroke={GOLD} strokeWidth="0.3"/>
        <line x1="0" y1="0" x2="220" y2="0" stroke={GOLD} strokeWidth="0.3"/>
        <line x1="0" y1="0" x2="0" y2="220" stroke={GOLD} strokeWidth="0.3"/>
      </svg>
      <svg style={{ position:'absolute', bottom:0, right:0, opacity:0.07, pointerEvents:'none', zIndex:0, transform:'rotate(180deg)' }} width="220" height="220" viewBox="0 0 220 220">
        <circle cx="0" cy="0" r="180" fill="none" stroke={GOLD} strokeWidth="0.8"/>
        <circle cx="0" cy="0" r="140" fill="none" stroke={GOLD} strokeWidth="0.5"/>
        <circle cx="0" cy="0" r="100" fill="none" stroke={GOLD} strokeWidth="0.4"/>
      </svg>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 560, textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'center' }}>
          <LawhaWordmark scale={1.5} />
        </div>

        {/* Tagline */}
        <p style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontStyle: 'italic',
          color: TEXT_SECONDARY, marginBottom: 44, lineHeight: 1.55, letterSpacing: 0.3
        }}>
          Craft celebration cards — powered by AI vision &amp; deep visual analysis
        </p>

        {/* Topic Input */}
        <div style={{
          position: 'relative', marginBottom: 28,
          border: `1px solid ${focused ? GOLD : BORDER_GOLD}`,
          borderRadius: 14, background: 'rgba(13,11,39,0.85)',
          boxShadow: focused ? '0 0 0 3px rgba(201,168,76,0.09), 0 6px 32px rgba(201,168,76,0.07)' : 'none',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px 4px 16px' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ color: focused ? GOLD : TEXT_MUTED, flexShrink: 0, transition: 'color 0.2s' }}>
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="What occasion are you creating for?"
              value={topic} onChange={e => setTopic(e.target.value)}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              onKeyDown={e => e.key === 'Enter' && canContinue && handleContinue()}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: TEXT_PRIMARY, fontSize: 15, padding: '15px 12px',
                fontFamily: 'Inter,sans-serif', caretColor: GOLD
              }}
            />
            {topic && (
              <button onClick={() => setTopic('')} style={{ background:'transparent', border:'none',
                color: TEXT_SECONDARY, cursor:'pointer', padding:'0 10px', fontSize:18, lineHeight:1 }}>×</button>
            )}
          </div>
        </div>

        {/* Category grid */}
        <p style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.8, fontFamily: 'Inter,sans-serif' }}>
          Select Category
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 32 }}>
          {OCCASION_CATEGORIES.map(cat => (
            <CategoryCard key={cat.id} cat={cat} selected={category === cat.id} onClick={() => setCategory(cat.id)} />
          ))}
        </div>

        <GoldButton size="lg" onClick={handleContinue} disabled={!canContinue} style={{ width:'100%', borderRadius:12 }}>
          Begin Creating →
        </GoldButton>
        <p style={{ marginTop: 14, fontSize: 11, color: TEXT_MUTED, fontFamily: 'Inter,sans-serif' }}>
          Powered by Gemini 2.5 Flash · VisionStruct Engine
        </p>
      </div>
    </div>
  );
}

function CategoryCard({ cat, selected, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        padding: '13px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
        background: selected ? `${cat.color}14` : hover ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? cat.color + '38' : BORDER_SUBTLE}`,
        boxShadow: selected ? `0 0 18px ${cat.color}18` : 'none',
        transition: 'all 0.2s ease'
      }}>
      <div style={{ fontSize: 17, marginBottom: 5 }}>{cat.icon}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: selected ? cat.color : TEXT_PRIMARY, marginBottom: 3, fontFamily:'Inter,sans-serif' }}>{cat.label}</div>
      <div style={{ fontSize: 10, color: TEXT_SECONDARY, lineHeight: 1.4, fontFamily:'Inter,sans-serif' }}>{cat.examples}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. DISCOVER SCREEN
// ═══════════════════════════════════════════════════════════════
function DiscoverScreen({ session, update, goTo }) {
  const [selectedUrl, setSelectedUrl] = React.useState(session.selectedImageUrl || null);
  const [images, setImages] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState(session.topic || '');

  const runSearch = React.useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await api.search(q.trim(), '', 6);
      setImages(res.images || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { runSearch(session.topic || ''); }, [session.topic, runSearch]);

  const handleContinue = () => {
    if (!selectedUrl) return;
    update({ selectedImageUrl: selectedUrl });
    goTo('style');
  };

  return (
    <div style={{ padding: '32px 32px 100px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 22 }}>
        <SectionHeader
          title="Discover References"
          subtitle="Pick one reference image that matches the feel you want."
        />
        {selectedUrl && (
          <div style={{ fontSize:12, color: GOLD, fontFamily:'Inter,sans-serif', fontWeight:500, flexShrink:0 }}>
            1 selected
          </div>
        )}
      </div>

      {/* Search bar */}
      <div style={{ display:'flex', gap:10, marginBottom:22 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runSearch(query)}
          placeholder="Search Pinterest for references…"
          style={{
            flex:1, background:SURFACE_2, border:`1px solid ${BORDER_GOLD}`,
            borderRadius:10, color:TEXT_PRIMARY, fontSize:14, padding:'12px 16px',
            fontFamily:'Inter,sans-serif', outline:'none', caretColor:GOLD
          }}
        />
        <GoldButton size="md" variant="outline" onClick={() => runSearch(query)} disabled={loading}>
          {loading ? 'Searching…' : '🔍 Search'}
        </GoldButton>
      </div>

      {error && (
        <div style={{
          padding:'12px 16px', borderRadius:10, marginBottom:16,
          background:'rgba(220,80,80,0.08)', border:'1px solid rgba(220,80,80,0.3)',
          color:'#E89B9B', fontSize:13, fontFamily:'Inter,sans-serif'
        }}>Search failed: {error}</div>
      )}

      {/* 3×2 grid */}
      {loading && images.length === 0 ? (
        <div style={{ minHeight: 360, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <LoadingDots label="Searching Pinterest" color={GOLD} />
        </div>
      ) : (
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:24
        }}>
          {images.map((img, i) => {
            const sel = selectedUrl === img.url;
            return (
              <div key={`${img.url}-${i}`} onClick={() => setSelectedUrl(img.url)}
                style={{
                  position:'relative', borderRadius:14, overflow:'hidden', cursor:'pointer',
                  border:`1px solid ${sel ? GOLD : BORDER_SUBTLE}`,
                  boxShadow: sel ? `0 0 0 2px ${GOLD}, 0 0 26px rgba(201,168,76,0.3)` : 'none',
                  transition:'all 0.2s ease', aspectRatio:'1 / 1', background:SURFACE_2
                }}>
                <img src={img.url} alt="" referrerPolicy="no-referrer"
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                {sel && (
                  <div style={{
                    position:'absolute', top:10, right:10, width:26, height:26, borderRadius:'50%',
                    background:GOLD, color:'#06041A', display:'flex', alignItems:'center',
                    justifyContent:'center', fontWeight:700, fontSize:14
                  }}>✓</div>
                )}
                <div style={{
                  position:'absolute', bottom:6, left:8, fontSize:10, color:TEXT_SECONDARY,
                  background:'rgba(6,4,26,0.7)', padding:'2px 6px', borderRadius:4,
                  fontFamily:'Inter,sans-serif', textTransform:'uppercase', letterSpacing:1
                }}>{img.source}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 32px', background: 'rgba(6,4,26,0.97)',
        borderTop: `1px solid ${BORDER_GOLD}`, backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ fontSize:13, color: selectedUrl ? GOLD : TEXT_MUTED, fontFamily:'Inter,sans-serif' }}>
          {selectedUrl ? 'Reference ready' : 'Select 1 image to continue'}
        </div>
        <GoldButton size="md" onClick={handleContinue} disabled={!selectedUrl}>
          Analyse Selected →
        </GoldButton>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3. STYLE SCREEN
// ═══════════════════════════════════════════════════════════════
function StyleScreen({ session, update, goTo }) {
  const [style, setStyle] = React.useState(session.style || '');
  const [prompt, setPrompt] = React.useState(session.changePrompt || '');
  const [analyzing, setAnalyzing] = React.useState(!session.visionJson);
  const [analysisComplete, setAnalysisComplete] = React.useState(!!session.visionJson);
  const [analyzeError, setAnalyzeError] = React.useState(null);

  React.useEffect(() => {
    if (session.visionJson || !session.selectedImageUrl) return;
    let cancelled = false;
    (async () => {
      setAnalyzing(true); setAnalyzeError(null);
      try {
        const visionJson = await api.analyze(session.selectedImageUrl);
        if (cancelled) return;
        update({ visionJson });
        setAnalysisComplete(true);
      } catch (e) {
        if (cancelled) return;
        setAnalyzeError(String(e.message || e));
      } finally {
        if (!cancelled) setAnalyzing(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session.selectedImageUrl]);

  const handleContinue = () => {
    update({ style, changePrompt: prompt });
    goTo('suggest');
  };

  const selectedImageUrl = session.selectedImageUrl;

  return (
    <div style={{ padding: '32px 32px 100px', maxWidth: 900, margin: '0 auto' }}>
      {/* VisionStruct analysis status */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom: 28, padding: '14px 18px', borderRadius: 12,
        background: analysisComplete ? 'rgba(107,79,168,0.1)' : 'rgba(201,168,76,0.06)',
        border: `1px solid ${analysisComplete ? 'rgba(107,79,168,0.25)' : BORDER_GOLD}`
      }}>
        {analyzing ? (
          <LoadingDots label="VisionStruct Engine analysing reference" />
        ) : analyzeError ? (
          <span style={{ fontSize:12, color:'#E89B9B', fontFamily:'Inter,sans-serif' }}>
            Analysis failed: {analyzeError}
          </span>
        ) : (
          <GeminiBadge label="VisionStruct Analysis Complete — JSON ready" />
        )}
        {selectedImageUrl && (
          <img src={selectedImageUrl} alt="" referrerPolicy="no-referrer"
            style={{ width:54, height:54, borderRadius:8, objectFit:'cover', flexShrink:0,
              border:`1px solid ${BORDER_GOLD}` }}/>
        )}
      </div>

      <SectionHeader title="Choose Your Style" subtitle="Style cards adapt your card's visual language. Select one, then describe what you'd like to change." />

      {/* Style cards horizontal scroll */}
      <div style={{ overflowX:'auto', paddingBottom:12, marginBottom:32 }}>
        <div style={{ display:'flex', gap:12, width:'max-content' }}>
          {STYLE_OPTIONS.map(s => (
            <StyleCard key={s.id} s={s} selected={style === s.id} onClick={() => setStyle(s.id)} />
          ))}
        </div>
      </div>

      <GoldDivider my={20} />

      {/* Change prompt */}
      <div style={{ marginBottom: 32 }}>
        <label style={{ display:'block', fontSize:12, color:TEXT_SECONDARY, marginBottom:10, textTransform:'uppercase', letterSpacing:1.5, fontFamily:'Inter,sans-serif' }}>
          What would you like to change?
        </label>
        <textarea
          placeholder='e.g. "change the text to something motivational" or "make it feel more Ramadan"'
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          style={{
            width:'100%', minHeight:90, background:'rgba(13,11,39,0.8)',
            border:`1px solid ${prompt ? BORDER_GOLD : BORDER_SUBTLE}`,
            borderRadius:12, color:TEXT_PRIMARY, fontSize:14, padding:'14px 16px',
            fontFamily:'Inter,sans-serif', lineHeight:1.6, resize:'vertical', outline:'none',
            transition:'border 0.2s', caretColor:GOLD, boxSizing:'border-box'
          }}
        />
        <p style={{ marginTop:8, fontSize:11, color:TEXT_MUTED, fontFamily:'Inter,sans-serif' }}>
          The AI agent will guide you through 1–3 clarifying rounds before generating.
        </p>
      </div>

      <GoldButton size="lg" onClick={handleContinue} disabled={!style || !prompt.trim()} style={{ width:'100%', borderRadius:12 }}>
        Continue to Refine →
      </GoldButton>
    </div>
  );
}

function StyleCard({ s, selected, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: 148, flexShrink:0, borderRadius:14, overflow:'hidden', cursor:'pointer',
        border:`1px solid ${selected ? s.accent : hover ? 'rgba(255,255,255,0.1)' : BORDER_SUBTLE}`,
        boxShadow: selected ? `0 0 0 2px ${s.accent}, 0 0 24px ${s.accent}28` : hover ? '0 4px 16px rgba(0,0,0,0.4)' : 'none',
        transition:'all 0.22s ease', transform: selected ? 'scale(1.04)' : hover ? 'scale(1.01)' : 'scale(1)'
      }}>
      {/* Mini preview */}
      <div style={{
        height: 90, background:`linear-gradient(160deg, ${s.bg[0]}, ${s.bg[1]})`,
        position:'relative', overflow:'hidden'
      }}>
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.13}} preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id={`sp${s.id}`} x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <rect x="3" y="3" width="18" height="18" fill="none" stroke={s.accent} strokeWidth="0.4"/>
              <rect x="3" y="3" width="18" height="18" fill="none" stroke={s.accent} strokeWidth="0.4" transform="rotate(45 12 12)"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#sp${s.id})`}/>
        </svg>
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at 50% 55%, ${s.accent}22 0%, transparent 70%)` }}/>
        {selected && (
          <div style={{ position:'absolute', top:7, right:7, width:18, height:18, borderRadius:'50%',
            background:s.accent, display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:10, color:'#06041A', fontWeight:700 }}>✓</div>
        )}
      </div>
      {/* Label */}
      <div style={{ padding:'10px 12px', background:SURFACE_2 }}>
        <div style={{ fontSize:12, fontWeight:600, color:selected?s.accent:TEXT_PRIMARY, marginBottom:3, fontFamily:'Inter,sans-serif' }}>{s.label}</div>
        <div style={{ fontSize:10, color:TEXT_SECONDARY, lineHeight:1.4, fontFamily:'Inter,sans-serif' }}>{s.desc}</div>
        <div style={{ marginTop:6 }}><TagChip label={s.tag} color="muted" size="sm" selected /></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. SUGGEST SCREEN (Interactive Suggestion Loop)
// ═══════════════════════════════════════════════════════════════
const MAX_SUGGESTION_ROUNDS = 3;

function SuggestScreen({ session, update, goTo }) {
  const [answers, setAnswers] = React.useState([]);
  const [current, setCurrent] = React.useState(null);  // { question, options, round_hint }
  const [pendingAnswer, setPendingAnswer] = React.useState(null);
  const [customInput, setCustomInput] = React.useState('');
  const [showCustom, setShowCustom] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [finalSummary, setFinalSummary] = React.useState(null); // {summary, confirmed_changes}

  const askAgent = React.useCallback(async (history) => {
    setLoading(true); setError(null);
    setPendingAnswer(null); setCustomInput(''); setShowCustom(false);
    try {
      const res = await api.suggest({
        change_prompt: session.changePrompt || '',
        vision_json: session.visionJson || {},
        occasion: occasionFor(session.category),
        topic: session.topic || '',
        history,
      });
      if (res.done) {
        setFinalSummary({
          summary: res.summary || (session.changePrompt || ''),
          confirmed_changes: res.confirmed_changes || [session.changePrompt || ''],
        });
        setCurrent(null);
      } else {
        setCurrent({
          question: res.question,
          options: res.options || [],
          round_hint: res.round_hint || `Step ${history.length + 1} of up to ${MAX_SUGGESTION_ROUNDS}`,
        });
      }
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, [session.changePrompt, session.visionJson, session.category, session.topic]);

  React.useEffect(() => { askAgent([]); }, [askAgent]);

  const handleSelect = (option) => {
    if (option.custom) { setShowCustom(true); setPendingAnswer(null); return; }
    setPendingAnswer(option.label);
    setShowCustom(false);
  };

  const handleNext = () => {
    const answer = showCustom ? customInput.trim() : pendingAnswer;
    if (!answer) return;
    const newAnswers = [...answers, { question: current.question, answer }];
    setAnswers(newAnswers);
    askAgent(newAnswers);
  };

  const handleSkip = () => {
    askAgent([...answers]);  // ask again with same history; agent may finish
  };

  const handleConfirm = () => {
    update({
      suggestionRounds: answers,
      confirmedChanges: finalSummary?.confirmed_changes || [session.changePrompt || ''],
      suggestionSummary: finalSummary?.summary || '',
    });
    goTo('variants');
  };

  if (loading && !current && !finalSummary) {
    return (
      <div style={{ padding:'80px 32px', display:'flex', justifyContent:'center' }}>
        <LoadingDots label="Agent is thinking" color={GOLD} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding:'40px 32px', maxWidth:520, margin:'0 auto', textAlign:'center' }}>
        <div style={{ color:'#E89B9B', marginBottom:18, fontFamily:'Inter,sans-serif' }}>
          Agent error: {error}
        </div>
        <GoldButton size="md" onClick={() => askAgent(answers)}>Retry</GoldButton>
      </div>
    );
  }

  if (finalSummary) {
    return (
      <div style={{ padding:'48px 32px', maxWidth:620, margin:'0 auto', textAlign:'center' }}>
        <div style={{ marginBottom:24, fontSize:36 }}>✦</div>
        <SectionHeader title="Agent Summary" subtitle={finalSummary.summary || 'Confirmed changes ready to apply.'} align="center" />
        <div style={{ marginBottom:24, marginTop:18, textAlign:'left' }}>
          {(finalSummary.confirmed_changes || []).map((c, i) => (
            <div key={i} style={{
              padding:'12px 16px', borderRadius:10, marginBottom:8,
              background:SURFACE_2, border:`1px solid ${BORDER_GOLD}`,
              fontSize:13, color:TEXT_PRIMARY,
              fontFamily: /[؀-ۿ]/.test(c) ? 'Amiri,serif' : 'Inter,sans-serif',
              direction: /[؀-ۿ]/.test(c) ? 'rtl' : 'ltr'
            }}>{c}</div>
          ))}
        </div>
        {answers.length > 0 && (
          <details style={{ marginBottom:24, textAlign:'left', color:TEXT_SECONDARY, fontFamily:'Inter,sans-serif', fontSize:12 }}>
            <summary style={{ cursor:'pointer', marginBottom:8 }}>Q&amp;A history</summary>
            {answers.map((a, i) => (
              <div key={i} style={{ padding:'8px 12px', borderRadius:8, marginBottom:6, background:SURFACE_2 }}>
                <div style={{ color:TEXT_MUTED, marginBottom:2 }}>{a.question}</div>
                <div style={{ color:TEXT_PRIMARY }}>{a.answer}</div>
              </div>
            ))}
          </details>
        )}
        <GoldButton size="lg" onClick={handleConfirm} style={{ width:'100%', borderRadius:12 }}>
          Generate Images →
        </GoldButton>
      </div>
    );
  }

  if (!current) return null;

  const roundIdx = answers.length;
  const isArabic = (s) => /[؀-ۿ]/.test(s || "");

  return (
    <div style={{ padding:"40px 32px", maxWidth:620, margin:"0 auto" }}>
      {/* Progress */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:30 }}>
        {Array.from({ length: MAX_SUGGESTION_ROUNDS }).map((_, i) => (
          <React.Fragment key={i}>
            <div style={{
              width: i === roundIdx ? 28 : 8, height:8, borderRadius:4,
              background: i < roundIdx ? GOLD_DIM : i === roundIdx ? GOLD : "rgba(201,168,76,0.15)",
              transition:"all 0.3s"
            }}/>
            {i < MAX_SUGGESTION_ROUNDS - 1 && (
              <div style={{ width:20, height:1, background: i < roundIdx ? "rgba(201,168,76,0.3)":"rgba(201,168,76,0.1)" }}/>
            )}
          </React.Fragment>
        ))}
        <span style={{ marginLeft:8, fontSize:11, color:TEXT_SECONDARY, fontFamily:"Inter,sans-serif" }}>
          {current.round_hint}
        </span>
      </div>

      {/* AI question card */}
      <div style={{
        padding:"24px", borderRadius:16, marginBottom:22,
        background:`linear-gradient(135deg, ${SURFACE_2} 0%, rgba(107,79,168,0.12) 100%)`,
        border:`1px solid ${BORDER_GOLD}`
      }}>
        <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
          <div style={{
            width:32, height:32, borderRadius:"50%", background:"rgba(201,168,76,0.12)",
            border:`1px solid ${BORDER_GOLD}`, display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:14, flexShrink:0
          }}>✦</div>
          <div style={{ fontSize:16, fontWeight:500, color:TEXT_PRIMARY, fontFamily:"Cinzel,serif", letterSpacing:0.3, lineHeight:1.5 }}>
            {current.question}
          </div>
        </div>
      </div>

      {/* Options */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:18 }}>
        {current.options.map((opt, i) => {
          const isAr = isArabic(opt.label);
          const sel = pendingAnswer === opt.label && !opt.custom;
          return (
            <div key={opt.id || i} onClick={() => handleSelect(opt)}
              style={{
                padding:"14px 18px", borderRadius:12, cursor:"pointer",
                background: sel ? "rgba(201,168,76,0.1)" : SURFACE_2,
                border:`1px solid ${sel ? GOLD : BORDER_SUBTLE}`,
                boxShadow: sel ? "0 0 16px rgba(201,168,76,0.12)" : "none",
                transition:"all 0.2s",
                display:"flex", alignItems:"center", gap:14
              }}>
              {opt.icon && (
                <div style={{
                  width:36, height:36, borderRadius:10,
                  background: sel ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)",
                  border:`1px solid ${sel ? BORDER_GOLD : BORDER_SUBTLE}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize: isAr ? 14 : 16, fontFamily: isAr ? "Amiri,serif" : "inherit",
                  color: sel ? GOLD : TEXT_SECONDARY, flexShrink:0
                }}>{opt.icon}</div>
              )}
              <div style={{ flex:1 }}>
                <div style={{
                  fontSize: isAr ? 17 : 14, fontWeight:500,
                  color: sel ? GOLD : TEXT_PRIMARY,
                  fontFamily: isAr ? "Amiri,serif" : "Inter,sans-serif",
                  direction: isAr ? "rtl" : "ltr", textAlign: isAr ? "right" : "left"
                }}>{opt.label}</div>
              </div>
              {sel && <div style={{ color:GOLD, fontSize:14 }}>✓</div>}
            </div>
          );
        })}
      </div>

      {/* Custom input */}
      {showCustom && (
        <div style={{ marginBottom:16 }}>
          <input type="text" placeholder="Type your own answer…"
            value={customInput} onChange={e => setCustomInput(e.target.value)}
            autoFocus
            style={{
              width:"100%", background:SURFACE_2, border:`1px solid ${BORDER_GOLD}`,
              borderRadius:10, color:TEXT_PRIMARY, fontSize:14, padding:"12px 16px",
              fontFamily:"Inter,sans-serif", outline:"none", caretColor:GOLD, boxSizing:"border-box"
            }}/>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:"flex", gap:10 }}>
        <GoldButton size="md" onClick={handleNext}
          disabled={loading || (!pendingAnswer && !customInput.trim())}
          style={{ flex:1, borderRadius:10 }}>
          {loading ? "Thinking…" : "Next →"}
        </GoldButton>
        <GoldButton size="md" variant="ghost" onClick={handleSkip} disabled={loading} style={{ borderRadius:10 }}>
          Skip
        </GoldButton>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. VARIANTS SCREEN
// ═══════════════════════════════════════════════════════════════

function VariantsScreen({ session, update, goTo }) {
  // Each entry: { id, url, prompt, model, parent_id, note? }
  const [pool, setPool] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [improving, setImproving] = React.useState(null);
  const [improveNote, setImproveNote] = React.useState('');
  const [improvingId, setImprovingId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await api.generateImages({
          vision_json: session.visionJson || {},
          style_id: session.style || 'same',
          custom_style_text: '',
          user_changes: session.confirmedChanges || [],
          model: IMAGE_MODEL,
          n: 3,
        });
        if (cancelled) return;
        const variants = (res.variants || []).map((v, i) => ({
          id: `v${i + 1}`, url: v.url, prompt: v.prompt, model: v.model, parent_id: v.parent_id,
        }));
        setPool(variants);
      } catch (e) {
        if (!cancelled) setError(String(e.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleImprove = (id) => {
    setImproving(id === improving ? null : id);
    setImproveNote('');
  };

  const handleGenImprove = async (id) => {
    const parent = pool.find(v => v.id === id);
    if (!parent || !improveNote.trim()) return;
    setImprovingId(id);
    try {
      const res = await api.improve({
        vision_json: session.visionJson || {},
        improvement_note: improveNote.trim(),
        previous_prompt: parent.prompt,
        model: IMAGE_MODEL,
      });
      const newVariant = {
        id: `v${pool.length + 1}`, url: res.url, prompt: res.prompt,
        model: res.model, parent_id: parent.id, note: improveNote.trim(),
      };
      setPool(prev => {
        const next = [...prev, newVariant];
        return next.length > 6 ? next.slice(next.length - 6) : next;
      });
      setImproving(null);
      setImproveNote('');
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setImprovingId(null);
    }
  };

  const handleUse = (id) => {
    const v = pool.find(x => x.id === id);
    if (!v) return;
    setSelected(id);
    update({ selectedImageId: id, selectedVariant: v });
    setTimeout(() => goTo('animate'), 500);
  };

  if (loading && pool.length === 0) {
    return (
      <div style={{ padding:'80px 32px', display:'flex', justifyContent:'center' }}>
        <LoadingDots label="Generating with Imagen" color={GOLD} />
      </div>
    );
  }

  return (
    <div style={{ padding:'32px 32px 32px', maxWidth:1000, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:28 }}>
        <SectionHeader title="Generated Variants" subtitle="Select your favourite, or improve any image before animating." />
        <span style={{ fontSize:12, color:TEXT_SECONDARY, fontFamily:'Inter,sans-serif', flexShrink:0, paddingBottom:2 }}>
          {pool.length} / 6 images
        </span>
      </div>

      {error && (
        <div style={{
          padding:'12px 16px', borderRadius:10, marginBottom:16,
          background:'rgba(220,80,80,0.08)', border:'1px solid rgba(220,80,80,0.3)',
          color:'#E89B9B', fontSize:13, fontFamily:'Inter,sans-serif'
        }}>{error}</div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:18 }}>
        {pool.map(v => (
          <VariantCard key={v.id} variant={v} selected={selected === v.id}
            improving={improving === v.id} improveNote={improveNote}
            onImproveNoteChange={setImproveNote}
            onUse={() => handleUse(v.id)}
            onImprove={() => handleImprove(v.id)}
            onGenImprove={() => handleGenImprove(v.id)}
            generatingNew={improvingId === v.id}
          />
        ))}
        {improvingId && (
          <div style={{
            borderRadius:16, border:`1px dashed ${BORDER_GOLD}`,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:12, minHeight:300, color:TEXT_SECONDARY
          }}>
            <LoadingDots label="Generating improved image" color={GOLD} />
          </div>
        )}
      </div>
    </div>
  );
}

function VariantCard({ variant, selected, improving, improveNote, onImproveNoteChange, onUse, onImprove, onGenImprove, generatingNew }) {
  const { url, note } = variant;
  const accent = GOLD;
  return (
    <div style={{
      borderRadius:16, overflow:'hidden',
      border:`1px solid ${selected ? accent : BORDER_SUBTLE}`,
      boxShadow: selected ? `0 0 0 2px ${accent}, 0 0 30px ${accent}30` : 'none',
      background: SURFACE_2,
      transition:'all 0.25s ease'
    }}>
      {/* Image area */}
      <div style={{ height:280, position:'relative', overflow:'hidden', background:'#0a0820' }}>
        {url ? (
          <img src={url} alt="" referrerPolicy="no-referrer"
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:TEXT_MUTED }}>
            no image
          </div>
        )}
        {note && (
          <div style={{ position:'absolute', top:10, left:10 }}>
            <TagChip label={`Improved: ${note.slice(0,20)}…`} color="purple" selected />
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding:'14px 14px 12px' }}>
        <div style={{ display:'flex', gap:8 }}>
          <GoldButton size="sm" onClick={onUse} style={{ flex:1, borderRadius:8 }}>
            ⭐ Use This
          </GoldButton>
          <GoldButton size="sm" variant="outline" onClick={onImprove} style={{ flex:1, borderRadius:8 }}>
            🔄 Improve
          </GoldButton>
        </div>

        {improving && (
          <div style={{ marginTop:10 }}>
            <input type="text" placeholder='e.g. "make the stars brighter"'
              value={improveNote} onChange={e => onImproveNoteChange(e.target.value)}
              style={{
                width:'100%', background:'rgba(6,4,26,0.7)', border:`1px solid ${BORDER_GOLD}`,
                borderRadius:8, color:TEXT_PRIMARY, fontSize:12, padding:'9px 12px',
                fontFamily:'Inter,sans-serif', outline:'none', caretColor:GOLD, boxSizing:'border-box'
              }}/>
            <GoldButton size="sm" onClick={onGenImprove} disabled={!improveNote.trim() || generatingNew}
              style={{ width:'100%', marginTop:7, borderRadius:8 }}>
              {generatingNew ? 'Generating…' : 'Apply Improvement'}
            </GoldButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 6. ANIMATE SCREEN
// ═══════════════════════════════════════════════════════════════
function AnimateScreen({ session, update, goTo }) {
  const [selectedPlan, setSelectedPlan] = React.useState(null);
  const [description, setDescription] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [videoReady, setVideoReady] = React.useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setVideoReady(true); }, 3200);
  };

  const handleContinue = () => {
    update({ selectedAnimationPlan: selectedPlan });
    goTo('share');
  };

  return (
    <div style={{ padding:'32px 32px 80px', maxWidth:900, margin:'0 auto' }}>
      <SectionHeader title="Choose Animation Style"
        subtitle="The VisionStruct depth map informs each plan — elements animate in their correct spatial layers." />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:14, marginBottom:32 }}>
        {ANIMATION_PLANS.map(plan => (
          <AnimationPlanCard key={plan.name} plan={plan}
            selected={selectedPlan === plan.name}
            onClick={() => setSelectedPlan(plan.name)} />
        ))}
      </div>

      {/* Optional description */}
      <div style={{ marginBottom:28 }}>
        <label style={{ display:'block', fontSize:12, color:TEXT_SECONDARY, marginBottom:10, textTransform:'uppercase', letterSpacing:1.5, fontFamily:'Inter,sans-serif' }}>
          Optional: Describe the feel you want
        </label>
        <input type="text" placeholder='e.g. "I want it to feel like stars are falling"'
          value={description} onChange={e => setDescription(e.target.value)}
          style={{
            width:'100%', background:SURFACE_2, border:`1px solid ${BORDER_SUBTLE}`,
            borderRadius:10, color:TEXT_PRIMARY, fontSize:14, padding:'12px 16px',
            fontFamily:'Inter,sans-serif', outline:'none', caretColor:GOLD, boxSizing:'border-box',
            transition:'border 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = BORDER_GOLD}
          onBlur={e => e.target.style.borderColor = BORDER_SUBTLE}
        />
      </div>

      {/* Video preview area */}
      {(videoReady || generating) && (
        <div style={{
          borderRadius:16, overflow:'hidden', marginBottom:28,
          border:`1px solid ${BORDER_GOLD}`, background:SURFACE_2
        }}>
          <div style={{
            height:240, display:'flex', alignItems:'center', justifyContent:'center',
            background:'linear-gradient(160deg, #0D0A2E, #2A1060)', position:'relative', overflow:'hidden'
          }}>
            {generating ? (
              <div style={{ textAlign:'center' }}>
                <LoadingDots label="Generating animation" color={GOLD} />
                <p style={{ marginTop:10, fontSize:11, color:TEXT_MUTED, fontFamily:'Inter,sans-serif' }}>
                  Rendering {ANIMATION_PLANS.find(p=>p.name===selectedPlan)?.duration || 6}s video…
                </p>
              </div>
            ) : (
              <>
                <div style={{ width:56, height:56, borderRadius:'50%', border:`2px solid ${GOLD}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:22, cursor:'pointer', background:'rgba(201,168,76,0.12)',
                  backdropFilter:'blur(8px)', color:GOLD }}>▶</div>
                <div style={{
                  position:'absolute', bottom:12, right:12, display:'flex', gap:8
                }}>
                  <TagChip label={`${ANIMATION_PLANS.find(p=>p.name===selectedPlan)?.duration||6}s`} color="gold" selected />
                  <TagChip label={ANIMATION_PLANS.find(p=>p.name===selectedPlan)?.mood||''} color="purple" selected />
                </div>
              </>
            )}
          </div>
          {videoReady && (
            <div style={{ padding:'12px 16px', display:'flex', gap:8 }}>
              <GoldButton size="sm" variant="outline" style={{ flex:1, borderRadius:8 }}>⬇ Download</GoldButton>
              <GoldButton size="sm" onClick={handleContinue} style={{ flex:1, borderRadius:8 }}>Share → </GoldButton>
            </div>
          )}
        </div>
      )}

      <GoldButton size="lg" onClick={generating || videoReady ? handleContinue : handleGenerate}
        disabled={!selectedPlan}
        style={{ width:'100%', borderRadius:12 }}>
        {videoReady ? 'Continue to Share →' : generating ? 'Generating…' : 'Generate Animation'}
      </GoldButton>
    </div>
  );
}

function AnimationPlanCard({ plan, selected, onClick }) {
  const [hover, setHover] = React.useState(false);
  const complexityColor = { Low:'#7DC898', Medium:GOLD, High:'#E87BA8' }[plan.complexity] || GOLD;
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        padding:'20px', borderRadius:14, cursor:'pointer',
        background: selected ? `${plan.accentColor}0E` : hover ? 'rgba(255,255,255,0.03)' : SURFACE_2,
        border:`1px solid ${selected ? plan.accentColor+'50' : BORDER_SUBTLE}`,
        boxShadow: selected ? `0 0 24px ${plan.accentColor}18` : 'none',
        transition:'all 0.22s ease',
        transform: selected ? 'translateY(-2px)' : 'none'
      }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:20, color:plan.accentColor }}>{plan.icon}</div>
          <div style={{ fontSize:15, fontWeight:600, color: selected ? plan.accentColor : TEXT_PRIMARY, fontFamily:'Cinzel,serif', letterSpacing:0.3 }}>
            {plan.name}
          </div>
        </div>
        <div style={{ fontSize:11, color:plan.accentColor, fontFamily:'Inter,sans-serif', fontWeight:600,
          padding:'2px 8px', borderRadius:6, background:`${plan.accentColor}14`, border:`1px solid ${plan.accentColor}28`, whiteSpace:'nowrap' }}>
          {plan.duration}s
        </div>
      </div>
      <p style={{ fontSize:12.5, color:TEXT_SECONDARY, lineHeight:1.65, fontFamily:'Inter,sans-serif', marginBottom:14 }}>
        {plan.description}
      </p>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        <span style={{ fontSize:10, color:complexityColor, padding:'2px 8px', borderRadius:6, background:`${complexityColor}12`, border:`1px solid ${complexityColor}25`, fontFamily:'Inter,sans-serif', fontWeight:500 }}>
          {plan.complexity}
        </span>
        {plan.mood.split(' · ').map(m => (
          <span key={m} style={{ fontSize:10, color:TEXT_SECONDARY, padding:'2px 8px', borderRadius:6, background:'rgba(255,255,255,0.04)', fontFamily:'Inter,sans-serif' }}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 7. SHARE SCREEN
// ═══════════════════════════════════════════════════════════════
const PLATFORM_CAPTIONS = {
  instagram: {
    caption: `✨ تَوَكَّلْ عَلَى اللَّه — Trust in Allah ✨\n\nEvery step of your journey is guided by a higher hand. Let go of worry and embrace the peace that comes from true surrender.\n\nMay this reminder bring serenity to your heart today. 🌙`,
    hashtags: ['#TawakkalAlAllah', '#IslamicReminder', '#EidMubarak', '#MuslimArt', '#AIGeneratedArt', '#LawhaApp', '#Calligraphy', '#DigitalIslam']
  },
  twitter: {
    caption: `تَوَكَّلْ عَلَى اللَّه — Trust in Allah.\n\nA reminder for those who need it today. 🌙✨`,
    hashtags: ['#IslamicQuotes', '#TawakkalAlAllah', '#Eid']
  },
  linkedin: {
    caption: `Sharing a moment of reflection: تَوَكَّلْ عَلَى اللَّه — Trust in Allah.\n\nIn a world of uncertainty, this principle guides countless individuals toward inner peace and resilience. Created with Lawha AI Creative Studio.`,
    hashtags: ['#Mindfulness', '#IslamicArt', '#AICreativity', '#DigitalDesign']
  },
  tiktok: {
    caption: `This card took 30 seconds to make with AI 🤯✨\n\nتَوَكَّلْ عَلَى اللَّه — Trust in Allah 🌙`,
    hashtags: ['#IslamicTikTok', '#AIArt', '#TawakkalAlAllah', '#viral', '#fyp', '#LawhaApp']
  }
};

const PLATFORM_COLORS = { instagram:'#E1306C', twitter:'#1DA1F2', linkedin:'#0077B5', tiktok:'#69C9D0' };
const PLATFORM_ICONS = { instagram:'📸', twitter:'𝕏', linkedin:'in', tiktok:'♪' };

function ShareScreen({ session, update, goTo }) {
  const [platform, setPlatform] = React.useState('instagram');
  const [caption, setCaption] = React.useState(PLATFORM_CAPTIONS.instagram.caption);
  const [hashtags, setHashtags] = React.useState(PLATFORM_CAPTIONS.instagram.hashtags);
  const [sharing, setSharing] = React.useState(false);
  const [shared, setShared] = React.useState(false);

  const switchPlatform = (p) => {
    setPlatform(p);
    setCaption(PLATFORM_CAPTIONS[p].caption);
    setHashtags(PLATFORM_CAPTIONS[p].hashtags);
  };

  const removeHashtag = (tag) => setHashtags(prev => prev.filter(t => t !== tag));

  const handleShare = () => {
    setSharing(true);
    setTimeout(() => { setSharing(false); setShared(true); }, 1800);
  };

  const pc = PLATFORM_COLORS[platform];

  return (
    <div style={{ padding:'32px 32px 60px', maxWidth:780, margin:'0 auto' }}>
      <SectionHeader title="Share Your Creation"
        subtitle="Review and edit your caption, then share to your preferred platform." />

      {/* Preview card */}
      <div style={{
        display:'grid', gridTemplateColumns:'200px 1fr', gap:24, marginBottom:32,
        padding:'20px', borderRadius:16, background:SURFACE_2, border:`1px solid ${BORDER_GOLD}`
      }}>
        <div style={{ height:240, borderRadius:12, overflow:'hidden', background:'linear-gradient(160deg, #0D0A2E, #2A1060)', position:'relative', flexShrink:0 }}>
          <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.15}} preserveAspectRatio="xMidYMid slice">
            <defs><pattern id="sharepat" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
              <rect x="5" y="5" width="26" height="26" fill="none" stroke={GOLD} strokeWidth="0.5"/>
              <rect x="5" y="5" width="26" height="26" fill="none" stroke={GOLD} strokeWidth="0.5" transform="rotate(45 18 18)"/>
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#sharepat)"/>
          </svg>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 45%, rgba(201,168,76,0.22) 0%, transparent 65%)'}}/>
          <div style={{position:'absolute',bottom:'42%',left:0,right:0,textAlign:'center',fontFamily:'Amiri,serif',fontSize:20,color:GOLD,direction:'rtl',textShadow:'0 0 24px rgba(201,168,76,0.55)'}}>
            تَوَكَّلْ عَلَى اللَّه
          </div>
          <div style={{position:'absolute',bottom:'28%',left:0,right:0,textAlign:'center',fontFamily:'Cinzel,serif',fontSize:9,color:'rgba(255,255,255,0.5)',letterSpacing:2}}>Trust in Allah</div>
          <div style={{position:'absolute',bottom:10,left:0,right:0,textAlign:'center',fontSize:9,color:'rgba(255,255,255,0.3)',fontFamily:'Inter,sans-serif'}}>▶ Animated · 6s</div>
        </div>
        <div>
          <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
            <GeminiBadge label="Caption generated by AI" />
            <TagChip label={session.style || 'Islamic Geometric'} color="gold" selected />
          </div>
          <div style={{ fontSize:12, color:TEXT_SECONDARY, fontFamily:'Inter,sans-serif', lineHeight:1.7 }}>
            Topic: <strong style={{color:TEXT_PRIMARY}}>{session.topic || 'Eid Mubarak'}</strong> &nbsp;·&nbsp;
            Style: <strong style={{color:TEXT_PRIMARY}}>{session.style || 'Islamic Geometric'}</strong>
          </div>
        </div>
      </div>

      {/* Platform tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {['instagram','twitter','linkedin','tiktok'].map(p => {
          const active = p === platform;
          const c = PLATFORM_COLORS[p];
          return (
            <button key={p} onClick={() => switchPlatform(p)} style={{
              padding:'8px 18px', borderRadius:20, cursor:'pointer', fontSize:13, fontFamily:'Inter,sans-serif', fontWeight:500,
              background: active ? `${c}18` : 'transparent',
              border:`1px solid ${active ? c+'55' : BORDER_SUBTLE}`,
              color: active ? c : TEXT_SECONDARY,
              transition:'all 0.2s',
              display:'flex', alignItems:'center', gap:6
            }}>
              <span style={{fontSize:14}}>{PLATFORM_ICONS[p]}</span>
              <span style={{textTransform:'capitalize'}}>{p}</span>
            </button>
          );
        })}
      </div>

      {/* Caption editor */}
      <div style={{ marginBottom:20 }}>
        <label style={{ display:'block', fontSize:11, color:TEXT_SECONDARY, marginBottom:8, textTransform:'uppercase', letterSpacing:1.5, fontFamily:'Inter,sans-serif' }}>Caption</label>
        <textarea value={caption} onChange={e => setCaption(e.target.value)}
          style={{
            width:'100%', minHeight:130, background:SURFACE_2, border:`1px solid ${BORDER_SUBTLE}`,
            borderRadius:12, color:TEXT_PRIMARY, fontSize:14, padding:'14px 16px',
            fontFamily:'Inter,sans-serif', lineHeight:1.7, resize:'vertical', outline:'none',
            caretColor:GOLD, boxSizing:'border-box', transition:'border 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = BORDER_GOLD}
          onBlur={e => e.target.style.borderColor = BORDER_SUBTLE}
        />
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
          <span style={{ fontSize:11, color:TEXT_MUTED, fontFamily:'Inter,sans-serif' }}>{caption.length} characters</span>
          <span style={{ fontSize:11, color:TEXT_MUTED, fontFamily:'Inter,sans-serif' }}>dir="auto" · RTL detection enabled</span>
        </div>
      </div>

      {/* Hashtags */}
      <div style={{ marginBottom:28 }}>
        <label style={{ display:'block', fontSize:11, color:TEXT_SECONDARY, marginBottom:10, textTransform:'uppercase', letterSpacing:1.5, fontFamily:'Inter,sans-serif' }}>Hashtags</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
          {hashtags.map(tag => (
            <div key={tag} onClick={() => removeHashtag(tag)} style={{
              padding:'4px 12px', borderRadius:20, cursor:'pointer',
              background:'rgba(201,168,76,0.08)', border:`1px solid ${BORDER_GOLD}`,
              fontSize:12, color:GOLD_DIM, fontFamily:'Inter,sans-serif',
              transition:'all 0.15s', display:'flex', alignItems:'center', gap:5
            }}>
              {tag} <span style={{ fontSize:11, opacity:0.6 }}>×</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share button */}
      {shared ? (
        <div style={{
          padding:'20px', borderRadius:14, textAlign:'center',
          background:'rgba(76,168,100,0.1)', border:'1px solid rgba(76,168,100,0.25)'
        }}>
          <div style={{ fontSize:28, marginBottom:8 }}>✓</div>
          <div style={{ fontFamily:'Cinzel,serif', fontSize:16, color:'#7DC898', marginBottom:4 }}>Shared Successfully</div>
          <div style={{ fontSize:13, color:TEXT_SECONDARY, fontFamily:'Inter,sans-serif' }}>Your card has been posted to {platform}</div>
          <div style={{ marginTop:16, display:'flex', gap:10, justifyContent:'center' }}>
            <GoldButton size="sm" variant="outline" onClick={() => goTo('home')}>Create New Card</GoldButton>
            <GoldButton size="sm" onClick={() => setShared(false)}>Share to Another Platform</GoldButton>
          </div>
        </div>
      ) : (
        <GoldButton size="lg" onClick={handleShare} style={{ width:'100%', borderRadius:12, background: sharing ? undefined : pc }}
          disabled={sharing}>
          {sharing ? 'Sharing…' : `Share to ${platform.charAt(0).toUpperCase()+platform.slice(1)}`}
        </GoldButton>
      )}
    </div>
  );
}

Object.assign(window, {
  HomeScreen, DiscoverScreen, StyleScreen, SuggestScreen,
  VariantsScreen, AnimateScreen, ShareScreen
});

// lawha-app.jsx — App root, routing, state, tweaks

const SCREENS = ['home', 'discover', 'style', 'suggest', 'variants', 'animate', 'share'];

function App() {
  const [screen, setScreen] = React.useState(() => localStorage.getItem('lawha_screen') || 'home');
  const [transitioning, setTransitioning] = React.useState(false);
  const [session, setSession] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('lawha_session') || '{}'); } catch { return {}; }
  });
  const [tweaksVisible, setTweaksVisible] = React.useState(false);

  // Persist state
  React.useEffect(() => { localStorage.setItem('lawha_screen', screen); }, [screen]);
  React.useEffect(() => { localStorage.setItem('lawha_session', JSON.stringify(session)); }, [session]);

  // Tweaks protocol
  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksVisible(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksVisible(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const [tweaks, setTweaks] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('lawha_tweaks') || 'null') || TWEAK_DEFAULTS; }
    catch { return TWEAK_DEFAULTS; }
  });

  const applyTweak = (key, val) => {
    const next = { ...tweaks, [key]: val };
    setTweaks(next);
    localStorage.setItem('lawha_tweaks', JSON.stringify(next));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
  };

  const goTo = (s) => {
    setTransitioning(true);
    setTimeout(() => { setScreen(s); setTransitioning(false); }, 180);
  };

  const goBack = () => {
    const idx = SCREENS.indexOf(screen);
    if (idx > 0) goTo(SCREENS[idx - 1]);
  };

  const update = (data) => setSession(prev => ({ ...prev, ...data }));

  const screenIndex = SCREENS.indexOf(screen);

  // Apply tweaks to CSS vars
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--lawha-gold', tweaks.accentColor);
    root.style.setProperty('--lawha-font-scale', tweaks.fontScale);
    document.body.style.fontSize = `${tweaks.fontScale}px`;
  }, [tweaks]);

  const screenProps = { session, update, goTo };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
      background: tweaks.theme === 'noir' ? '#0A0A0C' : tweaks.theme === 'emerald' ? '#040E0A' : '#06041A',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Top nav (hidden on home) */}
      {screen !== 'home' && (
        <TopNav screenIndex={screenIndex} onBack={goBack} topic={session.topic} />
      )}

      {/* Screen content */}
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.18s ease, transform 0.18s ease'
      }}>
        {screen === 'home'     && <HomeScreen     {...screenProps} />}
        {screen === 'discover' && <DiscoverScreen {...screenProps} />}
        {screen === 'style'    && <StyleScreen    {...screenProps} />}
        {screen === 'suggest'  && <SuggestScreen  {...screenProps} />}
        {screen === 'variants' && <VariantsScreen {...screenProps} />}
        {screen === 'animate'  && <AnimateScreen  {...screenProps} />}
        {screen === 'share'    && <ShareScreen    {...screenProps} />}
      </div>

      {/* Tweaks panel */}
      {tweaksVisible && <TweaksPanel tweaks={tweaks} applyTweak={applyTweak} screen={screen} goTo={goTo} />}
    </div>
  );
}

// ── Tweaks Panel ──────────────────────────────────────────────
function TweaksPanel({ tweaks, applyTweak, screen, goTo }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      width: 280, background: 'rgba(13,11,39,0.97)',
      border: '1px solid rgba(201,168,76,0.3)',
      borderRadius: 16, padding: '20px',
      backdropFilter: 'blur(24px)',
      boxShadow: '0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD, boxShadow: `0 0 8px ${GOLD}` }}/>
        <span style={{ fontSize: 12, fontFamily: 'Cinzel,serif', color: TEXT_PRIMARY, letterSpacing: 1 }}>TWEAKS</span>
      </div>

      {/* Theme */}
      <TweakRow label="Color Theme">
        {['indigo','noir','emerald'].map(t => (
          <TweakChip key={t} label={t} active={tweaks.theme === t} onClick={() => applyTweak('theme', t)} />
        ))}
      </TweakRow>

      {/* Accent color */}
      <TweakRow label="Gold Accent">
        {['#C9A84C','#E8C86A','#D4AF70','#FFD700'].map(c => (
          <button key={c} onClick={() => applyTweak('accentColor', c)} style={{
            width: 22, height: 22, borderRadius: '50%', background: c, border: tweaks.accentColor === c ? `2px solid white` : '2px solid transparent',
            cursor: 'pointer', padding: 0, flexShrink: 0
          }}/>
        ))}
      </TweakRow>

      {/* Font scale */}
      <TweakRow label="Type Scale">
        {[{label:'Compact', val:13},{label:'Regular', val:14.5},{label:'Large', val:16}].map(f => (
          <TweakChip key={f.val} label={f.label} active={tweaks.fontScale === f.val} onClick={() => applyTweak('fontScale', f.val)} />
        ))}
      </TweakRow>

      {/* Nav to screen */}
      <TweakRow label="Jump to Screen">
        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
          {SCREENS.map(s => (
            <TweakChip key={s} label={s} active={screen === s} onClick={() => goTo(s)} />
          ))}
        </div>
      </TweakRow>
    </div>
  );
}

function TweakRow({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
    </div>
  );
}

function TweakChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
      background: active ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)'}`,
      color: active ? GOLD : TEXT_SECONDARY, transition: 'all 0.15s',
      textTransform: 'capitalize'
    }}>{label}</button>
  );
}


export { App };
