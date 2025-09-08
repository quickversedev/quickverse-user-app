import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { Animated, Image, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Images } from '../../assets';
import { useTheme } from '../../theme/ThemeContext';
import { Vendor } from '../../types/vendor';
import { ThemeText } from '../common/theme/ThemeText';

interface VendorHeaderCardProps {
  vendor: Vendor;
  onPress?: () => void;
  style?: ViewStyle;
}

const VendorHeaderCard: React.FC<VendorHeaderCardProps> = ({ vendor, onPress, style }) => {
  const { getColor, theme } = useTheme();
  const navigation = useNavigation();
  const scale = useRef(new Animated.Value(1)).current;
  const [logoError, setLogoError] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      margin: 16,
      padding: 12,
      shadowColor: getColor('primary'),
      shadowOpacity: 0.2,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: getColor('primary'),
    },
    logo: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.max,
      marginRight: 12,
      backgroundColor: getColor('border'),
    },
    info: { flex: 1 },
    meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    metaText: { color: getColor('subText'), marginRight: 8 },
    ratingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1ec28b',
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 8,
    },
  });

  const renderRating = () => {
    if (!vendor.rating || vendor.rating === 0)
      return (
        <ThemeText variant="caption" color="#fff" style={{ marginLeft: 2 }}>
          Not Rated
        </ThemeText>
      );
    return (
      <ThemeText variant="caption" color="#fff" style={{ marginLeft: 2 }}>
        {vendor.rating}
      </ThemeText>
    );
  };

  const formatAddress = () => {
    if (vendor.shopAddress) return vendor.shopAddress.city;
    return 'Location';
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    // @ts-expect-error - Navigation type issue
    navigation.navigate('VendorDetails', { vendor });
  };

  const handlePressIn = () => {
    Animated.timing(scale, { toValue: 0.98, duration: 100, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Image
          source={logoError || !vendor.logo ? Images.bg1 : { uri: vendor.logo }}
          style={styles.logo}
          onError={() => setLogoError(true)}
        />
        <View style={styles.info}>
          <ThemeText variant="h2" color={getColor('text')}>
            {vendor.name}
          </ThemeText>
          <View style={styles.meta}>
            <ThemeText variant="caption" color={getColor('subText')} style={{ marginRight: 8 }}>
              ⏱ {vendor.preparationTime}
            </ThemeText>
            <ThemeText variant="caption" color={getColor('subText')} style={{ marginRight: 8 }}>
              | {formatAddress()}
            </ThemeText>
            <View style={styles.ratingBox}>
              <MaterialCommunityIcons name="star" size={14} color="#fff" />
              {renderRating()}
            </View>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={28} color={getColor('primary')} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default VendorHeaderCard;
