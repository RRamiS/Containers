import React, { createContext, useCallback, useContext, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/core/theme/ThemeContext';

export type ToastType = 'success' | 'info' | 'error' | 'warning' | 'loading';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number; // ms, default 4000
}

interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  anim: Animated.Value;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => string;
  hideToast: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalShowToast: ((options: ToastOptions) => string) | null = null;

export const toast = {
  show: (options: ToastOptions) => globalShowToast?.(options),
  success: (title: string, description?: string) =>
    globalShowToast?.({ type: 'success', title, description }),
  error: (title: string, description?: string) =>
    globalShowToast?.({ type: 'error', title, description }),
  info: (title: string, description?: string) =>
    globalShowToast?.({ type: 'info', title, description }),
  warning: (title: string, description?: string) =>
    globalShowToast?.({ type: 'warning', title, description }),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;

      Animated.timing(target.anim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }).start(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      });

      return prev;
    });
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = options.id || Math.random().toString(36).substring(2, 9);
      const type = options.type || 'info';
      const anim = new Animated.Value(0);

      const newToast: ToastItem = {
        ...options,
        id,
        type,
        anim,
      };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Max 5 toasts visible

      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }).start();

      if (type !== 'loading' && options.duration !== 0) {
        const dur = options.duration || 4000;
        setTimeout(() => {
          hideToast(id);
        }, dur);
      }

      return id;
    },
    [hideToast],
  );

  globalShowToast = showToast;

  const success = useCallback(
    (title: string, description?: string) => showToast({ type: 'success', title, description }),
    [showToast],
  );
  const error = useCallback(
    (title: string, description?: string) => showToast({ type: 'error', title, description }),
    [showToast],
  );
  const info = useCallback(
    (title: string, description?: string) => showToast({ type: 'info', title, description }),
    [showToast],
  );
  const warning = useCallback(
    (title: string, description?: string) => showToast({ type: 'warning', title, description }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast, success, error, info, warning }}>
      {children}

      {/* Renderizado de Toasts en la parte superior derecha */}
      <View style={styles.toastOverlayContainer} pointerEvents="box-none">
        {toasts.map((item) => (
          <SingleToastCard
            key={item.id}
            item={item}
            isDark={isDark}
            theme={theme}
            onClose={() => hideToast(item.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function SingleToastCard({
  item,
  isDark,
  theme,
  onClose,
}: {
  item: ToastItem;
  isDark: boolean;
  theme: any;
  onClose: () => void;
}) {
  const { type, title, description, actionLabel, onAction, anim } = item;

  // Icono y color principal según la variante exacta del diseño
  let iconName: keyof typeof Feather.glyphMap = 'info';
  let accentColor = '#3B82F6'; // Info (Azul)

  if (type === 'success') {
    iconName = 'check-circle';
    accentColor = '#22C55E'; // Verde
  } else if (type === 'error') {
    iconName = 'alert-circle';
    accentColor = '#EF4444'; // Rojo
  } else if (type === 'warning') {
    iconName = 'alert-triangle';
    accentColor = '#F59E0B'; // Ámbar
  } else if (type === 'loading') {
    iconName = 'loader';
    accentColor = '#3B82F6'; // Azul
  }

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  return (
    <Animated.View
      style={[
        styles.toastCard,
        {
          backgroundColor: isDark ? '#161B22' : '#FFFFFF',
          borderColor: isDark ? '#262D37' : '#E2E8F0',
          opacity: anim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.toastHeaderRow}>
        {/* Ícono de Estado */}
        <View style={styles.iconWrap}>
          <Feather name={iconName} size={18} color={accentColor} />
        </View>

        {/* Título y Descripción */}
        <View style={styles.toastTextContent}>
          <Text style={[styles.toastTitle, { color: type === 'info' || type === 'loading' ? accentColor : (type === 'error' ? accentColor : (type === 'warning' ? accentColor : (type === 'success' ? (isDark ? '#4ADE80' : '#166534') : theme.text))) }]}>
            {title}
          </Text>
          {description ? (
            <Text style={[styles.toastDescription, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {description}
            </Text>
          ) : null}
        </View>

        {/* Botón de Acción Opcional (ej. Refresh / Retry) */}
        {actionLabel ? (
          <Pressable
            style={({ pressed }) => [
              styles.toastActionBtn,
              { backgroundColor: accentColor },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => {
              onAction?.();
              onClose();
            }}
          >
            <Text style={styles.toastActionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}

        {/* Botón de Cierre (X) */}
        <Pressable
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && { backgroundColor: isDark ? '#262C36' : '#F1F5F9' },
          ]}
          onPress={onClose}
          hitSlop={8}
        >
          <Feather name="x" size={14} color={isDark ? '#64748B' : '#94A3B8'} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastOverlayContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 99999,
    gap: 10,
    maxWidth: 420,
    width: '90%',
  },
  toastCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  toastHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    marginTop: 2,
  },
  toastTextContent: {
    flex: 1,
    gap: 3,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  toastDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  toastActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
