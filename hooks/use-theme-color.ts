/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { colors } from '@/constants/theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof colors
) {
  // Always use dark theme (warm chai colors)
  return props.dark || colors[colorName] || colors.text;
}
