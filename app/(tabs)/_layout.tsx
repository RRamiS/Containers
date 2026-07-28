import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { industry, label } from '@/config/industry';
import { ThemeToggleSwitch } from '@/core/theme/ThemeToggleSwitch';
import { ProfileButton } from '@/core/profile/ProfileModal';
import { useTheme } from '@/core/theme/ThemeContext';

const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: 'file-text',
  map: 'map-pin',
  stats: 'bar-chart-2',
  operators: 'truck',
};

const TAB_LABELS: Record<string, string> = {
  index: 'Operaciones Diarias',
  map: 'Mapa',
  stats: 'Estadísticas',
  operators: 'Choferes',
};

function CustomTopTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useTheme();
  const [layouts, setLayouts] = useState<Record<number, { x: number; width: number }>>({});
  const translateX = useRef(new Animated.Value(0)).current;
  const pillWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const currentLayout = layouts[state.index];
    if (currentLayout) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: currentLayout.x,
          useNativeDriver: false,
          tension: 68,
          friction: 11,
        }),
        Animated.spring(pillWidth, {
          toValue: currentLayout.width,
          useNativeDriver: false,
          tension: 68,
          friction: 11,
        }),
      ]).start();
    }
  }, [state.index, layouts, translateX, pillWidth]);

  const handleItemLayout = (index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setLayouts((prev) => {
      if (prev[index]?.x === x && prev[index]?.width === width) return prev;
      return { ...prev, [index]: { x, width } };
    });
  };

  return (
    <View style={[styles.topBarContainer, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      {/* Centro: Barra Flotante de Píldora */}
      <View style={[styles.floatingPillBar, { backgroundColor: theme.pillBg, borderColor: theme.border }]}>
        {/* Píldora animada deslizante de fondo */}
        {layouts[state.index] ? (
          <Animated.View
            style={[
              styles.animatedIndicator,
              {
                transform: [{ translateX }],
                width: pillWidth,
                backgroundColor: theme.pillIndicator,
              },
            ]}
          />
        ) : null}

        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          if (options.href === null) return null;

          const isFocused = state.index === index;
          const iconName = TAB_ICONS[route.name] ?? 'disc';
          const labelText = TAB_LABELS[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onLayout={(e) => handleItemLayout(index, e)}
              onPress={onPress}
              style={styles.tabButton}
            >
              <Feather
                name={iconName}
                size={16}
                color={isFocused ? theme.text : theme.textMuted}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabLabelText,
                  { color: isFocused ? theme.text : theme.textMuted },
                  isFocused && styles.tabLabelTextActive,
                ]}
              >
                {labelText}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Derecha: Switch Modo Claro/Oscuro y Botón de Perfil */}
      <View style={styles.topRightControls}>
        <ThemeToggleSwitch />
        <ProfileButton />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTopTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: label('rental', 'plural'),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          href: industry.features.map ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Estadísticas & Transacciones',
        }}
      />
      <Tabs.Screen
        name="operators"
        options={{
          title: label('operator', 'plural'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  topBarContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  floatingPillBar: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    padding: 4,
    borderWidth: 1,
  },
  animatedIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 6,
    zIndex: 1,
  },
  tabIcon: {
    marginRight: 2,
  },
  tabLabelText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tabLabelTextActive: {
    fontWeight: '700',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
