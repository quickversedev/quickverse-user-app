import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../../routes/AppStack';
import useCartStore from '../../../store/cartStore';
import useVendorStore from '../../../store/vendorStore';
import { useTheme } from '../../../theme/ThemeContext';

const { width } = Dimensions.get('window');

interface CartBarProps {
  itemCount: number;
  /**
   * Pass custom styles for the CartBar container, including position, top, left, right, etc.
   * This will override the default sticky positioning.
   */
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
  const { getColor, getTypography } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const [isRevealed, setIsRevealed] = React.useState(false);
  const getVendorNameById = useVendorStore(state => state.getVendorNameById);
  const vendorName = getVendorNameById(shopId) || shopId;
  const { navigate } = useNavigation<StackNavigationProp<RootStackParamList>>();
  const clearCart = useCartStore(state => state.clearCart);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow right swipe (positive dx)
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
    clearCart(cartId);
    // Reset position
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setIsRevealed(false);
  };

  const handleCartPress = () => {
    // If cart is in revealed position, snap back. Otherwise, view cart
    if (isRevealed) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      setIsRevealed(false);
    } else {
      if (isExpanded) {
        navigate('Cart', { cartId });
      } else if (onExpand) {
        onExpand();
      }
    }
  };

  return (
    <View style={[styles.stickyContainer, style]}>
      {/* Remove button (hidden behind cart) */}
      <Animated.View
        style={[
          styles.removeButton,
          {
            position: 'absolute',
            left: 50,
            top: 0,
            bottom: -10,
            zIndex: 1,
            opacity: translateX.interpolate({
              inputRange: [0, 40, 80],
              outputRange: [0, 0.5, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [0, 80],
                  outputRange: [-60, -20],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.removeButtonContent}
          onPress={handleRemovePress}
          activeOpacity={0.8}
          hitSlop={{ left: 10, right: 10, top: 10, bottom: 10 }}
        >
          <MaterialCommunityIcons name="close" size={24} color={getColor('white')} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View {...panResponder.panHandlers} pointerEvents="box-none" style={{ zIndex: 2 }}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <TouchableOpacity style={styles.cartBar} activeOpacity={0.92} onPress={handleCartPress}>
            {/* Cross icon to trigger swipe reveal */}
            <TouchableOpacity
              onPress={() => {
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
              }}
              style={styles.crossIconBtn}
              hitSlop={{ left: 8, right: 8, top: 8, bottom: 8 }}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color={getColor('error')} />
            </TouchableOpacity>
            {/* Cart icon */}
            <MaterialCommunityIcons
              name="cart-outline"
              size={26}
              color={getColor('text')}
              style={styles.cartIcon}
            />
            <View style={styles.divider} />
            <Text
              style={[
                styles.cartText,
                { fontSize: getTypography('subtitle'), color: getColor('text') },
              ]}
            >
              {vendorName}
            </Text>
            <View style={{ flex: 1 }} />
            <Text
              style={[
                styles.itemCount,
                { color: getColor('text'), fontSize: getTypography('body') },
              ]}
            >
              {itemCount} Item{itemCount > 1 ? 's' : ''}{' '}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={getColor('text')}
              style={styles.chevronIcon}
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyContainer: {
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD600', // This should be replaced with theme color if available
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    width: width - 30,
    minHeight: 56,
    alignSelf: 'center',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#E0E0E0', // This should be replaced with theme color if available
    marginHorizontal: 10,
    borderRadius: 1,
  },
  cartText: {
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  itemCount: {
    fontWeight: 'bold',
    marginRight: 2,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  crossIconBtn: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    marginRight: 10,
  },
  chevronIcon: {
    marginLeft: 2,
  },
});

export default CartBar;
