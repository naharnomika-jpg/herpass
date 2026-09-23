// ─── Design Tokens ────────────────────────────────────────────────────────────
export const colors = {
  // Backgrounds
  bg:       '#0f172a',
  bgCard:   '#1e293b',
  bgMuted:  '#0f172a',
  bgInput:  '#1e293b',
  border:   '#334155',
  borderDim:'#1e293b',

  // Brand
  pink:     '#ec4899',
  pinkDark: '#be185d',
  rose:     '#f43f5e',

  // Status
  emerald:  '#10b981',
  amber:    '#f59e0b',
  blue:     '#3b82f6',
  purple:   '#a855f7',
  red:      '#ef4444',

  // Text
  white:    '#f1f5f9',
  muted:    '#94a3b8',
  dim:      '#64748b',
};

export const STATUS_COLORS = {
  OUT:          { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  UPCOMING:     { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  RETURNED:     { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  OVERDUE:      { bg: '#991b1b',               text: '#fff',    border: '#ef4444' },
  'LATE RETURN':{ bg: 'rgba(168,85,247,0.12)', text: '#c084fc', border: 'rgba(168,85,247,0.3)' },
};

export const STATUS_EMOJI = {
  OUT:          '🟠',
  UPCOMING:     '🔵',
  RETURNED:     '🟢',
  OVERDUE:      '🔴',
  'LATE RETURN':'🟣',
};

export const typography = {
  xs:   10,
  sm:   12,
  base: 14,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  '3xl':28,
};
