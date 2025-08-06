import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icons } from '../../../assets';
import { useTheme } from '../../../theme/ThemeContext';
import { Vendor } from '../../../types/vendor';
import { RatingBadge } from '../../common';

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
  isFavorite = false,
  favoriteColor = '#FF6B35',
  size = 'medium',
  disabled = false,
}) => {
  const { getColor, getTypography } = useTheme();

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
    return cardWidth * 0.7; // 60% of card width for aspect ratio
  };

  const cardWidth = typeof size === 'number' ? size : getCardWidth();
  const imageHeight = getImageHeight();

  const styles = StyleSheet.create({
    vendorCard: {
      width: cardWidth,
      backgroundColor: getColor('card'),
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    vendorImage: {
      width: '100%',
      height: imageHeight,
      resizeMode: 'cover',
    },
    vendorInfo: {
      padding: size === 'small' ? 8 : 12,
    },
    vendorName: {
      color: getColor('text'),
      fontSize: size === 'small' ? getTypography('caption') : getTypography('body'),
      fontWeight: 'bold',
      marginBottom: 4,
    },
    vendorRating: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    ratingText: {
      color: getColor('text'),
      fontSize: size === 'small' ? getTypography('small') : getTypography('caption'),
      marginLeft: 4,
    },
    vendorMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      color: getColor('subText'),
      fontSize: size === 'small' ? getTypography('small') : getTypography('caption'),
      marginLeft: 4,
    },
    favoriteButton: {
      position: 'absolute',
      top: size === 'small' ? 4 : 8,
      right: size === 'small' ? 4 : 8,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontFamily: 'BricolageGrotesque-Regular',
    },
  });

  return (
    <TouchableOpacity
      style={[styles.vendorCard, disabled && { opacity: 0.4 }]}
      onPress={() => onPress(vendor)}
    >
      <View style={{ position: 'relative' }}>
        {disabled && (
          <View style={styles.disabledOverlay}>
            <Text style={styles.closedText}>Store Closed</Text>
          </View>
        )}
        <Image source={{ uri: vendor.banner || vendor.logo }} style={styles.vendorImage} />
        <TouchableOpacity style={styles.favoriteButton} onPress={() => onFavoritePress?.(vendor)}>
          <Image source={Icons.heart} style={{ width: 20, height: 20 }} />
        </TouchableOpacity>
      </View>
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName} numberOfLines={size === 'small' ? 1 : 2}>
          {vendor.name}
        </Text>
        <View style={styles.vendorRating}>
          <RatingBadge rating={vendor.rating || 0} size="small" />
        </View>
        <View style={styles.vendorMeta}>
          <Image source={Icons.lightning} />
          <Text style={styles.metaText} numberOfLines={1}>
            30 mins • FC Road
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default VendorCard;
