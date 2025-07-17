import React from 'react';
import { Image, ImageProps, ImageStyle, StyleProp } from 'react-native';
import useThemeStore from '../../store/themeStore';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fallbackImage = require('../../assets/images/homeBackground.png');

interface CategoryLogoProps extends Omit<ImageProps, 'source'> {
  category: string;
  style?: StyleProp<ImageStyle>;
}

const CategoryLogo: React.FC<CategoryLogoProps> = ({ category, style, ...rest }) => {
  const categoryImages = useThemeStore(state => state.getCategoryImages());
  const imageUrl = categoryImages[category];

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={style} {...rest} />;
  }
  return <Image source={fallbackImage} style={style} {...rest} />;
};

export default CategoryLogo;
