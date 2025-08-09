import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface BadgeTagProps {
  value: string | number;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  orientation?: 'vertical' | 'horizontal';
  style?: StyleProp<ViewStyle>;
}

const BadgeTag: React.FC<BadgeTagProps> = ({
  value,
  color = '#F44336', // Default red color
  size = 'medium',
  orientation = 'vertical',
  style,
}) => {
  const { getTypography } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: color,
      // borderRadius: size === 'small' ? 8 : size === 'large' ? 16 : 12,
      paddingHorizontal: size === 'small' ? 6 : size === 'large' ? 12 : 8,
      paddingVertical: size === 'small' ? 3 : size === 'large' ? 6 : 4,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: size === 'small' ? 40 : size === 'large' ? 80 : 60,
      minHeight: size === 'small' ? 24 : size === 'large' ? 48 : 36,
      // Shadow for 3D effect
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      borderBottomEndRadius: size === 'small' ? 8 : size === 'large' ? 16 : 12,
      elevation: 5,
    },
    horizontalContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: size === 'small' ? 8 : size === 'large' ? 16 : 12,
      paddingVertical: size === 'small' ? 4 : size === 'large' ? 8 : 6,
    },
    text: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      fontSize:
        size === 'small'
          ? getTypography('caption') - 2
          : size === 'large'
          ? getTypography('subtitle')
          : getTypography('caption'),
    },
    verticalText: {
      lineHeight: size === 'small' ? 12 : size === 'large' ? 20 : 16,
    },
    horizontalText: {
      lineHeight: size === 'small' ? 14 : size === 'large' ? 22 : 18,
    },
  });

  const formatValue = (value: string | number): string => {
    if (typeof value === 'number') {
      return `${Math.floor(value)}%`;
    }
    return value.toString();
  };

  const renderText = () => {
    const formattedValue = formatValue(value);

    if (orientation === 'vertical') {
      // Split text for vertical layout (e.g., "50%" on top, "OFF" below)
      const parts = formattedValue.split('%');
      if (parts.length > 1) {
        return (
          <>
            <Text style={[styles.text, styles.verticalText]}>{parts[0]}%</Text>
            <Text style={[styles.text, styles.verticalText]}>OFF</Text>
          </>
        );
      }
      return <Text style={[styles.text, styles.verticalText]}>{formattedValue}</Text>;
    } else {
      // Horizontal layout
      return <Text style={[styles.text, styles.horizontalText]}>{formattedValue}</Text>;
    }
  };

  return (
    <View
      style={[orientation === 'horizontal' ? styles.horizontalContainer : styles.container, style]}
    >
      {renderText()}
    </View>
  );
};

export default BadgeTag;
