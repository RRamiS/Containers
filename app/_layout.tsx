import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { label } from '@/config/industry';
import { AuthProvider, useAuth } from '@/core/auth/AuthContext';
import { ThemeProvider, useTheme } from '@/core/theme/ThemeContext';
import { ToastProvider } from '@/core/ui/ToastContext';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inLoginRoute = segments[0] === 'login';
    if (!isAuthenticated && !inLoginRoute) {
      router.replace('/login');
    } else if (isAuthenticated && inLoginRoute) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117' }}>
        <ActivityIndicator size="large" color="#0084FF" />
      </View>
    );
  }

  return <>{children}</>;
}

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
        *:focus, *:focus-visible, button:focus, input:focus, select:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        button, [role="button"], a, .cursor-pointer {
          transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 140ms ease, background-color 160ms ease, border-color 160ms ease, box-shadow 180ms ease !important;
        }

        /* Filas / cards clickeables en web */
        [data-hoverable="true"]:hover {
          filter: brightness(${mode === 'dark' ? '1.08' : '0.985'});
        }

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

        /* Light: fondo de página un poco más rico */
        ${
          mode === 'light'
            ? `body, #root { background: #EEF2F7 !important; }`
            : `body, #root { background: #0F1216 !important; }`
        }
      `;
    }
  }, [mode]);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" />
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
      </AuthGuard>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainStack />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
