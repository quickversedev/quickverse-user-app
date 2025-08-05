import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';

interface Variant {
  id: string;
  name: string;
  value: string;
}

interface ProductInfoProps {
  productName: string;
  variants: Variant[];
  selectedVariantId: string;
  onVariantSelect: (variantId: string) => void;
  onProductInfoPress: () => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  productName,
  variants,
  selectedVariantId,
  onVariantSelect,
  onProductInfoPress,
}) => {
  const { getColor, getTypography } = useTheme();

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    productName: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginBottom: 20,
      textAlign: 'left',
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
    productInfoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: getColor('card'),
      borderRadius: 8,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    productInfoText: {
      fontSize: getTypography('body'),
      fontWeight: '500',
      color: getColor('text'),
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.productName}>{productName}</Text>

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

      <TouchableOpacity style={styles.productInfoButton} onPress={onProductInfoPress}>
        <Text style={styles.productInfoText}>Product Info</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={getColor('subText')} />
      </TouchableOpacity>
    </View>
  );
};

export default ProductInfo;
