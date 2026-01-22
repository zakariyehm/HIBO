/**
 * Colors used in the app - Light theme only
 */

import { Platform } from 'react-native';

const tintColor = '#0a7ea4';

export const Colors = {
  text: '#11181C',
  textDark: '#000000',
  textLight: '#999999',
  background: '#F6F6F6',
  cardBackground: '#FFFFFF',
  tint: tintColor,
  icon: '#687076',
  iconLight: '#666666',
  tabIconDefault: '#687076',
  tabIconSelected: tintColor,
  border: '#E0E0E0',
  borderLight: '#f0f0f0',
  primary: '#000000',
  primaryText: '#FFFFFF',
  green: '#4CAF50',
  red: '#F44336',
  navbarBackground: '#1A1A1A',
  navbarIcon: '#FFFFFF',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
});
