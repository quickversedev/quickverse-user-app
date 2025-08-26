import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

interface VendorEmptyStateProps {
  message?: {
    title: string;
    subtitle: string;
  };
  category?: string;
}

const VendorEmptyState: React.FC<VendorEmptyStateProps> = ({ message, category }) => {
  const { getColor, theme } = useTheme();

  // Generate message based on category if message prop is not provided
  const getMessage = () => {
    if (message) {
      return message;
    }

    const categoryMessages = {
      Food: {
        title: 'No Food Vendors Available',
        subtitle:
          "We don't have any food delivery vendors in your area at the moment. Please try changing your delivery address or check back later.",
      },
      Grocery: {
        title: 'No Grocery Vendors Available',
        subtitle:
          "We don't have any grocery delivery vendors in your area at the moment. Please try changing your delivery address or check back later.",
      },
      Pharmacy: {
        title: 'No Pharmacy Vendors Available',
        subtitle:
          "We don't have any pharmacy delivery vendors in your area at the moment. Please try changing your delivery address or check back later.",
      },
    };

    return (
      categoryMessages[category as keyof typeof categoryMessages] || {
        title: 'No Vendors Available',
        subtitle:
          "We don't have any vendors in your area at the moment. Please try changing your delivery address or check back later.",
      }
    );
  };

  const displayMessage = getMessage();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    image: {
      width: 120,
      height: 120,
      marginBottom: 24,
      opacity: 0.6,
    },
    emptyTitle: {
      color: getColor('text'),
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtitle: {
      color: getColor('subText'),
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/images/empty_vendors.png')} style={styles.image} />
      <ThemeText variant="h2" color={getColor('text')} style={styles.emptyTitle}>
        {displayMessage.title}
      </ThemeText>
      <ThemeText variant="body" color={getColor('subText')} style={styles.emptySubtitle}>
        {displayMessage.subtitle}
      </ThemeText>
    </View>
  );
};

export default VendorEmptyState;
