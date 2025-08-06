import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeContext';

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
  const { getTypography } = useTheme();

  // Get background color based on rating
  const getBackgroundColor = (rating: number): string => {
    if (rating >= 4.5) return '#1ec28b'; // Excellent - Teal green
    if (rating >= 4.0) return '#4CAF50'; // Good - Green
    if (rating >= 3.5) return '#FF9800'; // Average - Orange
    if (rating >= 3.0) return '#FFC107'; // Below Average - Yellow
    return '#F44336'; // Poor - Red
  };

  // Get star color based on rating
  const getStarColor = (rating: number): string => {
    if (rating >= 4.0) return '#FFFFFF'; // White for good ratings
    return '#FFFFFF'; // White for all ratings
  };

  // Get text color based on rating
  const getTextColor = (rating: number): string => {
    if (rating >= 4.0) return '#FFFFFF'; // White for good ratings
    return '#FFFFFF'; // White for all ratings
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getBackgroundColor(rating),
      borderRadius: size === 'small' ? 6 : size === 'large' ? 10 : 8,
      paddingHorizontal: size === 'small' ? 6 : size === 'large' ? 10 : 8,
      paddingVertical: size === 'small' ? 1 : size === 'large' ? 3 : 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: size === 'small' ? 40 : size === 'large' ? 60 : 50,
    },
    starIcon: {
      marginRight: size === 'small' ? 1 : size === 'large' ? 3 : 2,
    },
    ratingText: {
      color: getTextColor(rating),
      fontWeight: 'bold',
      fontSize:
        size === 'small'
          ? getTypography('caption') - 2
          : size === 'large'
          ? getTypography('body')
          : getTypography('caption'),
    },
  });

  const formatRating = (rating: number): string => {
    if (showDecimal) {
      return rating.toFixed(1);
    }
    return Math.round(rating).toString();
  };

  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons
        name="star"
        size={size === 'small' ? 10 : size === 'large' ? 16 : 14}
        color={getStarColor(rating)}
        style={styles.starIcon}
      />
      <Text style={styles.ratingText}>{formatRating(rating)}</Text>
    </View>
  );
};

export default RatingBadge;
