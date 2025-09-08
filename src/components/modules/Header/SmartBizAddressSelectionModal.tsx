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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../../../contexts/login/AuthProvider';
import AddAddressModal from '../../../screens/profile/Address/AddAddressModal';
import {
  SmartBizAddress,
  smartBizAddressService,
} from '../../../store/address/smartBizAddressStore';
import { useTheme } from '../../../theme/ThemeContext';
import SectionDivider from '../../common/SectionDivider';

const { height: screenHeight } = Dimensions.get('window');
const MODAL_HEIGHT = screenHeight * 0.6;

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
  const { getColor, getTypography, theme } = useTheme();
  const { authData } = useAuth();

  // Local state for addresses
  const [addresses, setAddresses] = useState<SmartBizAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = Boolean(authData?.jwt);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchAddresses = async () => {
    if (!isLoggedIn || !vendorId || !authData?.jwt || !authData?.phone) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedAddresses = await smartBizAddressService.fetchAddresses(
        vendorId,
        authData.jwt,
        authData.phone
      );
      setAddresses(fetchedAddresses);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch addresses';
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
      fetchAddresses();
    }
  };

  const handleAddNewAddress = () => {
    setShowAddModal(true);
  };

  const handleAddAddressSuccess = () => {
    setShowAddModal(false);
    // Refresh addresses after adding new one
    fetchAddresses();
  };

  const defaultAddress = smartBizAddressService.getDefaultAddress(vendorId);

  const themedStyles = StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: MODAL_HEIGHT,
      paddingBottom: 26,
      backgroundColor: getColor('background'),
      borderTopLeftRadius: theme.borderRadius.md,
      borderTopRightRadius: theme.borderRadius.md,
      ...Platform.select({
        android: {
          elevation: 20,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
        },
      }),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: 'transparent',
      alignItems: 'center',
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      paddingVertical: 16,
    },
    closeButton: {
      padding: 8,
      borderRadius: theme.borderRadius.max,
      backgroundColor: getColor('card'),
      minHeight: 40,
      minWidth: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    refreshButton: {
      padding: 8,
      borderRadius: theme.borderRadius.max,
      backgroundColor: getColor('card'),
      minHeight: 40,
      minWidth: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    sectionDividerContainer: {
      marginTop: 16,
    },
    addressesContainer: {
      flex: 1,
      borderRadius: theme.borderRadius.md,
      padding: 20,
      maxHeight: MODAL_HEIGHT * 0.6,
    },
    addressCard: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedAddressCard: {
      borderColor: getColor('main'),
      backgroundColor: getColor('overlay'),
    },
    addressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    addressName: {
      fontSize: getTypography('body'),
      fontWeight: '600',
      color: getColor('text'),
      includeFontPadding: false,
    },
    addressTag: {
      fontSize: getTypography('caption'),
      color: getColor('main'),
      fontWeight: '500',
      backgroundColor: getColor('overlay'),
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
      includeFontPadding: false,
    },
    addressDetails: {
      marginBottom: 4,
    },
    addressLine: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      includeFontPadding: false,
    },
    addressLocation: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      includeFontPadding: false,
      marginTop: 4,
    },
    defaultBadge: {
      backgroundColor: getColor('secondary'),
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
      marginLeft: 8,
    },
    defaultBadgeText: {
      fontSize: getTypography('caption'),
      color: getColor('white'),
      fontWeight: '500',
      includeFontPadding: false,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: getTypography('body'),
      color: getColor('subText'),
      textAlign: 'center',
      includeFontPadding: false,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    errorText: {
      fontSize: getTypography('body'),
      color: getColor('error'),
      textAlign: 'center',
      marginBottom: 16,
      includeFontPadding: false,
    },
    retryButton: {
      backgroundColor: getColor('main'),
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
    },
    retryButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      includeFontPadding: false,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: getColor('main'),
      paddingHorizontal: 20,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.md,
      minHeight: 56,
    },
    addButtonText: {
      color: getColor('main'),
      fontSize: getTypography('body'),
      fontWeight: '600',
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
        activeOpacity={0.8}
      >
        <View style={themedStyles.addressHeader}>
          <Text style={themedStyles.addressName}>{address.address.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
          <Text style={themedStyles.addressLine} numberOfLines={3}>
            {[
              address.address.addressLine1,
              address.address.addressLine2,
              address.address.addressLine3,
            ]
              .filter(Boolean)
              .join(', ')}
          </Text>
          <Text style={themedStyles.addressLocation}>
            {address.address.city}, {address.address.state} - {address.address.pincode}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (!isLoggedIn) {
      return (
        <View style={themedStyles.emptyContainer}>
          <MaterialCommunityIcons
            name="account-lock"
            size={48}
            color={getColor('subText')}
            style={{ marginBottom: 16 }}
          />
          <Text style={themedStyles.emptyText}>Please log in to view SmartBiz addresses.</Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={themedStyles.loadingContainer}>
          <ActivityIndicator size="large" color={getColor('main')} />
          <Text style={themedStyles.emptyText}>Loading addresses...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={themedStyles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={48}
            color={getColor('error')}
            style={{ marginBottom: 16 }}
          />
          <Text style={themedStyles.errorText}>{error}</Text>
          <TouchableOpacity
            style={themedStyles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <Text style={themedStyles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (addresses.length === 0) {
      return (
        <View style={themedStyles.emptyContainer}>
          <MaterialCommunityIcons
            name="map-marker-off"
            size={48}
            color={getColor('subText')}
            style={{ marginBottom: 16 }}
          />
          <Text style={themedStyles.emptyText}>
            No addresses found.{'\n'}Please add addresses through the vendor portal.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        style={{ flex: 1 }}
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
              accessibilityLabel="Close SmartBiz address selection"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={20} color={getColor('text')} />
            </TouchableOpacity>

            <TouchableOpacity
              style={themedStyles.refreshButton}
              onPress={handleRetry}
              disabled={loading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Refresh SmartBiz addresses"
              accessibilityHint="Refreshes the list of SmartBiz addresses"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={20}
                color={loading ? getColor('subText') : getColor('main')}
              />
            </TouchableOpacity>
          </View>

          <View style={themedStyles.content}>
            {/* Section Divider */}
            <View style={themedStyles.sectionDividerContainer}>
              <SectionDivider text="DELIVERY ADDRESSES" fontSize={16} />
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
              accessibilityHint="Opens the add address form"
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={20} color={getColor('main')} />
              <Text style={themedStyles.addButtonText}>Add Address Details</Text>
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
