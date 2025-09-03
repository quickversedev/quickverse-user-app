import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AddressComponents } from '../../../services/api/olaLocationService';
import { useTheme } from '../../../theme/ThemeContext';
import AddressDetailsStep from './AddressDetailsStep';
import MapLocationStep from './components/MapLocationStep';

const { width } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
}

interface AddressDetails {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  phoneNumber: string;
  addressLine3?: string;
  tag: string;
  isDefaultAddress: boolean;
}

interface AddAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (address: AddressDetails) => void;
}

const AddAddressModal = ({ visible, onClose, onSave }: AddAddressModalProps) => {
  const { getColor, getTypography, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedAddressDescription, setSelectedAddressDescription] = useState<AddressComponents>({
    country: '',
    state: '',
    city: '',
    postalCode: '',
    formatted_address: '',
  });
  const [addressDetails, setAddressDetails] = useState<AddressDetails>({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    phoneNumber: '',
    addressLine3: '',
    tag: '',
    isDefaultAddress: false,
  });
  const [apiError, setApiError] = useState<string | null>(null);

  const handleLocationSelect = (
    selectedLocation: Location,
    addressDescription: AddressComponents
  ) => {
    setLocation(selectedLocation);
    setSelectedAddressDescription(addressDescription);
    setStep(2);
  };

  const handleSaveAddress = async (_details: AddressDetails) => {
    setApiError(null);
    // The API call is now handled by AddressDetailsStep internally
    // This function is kept for any additional logic if needed
  };

  const handleAddressSaveSuccess = () => {
    // Close the modal when address is successfully saved
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setStep(1);
    setLocation(null);
    setSelectedAddressDescription({
      country: '',
      state: '',
      city: '',
      postalCode: '',
      formatted_address: '',
    });
    setAddressDetails({
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      phoneNumber: '',
      addressLine3: '',
      tag: '',
      isDefaultAddress: false,
    });
    setApiError(null);
  };

  const handleBack = () => {
    if (step === 1) {
      resetForm();
      onClose();
    } else {
      setStep(1);
    }
  };

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingTop: Platform.OS === 'ios' ? Math.max(insets.top + 4, 8) : Math.max(16, width * 0.04),
      paddingBottom: Math.max(16, width * 0.04),
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      backgroundColor: getColor('card'),
      minHeight: Platform.OS === 'ios' ? Math.max(60, insets.top + 44) : 60,
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
        },
      }),
    },
    backButton: {
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      color: getColor('primary'),
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 8,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    title: {
      fontWeight: 'bold',
      color: getColor('text'),
      fontSize: Math.min(getTypography('h2'), 20),
      flex: 1,
      textAlign: 'center',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    placeholder: {
      width: 60,
    },
  });

  return (
    <Modal
  visible={visible}
  animationType="slide"
  onRequestClose={handleBack}
  presentationStyle="fullScreen"
>
  <View
    style={{
      flex: 1,
      backgroundColor: getColor('background'),
      // paddingTop: insets.top,     // ✅ handles notch/status bar
      paddingBottom: insets.bottom, // ✅ handles iPhone home indicator
    }}
  >
    {/* Header */}
    <View style={themedStyles.header}>
      <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
        <MaterialCommunityIcons
          name="arrow-left-thick"
          size={25}
          color={getColor('primary')}
        />
      </TouchableOpacity>
      <Text style={themedStyles.title}>
        {step === 1 ? 'Select Location' : 'Add Address Details'}
      </Text>
      <View style={themedStyles.placeholder} />
    </View>

    {/* Body */}
    {step === 1 ? (
      <MapLocationStep onLocationSelect={handleLocationSelect} />
    ) : (
      <AddressDetailsStep
        location={location}
        selectedAddressDescription={selectedAddressDescription}
        details={addressDetails}
        onDetailsChange={setAddressDetails}
        onSave={handleSaveAddress}
        onSuccess={handleAddressSaveSuccess}
        apiError={apiError}
      />
    )}
  </View>
</Modal>

  );
};

export default AddAddressModal;
