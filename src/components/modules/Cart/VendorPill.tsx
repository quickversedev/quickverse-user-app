import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Icons } from '../../../assets';
import { useTheme } from '../../../theme/ThemeContext';
import { Vendor } from '../../../types/vendor';

interface VendorPillProps {
  vendor: Vendor;
}

const VendorPill: React.FC<VendorPillProps> = ({ vendor }) => {
  const { getColor, getTypography, theme } = useTheme();

  const styles = StyleSheet.create({
    vendorPillContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginBottom: 0,
      marginLeft: 16,
      marginTop: 0,
    },
    vendorPillTab: {
      backgroundColor: getColor('card'),
      borderTopLeftRadius: theme.borderRadius.md,
      borderTopRightRadius: theme.borderRadius.md,
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0,
      paddingHorizontal: 24,
      paddingVertical: 12,
      minWidth: 0,
      alignItems: 'flex-start',
    },
    vendorPillTabText: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
    },
    deliveryBadgeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: getColor('primary'),
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: 'transparent',
      position: 'absolute',
      right: 32,
      top: 2,
      zIndex: 2,
    },
    deliveryBadgeBoxText: {
      color: getColor('primary'),
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
    },
    deliveryBadgeBoxIcon: {
      width: 16,
      height: 16,
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
        <Text style={styles.vendorPillTabText}>{vendor.name}</Text>
      </View>
      <View style={styles.deliveryBadgeBox}>
        <Image source={Icons.lightning} style={styles.deliveryBadgeBoxIcon} />
        <Text style={styles.deliveryBadgeBoxText}>{preparationTime} mins</Text>
      </View>
    </View>
  );
};

export default VendorPill;
