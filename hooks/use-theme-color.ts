/**
 * Simplified theming: always use the light color palette.
 * Dark mode and system color scheme have been disabled.
 */

import { Colors } from '@/constants/theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const colorFromProps = props.light;

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors.light[colorName];
}
