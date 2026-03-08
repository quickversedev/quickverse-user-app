import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Vendor } from '../../../types/vendor';
import { ThemeText } from '../../common/theme/ThemeText';

interface VendorPillProps {
  vendor: Vendor;
}

const VendorPill: React.FC<VendorPillProps> = ({ vendor }) => {
  const { getColor, theme } = useTheme();

  const styles = StyleSheet.create({
    vendorPillContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      width: '100%',
      marginBottom: 0,
      marginLeft: 0,
      marginTop: 8,
      paddingLeft: 16,
    },
    vendorPillTab: {
      backgroundColor: getColor('card'),
      borderTopLeftRadius: theme.borderRadius.md,
      borderTopRightRadius: theme.borderRadius.md,
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: getColor('border'),
      paddingHorizontal: 24,
      paddingVertical: 12,
      minWidth: 0,
      alignItems: 'flex-start',
    },
    deliveryBadgeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: getColor('primary'),
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: getColor('card'),
      marginLeft: 'auto',
      marginRight: 16,
      marginBottom: 4,
    },
    deliveryBadgeBoxIcon: {
      width: 16,
      height: 16,
      marginRight: 4,
    },
    statIcon: {
      marginRight: 4,
    },
  });

  const preparationTime = useMemo(
    () => vendor.preparationTime || '30 mins',
    [vendor.preparationTime]
  );

  return (
    <View style={styles.vendorPillContainer}>
      <View style={styles.vendorPillTab}>
        <ThemeText variant="caption" color={getColor('text')} style={{ fontWeight: 'bold' }}>
          {vendor.name}
        </ThemeText>
      </View>
      <View style={styles.deliveryBadgeBox}>
        <MaterialCommunityIcons
          name="flash"
          size={18}
          color={getColor('primary')}
          style={styles.statIcon}
        />
        <ThemeText variant="caption" color={getColor('primary')} style={{ fontWeight: 'bold' }}>
          {preparationTime}
        </ThemeText>
      </View>
    </View>
  );
};

export default VendorPill;
