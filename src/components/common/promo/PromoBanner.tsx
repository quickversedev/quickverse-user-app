import React from 'react';
import {
  Image,
  ImageStyle,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Images } from '../../../assets';
import { useTheme } from '../../../theme/ThemeContext';

export type PromoBannerSize = 'small' | 'medium' | 'large' | number;

interface BannerButtonConfig {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

interface PromoBannerProps {
  promo: string;
  title?: string;
  subtitle?: string;
  bannerButton?: React.ReactNode | BannerButtonConfig;
  size?: PromoBannerSize;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  backgroundColor?: string;
  isBannerImage?: boolean;
  aspectRatio?: number; // width:height ratio for custom sizes (predefined sizes have their own ratios)
}

const sizeMap = {
  small: { img: 60, font: 14, subFont: 11, pad: 10, btn: 24 },
  medium: { img: 100, font: 18, subFont: 14, pad: 16, btn: 32 },
  large: { img: 160, font: 24, subFont: 16, pad: 24, btn: 40 },
};

/**
 * PromoBanner Component
 *
 * Aspect Ratio Implementation:
 * - For regular mode (isBannerImage = false): Always uses square (1:1) aspect ratio
 * - For banner mode (isBannerImage = true): Uses size-based aspect ratios:
 *   - small: 13/3 (4.33:1) - very wide
 *   - medium: 8/3 (2.67:1) - wide
 *   - large: 5/3 (1.67:1) - moderate
 * - Custom sizes (numbers) use the aspectRatio prop
 *
 * Common aspect ratios (when using custom sizes):
 * - 16/9 = Widescreen (1.78:1) - common for videos/banners
 * - 4/3 = Standard (1.33:1) - traditional aspect ratio
 * - 1 = Square (1:1)
 * - 3/2 = Photo (1.5:1) - common for photos
 * - 2/1 = Panoramic (2:1) - wide banners
 *
 * Usage examples:
 * <PromoBanner promo="banner1" size="medium" isBannerImage />
 * <PromoBanner promo="product1" size="large" /> // Always square image
 * <PromoBanner promo="custom1" aspectRatio={16/9} size={120} />
 */
const PromoBanner: React.FC<PromoBannerProps> = ({
  promo,
  title,
  subtitle,
  bannerButton,
  size = 'medium',
  style,
  imageStyle,
  backgroundColor,
  isBannerImage = false,
  aspectRatio = 16 / 9, // Default for custom sizes
}) => {
  const { getColor, getTypography, theme } = useTheme();
  // const promoImages = useThemeStore(state => state.getPromoImages());
  const promoImages: Record<string, string> = {};
  const imageUrl = promoImages[promo];
  const s =
    typeof size === 'number'
      ? { img: size, font: 16, subFont: 12, pad: 12, btn: 28 }
      : sizeMap[size] || sizeMap.medium;

  const fallbackPromo = Images.bg1;

  // Get aspect ratio based on size
  const getAspectRatio = (): number => {
    // For regular mode (isBannerImage = false), always use square aspect ratio
    if (!isBannerImage) {
      return 1; // Square aspect ratio for regular mode
    }

    if (typeof size === 'number') {
      return aspectRatio; // Use custom aspect ratio for custom sizes
    }

    switch (size) {
      case 'small':
        return 13 / 3; // 4.33:1 - very wide for small
      case 'medium':
        return 8 / 3; // 2.67:1 - wide for medium
      case 'large':
        return 5 / 3; // 1.67:1 - moderate for large
      default:
        return aspectRatio; // Fallback to custom aspect ratio
    }
  };

  const currentAspectRatio = getAspectRatio();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center', // default, will be overridden
      borderRadius: theme.borderRadius.md,
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      borderRadius: theme.borderRadius.sm,
    },
    image: {
      borderRadius: theme.borderRadius.sm,
      marginRight: 16, // Will be overridden by dynamic pad
    },
    content: {
      flex: 1,
    },
    bannerImageContent: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderBottomLeftRadius: theme.borderRadius.sm,
      borderBottomRightRadius: theme.borderRadius.sm,
    },
    title: {
      fontWeight: 'bold',
      marginBottom: 2,
      color: getColor('text'),
      fontSize: getTypography('body'),
    },
    bannerImageTitle: {
      fontWeight: 'bold',
      marginBottom: 2,
      color: '#fff',
      fontSize: getTypography('body'),
    },
    subtitle: {
      color: getColor('subText'),
      marginBottom: 4,
      fontSize: getTypography('caption'),
    },
    bannerImageSubtitle: {
      color: '#fff',
      marginBottom: 4,
      opacity: 0.9,
      fontSize: getTypography('caption'),
    },
    button: {
      backgroundColor: getColor('primary'),
      borderRadius: theme.borderRadius.sm,
      paddingVertical: 6,
      paddingHorizontal: 16,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    bannerImageButton: {
      backgroundColor: '#fff',
      borderRadius: theme.borderRadius.sm,
      paddingVertical: 6,
      paddingHorizontal: 16,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
    },
    bannerImageButtonText: {
      color: '#000',
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
    },
  });

  const bannerShadow =
    Platform.OS === 'ios'
      ? {
          shadowColor: getColor('shadow').color,
          shadowOpacity: getColor('shadow').opacity,
          shadowRadius: getColor('shadow').radius,
        }
      : {
          elevation: 2,
        };

  if (isBannerImage) {
    return (
      <View
        style={[
          styles.container,
          bannerShadow,
          { aspectRatio: currentAspectRatio }, // Apply dynamic aspect ratio to container
          style,
        ]}
      >
        <Image
          source={imageUrl ? { uri: imageUrl } : fallbackPromo}
          style={[styles.bannerImage, imageStyle]}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        bannerShadow,
        { padding: s.pad, backgroundColor: backgroundColor || getColor('card') },
        style,
      ]}
    >
      <Image
        source={imageUrl ? { uri: imageUrl } : fallbackPromo}
        style={[
          styles.image,
          {
            width: s.img,
            height: s.img / currentAspectRatio, // Calculate height based on aspect ratio
            marginRight: s.pad,
          },
          imageStyle,
        ]}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={[styles.title, { fontSize: s.font }]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[styles.subtitle, { fontSize: s.subFont }]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
        {bannerButton &&
          (typeof bannerButton === 'object' && 'label' in bannerButton ? (
            <TouchableOpacity
              style={[styles.button, bannerButton.style]}
              onPress={bannerButton.onPress}
            >
              <Text style={[styles.buttonText, { fontSize: s.subFont }]}>{bannerButton.label}</Text>
            </TouchableOpacity>
          ) : (
            bannerButton
          ))}
      </View>
    </View>
  );
};

export default PromoBanner;
