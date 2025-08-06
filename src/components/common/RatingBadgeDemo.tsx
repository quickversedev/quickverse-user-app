import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import RatingBadge from './RatingBadge';

const RatingBadgeDemo: React.FC = () => {
  const { getColor, getTypography } = useTheme();

  const ratings = [1.0, 2.5, 3.0, 3.8, 4.2, 4.7, 5.0];

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: getColor('background'),
    },
    title: {
      fontSize: getTypography('title'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginBottom: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: getTypography('subtitle'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      width: 60,
      marginRight: 12,
    },
    badgeContainer: {
      flexDirection: 'row',
      gap: 8,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rating Badge Demo</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Different Ratings (Medium Size)</Text>
        {ratings.map(rating => (
          <View key={rating} style={styles.row}>
            <Text style={styles.label}>{rating}</Text>
            <RatingBadge rating={rating} size="medium" />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Different Sizes (Rating: 4.5)</Text>
        <View style={styles.badgeContainer}>
          <RatingBadge rating={4.5} size="small" />
          <RatingBadge rating={4.5} size="medium" />
          <RatingBadge rating={4.5} size="large" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>With/Without Decimal</Text>
        <View style={styles.badgeContainer}>
          <RatingBadge rating={4.5} showDecimal={true} />
          <RatingBadge rating={4.5} showDecimal={false} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Color Variations</Text>
        <View style={styles.badgeContainer}>
          <RatingBadge rating={1.0} /> {/* Red */}
          <RatingBadge rating={2.5} /> {/* Yellow */}
          <RatingBadge rating={3.5} /> {/* Orange */}
          <RatingBadge rating={4.2} /> {/* Green */}
          <RatingBadge rating={4.8} /> {/* Teal */}
        </View>
      </View>
    </View>
  );
};

export default RatingBadgeDemo;
