import { useColorScheme } from 'react-native';
import { palette, type ThemeColors } from '@/constants/theme';

/** Colours for the device's current light/dark setting. */
export function useTheme(): ThemeColors {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}
