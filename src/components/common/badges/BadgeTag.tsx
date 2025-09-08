import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../theme/ThemeText';

interface BadgeTagProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
}

const BadgeTag: React.FC<BadgeTagProps> = ({
  text,
  variant = 'primary',
  size = 'medium',
  style,
}) => {
  const { getColor } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: getColor('card'), textColor: getColor('text') };
      case 'success':
        return { backgroundColor: '#4CAF50', textColor: getColor('white') };
      case 'warning':
        return { backgroundColor: '#FF9800', textColor: getColor('white') };
      case 'error':
        return { backgroundColor: getColor('error'), textColor: getColor('white') };
      default:
        return { backgroundColor: getColor('primary'), textColor: getColor('white') };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 };
      case 'large':
        return { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 };
      default:
        return { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: variantStyles.backgroundColor,
      // borderRadius: sizeStyles.borderRadius,
      borderBottomRightRadius: sizeStyles.borderRadius,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
      alignSelf: 'flex-start',
    },
    text: {
      color: variantStyles.textColor,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <ThemeText variant="small" color={variantStyles.textColor} style={styles.text}>
        {text}
      </ThemeText>
    </View>
  );
};

export default BadgeTag;
