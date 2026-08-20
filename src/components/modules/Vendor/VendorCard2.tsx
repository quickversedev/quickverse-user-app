import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import CachedImage from '../../common/CachedImage';
import { useTheme } from '../../../theme/ThemeContext';
import { Vendor } from '../../../types/vendor';
import { getCleanImageUri } from '../../../utils/imageUtils';
import { isStoreOpen } from '../../../utils/storeUtils';
import { ThemeText } from '../../common/theme/ThemeText';

const { width } = Dimensions.get('window');

type CardSize = 'small' | 'medium' | 'large' | number;

interface VendorCardProps {
  vendor: Vendor;
  onPress: (vendor: Vendor) => void;
  onFavoritePress?: (vendor: Vendor) => void;
  isFavorite?: boolean;
  size?: CardSize;
  disabled?: boolean;
}

const VendorCard2: React.FC<VendorCardProps> = ({
  vendor,
  onPress,
  onFavoritePress,
  isFavorite = false,
  size = 'medium',
  disabled = false,
}) => {
  const { getColor, theme } = useTheme();

  const storeStatus = React.useMemo(
    () =>
      isStoreOpen({
        openingTime: vendor.openingTime,
        closingTime: vendor.closingTime,
        storeActive: vendor.storeActive,
      }),
    [vendor.openingTime, vendor.closingTime, vendor.storeActive]
  );

  const isStoreClosed = disabled || !storeStatus.isOpen;

  const getCardWidth = (): number => {
    switch (size) {
      case 'small':
        return (width - 48) / 3;
      case 'large':
        return width - 40; // Full width with margins
      case 'medium':
      default:
        return (width - 48) / 2;
    }
  };

  const cardWidth = typeof size === 'number' ? size : getCardWidth();
  const imageHeight = cardWidth * 0.75;

  const bannerUri = getCleanImageUri(vendor.banner as string);
  const logoUri = getCleanImageUri(vendor.logo as string);
  const imageUri = bannerUri || logoUri || undefined;

  // Hardcoded colors to match screenshot aesthetics
  const COLORS = {
    background: '#F9FAFB', // Very light grey/white
    cardBg: '#FFFFFF',
    title: '#003F66', // Dark slate/navy
    starBg: '#12A58C', // Emerald green
    metaText: '#9CA3AF', // Grey
    metaIcon: '#9CA3AF',
  };

  const styles = StyleSheet.create({
    cardContainer: {
      width: cardWidth,
      backgroundColor: COLORS.cardBg,
      borderRadius: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
      overflow: 'visible', // Allow shadow to show
    },
    innerContainer: {
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: COLORS.cardBg,
    },
    imageWrapper: {
      position: 'relative',
      height: imageHeight,
      width: '100%',
      backgroundColor: '#E2E8F0',
    },
    vendorImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    disabledOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.55)',
      zIndex: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closedText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 16,
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
    closedTimingOverlay: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 11,
      marginTop: 4,
    },
    favoriteButton: {
      position: 'absolute',
      top: 6,
      right: 6,
      zIndex: 20,
      backgroundColor: '#55555566',
      borderRadius: 20,
      padding: 4,
    },
    contentContainer: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    title: {
      fontSize: 12,
      fontWeight: '700',
      color: COLORS.title,
      fontFamily: 'Inter-Bold', // Assuming Inter or system bold
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.starBg,
      paddingHorizontal: 4,
      // paddingVertical: 2,
      borderRadius: 6,
      marginRight: 8,
    },
    ratingText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 4,
    },
    reviewCount: {
      color: COLORS.metaText,
      fontSize: 13,
      fontWeight: '400',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      color: COLORS.metaText,
      fontSize: 13,
      fontWeight: '500',
    },
    dot: {
      marginHorizontal: 6,
      color: COLORS.metaText,
      fontSize: 10,
    },
    timeBadge: {
      position: 'absolute',
      top: 6,
      left: 6,
      zIndex: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.9)',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
    },
    timeBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#1F2937',
    },
    closedCard: {
      opacity: 0.6,
    },
  });

  return (
    <TouchableOpacity
      activeOpacity={isStoreClosed ? 1 : 0.9}
      style={[styles.cardContainer, isStoreClosed && styles.closedCard]}
      onPress={() => !isStoreClosed && onPress(vendor)}
    >
      <View style={styles.innerContainer}>
        <View style={styles.imageWrapper}>
          {isStoreClosed && (
            <View style={styles.disabledOverlay}>
              <ThemeText style={styles.closedText}>CLOSED</ThemeText>
              {vendor.openingTime && vendor.closingTime && (
                <ThemeText style={styles.closedTimingOverlay}>
                  {vendor.openingTime} - {vendor.closingTime}
                </ThemeText>
              )}
            </View>
          )}
          {imageUri && <CachedImage uri={imageUri} style={styles.vendorImage} />}
          {!isStoreClosed && (
            <View style={styles.timeBadge}>
              <FontAwesome6
                name="bolt-lightning"
                iconStyle="solid"
                size={8}
                color="#D97706"
                style={{ marginRight: 3 }}
              />
              <ThemeText style={styles.timeBadgeText}>
                {vendor.preparationTime || '30 mins'}
              </ThemeText>
            </View>
          )}
          {/* <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => onFavoritePress && onFavoritePress(vendor)}
                    >
                        <MaterialCommunityIcons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={24}
                            color="#fff"
                        />
                    </TouchableOpacity> */}
        </View>

        <View style={styles.contentContainer}>
          <ThemeText style={styles.title} numberOfLines={1}>
            {vendor.name}
          </ThemeText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(VendorCard2);
