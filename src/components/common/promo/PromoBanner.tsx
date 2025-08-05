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
import useThemeStore from '../../../store/themeStore';

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
}

const sizeMap = {
  small: { img: 60, font: 14, subFont: 11, pad: 10, btn: 24 },
  medium: { img: 100, font: 18, subFont: 14, pad: 16, btn: 32 },
  large: { img: 160, font: 24, subFont: 16, pad: 24, btn: 40 },
};

const bannerShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
      }
    : {
        elevation: 2,
      };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center', // default, will be overridden
    borderRadius: 16,
    // marginVertical: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  image: {
    borderRadius: 12,
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
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bannerImageTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#fff',
  },
  subtitle: {
    color: '#666',
    marginBottom: 4,
  },
  bannerImageSubtitle: {
    color: '#fff',
    marginBottom: 4,
    opacity: 0.9,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  bannerImageButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bannerImageButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

const PromoBanner: React.FC<PromoBannerProps> = ({
  promo,
  title,
  subtitle,
  bannerButton,
  size = 'medium',
  style,
  imageStyle,
  backgroundColor = '#fff',
  isBannerImage = false,
}) => {
  const promoImages = useThemeStore(state => state.getPromoImages());
  const imageUrl = promoImages[promo];
  const s =
    typeof size === 'number'
      ? { img: size, font: 16, subFont: 12, pad: 12, btn: 28 }
      : sizeMap[size] || sizeMap.medium;

  const fallbackPromo = Images.bg1;

  if (isBannerImage) {
    return (
      <View style={[styles.container, bannerShadow, style]}>
        <Image
          source={imageUrl ? { uri: imageUrl } : fallbackPromo}
          style={[styles.bannerImage, { width: '100%', height: '100%' }, imageStyle]}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, bannerShadow, { padding: s.pad, backgroundColor }, style]}>
      <Image
        source={imageUrl ? { uri: imageUrl } : fallbackPromo}
        style={[styles.image, { width: s.img, height: s.img, marginRight: s.pad }, imageStyle]}
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
