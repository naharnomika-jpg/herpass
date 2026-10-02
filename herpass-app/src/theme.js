// ─── Premium Design Tokens ─────────────────────────────────────────────────────
import { Dimensions, Platform } from 'react-native';

export const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
export const isSmallPhone = SCREEN_H < 700;
export const isTallPhone  = SCREEN_H > 850;

// Safe-area bottom padding (for phones with home indicator)
export const TAB_BAR_HEIGHT = 72 + (Platform.OS === 'ios' ? 20 : 0);
export const SAFE_BOTTOM    = Platform.OS === 'ios' ? 34 : 16;

export const colors = {
  // Backgrounds – rich deep navy/slate
  bg:         '#080C18',
  bgCard:     '#0F1629',
  bgCardAlt:  '#131D35',
  bgMuted:    '#0A0F1E',
  bgInput:    '#0F1629',
  bgOverlay:  'rgba(8,12,24,0.85)',

  // Borders
  border:     '#1E2D50',
  borderDim:  '#131D35',
  borderGlow: 'rgba(99,102,241,0.35)',

  // Brand – indigo/violet gradient system
  primary:    '#6366F1',  // indigo-500
  primaryDark:'#4F46E5',  // indigo-600
  primaryGlow:'rgba(99,102,241,0.25)',
  accent:     '#8B5CF6',  // violet-500
  accentDark: '#7C3AED',  // violet-600
  accentGlow: 'rgba(139,92,246,0.25)',

  // Semantic status
  emerald:    '#10B981',
  emeraldDim: 'rgba(16,185,129,0.15)',
  amber:      '#F59E0B',
  amberDim:   'rgba(245,158,11,0.15)',
  blue:       '#3B82F6',
  blueDim:    'rgba(59,130,246,0.15)',
  rose:       '#F43F5E',
  roseDim:    'rgba(244,63,94,0.15)',
  red:        '#EF4444',
  purple:     '#A855F7',
  purpleDim:  'rgba(168,85,247,0.15)',
  cyan:       '#06B6D4',
  cyanDim:    'rgba(6,182,212,0.15)',

  // Text
  white:      '#F1F5F9',
  textPrimary:'#E2E8F0',
  muted:      '#94A3B8',
  dim:        '#4B5B78',
  dimmer:     '#2D3A52',

  // Misc
  success:    '#10B981',
  warning:    '#F59E0B',
  danger:     '#EF4444',
};

export const gradients = {
  primary:    ['#6366F1', '#8B5CF6'],
  primaryDeep:['#4F46E5', '#6D28D9'],
  success:    ['#059669', '#10B981'],
  danger:     ['#BE123C', '#F43F5E'],
  amber:      ['#D97706', '#F59E0B'],
  blue:       ['#1D4ED8', '#3B82F6'],
  hero:       ['#080C18', '#0D1530', '#080C18'],
  card:       ['rgba(15,22,41,0.95)', 'rgba(19,29,53,0.95)'],
  glass:      ['rgba(99,102,241,0.08)', 'rgba(139,92,246,0.04)'],
};

export const STATUS_COLORS = {
  OUT:           { bg: 'rgba(245,158,11,0.12)',  text: '#FCD34D', border: 'rgba(245,158,11,0.35)' },
  UPCOMING:      { bg: 'rgba(59,130,246,0.12)',  text: '#93C5FD', border: 'rgba(59,130,246,0.35)' },
  RETURNED:      { bg: 'rgba(16,185,129,0.12)',  text: '#6EE7B7', border: 'rgba(16,185,129,0.35)' },
  OVERDUE:       { bg: 'rgba(244,63,94,0.18)',   text: '#FDA4AF', border: 'rgba(244,63,94,0.5)'  },
  'LATE RETURN': { bg: 'rgba(168,85,247,0.12)',  text: '#C4B5FD', border: 'rgba(168,85,247,0.35)' },
};

export const STATUS_ICONS = {
  OUT:           'navigate-circle',
  UPCOMING:      'time-outline',
  RETURNED:      'checkmark-circle',
  OVERDUE:       'warning',
  'LATE RETURN': 'return-up-back',
};

export const STATUS_EMOJI = {
  OUT:          '🟠',
  UPCOMING:     '🔵',
  RETURNED:     '🟢',
  OVERDUE:      '🔴',
  'LATE RETURN':'🟣',
};

export const typography = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   16,
  lg:   18,
  xl:   21,
  xxl:  26,
  '3xl':32,
  '4xl':38,
};

export const radius = {
  xs:  6,
  sm:  10,
  md:  14,
  lg:  18,
  xl:  22,
  xxl: 28,
  full: 9999,
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  base:16,
  lg:  20,
  xl:  24,
  xxl: 32,
};

export const shadows = {
  primary: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
};
