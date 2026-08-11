import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface Variant {
  id: string;
  name: string;
  value: string;
}

/**
 * Variant chips only. The product name, subtitle and description used to live here
 * too, but ProductDetailModal now renders them so it can place the price between
 * the name and the description — this component self-hides at <= 1 variant.
 */
interface ProductInfoProps {
  variants: Variant[];
  selectedVariantId: string;
  onVariantSelect: (variantId: string) => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  variants,
  selectedVariantId,
  onVariantSelect,
}) => {
  const { getColor, getTypography } = useTheme();

  const styles = StyleSheet.create({
    container: {
      // No horizontal padding — ProductDetailModal's sheet supplies the gutter.
      paddingBottom: 16,
    },
    variantsContainer: {
      marginBottom: 24,
    },
    variantsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    variantOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: getColor('border'),
      backgroundColor: getColor('card'),
    },
    selectedVariant: {
      borderColor: getColor('primary'),
      backgroundColor: getColor('card'),
    },
    radioButton: {
      width: 16,
      height: 16,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: getColor('border'),
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedRadioButton: {
      borderColor: getColor('white'),
    },
    radioButtonInner: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: getColor('white'),
    },
    variantText: {
      fontSize: getTypography('small'),
      color: getColor('text'),
      fontWeight: '500',
    },
    selectedVariantText: {
      color: getColor('white'),
    },
  });

  return (
    <View style={styles.container}>
      {variants.length > 1 && (
        <View style={styles.variantsContainer}>
          <View style={styles.variantsList}>
            {variants.map(variant => {
              const isSelected = variant.id === selectedVariantId;
              return (
                <TouchableOpacity
                  key={variant.id}
                  style={[styles.variantOption, isSelected && styles.selectedVariant]}
                  onPress={() => onVariantSelect(variant.id)}
                >
                  <View style={[styles.radioButton, isSelected && styles.selectedRadioButton]}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={[styles.variantText, isSelected && styles.selectedVariantText]}>
                    {variant.value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

export default ProductInfo;
