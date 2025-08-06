import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAddress } from '../../../hooks/useAddress';
import AddAddressModal from '../../../screens/profile/Address/AddAddressModal';
import AddressCard from '../../../screens/profile/Address/AddressCard';
import { useTheme } from '../../../theme/ThemeContext';
import { Address } from '../../../types/address';
import SectionDivider from '../../common/SectionDivider';

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
  const { addresses, loading } = useAddress();
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleEditAddresses = () => {
    // TODO: Navigate to address management screen
  };

  const filteredAddresses = addresses.filter(
    address =>
      (address.address?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (address.city?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

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
      justifyContent: 'center',
      backgroundColor: 'transparent',
      alignItems: 'center',
      paddingHorizontal: 20,
      // paddingTop: 20,
      // paddingBottom: 16,
      borderBottomWidth: 1,
      // borderBottomColor: getColor('border'),
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
      paddingHorizontal: 20,
    },
    searchContainer: {
      marginTop: 16,
      marginBottom: 20,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: getTypography('body'),
      color: getColor('text'),
      includeFontPadding: false,
    },
    sectionDividerContainer: {
      // marginVertical: 20,
    },
    addressesContainer: {
      flex: 1,
      // backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 20,
      // marginBottom: 20,
      maxHeight: MODAL_HEIGHT * 0.6, // Limit height to prevent overflow
    },
    addressCardContainer: {
      // marginBottom: 4,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      marginTop: 8,
      marginBottom: 16,
    },
    editButtonText: {
      fontSize: getTypography('body'),
      color: getColor('primary'),
      fontWeight: '500',
      marginLeft: 4,
      includeFontPadding: false,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: getColor('primary'),
      paddingHorizontal: 20,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.md,
      // marginBottom: 20,
      minHeight: 56,
    },
    addButtonText: {
      color: getColor('primary'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      marginLeft: 8,
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
  });

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
            {/* Search Bar */}
            <View style={themedStyles.searchContainer}>
              <View style={themedStyles.searchBar}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={getColor('subText')}
                  style={themedStyles.searchIcon}
                />
                <TextInput
                  style={themedStyles.searchInput}
                  placeholder="Search Locality"
                  placeholderTextColor={getColor('placeholder')}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  accessible={true}
                  accessibilityRole="search"
                  accessibilityLabel="Search for addresses"
                />
              </View>
            </View>

            {/* Section Divider */}
            <View style={themedStyles.sectionDividerContainer}>
              <SectionDivider text="CHOOSE DELIVERY ADDRESS" fontSize={16} />
            </View>

            {/* Addresses Container */}
            <View style={themedStyles.addressesContainer}>
              {loading ? (
                <View style={themedStyles.loadingContainer}>
                  <Text style={themedStyles.emptyText}>Loading addresses...</Text>
                </View>
              ) : filteredAddresses.length === 0 ? (
                <View style={themedStyles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="map-marker-off"
                    size={48}
                    color={getColor('subText')}
                    style={{ marginBottom: 16 }}
                  />
                  <Text style={themedStyles.emptyText}>
                    No addresses found.{'\n'}Add your first address to get started.
                  </Text>
                </View>
              ) : (
                <>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }} // Space for edit button
                    style={{ flex: 1 }}
                  >
                    {filteredAddresses.map((address, index) => (
                      <View key={address.id || index} style={themedStyles.addressCardContainer}>
                        <AddressCard
                          address={address}
                          size="small"
                          onPress={() => handleAddressSelect(address)}
                          isSelected={selectedAddress?.id === address.id}
                        />
                      </View>
                    ))}
                  </ScrollView>

                  {/* Edit Button */}
                </>
              )}
            </View>

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
              <MaterialCommunityIcons name="plus" size={20} color={getColor('primary')} />
              <Text style={themedStyles.addButtonText}>Add Address Details</Text>
            </TouchableOpacity>
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
