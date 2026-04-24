import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const SearchSkeleton: React.FC = () => {
  const { getColor } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionLine: {
      flex: 1,
      height: 1,
      backgroundColor: getColor('border'),
    },
    sectionTitle: {
      width: 80,
      height: 14,
      backgroundColor: getColor('border'),
      borderRadius: 7,
      marginHorizontal: 12,
    },
    productsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
      marginBottom: 24,
    },
    productRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '48%',
      paddingHorizontal: 8,
    },
    productCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: getColor('border'),
      marginRight: 8,
    },
    productTextCol: {
      flex: 1,
    },
    productTagLine: {
      height: 8,
      width: '50%',
      borderRadius: 4,
      backgroundColor: getColor('border'),
      marginBottom: 6,
    },
    productNameLine: {
      height: 10,
      width: '85%',
      borderRadius: 5,
      backgroundColor: getColor('border'),
      marginBottom: 4,
    },
    productNameLineShort: {
      height: 10,
      width: '60%',
      borderRadius: 5,
      backgroundColor: getColor('border'),
    },
    vendorsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      rowGap: 12,
    },
    vendorCard: {
      width: '48%',
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: getColor('card'),
    },
    vendorImage: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: getColor('border'),
    },
    vendorContent: {
      padding: 8,
    },
    vendorNameLine: {
      height: 10,
      width: '80%',
      borderRadius: 5,
      backgroundColor: getColor('border'),
      marginBottom: 6,
    },
    vendorMetaLine: {
      height: 8,
      width: '50%',
      borderRadius: 4,
      backgroundColor: getColor('border'),
    },
  });

  const ProductRowSkeleton = () => (
    <Animated.View style={[styles.productRow, { opacity: pulseAnim }]}>
      <View style={styles.productCircle} />
      <View style={styles.productTextCol}>
        <View style={styles.productTagLine} />
        <View style={styles.productNameLine} />
        <View style={styles.productNameLineShort} />
      </View>
    </Animated.View>
  );

  const VendorCardSkeleton = () => (
    <Animated.View style={[styles.vendorCard, { opacity: pulseAnim }]}>
      <View style={styles.vendorImage} />
      <View style={styles.vendorContent}>
        <View style={styles.vendorNameLine} />
        <View style={styles.vendorMetaLine} />
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.sectionHeader, { opacity: pulseAnim }]}>
        <View style={styles.sectionLine} />
        <View style={styles.sectionTitle} />
        <View style={styles.sectionLine} />
      </Animated.View>

      <View style={styles.productsGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(item => (
          <ProductRowSkeleton key={`p-${item}`} />
        ))}
      </View>

      <Animated.View style={[styles.sectionHeader, { opacity: pulseAnim }]}>
        <View style={styles.sectionLine} />
        <View style={styles.sectionTitle} />
        <View style={styles.sectionLine} />
      </Animated.View>

      <View style={styles.vendorsGrid}>
        {[1, 2, 3, 4].map(item => (
          <VendorCardSkeleton key={`v-${item}`} />
        ))}
      </View>
    </View>
  );
};

export default SearchSkeleton;
