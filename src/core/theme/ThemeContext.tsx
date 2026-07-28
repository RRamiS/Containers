import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type ThemeMode = 'dark' | 'light';

export type ThemeColors = {
  mode: ThemeMode;
  background: string;
  surface: string;
  surfaceBorder: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  accent: string;
  pillBg: string;
  pillIndicator: string;
  tableHeaderBg: string;
  tableRowBg: string;
  tableRowPressed: string;
  tableRowHover: string;
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  danger: string;
  success: string;
  shadow: string;
  overlay: string;
};

export const darkTheme: ThemeColors = {
  mode: 'dark',
  background: '#0F1216',
  surface: '#161C23',
  surfaceBorder: '#242C37',
  card: '#161C23',
  text: '#FFFFFF',
  textMuted: '#8EA0B5',
  border: '#1E232A',
  primary: '#0F1216',
  accent: '#C4A35A',
  pillBg: '#161C23',
  pillIndicator: '#343D49',
  tableHeaderBg: '#1C2128',
  tableRowBg: '#0F1216',
  tableRowPressed: '#1A2027',
  tableRowHover: '#151B22',
  inputBg: '#161C23',
  inputBorder: '#262C36',
  inputFocusBorder: '#3B82F6',
  danger: '#F85149',
  success: '#2E7D32',
  shadow: 'rgba(0,0,0,0.35)',
  overlay: 'rgba(0,0,0,0.55)',
};

/** Light más moderno: fondo frío suave, superficies limpias, bordes menos grises */
export const lightTheme: ThemeColors = {
  mode: 'light',
  background: '#EEF2F7',
  surface: '#FFFFFF',
  surfaceBorder: '#E4EAF2',
  card: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#5B6B7C',
  border: '#E4EAF2',
  primary: '#FFFFFF',
  accent: '#B8934A',
  pillBg: '#E2E8F0',
  pillIndicator: '#FFFFFF',
  tableHeaderBg: '#F1F5F9',
  tableRowBg: '#FFFFFF',
  tableRowPressed: '#E8EEF6',
  tableRowHover: '#F5F8FC',
  inputBg: '#FFFFFF',
  inputBorder: '#D5DEE9',
  inputFocusBorder: '#3B82F6',
  danger: '#DC2626',
  success: '#16A34A',
  shadow: 'rgba(15, 23, 42, 0.08)',
  overlay: 'rgba(15, 23, 42, 0.35)',
};

export const cardShadow = (mode: ThemeMode) =>
  Platform.select({
    web: {
      boxShadow:
        mode === 'light'
          ? '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)'
          : '0 1px 2px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.25)',
    } as object,
    default: {
      shadowColor: mode === 'light' ? '#0F172A' : '#000',
      shadowOffset: { width: 0, height: mode === 'light' ? 2 : 4 },
      shadowOpacity: mode === 'light' ? 0.06 : 0.3,
      shadowRadius: mode === 'light' ? 8 : 12,
      elevation: mode === 'light' ? 2 : 4,
    },
  });

type ThemeContextType = {
  mode: ThemeMode;
  theme: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = '@containers/theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  theme: darkTheme,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
          setMode(stored);
        }
      } catch (error) {
        console.warn('Could not load theme mode:', error);
      }
    })();
  }, []);

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
    void AsyncStorage.setItem(STORAGE_KEY, newMode);
  };

  const toggleTheme = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
  };

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
