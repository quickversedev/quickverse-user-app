import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useAuth } from '../../../contexts/login/AuthProvider';
import type { RootStackParamList } from '../../../routes/AppStack';
import useVendorStore from '../../../store/vendorStore';
import { useTheme } from '../../../theme/ThemeContext';
import { getStoreStatus } from '../../../utils/storeUtils';
import VendorCard from './VendorCard';

const VendorList = () => {
  const { loading, error, vendors } = useVendorStore();
  const { getColor } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { selectedAddress: _selectedAddress } = useAuth();

  // const sortedVendors = useMemo(() => {
  //   return [...vendors].sort((a, b) => {
  //     if (a.storeActive === b.storeActive) return 0;
  //     return a.storeActive ? -1 : 1;
  //   });
  // }, [vendors]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
      paddingVertical: 16,
    },
    listContent: {
      paddingHorizontal: 16,
    },
    separator: {
      width: 20,
    },
  });

  const vendorsWithStatus = useMemo(() => {
    return vendors.map(vendor => ({
      ...vendor,
      storeStatus: getStoreStatus(vendor),
    }));
  }, [vendors]);

  // Use shared distance utility

  // no-op placeholder to keep potential future usage aligned with store-based sorting

  // Respect store order; no local sorting
  const sortedByDistance = vendorsWithStatus;

  const renderSeparator = useCallback(() => <View style={styles.separator} />, [styles.separator]);

  if (loading) return null;
  if (error) return null;
  return (
    <View style={styles.container}>
      <FlatList
        data={sortedByDistance}
        keyExtractor={item => item.shopId}
        renderItem={({ item }) => (
          <VendorCard
            vendor={item}
            size="small"
            onPress={() => navigation.navigate('VendorProduct', { vendor: item })}
            disabled={!item.storeStatus.isOpen}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={renderSeparator}
      />
    </View>
  );
};

export default VendorList;
