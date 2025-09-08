import React from 'react';
import { TextProps } from 'react-native';
import { ThemeText } from './theme/ThemeText';

interface TruncatedTextProps extends TextProps {
  text: string;
  maxLength: number;
  variant?: 'h1' | 'h2' | 'subtitle' | 'body' | 'caption' | 'small';
  color?: string;
}

const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxLength,
  variant = 'body',
  color,
  style,
  ...props
}) => {
  const truncatedText = text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;

  return (
    <ThemeText variant={variant} color={color} style={style} {...props}>
      {truncatedText}
    </ThemeText>
  );
};

export default TruncatedText;
