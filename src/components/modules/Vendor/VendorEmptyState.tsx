import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Images } from '../../../assets';
import { useTheme } from '../../../theme/ThemeContext';

interface VendorEmptyStateProps {
  category: string;
}

const VendorEmptyState: React.FC<VendorEmptyStateProps> = ({ category }) => {
  const { getColor } = useTheme();

  const getCategoryMessage = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return {
          title: 'No food vendors available',
          subtitle: "We're working on bringing delicious food to your area",
        };
      case 'grocery':
        return {
          title: 'No grocery stores nearby',
          subtitle: "We'll notify you when grocery delivery becomes available",
        };
      case 'pharmacy':
        return {
          title: 'No pharmacies in your area',
          subtitle: "We're expanding our pharmacy network to serve you better",
        };
      default:
        return {
          title: 'No vendors available',
          subtitle: "We're working on bringing services to your area",
        };
    }
  };

  const message = getCategoryMessage(category);

  return (
    <View style={[styles.container, { backgroundColor: getColor('background') }]}>
      <Image source={Images.emptyVendors} style={styles.emptyImage} resizeMode="contain" />
      <Text style={[styles.emptyTitle, { color: getColor('text') }]}>{message.title}</Text>
      <Text style={[styles.emptySubtitle, { color: getColor('subText') }]}>{message.subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'BricolageGrotesque-Regular',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'BricolageGrotesque-Regular',
  },
});

export default VendorEmptyState;
