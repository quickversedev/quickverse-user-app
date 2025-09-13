import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Images } from '../../assets';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeText } from './theme/ThemeText';

interface VendorLocationEmptyStateProps {
  onChangeAddress?: () => void;
  selectedAddress?: string;
}

const VendorLocationEmptyState: React.FC<VendorLocationEmptyStateProps> = ({
  onChangeAddress,
  selectedAddress,
}) => {
  const { getColor, theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
      paddingHorizontal: 20,
      backgroundColor: getColor('background'),
    },
    emptyImage: {
      width: 120,
      height: 120,
      marginBottom: 24,
    },
    changeAddressButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('primary'),
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      elevation: 2,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
    },
    iconContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.max,
      padding: 4,
    },
    titleText: {
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 12,
    },
    bodyText: {
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 8,
    },
    addressText: {
      textAlign: 'center',
      marginBottom: 32,
      fontStyle: 'italic',
    },
  });

  return (
    <View style={styles.container}>
      <Image source={Images.emptyVendors} style={styles.emptyImage} resizeMode="contain" />

      <ThemeText variant="subtitle" color={getColor('text')} style={styles.titleText}>
        This location is not serviceable
      </ThemeText>

      <ThemeText variant="body" color={getColor('subText')} style={styles.bodyText}>
        We don&apos;t have any vendors available at your current location. Please try changing your
        delivery address.
      </ThemeText>

      {selectedAddress && (
        <ThemeText variant="caption" color={getColor('subText')} style={styles.addressText}>
          Current address: {selectedAddress}
        </ThemeText>
      )}
    </View>
  );
};

export default VendorLocationEmptyState;
