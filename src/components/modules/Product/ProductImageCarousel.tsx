import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface ProductImageCarouselProps {
  imageUrl: string;
  additionalImages?: Array<{ url: string | null }>;
  productName: string;
  currentImageIndex?: number;
  onImageIndexChange?: (index: number) => void;
  /** Hero height, supplied by the parent so the image can be full-bleed. */
  height: number;
}

const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  imageUrl,
  additionalImages = [],
  productName,
  currentImageIndex = 0,
  onImageIndexChange,
  height,
}) => {
  const { getColor, getTypography } = useTheme();

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
    imageContainer: {
      width: '100%',
      height,
      backgroundColor: getColor('card'),
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    productImage: {
      width: '100%',
      height: '100%',
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
      position: 'absolute',
      bottom: 16,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
      backgroundColor: getColor('border'),
    },
    activeIndicator: {
      backgroundColor: getColor('primary'),
    },
  });

  return (
    <View style={styles.imageContainer}>
      {getCurrentImageUrl() ? (
        <Image
          source={{ uri: getCurrentImageUrl() }}
          style={styles.productImage}
          // 'cover' so the hero reaches both screen edges. 'contain' letterboxed a
          // square photo inside a wider frame, leaving background strips down the
          // sides. The frame is square (see HERO_HEIGHT), so square packshots lose
          // nothing; only unusually tall or wide photos get centre-cropped.
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>{productName}</Text>
        </View>
      )}

      {totalImages > 1 && (
        <View style={styles.carouselIndicators}>
          {Array.from({ length: totalImages }, (_, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.indicator, index === currentImageIndex && styles.activeIndicator]}
              onPress={() => onImageIndexChange?.(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default ProductImageCarousel;
