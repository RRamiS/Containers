import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme';
import { PressableMotion } from './PressableMotion';

type Option = { label: string; value: string };

type Props = {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  error?: string;
};

export function SelectField({ label, value, options, onChange, error }: Props) {
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <PressableMotion
              key={option.value}
              onPress={() => onChange(option.value)}
              pressScale={0.96}
              hoverScale={1.04}
              contentStyle={[
                styles.chip,
                {
                  backgroundColor: selected ? (isDark ? '#343D49' : '#007AFF') : theme.surface,
                  borderColor: selected ? (isDark ? '#343D49' : '#007AFF') : theme.border,
                },
                !isDark && !selected
                  ? {
                      shadowColor: '#0F172A',
                      shadowOpacity: 0.04,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 1 },
                      elevation: 1,
                    }
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: selected ? '#FFFFFF' : theme.text },
                  selected && styles.chipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </PressableMotion>
          );
        })}
      </View>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 14 },
  chipTextSelected: { fontWeight: '600' },
  error: { marginTop: spacing.xs, fontSize: 12 },
});
