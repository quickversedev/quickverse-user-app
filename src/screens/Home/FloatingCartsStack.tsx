import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CartBar from '../../components/common/CartBar';
import type { RootStackParamList } from '../../routes/AppStack';
import useCartStore from '../../store/cartStore';
import { useTheme } from '../../theme/ThemeContext';

const ANIMATION_DURATION = 250;

const FloatingCartsStack: React.FC = () => {
  const carts = useCartStore(state => state.carts);
  const allCarts = Object.values(carts);
  const activeCartId = useCartStore(state => state.activeCartId);
  const setActiveCart = useCartStore(state => state.setActiveCart);
  const clearCart = useCartStore(state => state.clearCart);
  const [expanded, setExpanded] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { getColor } = useTheme();

  // Sort carts: most recently active at the top
  const sortedCarts = [...allCarts].sort((a, b) => {
    if (a.cartId === activeCartId) return -1;
    if (b.cartId === activeCartId) return 1;
    return 0;
  });

  const showExpandCollapse = allCarts.length > 1;

  // Animated values for each cart (for fade/slide in)
  const animatedValues = useMemo(
    () => sortedCarts.map((_, i) => new Animated.Value(expanded || i === 0 ? 1 : 0)),
    [sortedCarts.length]
  );

  useEffect(() => {
    if (expanded) {
      // Animate all carts in
      Animated.stagger(
        50,
        animatedValues.map(av =>
          Animated.timing(av, {
            toValue: 1,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          })
        )
      ).start();
    } else {
      // Animate all carts out except the first
      Animated.stagger(
        30,
        animatedValues.map((av, idx) =>
          Animated.timing(av, {
            toValue: idx === 0 ? 1 : 0,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [expanded, animatedValues]);

  // No need for animatedValues sync effect, handled by useMemo

  if (allCarts.length === 0) return null;

  // Show a hint of the next cart behind the first when collapsed
  const showSecondCartBehind = !expanded && sortedCarts.length > 1;

  return (
    <>
      {/* Backdrop for collapse on outside press */}
      {expanded && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setExpanded(false)}
        />
      )}
      <View style={styles.container} pointerEvents="box-none">
        {showExpandCollapse && (
          <TouchableOpacity
            style={styles.toggleBarWrapper}
            onPress={() => setExpanded(prev => !prev)}
            activeOpacity={0.8}
          >
            {expanded ? (
              <MaterialCommunityIcons
                name="chevron-down"
                size={28}
                color={getColor('primary')}
                style={styles.chevronIcon}
              />
            ) : (
              <MaterialCommunityIcons
                name="chevron-up"
                size={28}
                color={getColor('primary')}
                style={styles.chevronIcon}
              />
            )}
          </TouchableOpacity>
        )}
        <View style={styles.stack}>
          {/* Show second cart behind the first as a visual cue when collapsed */}
          {showSecondCartBehind && (
            <View
              style={[
                styles.cartBarWrapper,
                styles.cartShadow,
                {
                  position: 'absolute',
                  top: 8,
                  left: 0,
                  right: 0,
                  zIndex: 0,
                  backgroundColor: getColor('primary'),
                },
              ]}
              pointerEvents="none"
            />
          )}
          {/* Main cart(s) */}
          {sortedCarts.map((cart, idx) => {
            // Only render the topmost cart if collapsed
            if (!expanded && idx > 0) return null;
            // Guard: skip if animatedValues[idx] is undefined
            if (!animatedValues[idx]) return null;
            // When collapsed, wrap the cart in TouchableOpacity to expand on press
            const CartContent = (
              <Animated.View
                key={cart.cartId}
                style={[
                  styles.cartBarWrapper,
                  {
                    opacity: animatedValues[idx],
                    transform: [
                      {
                        translateY: animatedValues[idx].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                    zIndex: 1,
                  },
                ]}
              >
                <CartBar
                  itemCount={Object.values(cart.products).reduce((sum, p) => sum + p.quantity, 0)}
                  onViewCart={() => {
                    if (expanded) {
                      if (activeCartId !== cart.cartId) setActiveCart(cart.cartId);
                      navigation.navigate('Cart');
                    } else {
                      setExpanded(true);
                    }
                  }}
                  onRemoveCart={() => clearCart(cart.cartId)}
                  style={styles.cartBar}
                  shopId={cart.cartId.replace('vendor_', '')}
                />
              </Animated.View>
            );
            if (!expanded) {
              // When collapsed, make the cart clickable to expand
              return (
                <TouchableOpacity
                  key={cart.cartId}
                  activeOpacity={0.9}
                  onPress={() => setExpanded(true)}
                  style={{ width: '100%' }}
                >
                  {CartContent}
                </TouchableOpacity>
              );
            }
            // When expanded, clicking the cart navigates to CartScreen
            return CartContent;
          })}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 55,
    zIndex: 99999,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  toggleBarWrapper: {
    alignItems: 'center',
    marginBottom: 6,
  },
  toggleBar: {
    width: 40,
    height: 6,
    borderRadius: 3,
    // backgroundColor is set dynamically
    opacity: 0.7,
  },
  stack: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cartBarWrapper: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 10,
    alignItems: 'center',
    // backgroundColor: 'rgba(255,0,0,0.2)', // debug
  },
  cartBar: {
    width: '100%',
    maxWidth: 360,
    // backgroundColor: 'rgba(0,255,0,0.2)', // debug
  },
  cartShadow: {
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    height: 60, // match CartBar height
    opacity: 0.7,
    alignSelf: 'center',
  },
  crossIcon: {
    alignSelf: 'center',
    marginBottom: 2,
  },
  chevronIcon: {
    alignSelf: 'center',
    marginBottom: 2,
  },
});

export default FloatingCartsStack;
