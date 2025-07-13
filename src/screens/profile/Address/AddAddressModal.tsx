import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../../theme/ThemeContext';
import AddressDetailsStep from './AddressDetailsStep';
import MapLocationStep from './MapLocationStep';

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
  const { getColor, getTypography } = useTheme();
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

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      backgroundColor: getColor('card'),
    },
    backButton: {
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      color: getColor('primary'),
    },
    title: {
      fontWeight: 'bold',
      color: getColor('text'),
      fontSize: getTypography('h2'),
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => {
        resetForm();
        onClose();
      }}
    >
      <View style={themedStyles.container}>
        <View style={themedStyles.header}>
          <TouchableOpacity onPress={() => (step === 1 ? onClose() : setStep(1))}>
            <Text style={themedStyles.backButton}>{step === 1 ? 'Cancel' : 'Back'}</Text>
          </TouchableOpacity>
          <Text style={themedStyles.title}>
            {step === 1 ? 'Select Location' : 'Add Address Details'}
          </Text>
          <View style={{ width: 60 }} />
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
