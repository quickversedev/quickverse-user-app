import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
// 80% of screen width, max 320px
interface ProductImageCarouselProps {
  imageUrl: string;
  additionalImages?: Array<{ url: string | null }>;
  productName: string;
  onAddToStacks: () => void;
  currentImageIndex?: number;
  onImageIndexChange?: (index: number) => void;
}

const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  imageUrl,
  additionalImages = [],
  productName,
  onAddToStacks,
  currentImageIndex = 0,
  onImageIndexChange,
}) => {
  const { getColor, getTypography } = useTheme();
  const { width: screenWidth } = Dimensions.get('window');
  const imageWidth = screenWidth - 32; // 16px margin on each side
  const imageHeight = imageWidth * 0.55;

  // Calculate total images: main image + additional images
  const totalImages = 1 + (additionalImages?.length || 0);

  // Get current image URL
  const getCurrentImageUrl = () => {
    if (currentImageIndex === 0) {
      return imageUrl;
    }
    const additionalImageIndex = currentImageIndex - 1;
    return additionalImages?.[additionalImageIndex]?.url || imageUrl;
  };
  const styles = StyleSheet.create({
    container: {
      paddingVertical: 20,
    },
    imageContainer: {
      alignSelf: 'center',
      width: imageWidth,
      height: imageHeight,
      borderRadius: 16,
      backgroundColor: getColor('background'),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      overflow: 'hidden',
    },
    productImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: getColor('border'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
    },
    carouselIndicators: {
      flexDirection: 'row',
      alignSelf: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
      backgroundColor: getColor('border'),
    },
    activeIndicator: {
      backgroundColor: getColor('white'),
    },
    addToStacksButton: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: getColor('background'),
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginLeft: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    addToStacksText: {
      color: getColor('text'),
      fontSize: getTypography('small'),
      fontWeight: '500',
      marginLeft: 6,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {getCurrentImageUrl() ? (
          <Image
            source={{ uri: getCurrentImageUrl() }}
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>{productName}</Text>
          </View>
        )}
      </View>

      <View style={styles.carouselIndicators}>
        {Array.from({ length: totalImages }, (_, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.indicator, index === currentImageIndex && styles.activeIndicator]}
            onPress={() => onImageIndexChange?.(index)}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.addToStacksButton} onPress={onAddToStacks}>
        <MaterialCommunityIcons name="bookmark-outline" size={16} color={getColor('text')} />
        <Text style={styles.addToStacksText}>Add to Stacks</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProductImageCarousel;
