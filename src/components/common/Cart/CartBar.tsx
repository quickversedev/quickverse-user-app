import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { RootStackParamList } from '../../../routes/AppStack';
import useCartStore from '../../../store/cart/cartStore';
import useVendorStore from '../../../store/vendorStore';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

const { width } = Dimensions.get('window');

interface CartBarProps {
  itemCount: number;
  style?: ViewStyle;
  shopId: string;
  cartId: string;
  onExpand?: () => void;
  isExpanded?: boolean;
}

const CartBar: React.FC<CartBarProps> = ({
  itemCount,
  style,
  shopId,
  cartId,
  onExpand,
  isExpanded = true,
}) => {
  const { getColor, isDarkMode } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isRevealed, setIsRevealed] = React.useState(false);

  // Slide-up entrance animation on mount
  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(slideUpAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideUpAnim, fadeAnim]);
  const getVendorById = useVendorStore(state => state.getVendorById);
  const vendor = getVendorById(shopId);
  const vendorName = vendor?.name || 'Collections';
  const cart = useCartStore(state => state.carts[cartId]);
  const cartProducts = Object.values(cart?.products || {});
  const firstItemName = cartProducts[0]?.name;
  // Show item name for single item, vendor name for multiple items
  const displayName = itemCount === 1 && firstItemName ? firstItemName : vendorName;
  const { navigate } = useNavigation<StackNavigationProp<RootStackParamList>>();
  const clearCart = useCartStore(state => state.clearCart);
  const { authData } = useAuth();

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        cartBar: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingLeft: 12,
          paddingRight: 6,
          width: width - 32,
          minHeight: 56,
          alignSelf: 'center',
          backgroundColor: getColor('primary'),
          borderRadius: 16,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          overflow: 'hidden',
        },
        divider: {
          width: 1,
          height: 28,
          marginHorizontal: 10,
          borderRadius: 1,
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)',
        },
        deleteButton: {
          width: 36,
          height: 36,
          borderRadius: 18,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: getColor('error'),
        },
        deleteButtonPositioned: {
          position: 'absolute',
          left: 16,
          top: '50%',
          marginTop: -18, // Half of button height (36/2) to center vertically
          zIndex: 1,
        },
        cartContainer: {
          zIndex: 2,
        },
        contentContainer: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          minWidth: 0,
        },
        vendorNameContainer: {
          flex: 1,
          minWidth: 0,
        },
        itemCountContainer: {
          flexShrink: 0,
          marginLeft: 8,
        },
        // Close icon with visible background
        closeIconContainer: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: getColor('error'),
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 10,
        },
        // View Cart button styles
        viewCartButton: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: getColor('background'),
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          marginLeft: 10,
        },
        viewCartText: {
          fontWeight: '600',
          fontSize: 13,
        },
      }),
    [getColor, isDarkMode]
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx >= 0) {
          translateX.setValue(Math.min(gestureState.dx, 80));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 40) {
          Animated.spring(translateX, {
            toValue: 80,
            useNativeDriver: true,
          }).start();
          setIsRevealed(true);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          setIsRevealed(false);
        }
      },
    })
  ).current;

  const handleRemovePress = () => {
    const phone = authData?.phone || '';
    const jwt = authData?.jwt || '';
    clearCart(cartId, jwt, phone);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setIsRevealed(false);
  };

  const handleBarPress = () => {
    if (isRevealed) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      setIsRevealed(false);
    } else if (!isExpanded && onExpand) {
      onExpand();
    }
  };

  const handleViewCartPress = () => {
    if (isRevealed) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      setIsRevealed(false);
    } else {
      navigate('MainApp', { screen: 'Cart', params: { cartId } });
    }
  };

  const toggleDeleteReveal = () => {
    if (!isRevealed) {
      Animated.spring(translateX, {
        toValue: 80,
        useNativeDriver: true,
      }).start();
      setIsRevealed(true);
    } else {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      setIsRevealed(false);
    }
  };

  return (
    <Animated.View
      style={[
        styles.stickyContainer,
        style,
        { transform: [{ translateY: slideUpAnim }], opacity: fadeAnim },
      ]}
    >
      {/* Delete button (hidden behind cart) */}
      <Animated.View
        style={[
          dynamicStyles.deleteButton,
          dynamicStyles.deleteButtonPositioned,
          {
            opacity: translateX.interpolate({
              inputRange: [0, 40, 80],
              outputRange: [0, 0.5, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [0, 80],
                  outputRange: [-50, 0],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButtonContent}
          onPress={handleRemovePress}
          activeOpacity={0.8}
          hitSlop={{ left: 10, right: 10, top: 10, bottom: 10 }}
        >
          <MaterialCommunityIcons name="delete-outline" size={22} color={getColor('white')} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        pointerEvents="box-none"
        style={dynamicStyles.cartContainer}
      >
        <Animated.View style={{ transform: [{ translateX }] }}>
          <TouchableOpacity
            style={dynamicStyles.cartBar}
            activeOpacity={0.95}
            onPress={handleBarPress}
          >
            {/* Close icon */}
            <TouchableOpacity
              onPress={toggleDeleteReveal}
              style={dynamicStyles.closeIconContainer}
              hitSlop={{ left: 6, right: 6, top: 6, bottom: 6 }}
            >
              <MaterialCommunityIcons name="close" size={14} color={getColor('white')} />
            </TouchableOpacity>

            {/* Cart icon */}
            <MaterialCommunityIcons
              name="cart-outline"
              size={24}
              color={isDarkMode ? '#22C55E' : '#16A34A'}
            />

            <View style={dynamicStyles.divider} />

            {/* Vendor name and item count */}
            <View style={dynamicStyles.contentContainer}>
              <View style={dynamicStyles.vendorNameContainer}>
                <ThemeText
                  variant="body"
                  style={styles.vendorName}
                  color={getColor('background')}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {displayName}
                </ThemeText>
              </View>

              <View style={dynamicStyles.itemCountContainer}>
                <ThemeText
                  variant="caption"
                  style={styles.itemCount}
                  color={getColor('background')}
                  numberOfLines={1}
                >
                  {itemCount} Item{itemCount > 1 ? 's' : ''}
                </ThemeText>
              </View>
            </View>

            {/* View Cart button */}
            <TouchableOpacity
              style={dynamicStyles.viewCartButton}
              onPress={handleViewCartPress}
              activeOpacity={0.8}
            >
              <ThemeText
                variant="caption"
                style={dynamicStyles.viewCartText}
                color={getColor('text')}
              >
                View Cart
              </ThemeText>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={getColor('text')}
                style={styles.viewCartChevron}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  stickyContainer: {
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  vendorName: {
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  itemCount: {
    opacity: 0.85,
  },
  deleteButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  viewCartChevron: {
    marginLeft: 2,
  },
});

export default CartBar;
