import React, { memo, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { triggerAddToCartHaptic } from '../../../utils/haptics';
import { ThemeText } from '../../common/theme/ThemeText';
import _VegIcon from '../../common/VegIcon';

const IMAGE_SIZE = 70;

interface HorizontalProductCardProps {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onPress?: () => void;
  disabled?: boolean;
  showVariantsCount?: boolean;
}

const HorizontalProductCard: React.FC<HorizontalProductCardProps> = memo(
  ({
    product,
    quantity,
    onAdd,
    onIncrement,
    onDecrement,
    onPress,
    disabled = false,
    showVariantsCount = false,
  }) => {
    const { getColor, theme } = useTheme();
    const [imageError, setImageError] = useState(false);

    const {
      name,
      mrp,
      sellingPrice,
      veg: _veg,
      imageUrl,
      numberOfVariants = 1,
      inStock = true,
    } = product;

    const hasDiscount = mrp > sellingPrice;
    const hasMultipleVariants = numberOfVariants > 1;
    const isDisabled = disabled || !inStock;

    const handleAddPress = () => {
      if (isDisabled) return;
      triggerAddToCartHaptic();
      onAdd();
    };

    const handleCardPress = () => {
      if (onPress) {
        onPress();
      }
    };

    const styles = StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingLeft: 0,
        paddingRight: 12,
        borderBottomWidth: 1,
        borderBottomColor: getColor('border'),
        opacity: isDisabled ? 0.5 : 1,
      },
      imageContainer: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: getColor('card'),
      },
      image: {
        width: '100%',
        height: '100%',
      },
      placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: getColor('card'),
      },
      contentContainer: {
        flex: 1,
        marginLeft: 3,
        justifyContent: 'center',
      },
      nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
      },
      productName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: getColor('text'),
        lineHeight: 18,
      },
      priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      mrpText: {
        fontSize: 12,
        color: getColor('subText'),
        textDecorationLine: 'line-through',
        marginRight: 6,
      },
      sellingPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: getColor('text'),
      },
      buttonContainer: {
        marginLeft: 12,
      },
      // Unified button styles - same dimensions for ADD and quantity selector
      addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: getColor('primary'),
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
        minWidth: 80,
        height: 36,
        backgroundColor: getColor('card'),
      },
      addButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: getColor('primary'),
        marginRight: 2,
      },
      quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: getColor('primary'),
        borderRadius: 8,
        backgroundColor: getColor('card'),
        minWidth: 80,
        height: 36,
      },
      qtyButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
      },
      qtyText: {
        fontSize: 18,
        fontWeight: '600',
        color: getColor('primary'),
        textAlign: 'center',
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
      qtyNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: getColor('text'),
        minWidth: 20,
        textAlign: 'center',
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
      variantsText: {
        fontSize: 9,
        color: getColor('primary'),
        marginTop: 2,
        textAlign: 'center',
      },
      outOfStockBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
      },
      outOfStockText: {
        fontSize: 8,
        fontWeight: '700',
        color: getColor('white'),
        textAlign: 'center',
      },
    });

    const renderAddButton = () => {
      if (quantity > 0) {
        return (
          <View style={styles.quantitySelector}>
            <TouchableOpacity style={styles.qtyButton} onPress={onDecrement} disabled={isDisabled}>
              <Text style={styles.qtyText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNumber}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyButton} onPress={onIncrement} disabled={isDisabled}>
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddPress}
            disabled={isDisabled}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>ADD</Text>
            <MaterialCommunityIcons name="plus" size={16} color={getColor('primary')} />
          </TouchableOpacity>
          {showVariantsCount && hasMultipleVariants && (
            <Text style={styles.variantsText}>{numberOfVariants} options</Text>
          )}
        </View>
      );
    };

    return (
      <>
        <TouchableOpacity
          style={styles.container}
          onPress={handleCardPress}
          activeOpacity={0.7}
          disabled={!onPress}
        >
          {/* Product Image */}
          <View style={styles.imageContainer}>
            {imageUrl && !imageError ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <MaterialCommunityIcons
                  name="image-outline"
                  size={30}
                  color={getColor('subText')}
                />
              </View>
            )}
            {!inStock && (
              <View style={styles.outOfStockBadge}>
                <ThemeText style={styles.outOfStockText}>OUT OF{'\n'}STOCK</ThemeText>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <View style={styles.nameRow}>
              <ThemeText style={styles.productName} numberOfLines={2}>
                {name}
              </ThemeText>
            </View>
            <View style={styles.priceRow}>
              {hasDiscount && <Text style={styles.mrpText}>₹{mrp}</Text>}
              <Text style={styles.sellingPrice}>₹{sellingPrice}</Text>
            </View>
          </View>

          {/* Add Button */}
          <View style={styles.buttonContainer}>{renderAddButton()}</View>
        </TouchableOpacity>
      </>
    );
  }
);

HorizontalProductCard.displayName = 'HorizontalProductCard';

export default HorizontalProductCard;
