import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  inputBg: string;
  inputBorder: string;
  danger: string;
  success: string;
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
  inputBg: '#161C23',
  inputBorder: '#262C36',
  danger: '#F85149',
  success: '#2E7D32',
};

export const lightTheme: ThemeColors = {
  mode: 'light',
  background: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceBorder: '#E2E8F0',
  card: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  primary: '#FFFFFF',
  accent: '#C4A35A',
  pillBg: '#E2E8F0',
  pillIndicator: '#FFFFFF',
  tableHeaderBg: '#F1F5F9',
  tableRowBg: '#FFFFFF',
  tableRowPressed: '#F8FAFC',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  danger: '#DC2626',
  success: '#16A34A',
};

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
