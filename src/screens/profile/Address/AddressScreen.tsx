import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAddress } from '../../../hooks/useAddress';
import { useTheme } from '../../../theme/ThemeContext';
import { NewAddress } from '../../../types/address';
import AddAddressModal from './AddAddressModal';
import AddressCard from './AddressCard';

const AddressScreen = () => {
  const { getColor, getTypography, theme } = useTheme();
  const { addresses, loading, error, addAddress, retryFetch } = useAddress();
  const [showAddModal, setShowAddModal] = useState(false);
  const insets = useSafeAreaInsets();

  const handleAddAddress = async (newAddress: NewAddress) => {
    const result = await addAddress(newAddress);
    if (result.success) {
      setShowAddModal(false);
    }
  };

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    header: {
      backgroundColor: getColor('card'),
      paddingTop: insets.top + 16,
      paddingBottom: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    headerTitle: {
      fontSize: getTypography('h1'),
      fontWeight: 'bold',
      color: getColor('text'),
      textAlign: 'center',
    },
    content: {
      flex: 1,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    listContainer: {
      padding: 16,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getColor('background'),
      padding: 24,
    },
    emptyText: {
      color: getColor('subText'),
      fontSize: getTypography('body'),
      marginBottom: 16,
    },
    addButton: {
      backgroundColor: getColor('primary'),
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginTop: 12,
    },
    addButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
    },
    fab: {
      position: 'absolute',
      bottom: 32,
      right: 32,
      width: 56,
      height: 56,
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getColor('primary'),
      elevation: 6,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
    },
    fabText: {
      color: getColor('white'),
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
    },
  });

  const renderEmptyState = () => (
    <View style={themedStyles.emptyContainer}>
      <Text style={themedStyles.emptyText}>No addresses saved yet.</Text>
      <TouchableOpacity style={themedStyles.addButton} onPress={() => setShowAddModal(true)}>
        <Text style={themedStyles.addButtonText}>Add Address</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.header}>
        <Text style={themedStyles.headerTitle}>Saved Addresses</Text>
      </View>

      <View style={themedStyles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={getColor('primary')} />
        ) : error ? (
          <View style={themedStyles.errorContainer}>
            <Text style={{ color: getColor('error') }}>{error}</Text>
            <TouchableOpacity onPress={retryFetch}>
              <Text style={{ color: getColor('primary') }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : addresses.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <FlatList
              data={addresses}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <AddressCard address={item} />}
              contentContainerStyle={themedStyles.listContainer}
            />
            <TouchableOpacity style={themedStyles.fab} onPress={() => setShowAddModal(true)}>
              <Text style={themedStyles.fabText}>+</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <AddAddressModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddAddress}
      />
    </View>
  );
};

export default AddressScreen;
