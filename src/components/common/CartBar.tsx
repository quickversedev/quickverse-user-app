import React, { useRef } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeContext';

interface CartBarProps {
  itemCount: number;
  onViewCart: () => void;
  onRemoveCart: () => void;
  style?: ViewStyle;
}

const CartBar: React.FC<CartBarProps> = ({ itemCount, onViewCart, onRemoveCart, style }) => {
  const { getColor } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  // Handler for when the left action (remove) is shown (swiped right)
  const handleLeftActionOpen = () => {
    console.log('CartBar swiped right');
  };

  // Render the red Remove button when swiped right
  const renderLeftActions = (_progress: unknown, _dragX: unknown) => {
    return (
      <TouchableOpacity
        style={[styles.removeButton, { backgroundColor: '#C6284B' }]}
        onPress={onRemoveCart}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="close" size={20} color="#fff" style={{ marginRight: 4 }} />
        <Text style={styles.removeText}>Remove</Text>
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
            style={{ marginRight: 8, justifyContent: 'center', alignItems: 'center' }}
            hitSlop={{ left: 8, right: 8, top: 8, bottom: 8 }}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color="#C6284B" />
          </TouchableOpacity>
          {/* Cart icon */}
          <MaterialCommunityIcons
            name="cart-outline"
            size={26}
            color="#222"
            style={{ marginRight: 10 }}
          />
          <View style={styles.divider} />
          <Text style={styles.cartText}>View Cart</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.itemCount}>
            {itemCount} Item{itemCount > 1 ? 's' : ''}{' '}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={getColor('text')}
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>
      </Swipeable>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 24 : 12,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    // pointerEvents: 'box-none',
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD600',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    minWidth: 320,
    minHeight: 56,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    alignSelf: 'center',
    borderTopRightRadius: 16, // <-- add this
    borderBottomRightRadius: 16,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
    borderRadius: 1,
  },
  cartText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  itemCount: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
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
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 2,
  },
});

export default CartBar;
