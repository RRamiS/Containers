import { StyleSheet } from 'react-native';
import { industry } from '@/config/industry';

export const colors = {
  primary: industry.primaryColor,
  accent: industry.accentColor,
  background: '#F4F6F5',
  surface: '#FFFFFF',
  text: '#1A1F1C',
  textMuted: '#5C6B63',
  border: '#D5DED9',
  danger: '#B3261E',
  success: '#2E7D32',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 18,
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
