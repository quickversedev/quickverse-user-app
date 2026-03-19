import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icons } from '../../../assets';
import { useAddress } from '../../../hooks/useAddress';
import { RootStackParamList } from '../../../routes/AppStack';
import { useTheme } from '../../../theme/ThemeContext';
import AddressCard from './AddressCard';

const { width, height } = Dimensions.get('window');

const AddressScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { getColor, getTypography, theme } = useTheme();
  const { addresses, loading, fetchError, retryFetch, fetchAddresses, deleteAddress } = useAddress();
  const insets = useSafeAreaInsets();

  const handleDelete = useCallback(
    (addr: import('../../../types/address').Address) => {
      Alert.alert(
        'Delete Address',
        `Are you sure you want to delete "${addr.tag}" address?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const result = await deleteAddress(addr.addressID);
              if (!result.success) {
                Alert.alert('Error', result.error?.message || 'Failed to delete address.');
              }
            },
          },
        ]
      );
    },
    [deleteAddress]
  );

  // Refresh addresses when screen comes into focus (e.g. after adding new address)
  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [fetchAddresses])
  );

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    header: {
      backgroundColor: getColor('card'),
      paddingTop: Platform.OS === 'ios' ? insets.top + 16 : insets.top + 8,
      paddingBottom: 16,
      paddingHorizontal: Math.max(16, width * 0.04),
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      justifyContent: 'center',
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: theme.colors.shadow.offset,
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
        },
      }),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerSide: {
      width: 40,
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    backIcon: {
      width: 24,
      height: 24,
      resizeMode: 'contain',
      tintColor: getColor('text'),
    },
    headerTitle: {
      flex: 1,
      fontSize: Math.min(getTypography('h1'), 24),
      fontWeight: 'bold',
      color: getColor('text'),
      textAlign: 'center',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    content: {
      flex: 1,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Math.max(24, width * 0.06),
    },
    errorText: {
      color: getColor('error'),
      fontSize: getTypography('body'),
      textAlign: 'center',
      marginBottom: 16,
      includeFontPadding: false,
    },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      backgroundColor: getColor('primary'),
    },
    retryButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      includeFontPadding: false,
    },
    listContainer: {
      padding: Math.max(16, width * 0.04),
      paddingBottom: 100, // Space for FAB
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getColor('background'),
      padding: Math.max(24, width * 0.06),
    },
    emptyText: {
      color: getColor('subText'),
      fontSize: getTypography('body'),
      marginBottom: 16,
      textAlign: 'center',
      includeFontPadding: false,
    },
    addButton: {
      backgroundColor: getColor('primary'),
      paddingVertical: 12,
      paddingHorizontal: Math.max(32, width * 0.08),
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginTop: 12,
      minHeight: 48,
      justifyContent: 'center',
    },
    addButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      includeFontPadding: false,
    },
    fab: {
      position: 'absolute',
      bottom: Math.max(32, height * 0.04),
      right: Math.max(32, width * 0.08),
      width: 56,
      height: 56,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getColor('primary'),
      ...Platform.select({
        android: {
          elevation: 6,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: theme.colors.shadow.offset,
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
        },
      }),
    },
    fabText: {
      color: getColor('white'),
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
  });

  const handleBack = () => {
    navigation.goBack();
  };

  const renderEmptyState = () => (
    <View style={themedStyles.emptyContainer}>
      <Text
        style={themedStyles.emptyText}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="No addresses saved yet"
      >
        No addresses saved yet.
      </Text>
      <TouchableOpacity
        style={themedStyles.addButton}
        onPress={() => navigation.navigate('AddAddress')}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Add new address"
        accessibilityHint="Opens the add address form"
        activeOpacity={0.7}
      >
        <Text style={themedStyles.addButtonText}>Add Address</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View
      style={themedStyles.container}
      accessible={true}
      accessibilityLabel="Saved addresses screen"
    >
      <View style={themedStyles.header}>
        <View style={themedStyles.headerRow}>
          <View style={themedStyles.headerSide}>
            <TouchableOpacity onPress={handleBack}>
              <Image source={Icons.backArrow} style={themedStyles.backIcon} />
            </TouchableOpacity>
          </View>
          <Text
            style={themedStyles.headerTitle}
            accessible={true}
            accessibilityRole="header"
            accessibilityLabel="Saved addresses"
          >
            Saved Addresses
          </Text>
          <View style={themedStyles.headerSide} />
        </View>
      </View>

      <View style={themedStyles.content}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={getColor('primary')}
            accessible={true}
            accessibilityLabel="Loading addresses"
          />
        ) : fetchError ? (
          <View style={themedStyles.errorContainer}>
            <Text
              style={themedStyles.errorText}
              accessible={true}
              accessibilityRole="alert"
              accessibilityLabel={`Error: ${fetchError}`}
            >
              {fetchError}
            </Text>
            <TouchableOpacity
              onPress={retryFetch}
              style={themedStyles.retryButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Retry loading addresses"
              accessibilityHint="Attempts to load addresses again"
              activeOpacity={0.7}
            >
              <Text style={themedStyles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : addresses.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <FlatList
              data={addresses}
              keyExtractor={(item, index) => item.addressID || `address-${index}`}
              renderItem={({ item }) => (
                <AddressCard
                  address={item}
                  onEdit={(addr) => navigation.navigate('EditAddress', { address: addr })}
                  onDelete={handleDelete}
                />
              )}
              contentContainerStyle={themedStyles.listContainer}
              showsVerticalScrollIndicator={false}
              accessible={true}
              accessibilityLabel="List of saved addresses"
            />
            <TouchableOpacity
              style={themedStyles.fab}
              onPress={() => navigation.navigate('AddAddress')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Add new address"
              accessibilityHint="Opens the add address form"
              activeOpacity={0.7}
            >
              <Text style={themedStyles.fabText}>+</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

export default AddressScreen;
