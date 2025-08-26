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
      paddingVertical: 40,
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
      shadowColor: getColor('shadow').color,
      shadowOffset: getColor('shadow').offset,
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
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

      <ThemeText
        variant="subtitle"
        color={getColor('text')}
        style={{ fontWeight: '700', textAlign: 'center', marginBottom: 12 }}
      >
        This location is not serviceable
      </ThemeText>

      <ThemeText
        variant="body"
        color={getColor('subText')}
        style={{ textAlign: 'center', lineHeight: 20, marginBottom: 8 }}
      >
        We don&apos;t have any vendors available at your current location. Please try changing your
        delivery address.
      </ThemeText>

      {selectedAddress && (
        <ThemeText
          variant="caption"
          color={getColor('subText')}
          style={{ textAlign: 'center', marginBottom: 32, fontStyle: 'italic' }}
        >
          Current address: {selectedAddress}
        </ThemeText>
      )}
    </View>
  );
};

export default VendorLocationEmptyState;
