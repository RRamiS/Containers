import { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  pressScale?: number;
  hoverScale?: number;
  /** Sombra al hover (web / desktop) */
  hoverShadow?: boolean;
  children: React.ReactNode;
};

/**
 * Micro-interacciones: scale al press + hover con sombra.
 */
export function PressableMotion({
  style,
  contentStyle,
  disabled,
  pressScale = 0.985,
  hoverScale = 1.012,
  hoverShadow = true,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const { mode } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const [hovered, setHovered] = useState(false);

  const to = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      tension: 320,
      friction: 20,
    }).start();
  };

  const handlePressIn = (e: GestureResponderEvent) => {
    if (!disabled) to(pressScale);
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    if (!disabled) to(hovered && Platform.OS === 'web' ? hoverScale : 1);
    onPressOut?.(e);
  };

  const hoverElevationStyle: ViewStyle | null =
    hoverShadow && hovered && !disabled
      ? Platform.select({
          web: {
            boxShadow:
              mode === 'light'
                ? '0 0 0 1px rgba(0,122,255,0.22), 0 6px 18px rgba(0,122,255,0.12), 0 2px 6px rgba(15,23,42,0.06)'
                : '0 0 0 1px rgba(0,122,255,0.35), 0 10px 28px rgba(0,0,0,0.5), 0 2px 8px rgba(0,122,255,0.15)',
            zIndex: 2,
          } as ViewStyle,
          default: {
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: mode === 'light' ? 0.18 : 0.35,
            shadowRadius: 12,
            elevation: 6,
            zIndex: 2,
          },
        }) ?? null
      : null;

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...(Platform.OS === 'web'
        ? {
            onHoverIn: () => {
              if (disabled) return;
              setHovered(true);
              to(hoverScale);
            },
            onHoverOut: () => {
              setHovered(false);
              to(1);
            },
          }
        : {})}
      style={[
        Platform.OS === 'web' ? ({ cursor: disabled ? 'default' : 'pointer' } as object) : null,
        style,
      ]}
      {...rest}
    >
      <Animated.View
        style={[
          { transform: [{ scale }] },
          Platform.OS === 'web'
            ? ({ transition: 'box-shadow 160ms ease, background-color 140ms ease' } as object)
            : null,
          hoverElevationStyle,
          contentStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
