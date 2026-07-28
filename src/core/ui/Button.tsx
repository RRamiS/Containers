import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, loading, variant = 'primary', style, disabled, ...rest }: Props) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: '#007AFF', border: 'transparent' };
      case 'secondary':
        return { backgroundColor: theme.surface, border: theme.border };
      case 'danger':
        return { backgroundColor: theme.danger, border: 'transparent' };
      case 'ghost':
        return { backgroundColor: 'transparent', border: 'transparent' };
    }
  };

  const vStyle = getVariantStyles();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: vStyle.backgroundColor,
          borderColor: vStyle.border,
          borderWidth: variant === 'secondary' ? 1 : 0,
        },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? theme.text : '#fff'} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: variant === 'secondary' || variant === 'ghost' ? theme.text : '#FFFFFF' },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
