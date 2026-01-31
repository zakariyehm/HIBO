/**
 * App theme – colors, fonts, typography, spacing.
 * Use these tokens across the app for a consistent, professional look.
 */

import { Platform } from 'react-native';

// ─── Colors ─────────────────────────────────────────────────────────────────
const tintColor = '#0a7ea4';

export const Colors = {
  // Text
  text: '#11181C',
  textDark: '#000000',
  textLight: '#999999',
  // Surfaces
  background: '#F6F6F6',
  cardBackground: '#FFFFFF',
  // Brand & UI
  tint: tintColor,
  primary: '#000000',
  primaryText: '#FFFFFF',
  // Icons
  icon: '#687076',
  iconLight: '#666666',
  tabIconDefault: '#687076',
  tabIconSelected: tintColor,
  // Borders
  border: '#E0E0E0',
  borderLight: '#f0f0f0',
  // Status
  green: '#4CAF50',
  red: '#F44336',
  love: '#E91E63',
  pass: '#757575',
  // Nav
  navbarBackground: '#1A1A1A',
  navbarIcon: '#FFFFFF',
} as const;

// ─── Font families (platform-aware) ──────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
}) as { sans: string; serif: string; rounded: string; mono: string };

// ─── Font sizes (scale) ──────────────────────────────────────────────────────
export const FontSize = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 15,
  xl: 18,
  xxl: 20,
  display: 24,
  hero: 28,
  /** Bio/prompt body – large serif */
  bio: 32,
} as const;

// ─── Font weights ──────────────────────────────────────────────────────────
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ─── Line heights ──────────────────────────────────────────────────────────
export const LineHeight = {
  tight: 18,
  base: 22,
  relaxed: 28,
  /** For bio/prompt 32px font */
  bio: 42,
} as const;

// ─── Spacing scale (use for margin, padding, gap) ────────────────────────────
export const Spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
} as const;

// ─── Border radius ────────────────────────────────────────────────────────
export const Radius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 10,
  pill: 999,
} as const;

// ─── Typography presets (use in StyleSheet or inline) ───────────────────────
/** Small label – e.g. bio title, prompt question, post card title */
export const Typography = {
  label: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  /** Large body – e.g. bio text, prompt answer, post description */
  bodyLarge: {
    fontSize: FontSize.bio,
    fontWeight: FontWeight.bold,
    color: Colors.textDark,
    lineHeight: LineHeight.bio,
    letterSpacing: -0.5,
    fontFamily: Fonts.serif,
  },
  /** Screen/page title */
  title: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    color: Colors.textDark,
    letterSpacing: -0.5,
  },
  /** Profile/card name */
  titleLarge: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
    color: Colors.textDark,
  },
  /** Secondary text – captions, hints */
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.textLight,
  },
  /** Button / pill text */
  button: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textDark,
  },
} as const;
