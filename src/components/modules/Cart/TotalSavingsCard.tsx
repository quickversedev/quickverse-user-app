import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

interface TotalSavingsCardProps {
  savings: number;
}

const TotalSavingsCard: React.FC<TotalSavingsCardProps> = ({ savings }) => {
  const { getTypography, theme } = useTheme();
  const ff = theme.typography.fontFamily;

  if (!savings || savings <= 0) return null;

  const formattedSavings = savings % 1 === 0 ? savings.toFixed(0) : savings.toFixed(2);

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: '#ECFDF5',
          borderColor: '#A7F3D0',
          borderRadius: theme.borderRadius.md,
        },
        Platform.select({
          ios: {
            shadowColor: '#059669',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
          },
          android: { elevation: 3 },
        }),
      ]}
    >
      <View style={styles.leftRow}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="tag-heart" size={20} color="#059669" />
        </View>

        <View style={styles.textContainer}>
          <ThemeText
            style={[
              styles.mainTitle,
              {
                color: '#065F46',
                fontFamily: ff,
                fontSize: getTypography('body'),
              },
            ]}
          >
            Your total savings are : ₹{formattedSavings}
          </ThemeText>

          <ThemeText
            style={[
              styles.subTitle,
              {
                color: '#047857',
                fontFamily: ff,
                fontSize: getTypography('caption'),
              },
            ]}
          >
            Great choice! You saved money with this order.
          </ThemeText>
        </View>
      </View>

      <View style={styles.savingsBadge}>
        <ThemeText style={styles.badgeText}>₹{formattedSavings}</ThemeText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  mainTitle: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subTitle: {
    marginTop: 3,
    fontWeight: '500',
    lineHeight: 16,
  },
  savingsBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

export default TotalSavingsCard;
