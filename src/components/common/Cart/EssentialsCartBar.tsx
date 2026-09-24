import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { RootStackParamList } from '../../../routes/AppStack';
import useEssentialsCartStore, {
  ESSENTIALS_CART_ID,
  useEssentialsLines,
  useEssentialsSummary,
} from '../../../store/cart/essentialsCartStore';
import CartBar from './CartBar';

interface EssentialsCartBarProps {
  isExpanded?: boolean;
  onExpand?: () => void;
}

/**
 * The floating bar for the Daily Essentials cart: the same CartBar every store cart uses, with a
 * basket instead of a cart as its icon. Like a store cart's bar it names the item when there is
 * one and the cart otherwise, and never the stores behind it.
 */
const EssentialsCartBar: React.FC<EssentialsCartBarProps> = ({ isExpanded, onExpand }) => {
  const { navigate } = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { authData } = useAuth();
  const lines = useEssentialsLines();
  const { itemCount } = useEssentialsSummary();
  const clear = useEssentialsCartStore(s => s.clear);

  const firstItemName = lines.find(l => l.available)?.name;
  const title = itemCount === 1 && firstItemName ? firstItemName : 'Daily Essentials';

  const handleClear = useCallback(() => {
    clear(authData?.jwt || undefined, authData?.phone || undefined);
  }, [clear, authData?.jwt, authData?.phone]);

  const handleViewCart = useCallback(() => {
    navigate('MainApp', { screen: 'Cart', params: { cartId: ESSENTIALS_CART_ID } });
  }, [navigate]);

  return (
    <CartBar
      itemCount={itemCount}
      shopId=""
      cartId={ESSENTIALS_CART_ID}
      title={title}
      iconName="basket-outline"
      onClear={handleClear}
      onViewCart={handleViewCart}
      isExpanded={isExpanded}
      onExpand={onExpand}
    />
  );
};

export default EssentialsCartBar;
