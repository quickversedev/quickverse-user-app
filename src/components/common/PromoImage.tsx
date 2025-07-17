import React from 'react';
import { Image, ImageProps, ImageStyle, StyleProp } from 'react-native';
import useThemeStore from '../../store/themeStore';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fallbackPromo = require('../../assets/images/bg_1.png');

interface PromoImageProps extends Omit<ImageProps, 'source'> {
  promo: string;
  size?: 'small' | 'medium' | 'large' | number;
  style?: StyleProp<ImageStyle>;
}

const sizeMap = {
  small: 60,
  medium: 100,
  large: 160,
};

const PromoImage: React.FC<PromoImageProps> = ({ promo, size = 'medium', style, ...rest }) => {
  const promoImages = useThemeStore(state => state.getPromoImages());
  const imageUrl = promoImages[promo];
  let dimension: number;
  if (typeof size === 'number') {
    dimension = size;
  } else {
    dimension = sizeMap[size] || sizeMap.medium;
  }

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[{ width: dimension, height: dimension, borderRadius: 12 }, style]}
        {...rest}
      />
    );
  }
  return (
    <Image
      source={fallbackPromo}
      style={[{ width: dimension, height: dimension, borderRadius: 12 }, style]}
      {...rest}
    />
  );
};

export default PromoImage;
