import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../../../contexts/login/AuthProvider';
import AddAddressModal from '../../../screens/profile/Address/AddAddressModal';
import {
  SmartBizAddress,
  smartBizAddressService,
} from '../../../store/address/smartBizAddressStore';
import { useTheme } from '../../../theme/ThemeContext';

const { height: screenHeight } = Dimensions.get('window');
const MAX_MODAL_HEIGHT = screenHeight * 0.75;

interface SmartBizAddressSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onAddressSelect: (address: SmartBizAddress) => void;
  selectedAddress?: SmartBizAddress | null;
  vendorId: string;
}

export const SmartBizAddressSelectionModal: React.FC<SmartBizAddressSelectionModalProps> = ({
  visible,
  onClose,
  onAddressSelect,
  selectedAddress,
  vendorId,
}) => {
  const { getColor, getTypography, theme, getButtonColor } = useTheme();
  const { authData } = useAuth();
  const insets = useSafeAreaInsets();

  // Local state for addresses
  const [addresses, setAddresses] = useState<SmartBizAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = Boolean(authData?.jwt);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchAddresses = async () => {
    console.log('[SmartBizModal] fetchAddresses called, vendorId:', vendorId);
    if (!isLoggedIn || !vendorId || !authData?.jwt || !authData?.phone) {
      console.log('[SmartBizModal] fetchAddresses - missing required data');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedAddresses = await smartBizAddressService.fetchAddresses(
        vendorId,
        authData.jwt,
        authData.phone
      );
      console.log('[SmartBizModal] fetchAddresses - got', fetchedAddresses.length, 'addresses');
      setAddresses(fetchedAddresses);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch addresses';
      console.log('[SmartBizModal] fetchAddresses - error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && isLoggedIn && vendorId && authData?.jwt && authData?.phone) {
      fetchAddresses();
    }
  }, [visible, isLoggedIn, vendorId, authData?.jwt, authData?.phone]);

  const handleClose = () => {
    onClose();
  };

  const handleAddressSelect = (address: SmartBizAddress) => {
    onAddressSelect(address);
    handleClose();
  };

  const handleRetry = () => {
    if (isLoggedIn && vendorId && authData?.jwt && authData?.phone) {
      // Clear cache before refetching to get fresh data
      smartBizAddressService.clearCache(vendorId);
      fetchAddresses();
    }
  };

  const handleAddNewAddress = () => {
    setShowAddModal(true);
  };

  const handleAddAddressSuccess = async () => {
    console.log('[SmartBizModal] handleAddAddressSuccess called');
    setShowAddModal(false);
    // Clear cache and refresh addresses after adding new one
    console.log('[SmartBizModal] Clearing cache for vendorId:', vendorId);
    smartBizAddressService.clearCache(vendorId);
    console.log('[SmartBizModal] Fetching addresses...');
    await fetchAddresses();
    console.log('[SmartBizModal] Fetch complete, addresses count:', addresses.length);
  };

  const defaultAddress = smartBizAddressService.getDefaultAddress(vendorId);

  const themedStyles = StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: MAX_MODAL_HEIGHT,
      paddingBottom: Math.max(insets.bottom, 16) + 8,
      backgroundColor: getColor('background'),
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      ...Platform.select({
        android: {
          elevation: 24,
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
        },
      }),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    headerTitle: {
      fontSize: getTypography('subtitle'),
      fontWeight: '700',
      color: getColor('text'),
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: getColor('card'),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    refreshButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: getColor('card'),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    content: {
      paddingHorizontal: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    sectionLine: {
      flex: 1,
      height: 1,
      backgroundColor: getColor('border'),
    },
    sectionTitle: {
      fontSize: getTypography('caption'),
      fontWeight: '600',
      color: getColor('subText'),
      marginHorizontal: 12,
      letterSpacing: 1,
    },
    addressesContainer: {
      maxHeight: MAX_MODAL_HEIGHT * 0.55,
    },
    addressCard: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      paddingVertical: 18,
      paddingHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1.5,
      borderColor: getColor('border'),
      flexDirection: 'row',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    selectedAddressCard: {
      borderColor: getColor('primary'),
      backgroundColor: `${getColor('primary')}10`,
    },
    addressIconBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    addressContent: {
      flex: 1,
    },
    addressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    addressName: {
      fontSize: getTypography('body'),
      fontWeight: '700',
      color: getColor('text'),
      includeFontPadding: false,
    },
    addressTagsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
    },
    addressTag: {
      fontSize: 10,
      color: getColor('subText'),
      fontWeight: '500',
      backgroundColor: getColor('background'),
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      includeFontPadding: false,
      marginRight: 4,
      overflow: 'hidden',
    },
    addressDetails: {},
    addressLine: {
      fontSize: getTypography('caption'),
      color: getColor('text'),
      includeFontPadding: false,
      lineHeight: 18,
    },
    addressLocation: {
      fontSize: getTypography('small'),
      color: getColor('subText'),
      includeFontPadding: false,
      marginTop: 2,
    },
    defaultBadge: {
      backgroundColor: getButtonColor('default', 'background'),
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    defaultBadgeText: {
      fontSize: 10,
      color: getButtonColor('default', 'text'),
      fontWeight: '600',
      includeFontPadding: false,
    },
    checkIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: getColor('primary'),
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
      borderRadius: 4,
    },
    emptyIconBadge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${getColor('subText')}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyText: {
      fontSize: getTypography('body'),
      color: getColor('subText'),
      textAlign: 'center',
      includeFontPadding: false,
      lineHeight: 22,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      marginTop: 12,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    errorIconBadge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${getColor('error')}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    errorText: {
      fontSize: getTypography('body'),
      color: getColor('error'),
      textAlign: 'center',
      marginBottom: 16,
      includeFontPadding: false,
    },
    retryButton: {
      backgroundColor: getColor('primary'),
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    retryButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      includeFontPadding: false,
      marginLeft: 8,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getButtonColor('default', 'background'),
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: theme.borderRadius.md,
      marginTop: 16,
      ...Platform.select({
        ios: {
          shadowColor: getButtonColor('default', 'background'),
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    addButtonText: {
      color: getButtonColor('default', 'text'),
      fontSize: getTypography('body'),
      fontWeight: '700',
      marginLeft: 8,
      includeFontPadding: false,
    },
  });

  const renderAddressCard = (address: SmartBizAddress) => {
    const isSelected = selectedAddress?.id === address.id;
    const isDefault = address.id === defaultAddress?.id;

    return (
      <TouchableOpacity
        key={address.id}
        style={[themedStyles.addressCard, isSelected && themedStyles.selectedAddressCard]}
        onPress={() => handleAddressSelect(address)}
        activeOpacity={0.7}
      >
        <View
          style={[
            themedStyles.addressIconBadge,
            {
              backgroundColor: isSelected ? `${getColor('primary')}20` : `${getColor('subText')}15`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="map-marker"
            size={20}
            color={isSelected ? getColor('primary') : getColor('subText')}
          />
        </View>

        <View style={themedStyles.addressContent}>
          <View style={themedStyles.addressHeader}>
            <Text style={themedStyles.addressName} numberOfLines={1}>
              {address.address.name}
            </Text>
            <View style={themedStyles.addressTagsContainer}>
              {address.address.tag && (
                <Text style={themedStyles.addressTag}>{address.address.tag}</Text>
              )}
              {isDefault && (
                <View style={themedStyles.defaultBadge}>
                  <Text style={themedStyles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
          </View>

          <View style={themedStyles.addressDetails}>
            <Text style={themedStyles.addressLine} numberOfLines={1}>
              {[
                address.address.addressLine1,
                address.address.addressLine2,
                address.address.addressLine3,
              ]
                .filter(Boolean)
                .join(', ')}
            </Text>
            <Text style={themedStyles.addressLocation} numberOfLines={1}>
              {address.address.city}, {address.address.state} - {address.address.pincode}
            </Text>
          </View>
        </View>

        <View
          style={[
            themedStyles.checkIcon,
            {
              backgroundColor: isSelected ? getColor('primary') : 'transparent',
              borderWidth: isSelected ? 0 : 2,
              borderColor: getColor('border'),
            },
          ]}
        >
          {isSelected && (
            <MaterialCommunityIcons name="check" size={16} color={getColor('white')} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (!isLoggedIn) {
      return (
        <View style={themedStyles.emptyContainer}>
          <View style={themedStyles.emptyIconBadge}>
            <MaterialCommunityIcons name="account-lock" size={36} color={getColor('subText')} />
          </View>
          <Text style={themedStyles.emptyText}>Please log in to view{'\n'}delivery addresses</Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={themedStyles.loadingContainer}>
          <ActivityIndicator size="large" color={getColor('primary')} />
          <Text style={themedStyles.loadingText}>Loading addresses...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={themedStyles.errorContainer}>
          <View style={themedStyles.errorIconBadge}>
            <MaterialCommunityIcons name="alert-circle" size={36} color={getColor('error')} />
          </View>
          <Text style={themedStyles.errorText}>{error}</Text>
          <TouchableOpacity
            style={themedStyles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="refresh" size={18} color={getColor('white')} />
            <Text style={themedStyles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (addresses.length === 0) {
      return (
        <View style={themedStyles.emptyContainer}>
          <View style={themedStyles.emptyIconBadge}>
            <MaterialCommunityIcons name="map-marker-off" size={36} color={getColor('subText')} />
          </View>
          <Text style={themedStyles.emptyText}>
            No addresses found{'\n'}Add a new address to continue
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 12 }}
      >
        {addresses.map(renderAddressCard)}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      hardwareAccelerated={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop */}
        <View style={[themedStyles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.9)' }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />
        </View>

        {/* Modal Content */}
        <View style={themedStyles.modalContainer}>
          <View style={themedStyles.header}>
            <TouchableOpacity
              style={themedStyles.closeButton}
              onPress={handleClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close address selection"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={20} color={getColor('text')} />
            </TouchableOpacity>

            <Text style={themedStyles.headerTitle}>Select Address</Text>

            <TouchableOpacity
              style={themedStyles.refreshButton}
              onPress={handleRetry}
              disabled={loading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Refresh addresses"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={20}
                color={loading ? getColor('subText') : getColor('primary')}
              />
            </TouchableOpacity>
          </View>

          <View style={themedStyles.content}>
            {/* Section Header */}
            <View style={themedStyles.sectionHeader}>
              <View style={themedStyles.sectionLine} />
              <Text style={themedStyles.sectionTitle}>SAVED ADDRESSES</Text>
              <View style={themedStyles.sectionLine} />
            </View>

            {/* Addresses Container */}
            <View style={themedStyles.addressesContainer}>{renderContent()}</View>

            {/* Add Address Button */}
            <TouchableOpacity
              style={themedStyles.addButton}
              onPress={handleAddNewAddress}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Add new address"
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={getButtonColor('default', 'text')}
              />
              <Text style={themedStyles.addButtonText}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Address Modal */}
        <AddAddressModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddAddressSuccess}
        />
      </View>
    </Modal>
  );
};
