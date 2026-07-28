import { StyleSheet } from 'react-native';
import { industry } from '@/config/industry';

export const colors = {
  primary: '#0F1216',
  accent: industry.accentColor,
  background: '#0F1216',
  surface: '#161C23',
  text: '#FFFFFF',
  textMuted: '#8EA0B5',
  border: '#1E232A',
  danger: '#F85149',
  success: '#2E7D32',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
};

export const typography = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontSize: 15,
    color: colors.text,
  },
  caption: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
