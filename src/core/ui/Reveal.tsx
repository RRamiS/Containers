import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, type StyleProp, type ViewStyle } from 'react-native';
import Reanimated, {
  Easing,
  FadeInDown,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
  /** Delay en ms para stagger */
  delay?: number;
  duration?: number;
  /** Desplazamiento inicial en Y */
  fromY?: number;
  style?: StyleProp<ViewStyle>;
};

/** Entrada fade + slide (ideal para cards/gráficos). */
export function Reveal({ children, delay = 0, duration = 420, fromY = 14, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        tension: 90,
        friction: 12,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>
  );
}

const SPRING_IN = { damping: 15, stiffness: 280, mass: 0.72 };

type DropdownRevealProps = {
  open: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Origen visual del popover (arriba = tipico dropdown) */
  origin?: 'top' | 'bottom';
};

/**
 * Menú desplegable con spring en UI thread (Reanimated).
 * Escala desde el borde + fade + slide; mantiene el nodo hasta terminar el exit.
 */
export function DropdownReveal({ open, children, style, origin = 'top' }: DropdownRevealProps) {
  const progress = useSharedValue(0);
  const openRef = useRef(open);
  const [mounted, setMounted] = useState(false);

  openRef.current = open;

  const unmountIfClosed = useCallback(() => {
    if (!openRef.current) {
      setMounted(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      progress.value = withSpring(1, SPRING_IN);
      return;
    }

    progress.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) {
        runOnJS(unmountIfClosed)();
      }
    });
  }, [open, progress, unmountIfClosed]);

  const fromY = origin === 'top' ? -18 : 18;

  const panelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 0.22, 1], [0, 0.7, 1]),
      transform: [{ translateY: fromY * (1 - p) }, { scale: interpolate(p, [0, 1], [0.84, 1]) }],
    };
  }, [fromY]);

  if (!mounted) return null;

  return (
    <Reanimated.View
      style={[
        panelStyle,
        Platform.OS === 'web'
          ? ({
              transformOrigin: origin === 'top' ? 'top center' : 'bottom center',
              willChange: 'transform, opacity',
            } as object)
          : null,
        style,
      ]}
      pointerEvents={open ? 'box-none' : 'none'}
    >
      {children}
    </Reanimated.View>
  );
}

type DropdownRevealItemProps = {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Entrada escalonada de cada opción (el panel padre maneja el cierre). */
export function DropdownRevealItem({ index, children, style }: DropdownRevealItemProps) {
  return (
    <Reanimated.View
      entering={FadeInDown.springify()
        .damping(16)
        .stiffness(250)
        .mass(0.65)
        .delay(32 + Math.min(index * 40, 260))}
      style={style}
    >
      {children}
    </Reanimated.View>
  );
}
