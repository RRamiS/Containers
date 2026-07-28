import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Reanimated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { brand } from '@/config/brand';

type Props = {
  /** Si true, mantiene la splash visible (p. ej. auth cargando) */
  holding?: boolean;
};

/**
 * Pantalla de carga simbólica con logo genérico, nombre y “Diseñado por…”.
 * Animaciones en UI thread (Reanimated).
 */
export function BrandSplashScreen({ holding = false }: Props) {
  const logoScale = useSharedValue(0.55);
  const logoRotate = useSharedValue(-12);
  const ring = useSharedValue(0);
  const glow = useSharedValue(0.35);
  const progress = useSharedValue(0);
  const shimmer = useSharedValue(-1);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12, stiffness: 140, mass: 0.85 });
    logoRotate.value = withSpring(0, { damping: 14, stiffness: 120 });

    ring.value = withDelay(
      180,
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      ),
    );

    glow.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    progress.value = withDelay(
      400,
      withTiming(holding ? 0.72 : 1, {
        duration: holding ? 2400 : 1800,
        easing: Easing.out(Easing.cubic),
      }),
    );

    shimmer.value = withDelay(
      600,
      withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, false),
    );
  }, [glow, holding, logoRotate, logoScale, progress, ring, shimmer]);

  useEffect(() => {
    if (!holding) {
      progress.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    }
  }, [holding, progress]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }, { rotate: `${logoRotate.value}deg` }],
  }));

  const ringStyle = useAnimatedStyle(() => {
    const p = ring.value % 1;
    return {
      opacity: interpolate(p, [0, 0.2, 1], [0.55, 0.35, 0]),
      transform: [{ scale: interpolate(p, [0, 1], [0.85, 1.55]) }],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: interpolate(glow.value, [0.35, 0.85], [0.92, 1.08]) }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, progress.value * 100)}%`,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [-1, 1], [-80, 220]) }],
  }));

  return (
    <View style={styles.root}>
      {/* Fondo atmosférico */}
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />
      <Reanimated.View style={[styles.gridFade, Platform.OS === 'web' ? styles.gridWeb : null]} />

      <View style={styles.center}>
        {/* Halo + anillo */}
        <View style={styles.logoStage}>
          <Reanimated.View style={[styles.glowBlob, glowStyle]} />
          <Reanimated.View style={[styles.pulseRing, ringStyle]} />

          <Reanimated.View entering={FadeIn.duration(500)} style={[styles.logoMark, logoStyle]}>
            {/* Logo genérico: contenedor estilizado */}
            <View style={styles.logoInner}>
              <View style={styles.logoLid} />
              <View style={styles.logoBody}>
                <View style={styles.logoStripe} />
                <View style={[styles.logoStripe, styles.logoStripeMid]} />
                <View style={styles.logoCorner} />
              </View>
            </View>
          </Reanimated.View>
        </View>

        <Reanimated.Text
          entering={FadeInDown.springify().damping(16).stiffness(160).delay(220)}
          style={styles.appName}
        >
          {brand.appName}
        </Reanimated.Text>

        <Reanimated.Text
          entering={FadeInDown.springify().damping(16).stiffness(160).delay(340)}
          style={styles.companyName}
        >
          {brand.companyName}
        </Reanimated.Text>

        <Reanimated.Text
          entering={FadeIn.duration(600).delay(480)}
          style={styles.tagline}
        >
          {brand.tagline}
        </Reanimated.Text>

        {/* Barra de progreso con shimmer */}
        <Reanimated.View entering={FadeInUp.delay(560).duration(500)} style={styles.progressTrack}>
          <Reanimated.View style={[styles.progressFill, progressStyle]}>
            <Reanimated.View style={[styles.progressShimmer, shimmerStyle]} />
          </Reanimated.View>
        </Reanimated.View>
      </View>

      <Reanimated.View entering={FadeInUp.delay(700).duration(650)} style={styles.footer}>
        <View style={styles.designedRow}>
          <Text style={styles.designedPrefix}>{brand.designedByPrefix}</Text>
          <Text style={styles.designedName}>{brand.designedByName}</Text>
        </View>
        <View style={styles.footerLine} />
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brand.background,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgOrbTop: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(0, 132, 255, 0.14)',
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: -140,
    right: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(196, 163, 90, 0.08)',
  },
  gridFade: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  gridWeb: {
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
    backgroundSize: '42px 42px',
    maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 72%)',
  } as object,
  center: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 420,
  },
  logoStage: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  glowBlob: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: brand.accentSoft,
    ...(Platform.OS === 'web'
      ? ({ filter: 'blur(18px)' } as object)
      : {}),
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: brand.accent,
  },
  logoMark: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: '#0E1520',
    borderWidth: 1,
    borderColor: 'rgba(0, 132, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 12px 40px rgba(0,132,255,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
        } as object)
      : {
          shadowColor: brand.accent,
          shadowOpacity: 0.4,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        }),
  },
  logoInner: {
    width: 48,
    height: 44,
    alignItems: 'center',
  },
  logoLid: {
    width: 40,
    height: 7,
    borderRadius: 3,
    backgroundColor: brand.accent,
    marginBottom: 3,
  },
  logoBody: {
    width: 44,
    height: 32,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E6EDF3',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 6,
    gap: 4,
  },
  logoStripe: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(0,132,255,0.85)',
    width: '100%',
  },
  logoStripeMid: {
    width: '68%',
    backgroundColor: 'rgba(196,163,90,0.9)',
  },
  logoCorner: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: brand.accent,
  },
  appName: {
    color: '#F0F6FC',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  companyName: {
    color: 'rgba(240,246,252,0.72)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  tagline: {
    color: 'rgba(148,163,184,0.9)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 28,
  },
  progressTrack: {
    width: '72%',
    maxWidth: 240,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: brand.accent,
    overflow: 'hidden',
  },
  progressShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 48,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center',
    gap: 10,
  },
  designedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  designedPrefix: {
    color: 'rgba(148,163,184,0.75)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  designedName: {
    color: '#E6EDF3',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  footerLine: {
    width: 42,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(0,132,255,0.55)',
  },
});
