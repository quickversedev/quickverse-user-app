import React from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../theme/ThemeText';

interface RatingBadgeProps {
  rating: number;
  size?: 'small' | 'medium' | 'large';
  showDecimal?: boolean;
  style?: any;
}

const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  size = 'medium',
  showDecimal = true,
  style,
}) => {
  const { getColor, theme } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { container: 16, icon: 12, text: 10 };
      case 'large':
        return { container: 24, icon: 18, text: 14 };
      default:
        return { container: 20, icon: 14, text: 12 };
    }
  };

  const sizeStyles = getSizeStyles();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('primary'),
      borderRadius: sizeStyles.container / 2,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    icon: {
      marginRight: 2,
    },
    text: {
      color: getColor('white'),
    },
  });

  const formatRating = (rating: number): string => {
    if (showDecimal) {
      return rating.toFixed(1);
    }
    return Math.round(rating).toString();
  };

  // Don't render badge if rating is 0 or less
  if (rating <= 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons
        name="star"
        size={sizeStyles.icon}
        color={getColor('white')}
        style={styles.icon}
      />
      <ThemeText variant="small" color={getColor('white')} style={styles.text}>
        {formatRating(rating)}
      </ThemeText>
    </View>
  );
};

export default RatingBadge;
