import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { RootStackParamList } from '../../../routes/AppStack';
import useVendorStore from '../../../store/vendorStore';
import { useTheme } from '../../../theme/ThemeContext';
import VendorCard from './VendorCard';

const VendorList = () => {
  const { loading, error, getActiveVendors } = useVendorStore();
  const { getColor } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const vendors = getActiveVendors();

  // useEffect(() => {
  //   fetchVendors();
  // }, []);

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
      width: 12,
    },
  });

  if (loading) return null;
  if (error) return null;
  return (
    <View style={styles.container}>
      <FlatList
        data={vendors}
        keyExtractor={item => item.shopId}
        renderItem={({ item }) => (
          <VendorCard
            vendor={item}
            size="small"
            onPress={() => navigation.navigate('VendorProduct', { vendor: item })}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

export default VendorList;
