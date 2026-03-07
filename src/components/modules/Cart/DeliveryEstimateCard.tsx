import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
import { Vendor } from '../../../types/vendor';
import { ThemeText } from '../../common/theme/ThemeText';

interface DeliveryEstimateCardProps {
  vendor: Vendor;
}

const DeliveryEstimateCard: React.FC<DeliveryEstimateCardProps> = ({ vendor }) => {
  const { getColor, theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 0,
      padding: 16,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconWrapper: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: '#F59E0B', // Orange color
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    text: {
      flex: 1,
      fontWeight: '600',
    },
    progressBarBackground: {
      height: 4,
      backgroundColor: getColor('border'),
      borderRadius: 2,
      width: '100%',
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#F59E0B', // Orange color
      borderRadius: 2,
      width: '20%', // Static progress for now
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#F59E0B',
      marginTop: 6,
    },
  });

  const estimatedTime = useMemo(() => {
    if (!vendor.category) return '30 mins';

    const category = vendor.category.toLowerCase();
    if (category === 'food') {
      return '35 mins';
    } else if (category === 'grocery') {
      return '20 mins';
    }

    return vendor.preparationTime || '30 mins';
  }, [vendor]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="clock-time-four-outline" size={14} color="#F59E0B" />
        </View>
        <ThemeText variant="body" color={getColor('text')} style={styles.text}>
          Estimated delivery in {estimatedTime}
        </ThemeText>
      </View>

      <View style={styles.progressBarBackground}>
        <View style={styles.progressBarFill} />
      </View>
    </View>
  );
};

export default DeliveryEstimateCard;
