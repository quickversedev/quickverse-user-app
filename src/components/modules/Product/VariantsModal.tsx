import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Product } from '../../../assets/mock/products';
import { useVariants } from '../../../hooks/useVariants';
import { useTheme } from '../../../theme/ThemeContext';
import SectionDivider from '../../common/SectionDivider';

const { height } = Dimensions.get('window');

interface VariantsModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product;
  onVariantSelect: (variant: any) => void;
}

const VariantsModal: React.FC<VariantsModalProps> = ({
  visible,
  onClose,
  product,
  onVariantSelect,
}) => {
  const { getColor, getTypography, theme } = useTheme();
  const { variants, loading, error, hasData, fetchVariants, clearError, reset } = useVariants();
  console.log('product', product);
  useEffect(() => {
    if (visible && product.sku) {
      fetchVariants(product.sku);
    }
  }, [visible, product.sku, fetchVariants]);

  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [visible, reset]);

  const handleVariantSelect = (variant: any) => {
    onVariantSelect(variant);
    onClose();
  };

  const handleRetry = () => {
    if (product.sku) {
      clearError();
      fetchVariants(product.sku);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modal: {
      backgroundColor: getColor('card'),
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: height * 0.85,
      paddingBottom: 20,
    },
    dragIndicator: {
      width: 40,
      height: 4,
      backgroundColor: getColor('border'),
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 8,
    },
    closeButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      zIndex: 10,
      backgroundColor: getColor('card'),
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: getColor('shadow').color,
      shadowOffset: getColor('shadow').offset,
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
      elevation: 3,
    },
    content: {
      paddingHorizontal: 20,
    },
    productName: {
      fontSize: getTypography('h1'),
      fontWeight: 'bold',
      color: getColor('text'),
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 8,
    },
    productDescription: {
      fontSize: getTypography('body'),
      color: getColor('subText'),
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    sectionDivider: {
      marginVertical: 20,
    },
    variantsContainer: {
      marginTop: 16,
    },
    variantItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('background'),
      borderRadius: theme.borderRadius.md,
      padding: 16,
      marginBottom: 12,
      shadowColor: getColor('shadow').color,
      shadowOffset: getColor('shadow').offset,
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
      elevation: 2,
    },
    variantImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: getColor('border'),
      marginRight: 16,
    },
    variantInfo: {
      flex: 1,
    },
    variantName: {
      fontSize: getTypography('body'),
      fontWeight: '500',
      color: getColor('text'),
      marginBottom: 4,
    },
    variantPrice: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
    },
    variantPriceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    currentPrice: {
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginRight: 8,
    },
    originalPrice: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      textDecorationLine: 'line-through',
    },
    addButton: {
      backgroundColor: getColor('white'),
      borderWidth: 2,
      borderColor: '#FFD700',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.md,
      minWidth: 80,
      alignItems: 'center',
    },
    addButtonText: {
      color: getColor('text'),
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
    },
    addButtonDisabled: {
      backgroundColor: getColor('border'),
      borderColor: getColor('border'),
    },
    addButtonTextDisabled: {
      color: getColor('subText'),
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      marginTop: 12,
    },
    errorContainer: {
      padding: 40,
      alignItems: 'center',
    },
    errorText: {
      color: getColor('error'),
      fontSize: getTypography('body'),
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: getColor('primary'),
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
    },
    retryButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: '600',
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      color: getColor('subText'),
      fontSize: getTypography('body'),
      textAlign: 'center',
    },
    bottomIndicator: {
      width: 40,
      height: 4,
      backgroundColor: getColor('white'),
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 20,
    },
  });

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={getColor('primary')} />
          <Text style={styles.loadingText}>Loading variants...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!hasData) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No variants available</Text>
        </View>
      );
    }

    return variants.map(variant => (
      <View key={variant.id} style={styles.variantItem}>
        <View style={styles.variantImage} />
        <View style={styles.variantInfo}>
          <Text style={styles.variantName}>{variant.name}</Text>
          <Text style={styles.variantPrice}>{variant.description}</Text>
        </View>
        <View style={styles.variantPriceContainer}>
          <Text style={styles.currentPrice}>₹{variant.price}</Text>
          <Text style={styles.originalPrice}>₹{variant.mrp}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, !variant.inStock && styles.addButtonDisabled]}
          onPress={() => handleVariantSelect(variant)}
          disabled={!variant.inStock}
        >
          <Text style={[styles.addButtonText, !variant.inStock && styles.addButtonTextDisabled]}>
            {variant.inStock ? 'ADD +' : 'NA'}
          </Text>
        </TouchableOpacity>
      </View>
    ));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.dragIndicator} />

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={20} color={getColor('text')} />
          </TouchableOpacity>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription}>
              A rich swirl of velvety dark chocolate ice cream, studded with gooey chunks of freshly
              baked fudge brownies.
            </Text>

            <View style={styles.sectionDivider}>
              <SectionDivider text="SELECT UNIT" fontSize={16} />
            </View>

            <View style={styles.variantsContainer}>{renderContent()}</View>
          </ScrollView>

          <View style={styles.bottomIndicator} />
        </View>
      </View>
    </Modal>
  );
};

export default VariantsModal;
