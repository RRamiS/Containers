import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { label } from '@/config/industry';
import { ThemeProvider, useTheme } from '@/core/theme/ThemeContext';

import { useEffect } from 'react';
import { Platform } from 'react-native';

function MainStack() {
  const { mode, theme } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'custom-app-scrollbar-styles';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      const thumbColor = mode === 'dark' ? 'rgba(142, 160, 181, 0.25)' : 'rgba(100, 116, 139, 0.25)';
      const thumbHoverColor = mode === 'dark' ? 'rgba(142, 160, 181, 0.5)' : 'rgba(100, 116, 139, 0.5)';

      styleEl.innerHTML = `
        /* Eliminar bordes azules de foco por defecto en web */
        *:focus, *:focus-visible, button:focus, input:focus, select:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        /* Barra de Desplazamiento Estilizada y Minimalista */
        ::-webkit-scrollbar {
          width: 7px;
          height: 7px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${thumbColor};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${thumbHoverColor};
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: ${thumbColor} transparent;
        }
      `;
    }
  }, [mode]);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="assets/[id]"
          options={{
            headerShown: true,
            title: label('asset'),
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.text,
          }}
        />
        <Stack.Screen
          name="operators/[id]"
          options={{
            headerShown: true,
            title: label('operator'),
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.text,
          }}
        />
        <Stack.Screen
          name="assets/[id]"
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="rentals/[id]"
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
      </Stack>
    </>
  );
}

import { ToastProvider } from '@/core/ui/ToastContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainStack />
      </ToastProvider>
    </ThemeProvider>
  );
}
