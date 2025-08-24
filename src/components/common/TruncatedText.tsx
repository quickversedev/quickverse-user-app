import React, { useState } from 'react';
import { Text, TextProps } from 'react-native';

interface TruncatedTextProps extends TextProps {
  text: string;
  maxWidth?: number;
  ellipsis?: string;
}

const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxWidth,
  ellipsis = '...',
  style,
  ...textProps
}) => {
  const [truncatedText, setTruncatedText] = useState(text);
  const [isTruncated, setIsTruncated] = useState(false);

  const onTextLayout = (event: any) => {
    const { lines } = event.nativeEvent;

    if (lines.length > 1) {
      // Text is wrapping to multiple lines, truncate it
      const firstLine = lines[0];
      const truncated = firstLine.text + ellipsis;
      setTruncatedText(truncated);
      setIsTruncated(true);
    } else if (lines.length === 1 && lines[0].width > (maxWidth || 0)) {
      // Single line but text is too wide, need to truncate
      const line = lines[0];
      const availableWidth = maxWidth || line.width;
      const ellipsisWidth = 20; // Approximate width of ellipsis
      const availableTextWidth = availableWidth - ellipsisWidth;

      // Estimate characters that can fit
      const avgCharWidth = line.width / line.text.length;
      const maxChars = Math.floor(availableTextWidth / avgCharWidth);

      if (maxChars > 0) {
        const truncated = text.substring(0, maxChars) + ellipsis;
        setTruncatedText(truncated);
        setIsTruncated(true);
      }
    } else {
      // Text fits properly
      setTruncatedText(text);
      setIsTruncated(false);
    }
  };

  return (
    <Text style={style} onTextLayout={onTextLayout} numberOfLines={1} {...textProps}>
      {truncatedText}
    </Text>
  );
};

export default TruncatedText;
