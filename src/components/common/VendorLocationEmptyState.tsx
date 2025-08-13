import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Images } from '../../assets';
import { useTheme } from '../../theme/ThemeContext';

interface VendorLocationEmptyStateProps {
  onChangeAddress?: () => void;
  selectedAddress?: string;
}

const VendorLocationEmptyState: React.FC<VendorLocationEmptyStateProps> = ({
  onChangeAddress,
  selectedAddress,
}) => {
  const { getColor, getTypography, theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
      backgroundColor: getColor('background'),
    },
    emptyImage: {
      width: 120,
      height: 120,
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: getTypography('h3'),
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 12,
      color: getColor('text'),
      fontFamily: 'BricolageGrotesque-Regular',
    },
    emptySubtitle: {
      fontSize: getTypography('body'),
      textAlign: 'center',
      lineHeight: 20,
      color: getColor('subText'),
      fontFamily: 'BricolageGrotesque-Regular',
      marginBottom: 8,
    },
    addressText: {
      fontSize: getTypography('caption'),
      textAlign: 'center',
      color: getColor('subText'),
      fontFamily: 'BricolageGrotesque-Regular',
      marginBottom: 32,
      fontStyle: 'italic',
    },
    changeAddressButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('primary'),
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      elevation: 2,
      shadowColor: getColor('shadow').color,
      shadowOffset: getColor('shadow').offset,
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
    },
    changeAddressText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      marginLeft: 8,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    iconContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.full,
      padding: 4,
    },
  });

  return (
    <View style={styles.container}>
      <Image source={Images.emptyVendors} style={styles.emptyImage} resizeMode="contain" />

      <Text style={styles.emptyTitle}>This location is not serviceable</Text>

      <Text style={styles.emptySubtitle}>
        We don't have any vendors available at your current location. Please try changing your
        delivery address.
      </Text>

      {selectedAddress && (
        <Text style={styles.addressText}>Current address: {selectedAddress}</Text>
      )}
    </View>
  );
};

export default VendorLocationEmptyState;
