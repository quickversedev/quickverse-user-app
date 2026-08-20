import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { AppNavigationProp } from '../../../types/navigation';
import useVendorStore from '../../../store/vendorStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface CardConfig {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  icon?: ImageSourcePropType;
  bgColor: string;
  category: string;
  comingSoon?: boolean;
  compact?: boolean;
}

/* eslint-disable @typescript-eslint/no-require-imports */
const CARDS: CardConfig[] = [
  {
    title: 'Food & Dining',
    subtitle: 'Restaurant meals at menu prices',
    image: require('../../../assets/images/food-logo.png'),
    icon: require('../../../assets/images/icons/card-ikons/food-ikon.png'),
    bgColor: '#FEE2E2',
    category: 'Food',
  },
  {
    title: 'Daily Needs',
    subtitle: 'Groceries delivered fast',
    image: require('../../../assets/images/daily-logo.png'),
    icon: require('../../../assets/images/icons/card-ikons/daily-ikon.png'),
    bgColor: '#FEF9C3',
    category: 'Grocery',
  },
  {
    title: 'Quick Delivery',
    subtitle: 'Quick when you need it',
    image: require('../../../assets/images/delivery-logo.png'),
    icon: require('../../../assets/images/icons/card-ikons/quickDelivery-ikoon.png'),
    bgColor: '#DBEAFE',
    category: 'QuickDelivery',
    compact: true,
  },
  {
    title: 'Health & Care',
    subtitle: 'Medicines & essentials',
    image: require('../../../assets/images/med-logo.png'),
    icon: require('../../../assets/images/icons/card-ikons/health&care-ikon.png'),
    bgColor: '#D1FAE5',
    category: 'Pharmacy',
    compact: true,
  },
];
/* eslint-enable @typescript-eslint/no-require-imports */

const PHARMACY_SHOP_ID = '110802';

const CategoryCards = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { theme } = useTheme();
  const getVendorById = useVendorStore(s => s.getVendorById);
  const fetchVendorById = useVendorStore(s => s.fetchVendorById);

  const handlePress = async (card: CardConfig) => {
    if (card.category === 'QuickDelivery') {
      ToastAndroid.show('Coming Soon!', ToastAndroid.SHORT);
      return;
    }
    if (card.category === 'Pharmacy') {
      let vendor = getVendorById(PHARMACY_SHOP_ID);
      if (!vendor) {
        await fetchVendorById(PHARMACY_SHOP_ID);
        vendor = useVendorStore.getState().selectedVendor;
      }
      if (vendor) {
        navigation.navigate('VendorProduct', { vendor });
      } else {
        ToastAndroid.show('Store not available', ToastAndroid.SHORT);
      }
      return;
    }
    navigation.navigate('Category', { categoryName: card.category });
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {CARDS.map(card => (
          <Card key={card.category} config={card} onPress={() => handlePress(card)} theme={theme} />
        ))}
      </View>
    </View>
  );
};

const Card = ({
  config,
  onPress,
  theme,
}: {
  config: CardConfig;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[styles.cardWrapper, config.compact && styles.cardWrapperSmall]}
  >
    <View
      style={[
        styles.cardContent,
        { backgroundColor: config.bgColor },
      ]}
    >
      {config.icon && (
        <Image
          source={config.icon}
          style={styles.categoryIcon}
        />
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {config.title}
        </Text>
        {!config.compact && (
          <Text style={[styles.subtitle, { color: theme.colors.subText }]}>
            {config.subtitle}
          </Text>
        )}
      </View>
      {!config.compact && (
        <Image
          source={require('../../../assets/images/icons/card-ikons/arror.png')}
          style={styles.arrowIcon}
        />
      )}
      {!config.compact && (
        <Image
          source={config.image}
          style={styles.cardImage}
          resizeMode="contain"
        />
      )}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: 110,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardWrapperSmall: {
    height: 55,
  },
  cardContent: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
  },
  textContainer: {
    flex: 1,
    paddingRight: 45,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    lineHeight: 14,
  },
  cardImage: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 70,
    height: 70,
    borderBottomRightRadius: 16,
  },
  arrowIcon: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    width: 20,
    height: 20,
  },
  categoryIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
  },
});

export default CategoryCards;
