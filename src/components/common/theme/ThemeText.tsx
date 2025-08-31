import React from 'react';
import { Platform, StyleSheet, Text, TextProps } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface ThemeTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'subtitle' | 'body' | 'caption' | 'small';
  color?: string;
}

export const ThemeText: React.FC<ThemeTextProps> = ({
  variant = 'body',
  style,
  color,
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    text: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography[variant],
      lineHeight: theme.typography[variant] * theme.typography.lineHeightMultiplier,
      color: color || theme.colors.text,
      ...(Platform.OS === 'ios' ? { fontWeight: '400' as const } : null),
    },
  });

  return (
    <Text style={[styles.text, style]} {...props}>
      {children}
    </Text>
  );
};
