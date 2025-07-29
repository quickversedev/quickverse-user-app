import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAddress } from '../../../hooks/useAddress';
import AddAddressModal from '../../../screens/profile/Address/AddAddressModal';
import { useTheme } from '../../../theme/ThemeContext';
import { Address } from '../../../types/address';

const { height: screenHeight } = Dimensions.get('window');
const MODAL_HEIGHT = screenHeight * 0.6;

interface AddressSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onAddressSelect: (address: Address) => void;
  selectedAddress?: Address | null;
}

export const AddressSelectionModal: React.FC<AddressSelectionModalProps> = ({
  visible,
  onClose,
  onAddressSelect,
  selectedAddress,
}) => {
  const { getColor, getTypography, theme } = useTheme();
  const { addresses, loading, fetchAddresses } = useAddress();
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = React.useState(false);

  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Slide down animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: MODAL_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleAddressSelect = (address: Address) => {
    onAddressSelect(address);
    handleClose();
  };

  const handleAddNewAddress = () => {
    setShowAddModal(true);
  };

  const handleAddAddressSuccess = () => {
    setShowAddModal(false);
  };

  const renderAddressItem = ({ item }: { item: Address }) => {
    const isSelected = selectedAddress?.id === item.id;

    return (
      <TouchableOpacity
        style={[themedStyles.addressItem, isSelected && themedStyles.selectedAddressItem]}
        onPress={() => handleAddressSelect(item)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Select address: ${item.address}`}
        accessibilityHint="Selects this address as your current location"
        activeOpacity={0.7}
      >
        <View style={themedStyles.addressContent}>
          <View style={themedStyles.addressHeader}>
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color={isSelected ? getColor('white') : getColor('primary')}
              style={themedStyles.addressIcon}
            />
            <Text
              style={[themedStyles.addressText, isSelected && themedStyles.selectedAddressText]}
              numberOfLines={2}
            >
              {item.address}
            </Text>
          </View>
          <Text
            style={[themedStyles.addressDetails, isSelected && themedStyles.selectedAddressDetails]}
            numberOfLines={1}
          >
            {item.city}, {item.state} - {item.zipCode}
          </Text>
          {isSelected && (
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={getColor('white')}
              style={themedStyles.checkIcon}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
      alignItems: 'center',
      paddingHorizontal: Math.max(16, screenHeight * 0.02),
      paddingTop: Math.max(16, screenHeight * 0.02),
      paddingBottom: Math.max(12, screenHeight * 0.015),
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    headerTitle: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
      includeFontPadding: false,
    },
    closeButton: {
      padding: 8,
      borderRadius: theme.borderRadius.full,
      backgroundColor: getColor('card'),
      minHeight: 40,
      minWidth: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: Math.max(16, screenHeight * 0.02),
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('primary'),
      paddingHorizontal: Math.max(16, screenHeight * 0.02),
      paddingVertical: Math.max(12, screenHeight * 0.015),
      borderRadius: theme.borderRadius.md,
      marginBottom: Math.max(16, screenHeight * 0.02),
      minHeight: 48,
      justifyContent: 'center',
      ...Platform.select({
        android: {
          elevation: 4,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: theme.colors.shadow.offset,
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
        },
      }),
    },
    addButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      marginLeft: 8,
      includeFontPadding: false,
    },
    addressItem: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: Math.max(12, screenHeight * 0.015),
      marginBottom: Math.max(8, screenHeight * 0.01),
      borderWidth: 1,
      borderColor: getColor('border'),
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: theme.colors.shadow.offset,
          shadowOpacity: theme.colors.shadow.opacity * 0.5,
          shadowRadius: theme.colors.shadow.radius * 0.5,
        },
      }),
    },
    selectedAddressItem: {
      backgroundColor: getColor('primary'),
      borderColor: getColor('primary'),
    },
    addressContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addressHeader: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    addressIcon: {
      marginRight: 8,
      marginTop: 2,
    },
    addressText: {
      flex: 1,
      fontSize: getTypography('body'),
      fontWeight: '500',
      color: getColor('text'),
      includeFontPadding: false,
      lineHeight: getTypography('body') * 1.2,
    },
    selectedAddressText: {
      color: getColor('white'),
    },
    addressDetails: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      marginTop: 4,
      includeFontPadding: false,
    },
    selectedAddressDetails: {
      color: getColor('white'),
      opacity: 0.8,
    },
    checkIcon: {
      marginLeft: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Math.max(40, screenHeight * 0.05),
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
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop */}
        <Animated.View
          style={[
            themedStyles.backdrop,
            {
              opacity: backdropAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={[
            themedStyles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={themedStyles.header}>
            <Text
              style={themedStyles.headerTitle}
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel="Select delivery address"
            >
              Select Address
            </Text>
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
          </View>

          <View style={themedStyles.content}>
            <TouchableOpacity
              style={themedStyles.addButton}
              onPress={handleAddNewAddress}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Add new address"
              accessibilityHint="Opens the add address form"
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={20} color={getColor('white')} />
              <Text style={themedStyles.addButtonText}>Add New Address</Text>
            </TouchableOpacity>

            {loading ? (
              <View style={themedStyles.loadingContainer}>
                <Text style={themedStyles.emptyText}>Loading addresses...</Text>
              </View>
            ) : addresses.length === 0 ? (
              <View style={themedStyles.emptyContainer}>
                <MaterialCommunityIcons
                  name="map-marker-off"
                  size={48}
                  color={getColor('subText')}
                  style={{ marginBottom: 16 }}
                />
                <Text style={themedStyles.emptyText}>
                  No addresses saved yet.{'\n'}Add your first address to get started.
                </Text>
              </View>
            ) : (
              <FlatList
                data={addresses}
                renderItem={renderAddressItem}
                keyExtractor={(item, index) => item.id || `address-${index}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                accessible={true}
                accessibilityLabel="List of saved addresses"
              />
            )}
          </View>
        </Animated.View>

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
