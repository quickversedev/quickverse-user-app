import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

// Use the actual font file name that exists in assets
const FONT_NAME = 'BricolageGrotesque-Regular';

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
      fontFamily: FONT_NAME,
      fontSize: theme.typography[variant],
      lineHeight: theme.typography[variant] * theme.typography.lineHeightMultiplier,
      color: color || theme.colors.text,
    },
  });

  return (
    <Text style={[styles.text, style]} {...props}>
      {children}
    </Text>
  );
};
