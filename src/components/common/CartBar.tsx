import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';

interface CartBarProps {
  itemCount: number;
  onViewCart: () => void;
  onRemoveCart: () => void;
  /**
   * Pass custom styles for the CartBar container, including position, top, left, right, etc.
   * This will override the default sticky positioning.
   */
  style?: ViewStyle;
  shopId: string;
}

const CartBar: React.FC<CartBarProps> = ({
  itemCount,
  onViewCart,
  onRemoveCart,
  style,
  shopId,
}) => {
  const { getColor, getTypography } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const getVendorNameById = useVendorStore(state => state.getVendorNameById);
  const vendorName = getVendorNameById(shopId) || shopId;

  // Handler for when the left action (remove) is shown (swiped right)
  const handleLeftActionOpen = () => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('CartBar swiped right');
    }
  };

  // Render the red Remove button when swiped right
  const renderLeftActions = (_progress: unknown, _dragX: unknown) => {
    return (
      <TouchableOpacity
        style={[styles.removeButton, { backgroundColor: getColor('error') }]}
        onPress={onRemoveCart}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="close"
          size={20}
          color={getColor('white')}
          style={styles.removeIcon}
        />
        <Text style={styles.removeText}>{'Remove'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.stickyContainer, style]}>
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        overshootLeft={false}
        containerStyle={{ flex: 1 }}
        onSwipeableOpen={direction => {
          if (direction === 'left') handleLeftActionOpen();
        }}
      >
        <TouchableOpacity style={styles.cartBar} activeOpacity={0.92} onPress={onViewCart}>
          {/* Red cross icon */}
          <TouchableOpacity
            onPress={() => swipeableRef.current?.openLeft()}
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
            style={[styles.itemCount, { color: getColor('text'), fontSize: getTypography('body') }]}
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
      </Swipeable>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyContainer: {
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD600', // This should be replaced with theme color if available
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    minWidth: 320,
    minHeight: 56,
    width: '100%',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    paddingHorizontal: 18,
    marginRight: -8,
    height: '100%',
  },
  removeText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 2,
  },
  removeIcon: {
    marginRight: 4,
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
