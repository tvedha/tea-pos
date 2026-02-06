import { MD3DarkTheme } from 'react-native-paper';

export const colors = {
  primary: '#FF6B35', // Saffron/Orange
  secondary: '#00695C', // Teal
  background: '#121212',
  surface: '#1E1E1E',
  text: '#F5F5F5',
  textSecondary: '#E0E0E0',
  error: '#CF6679',
  success: '#4CAF50',
  warning: '#FFC107',
  white: '#FFFFFF',
  black: '#000000',
  border: '#333333',
  disabled: '#666666',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    onSurface: colors.text,
    surfaceVariant: colors.surface,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 28, fontWeight: 'bold' },
  h3: { fontSize: 24, fontWeight: '600' },
  h4: { fontSize: 20, fontWeight: '600' },
  body1: { fontSize: 16, fontWeight: '400' },
  body2: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  button: { fontSize: 16, fontWeight: '500' },
};
