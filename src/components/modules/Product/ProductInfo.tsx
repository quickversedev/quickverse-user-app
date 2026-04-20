import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { cleanHtmlText } from '../../../utils/htmlUtils';

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
  attributes?: {
    color: string | null;
    size: string | null;
    name: string | null;
    description: string | null;
    price: number | null;
    unit: string | null;
  };
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  productName,
  variants,
  selectedVariantId,
  onVariantSelect,
  onProductInfoPress,
  attributes,
}) => {
  const { getColor, getTypography } = useTheme();

  const [isAttributesExpanded, setIsAttributesExpanded] = useState(true);

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    productNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    productName: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
      textAlign: 'left',
      flex: 1,
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
    collapsibleSection: {
      marginBottom: 16,
    },
    sectionHeader: {
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
    sectionTitle: {
      fontSize: getTypography('body'),
      fontWeight: '600',
      color: getColor('text'),
    },
    sectionContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: getColor('background'),
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: getColor('border'),
    },
    attributeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    attributeLabel: {
      fontSize: getTypography('small'),
      color: getColor('subText'),
      fontWeight: '500',
    },
    attributeValue: {
      fontSize: getTypography('small'),
      color: getColor('text'),
      fontWeight: '600',
      textAlign: 'right',
      flex: 1,
      marginLeft: 16,
    },
    lastAttributeRow: {
      borderBottomWidth: 0,
    },
  });

  const renderCollapsibleSection = (
    title: string,
    isExpanded: boolean,
    onToggle: () => void,
    children: React.ReactNode
  ) => (
    <View style={styles.collapsibleSection}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <MaterialCommunityIcons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={getColor('subText')}
        />
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );

  const renderAttributeRow = (label: string, value: string | number | null, isLast = false) => {
    if (value === null || value === undefined) return null;
    const cleanValue = cleanHtmlText(value.toString());

    return (
      <View style={[styles.attributeRow, isLast && styles.lastAttributeRow]}>
        <Text style={styles.attributeLabel}>{label}</Text>
        <Text style={styles.attributeValue} numberOfLines={3}>
          {cleanValue}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.productNameContainer}>
        <Text style={styles.productName}>{productName}</Text>
      </View>
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
      {/* Product Info Collapsible Section */}
      {/* Attributes Collapsible Section */}
      {attributes &&
        renderCollapsibleSection(
          'Product Attributes',
          isAttributesExpanded,
          () => setIsAttributesExpanded(!isAttributesExpanded),
          <View>
            {renderAttributeRow('Size', attributes.size)}
            {renderAttributeRow('Color', attributes.color)}
            {renderAttributeRow('Name', attributes.name)}
            {renderAttributeRow('Description', attributes.description)}
            {renderAttributeRow('Price', attributes.price ? `₹${attributes.price}` : null)}
            {renderAttributeRow('Unit', attributes.unit, true)}
          </View>
        )}
    </View>
  );
};

export default ProductInfo;
