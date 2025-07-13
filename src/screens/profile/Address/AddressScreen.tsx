import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import axiosInstance from '../../../config/api/axios.config';
import { useTheme } from '../../../theme/ThemeContext';
import AddAddressModal from './AddAddressModal';
import AddressCard from './AddressCard';

type AddressDetails = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  tag: string;
};

type Address = {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
};

type NewAddress = AddressDetails & { latitude?: number; longitude?: number };

const AddressScreen = () => {
  const { getColor, getTypography, theme } = useTheme();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/v2/getLocalAddress', {
        headers: {
          SessionKey:
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJtb2JpbGUiOiI5MTk3NjUwMDgxMTAiLCJpYXQiOjE3NTIzOTcwNTgsImV4cCI6MTc4MzkzMzA1OH0.vW0upVYdLBWCuy7Qinxgoz2a68TSdyEidjJtZDDCeaU',
        },
      });
      setAddresses(response.data.addresses || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch addresses. Please try again.');
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (newAddress: NewAddress) => {
    try {
      await axiosInstance.post(
        '/v2/addAddress',
        {
          address: newAddress,
          isDefaultAddress: addresses.length === 0,
        },
        {
          headers: {
            SessionKey: 'your-session-key-here',
          },
        }
      );
      fetchAddresses();
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding address:', err);
    }
  };

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
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
      {loading ? (
        <ActivityIndicator size="large" color={getColor('primary')} />
      ) : error ? (
        <View style={themedStyles.errorContainer}>
          <Text style={{ color: getColor('error') }}>{error}</Text>
          <TouchableOpacity onPress={fetchAddresses}>
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

      <AddAddressModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddAddress}
      />
    </View>
  );
};

export default AddressScreen;
