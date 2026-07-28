import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

import { toast } from '@/core/ui/ToastContext';

export function ThemeToggleSwitch() {
  const { mode, toggleTheme } = useTheme();
  const translateX = useRef(new Animated.Value(mode === 'dark' ? 28 : 2)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: mode === 'dark' ? 28 : 2,
      useNativeDriver: false,
      tension: 68,
      friction: 11,
    }).start();
  }, [mode, translateX]);

  const isDark = mode === 'dark';

  const handleToggle = () => {
    const nextModeName = isDark ? 'Claro ☀️' : 'Oscuro 🌙';
    toggleTheme();
    toast.info(`Modo ${nextModeName} activado`);
  };

  return (
    <Pressable
      onPress={handleToggle}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#161C23' : '#E2E8F0',
          borderColor: isDark ? '#242C37' : '#CBD5E1',
        },
      ]}
      accessibilityRole="switch"
      accessibilityLabel="Cambiar tema claro u oscuro"
    >
      {/* Píldora animada deslizante de fondo */}
      <Animated.View
        style={[
          styles.indicator,
          {
            transform: [{ translateX }],
            backgroundColor: isDark ? '#343D49' : '#FFFFFF',
          },
        ]}
      />

      <View style={styles.iconSlot}>
        <Feather
          name="sun"
          size={14}
          color={!isDark ? '#F59E0B' : '#8EA0B5'}
        />
      </View>
      <View style={styles.iconSlot}>
        <Feather
          name="moon"
          size={14}
          color={isDark ? '#FFFFFF' : '#64748B'}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    height: 32,
    borderRadius: 18,
    padding: 2,
    borderWidth: 1,
  },
  indicator: {
    position: 'absolute',
    top: 2,
    left: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  iconSlot: {
    width: 28,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});
