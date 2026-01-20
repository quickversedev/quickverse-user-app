import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, LayoutAnimation, Platform, StyleSheet, TouchableOpacity, UIManager, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { TabBarVisibilityContext } from '../../../navigation/TabNavigation';
import useCartStore from '../../../store/cart/cartStore';
import useOrderStore from '../../../store/cart/orderStore';
import { useTheme } from '../../../theme/ThemeContext';
import OrderProgressBar from '../order/OrderProgressBar';
import CartBar from './CartBar';

const { width } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FloatingCartsStack: React.FC = () => {
  const { authData } = useAuth();
  const carts = useCartStore(state => state.carts);
  const allCarts = Object.values(carts);
  const activeCartId = useCartStore(state => state.activeCartId);
  const [expanded, setExpanded] = useState(false);
  const { getColor, theme } = useTheme();
  const tabBarContext = useContext(TabBarVisibilityContext);
  const hasInProgressOrder = useOrderStore(state =>
    state.orders.some(o => o.status !== 'delivered' && o.status !== 'cancelled')
  );

  // Filter to only carts with items
  const nonEmptyCarts = allCarts.filter(
    cart => Object.values(cart.products || {}).reduce((sum, p) => sum + (p?.quantity || 0), 0) > 0
  );

  // Sort carts: most recently active at the top
  const sortedCarts = [...nonEmptyCarts].sort((a, b) => {
    if (a.cartId === activeCartId) return -1;
    if (b.cartId === activeCartId) return 1;
    return 0;
  });

  // Only show expand/collapse when there are multiple non-empty carts
  const showExpandCollapse = nonEmptyCarts.length > 1;

  // Use refs for stable animated values
  const animatedValuesRef = useRef<Animated.Value[]>([]);
  const arrowRotation = useRef(new Animated.Value(0)).current;

  // Ensure we have enough animated values for all carts
  if (animatedValuesRef.current.length !== sortedCarts.length) {
    animatedValuesRef.current = sortedCarts.map(
      (_, i) => animatedValuesRef.current[i] || new Animated.Value(i === 0 ? 1 : 0)
    );
  }
  const animatedValues = animatedValuesRef.current;

  // Arrow rotation interpolation
  const arrowRotateInterpolate = arrowRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Handle expand/collapse with smooth animations
  const toggleExpanded = () => {
    // Trigger layout animation for smooth height change
    LayoutAnimation.configureNext({
      duration: ANIMATION_DURATION,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });

    // Animate arrow rotation
    Animated.spring(arrowRotation, {
      toValue: expanded ? 0 : 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    setExpanded(prev => !prev);
  };

  useEffect(() => {
    if (expanded) {
      // Animate all carts in with spring effect
      Animated.stagger(
        80,
        animatedValues.map(av =>
          Animated.spring(av, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          })
        )
      ).start();
    } else {
      // Animate all carts out except the first with easing
      Animated.stagger(
        40,
        animatedValues.map((av, idx) =>
          Animated.timing(av, {
            toValue: idx === 0 ? 1 : 0,
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic),
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
          shadowOffset: {
            width: theme.colors.shadow.offset_width,
            height: theme.colors.shadow.offset_height,
          },
          shadowRadius: theme.colors.shadow.radius,
          elevation: 4,
        },
        cartBarWrapperMain: {
          borderRadius: theme.borderRadius.md,
          shadowColor: theme.colors.shadow.color,
          shadowOpacity: theme.colors.shadow.opacity,
          shadowOffset: {
            width: theme.colors.shadow.offset_width,
            height: theme.colors.shadow.offset_height,
          },
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

  // Only hide if there are no non-empty carts AND no in-progress order to show
  if (nonEmptyCarts.length === 0 && !hasInProgressOrder) return null;

  // Only render when user is logged in
  if (!authData?.jwt || !authData?.phone) {
    return null;
  }

  // Show a hint of the next cart behind the first when collapsed
  const showSecondCartBehind = !expanded && sortedCarts.length > 1;

  // Calculate the bottom position based on tab bar height
  const baseBottom = tabBarContext?.fullTabBarHeight ? tabBarContext.fullTabBarHeight + 10 : 75;

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
      <Animated.View
        style={[
          styles.container,
          {
            bottom: baseBottom,
            transform: tabBarContext?.tabBarTranslateY
              ? [{ translateY: tabBarContext.tabBarTranslateY }]
              : [],
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Toggle button at top - expands carts upward */}
        {showExpandCollapse && (
          <TouchableOpacity
            style={styles.toggleBarWrapper}
            onPress={toggleExpanded}
            activeOpacity={0.8}
          >
            <Animated.View
              style={{
                transform: [{ rotate: arrowRotateInterpolate }],
              }}
            >
              <MaterialCommunityIcons
                name="chevron-up"
                size={28}
                color={getColor('primary')}
                style={styles.chevronIcon}
              />
            </Animated.View>
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
          {/* Main cart(s) - render in reverse order so they expand upward */}
          {[...sortedCarts].reverse().map((cart, idx) => {
            const originalIdx = sortedCarts.length - 1 - idx;
            // Only render the topmost cart (last in original order) if collapsed
            if (!expanded && originalIdx > 0) return null;
            // Guard: skip if animatedValues[originalIdx] is undefined
            if (!animatedValues[originalIdx]) return null;
            // Guard: skip if cart.cartId is undefined
            if (!cart.cartId) return null;

            const animValue = animatedValues[originalIdx];

            // When collapsed, wrap the cart in TouchableOpacity to expand on press
            const CartContent = (
              <Animated.View
                key={cart.cartId}
                style={[
                  styles.cartBarWrapper,
                  dynamicStyles.cartBarWrapperMain,
                  {
                    opacity: animValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 0.8, 1],
                    }),
                    transform: [
                      {
                        translateY: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-30, 0],
                        }),
                      },
                      {
                        scale: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.95, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <CartBar
                  itemCount={Object.values(cart.products || {}).reduce(
                    (sum, p) => sum + (p?.quantity || 0),
                    0
                  )}
                  shopId={cart.cartId ? cart.cartId.replace('vendor_', '') : ''}
                  cartId={cart.cartId || ''}
                  isExpanded={expanded || nonEmptyCarts.length === 1}
                  onExpand={toggleExpanded}
                />
              </Animated.View>
            );
            // When expanded, clicking the cart navigates to CartScreen
            return CartContent;
          })}
        </View>
        {/* Show the in-progress order bar below cart bars */}
        <View>
          <OrderProgressBar />
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 75,
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
    width: '100%',
    maxWidth: width - 32,
    marginBottom: 4,
    alignItems: 'center',
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
