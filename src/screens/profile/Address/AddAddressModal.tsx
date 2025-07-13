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
  landmark: string;
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
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<Location | null>(null);
  const [addressDetails, setAddressDetails] = useState<AddressDetails>({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    tag: 'Home',
    isDefaultAddress: false,
  });

  const handleLocationSelect = (selectedLocation: Location) => {
    setLocation(selectedLocation);
    setStep(2);
  };

  const handleSaveAddress = () => {
    const fullAddress = {
      ...addressDetails,
      latitude: location?.latitude?.toString(),
      longitude: location?.longitude?.toString(),
    };
    onSave(fullAddress);
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setLocation(null);
    setAddressDetails({
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      tag: 'Home',
      isDefaultAddress: false,
    });
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
      padding: Math.max(16, width * 0.04),
      paddingTop: Platform.OS === 'ios' ? Math.max(16, width * 0.04) : Math.max(12, width * 0.03),
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      backgroundColor: getColor('card'),
      minHeight: 60,
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
      <View style={themedStyles.container} accessible={true} accessibilityLabel="Add address modal">
        <View style={themedStyles.header}>
          <TouchableOpacity
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              step === 1 ? 'Cancel adding address' : 'Go back to location selection'
            }
            accessibilityHint={
              step === 1 ? 'Closes the add address form' : 'Returns to the previous step'
            }
            activeOpacity={0.7}
          >
            <Text style={themedStyles.backButton}>{step === 1 ? 'Cancel' : 'Back'}</Text>
          </TouchableOpacity>
          <Text
            style={themedStyles.title}
            accessible={true}
            accessibilityRole="header"
            accessibilityLabel={step === 1 ? 'Select location step' : 'Add address details step'}
          >
            {step === 1 ? 'Select Location' : 'Add Address Details'}
          </Text>
          <View style={themedStyles.placeholder} />
        </View>

        {step === 1 ? (
          <MapLocationStep onLocationSelect={handleLocationSelect} />
        ) : (
          <AddressDetailsStep
            location={location}
            details={addressDetails}
            onDetailsChange={setAddressDetails}
            onSave={handleSaveAddress}
          />
        )}
      </View>
    </Modal>
  );
};

export default AddAddressModal;
