import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, style, ...rest }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBg,
            borderColor: error ? theme.danger : theme.inputBorder,
            color: theme.text,
          },
          style,
        ]}
        {...rest}
      />
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
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  error: { marginTop: spacing.xs, fontSize: 12 },
});
