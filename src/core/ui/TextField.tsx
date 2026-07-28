import { useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, style, onFocus, onBlur, ...rest }: Props) {
  const { mode, theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const setFocus = (next: boolean) => {
    setFocused(next);
    Animated.timing(focusAnim, {
      toValue: next ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = error
    ? theme.danger
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.inputBorder, theme.inputFocusBorder],
      });

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Animated.View
        style={[
          styles.inputWrap,
          {
            backgroundColor: theme.inputBg,
            borderColor: error ? theme.danger : borderColor,
          },
          focused && mode === 'light'
            ? {
                shadowColor: '#3B82F6',
                shadowOpacity: 0.12,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
              }
            : null,
          Platform.OS === 'web' && focused
            ? ({ boxShadow: `0 0 0 3px ${mode === 'light' ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.25)'}` } as object)
            : null,
        ]}
      >
        <TextInput
          placeholderTextColor={theme.textMuted}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              color: theme.text,
            },
            style,
          ]}
          {...rest}
        />
      </Animated.View>
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
  inputWrap: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  error: { marginTop: spacing.xs, fontSize: 12 },
});
