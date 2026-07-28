import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme';

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  badge?: { label: string; color: string };
  right?: ReactNode;
};

export function ListCard({ title, subtitle, meta, onPress, badge, right }: Props) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: `${badge.color}22` }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text> : null}
        {meta ? <Text style={[styles.meta, { color: theme.textMuted }]}>{meta}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.9 },
  body: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    fontSize: 16,
    flex: 1,
  },
  subtitle: {
    ...typography.body,
    marginTop: 4,
  },
  meta: {
    ...typography.caption,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
