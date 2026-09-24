import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../../../routes/AppStack';
import useEssentialsCartStore, {
  ESSENTIALS_CART_ID,
  useEssentialsSummary,
} from '../../../store/cart/essentialsCartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../theme/ThemeText';

const { width } = Dimensions.get('window');

/**
 * The floating bar for the Daily Essentials cart.
 *
 * One bar however many kiranas supply the cart, and it never says how many: to the customer it
 * is one cart and one order. Styled to match CartBar, without its swipe-to-delete.
 */
const EssentialsCartBar: React.FC = () => {
  const { getColor, isDarkMode } = useTheme();
  const { navigate } = useNavigation<StackNavigationProp<RootStackParamList>>();
  const enabled = useEssentialsCartStore(s => s.enabled === true);
  const { itemCount, itemTotal } = useEssentialsSummary();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingLeft: 12,
          paddingRight: 6,
          width: width - 32,
          minHeight: 56,
          alignSelf: 'center',
          marginBottom: 6,
          backgroundColor: getColor('primary'),
          borderRadius: 16,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        },
        divider: {
          width: 1,
          height: 28,
          marginHorizontal: 10,
          borderRadius: 1,
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)',
        },
        text: { flex: 1, minWidth: 0 },
        title: { fontWeight: '600' },
        sub: { opacity: 0.85 },
        view: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: getColor('background'),
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          marginLeft: 10,
        },
        viewText: { fontWeight: '600', fontSize: 13 },
      }),
    [getColor, isDarkMode]
  );

  if (!enabled || itemCount === 0) return null;

  const total = Number.isInteger(itemTotal) ? itemTotal : itemTotal.toFixed(2);

  return (
    <TouchableOpacity
      style={styles.bar}
      activeOpacity={0.95}
      onPress={() => navigate('Cart', { cartId: ESSENTIALS_CART_ID })}
      accessibilityRole="button"
      accessibilityLabel={`Daily Essentials cart, ${itemCount} items. View cart`}
    >
      <MaterialCommunityIcons
        name="basket-outline"
        size={24}
        color={isDarkMode ? '#22C55E' : '#16A34A'}
      />
      <View style={styles.divider} />
      <View style={styles.text}>
        <ThemeText
          variant="body"
          style={styles.title}
          color={getColor('background')}
          numberOfLines={1}
        >
          Daily Essentials
        </ThemeText>
        <ThemeText
          variant="caption"
          style={styles.sub}
          color={getColor('background')}
          numberOfLines={1}
        >
          {itemCount} Item{itemCount > 1 ? 's' : ''} · ₹{total}
        </ThemeText>
      </View>
      <View style={styles.view}>
        <ThemeText variant="caption" style={styles.viewText} color={getColor('text')}>
          View Cart
        </ThemeText>
        <MaterialCommunityIcons name="chevron-right" size={18} color={getColor('text')} />
      </View>
    </TouchableOpacity>
  );
};

export default EssentialsCartBar;
