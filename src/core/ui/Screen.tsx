import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme';

type Props = {
  title?: string;
  subtitle?: string;
  loading?: boolean;
  right?: ReactNode;
  children: ReactNode;
};

export function Screen({ title, subtitle, loading, right, children }: Props) {
  const { theme } = useTheme();
  const hasTitleOrSubtitle = Boolean((title && title.trim() !== '') || (subtitle && subtitle.trim() !== ''));
  const hasHeader = hasTitleOrSubtitle || Boolean(right);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (loading) return;
    fade.setValue(0);
    slide.setValue(8);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, tension: 120, friction: 14 }),
    ]).start();
  }, [loading, fade, slide]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {hasHeader ? (
        <View style={styles.header}>
          {hasTitleOrSubtitle ? (
            <View style={styles.headerText}>
              {title ? <Text style={[typography.title, { color: theme.text }]}>{title}</Text> : null}
              {subtitle ? <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text> : null}
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {right}
        </View>
      ) : null}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  headerText: { flex: 1 },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
