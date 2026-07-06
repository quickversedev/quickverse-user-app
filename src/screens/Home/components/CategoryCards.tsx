import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { AppNavigationProp } from '../../../types/navigation';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface CardConfig {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  bgColor: string;
  category: string;
  comingSoon?: boolean;
}

/* eslint-disable @typescript-eslint/no-require-imports */
const CARDS: CardConfig[] = [
  {
    title: 'Food & Dining',
    subtitle: 'Restaurant meals at menu prices',
    image: require('../../../assets/images/food-logo.png'),
    bgColor: '#FEE2E2',
    category: 'Food',
  },
  {
    title: 'Daily Needs',
    subtitle: 'Groceries delivered fast',
    image: require('../../../assets/images/daily-logo.png'),
    bgColor: '#FEF9C3',
    category: 'Grocery',
  },
  {
    title: 'Quick Delivery',
    subtitle: 'Quick when you need it',
    image: require('../../../assets/images/delivery-logo.png'),
    bgColor: '#DBEAFE',
    category: 'QuickDelivery',
    comingSoon: true,
  },
  {
    title: 'Health & Care',
    subtitle: 'Medicines & essentials',
    image: require('../../../assets/images/med-logo.png'),
    bgColor: '#D1FAE5',
    category: 'Pharmacy',
    comingSoon: true,
  },
];
/* eslint-enable @typescript-eslint/no-require-imports */

const CategoryCards = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { theme } = useTheme();

  const handlePress = (card: CardConfig) => {
    if (card.comingSoon) return;
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
    activeOpacity={config.comingSoon ? 1 : 0.8}
    style={styles.cardWrapper}
  >
    <View
      style={[
        styles.cardContent,
        { backgroundColor: config.comingSoon ? '#F3F4F6' : config.bgColor },
      ]}
    >
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: config.comingSoon ? '#9CA3AF' : theme.colors.text }]}>
          {config.title}
        </Text>
        <Text
          style={[styles.subtitle, { color: config.comingSoon ? '#D1D5DB' : theme.colors.subText }]}
        >
          {config.subtitle}
        </Text>
      </View>
      {config.comingSoon && (
        <View style={styles.comingSoonBanner}>
          <Text style={styles.comingSoonText}>COMING SOON</Text>
        </View>
      )}
      <Image
        source={config.image}
        style={[styles.cardImage, config.comingSoon && styles.cardImageGreyed]}
        resizeMode="contain"
      />
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
  cardImageGreyed: {
    opacity: 0.3,
  },
  comingSoonBanner: {
    position: 'absolute',
    bottom: 10,
    left: -20,
    backgroundColor: '#9CA3AF',
    paddingHorizontal: 24,
    paddingVertical: 3,
    transform: [{ rotate: '35deg' }],
    zIndex: 10,
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default CategoryCards;
