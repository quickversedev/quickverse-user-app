import React from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
import { Vendor } from '../../../types/vendor';
import { getCleanImageUri } from '../../../utils/imageUtils';
import { RatingBadge } from '../../common';
import { ThemeText } from '../../common/theme/ThemeText';

const { width } = Dimensions.get('window');

type CardSize = 'small' | 'medium' | 'large' | number;

interface VendorCardProps {
  vendor: Vendor;
  onPress: (vendor: Vendor) => void;
  onFavoritePress?: (vendor: Vendor) => void;
  isFavorite?: boolean;
  favoriteColor?: string;
  size?: CardSize;
  disabled?: boolean;
}

const VendorCard: React.FC<VendorCardProps> = ({
  vendor,
  onPress,
  onFavoritePress,
  isFavorite: _isFavorite = false,
  favoriteColor: _favoriteColor = '#FF6B35',
  size = 'medium',
  disabled = false,
}) => {
  const { getColor, theme } = useTheme();

  // Calculate card width based on size
  const getCardWidth = (): number => {
    switch (size) {
      case 'small':
        return (width - 48) / 3; // 3 columns
      case 'large':
        return width - 32; // Full width with margins
      case 'medium':
      default:
        return (width - 48) / 2; // 2 columns
    }
  };

  // Calculate image height based on card width
  const getImageHeight = (): number => {
    const cardWidth = typeof size === 'number' ? size : getCardWidth();
    return cardWidth * (7 / 10); // 10:7 aspect ratio (width:height)
  };

  const cardWidth = typeof size === 'number' ? size : getCardWidth();
  const imageHeight = getImageHeight();

  const styles = StyleSheet.create({
    vendorCard: {
      width: cardWidth,
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      marginBottom: 16,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: getColor('shadow').color,
      shadowOffset: getColor('shadow').offset,
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
    },
    vendorImage: {
      width: '100%',
      height: imageHeight,
      resizeMode: 'cover',
    },
    vendorInfo: {
      padding: size === 'small' ? 8 : 12,
    },
    vendorRating: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    ratingText: {
      color: getColor('text'),
      marginLeft: 4,
    },
    vendorMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      color: getColor('subText'),
      marginLeft: 4,
    },
    favoriteButton: {
      position: 'absolute',
      top: size === 'small' ? 4 : 8,
      right: size === 'small' ? 4 : 8,
      // backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: size === 'small' ? 8 : 12,
      padding: size === 'small' ? 2 : 4,
      zIndex: 20,
    },
    disabledOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closedText: {
      color: getColor('white'),
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontFamily: 'BricolageGrotesque-Regular',
    },
  });

  const bannerUri = getCleanImageUri(vendor.banner as string);
  const logoUri = getCleanImageUri(vendor.logo as string);

  const imageSource: ImageSourcePropType | undefined = bannerUri
    ? { uri: bannerUri }
    : logoUri
    ? { uri: logoUri }
    : undefined;
  return (
    <TouchableOpacity
      style={[styles.vendorCard, disabled && { opacity: 0.4 }]}
      onPress={() => onPress(vendor)}
    >
      <View style={{ position: 'relative' }}>
        {disabled && (
          <View style={styles.disabledOverlay}>
            <ThemeText
              variant="body"
              color={getColor('white')}
              style={{ textTransform: 'uppercase' }}
            >
              Store Closed
            </ThemeText>
          </View>
        )}
        {imageSource && <Image source={imageSource} style={styles.vendorImage} />}
        <TouchableOpacity style={styles.favoriteButton} onPress={() => onFavoritePress?.(vendor)}>
          <MaterialCommunityIcons
            name={_isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={_isFavorite ? _favoriteColor : getColor('error')}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.vendorInfo}>
        <ThemeText
          variant={size === 'small' ? 'caption' : 'body'}
          color={getColor('text')}
          style={{ marginBottom: 4 }}
          numberOfLines={size === 'small' ? 1 : 2}
        >
          {vendor.name}
        </ThemeText>
        <View style={styles.vendorRating}>
          <RatingBadge rating={vendor.rating || 0} size="small" />
        </View>
        <View style={styles.vendorMeta}>
          <MaterialCommunityIcons name="flash" size={18} color={getColor('primary')} />
          <ThemeText
            variant={size === 'small' ? 'small' : 'caption'}
            color={getColor('subText')}
            style={{ marginLeft: 4 }}
            numberOfLines={1}
          >
            {vendor.preparationTime || '30 mins'}
          </ThemeText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default VendorCard;
