import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useCartStore from '../../../store/cart/cartStore';
import useOrderStore from '../../../store/cart/orderStore';
import { useTheme } from '../../../theme/ThemeContext';
import OrderProgressBar from '../order/OrderProgressBar';
import CartBar from './CartBar';

const { width } = Dimensions.get('window');
const ANIMATION_DURATION = 250;

const FloatingCartsStack: React.FC = () => {
  const carts = useCartStore(state => state.carts);
  const allCarts = Object.values(carts);
  const activeCartId = useCartStore(state => state.activeCartId);
  const [expanded, setExpanded] = useState(false);
  const { getColor, theme } = useTheme();
  const hasInProgressOrder = useOrderStore(state =>
    state.orders.some(o => o.status !== 'delivered' && o.status !== 'cancelled')
  );

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

  // Dynamic styles using theme
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        cartShadow: {
          borderRadius: theme.borderRadius.md,
          backgroundColor: getColor('primary'),
          shadowColor: theme.colors.shadow.color,
          shadowOpacity: theme.colors.shadow.opacity,
          shadowOffset: theme.colors.shadow.offset,
          shadowRadius: theme.colors.shadow.radius,
          elevation: 4,
        },
        cartBarWrapperMain: {
          borderRadius: theme.borderRadius.md,
          shadowColor: theme.colors.shadow.color,
          shadowOpacity: theme.colors.shadow.opacity,
          shadowOffset: theme.colors.shadow.offset,
          shadowRadius: theme.colors.shadow.radius,
          elevation: 4,
          zIndex: 1,
        },
        cartSecondBehind: {
          position: 'absolute',
          top: 8,
          left: -20,
          right: 0,
          zIndex: 0,
        },
      }),
    [theme, getColor]
  );

  // Only hide if there are no carts AND no in-progress order to show
  if (allCarts.length === 0 && !hasInProgressOrder) return null;

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
        {/* Always show the in-progress order bar above cart bars */}
        <View style={[styles.cartBarWrapper, dynamicStyles.cartBarWrapperMain]}>
          <OrderProgressBar />
        </View>
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
                dynamicStyles.cartShadow,
                dynamicStyles.cartSecondBehind,
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
                  dynamicStyles.cartBarWrapperMain,
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
                  },
                ]}
              >
                <CartBar
                  itemCount={Object.values(cart.products).reduce((sum, p) => sum + p.quantity, 0)}
                  shopId={cart.cartId.replace('vendor_', '')}
                  cartId={cart.cartId}
                  isExpanded={expanded || allCarts.length === 1}
                  onExpand={() => setExpanded(true)}
                />
              </Animated.View>
            );
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
    overflow: 'visible',
  },
  cartBarWrapper: {
    width: width - 30,
    maxWidth: width - 30,
    marginBottom: 10,
    alignItems: 'center',
    // overflow: 'visible',
    // backgroundColor: 'rgba(255,0,0,0.2)', // debug
  },
  cartBar: {
    width: '100%',
    maxWidth: 360,
    overflow: 'visible',
    // backgroundColor: 'rgba(0,255,0,0.2)', // debug
  },
  cartShadow: {
    borderRadius: 20,
    width: width - 30,
    maxWidth: width - 30,
    height: 65, // match CartBar height
    opacity: 0.9,
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
