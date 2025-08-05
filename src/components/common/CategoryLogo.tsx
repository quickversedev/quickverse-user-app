import React from 'react';
import { Image, ImageProps, ImageStyle, StyleProp } from 'react-native';
import { Images } from '../../assets';
import useThemeStore from '../../store/themeStore';

interface CategoryLogoProps extends Omit<ImageProps, 'source'> {
  category: string;
  style?: StyleProp<ImageStyle>;
}

const CategoryLogo: React.FC<CategoryLogoProps> = ({ category, style, ...rest }) => {
  const categoryImages = useThemeStore(state => state.getCategoryImages());
  const imageUrl = categoryImages[category];

  // Get category-specific fallback image
  const getFallbackImage = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return Images.food;
      case 'grocery':
        return Images.grocery;
      case 'pharmacy':
        return Images.pharmacy;
      case 'for you':
      case 'foryou':
        return Images.forYou;
      default:
        return Images.homeBackground;
    }
  };

  const fallbackImage = getFallbackImage(category);

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={style} {...rest} />;
  }
  return <Image source={fallbackImage} style={style} {...rest} />;
};

export default CategoryLogo;
