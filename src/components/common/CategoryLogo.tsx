import React from 'react';
import { Image, ImageProps, ImageStyle, StyleProp } from 'react-native';
import { Images } from '../../assets';
import { useTheme } from '../../theme/ThemeContext';

interface CategoryLogoProps extends Omit<ImageProps, 'source'> {
  category: string;
  imageUrl?: string;
  style?: StyleProp<ImageStyle>;
}

const CategoryLogo: React.FC<CategoryLogoProps> = ({ category, imageUrl, style, ...rest }) => {
  const { theme } = useTheme();

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

  // Apply default styling if no style is provided
  const defaultStyle = {
    borderRadius: theme.borderRadius.sm,
  };

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={[defaultStyle, style]} {...rest} />;
  }
  return <Image source={fallbackImage} style={[defaultStyle, style]} {...rest} />;
};

export default CategoryLogo;
