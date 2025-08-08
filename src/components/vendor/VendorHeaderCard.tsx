import { useNavigation } from '@react-navigation/native';
import React, { useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeContext';
import { Vendor } from '../../types/vendor';

interface VendorHeaderCardProps {
  vendor: Vendor;
  onPress?: () => void;
  style?: ViewStyle;
}

const VendorHeaderCard: React.FC<VendorHeaderCardProps> = ({ vendor, onPress, style }) => {
  const { getColor, getTypography, theme } = useTheme();
  const navigation = useNavigation();
  const scale = useRef(new Animated.Value(1)).current;

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
      borderRadius: theme.borderRadius.full,
      marginRight: 12,
      backgroundColor: getColor('border'),
    },
    info: { flex: 1 },
    name: {
      color: getColor('text'),
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
    },
    meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    metaText: { color: getColor('subText'), fontSize: getTypography('caption'), marginRight: 8 },
    ratingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1ec28b',
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 8,
    },
    ratingText: {
      color: '#fff',
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      marginLeft: 2,
    },
  });

  const renderRating = () => {
    if (!vendor.rating || vendor.rating === 0)
      return <Text style={styles.ratingText}>Not Rated</Text>;
    return <Text style={styles.ratingText}>{vendor.rating}</Text>;
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
        <Image source={{ uri: vendor.logo }} style={styles.logo} />
        <View style={styles.info}>
          <Text style={styles.name}>{vendor.name}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>⏱ {vendor.preparationTime}</Text>
            <Text style={styles.metaText}>| {formatAddress()}</Text>
            <View style={styles.ratingBox}>
              <MaterialCommunityIcons name="star" size={14} color="#fff" />
              {renderRating()}
            </View>
            <Text style={styles.metaText}>(242+)</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={28} color={getColor('primary')} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default VendorHeaderCard;
