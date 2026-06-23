import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { RootStackParamList } from '../../../routes/AppStack';
import { AddressComponents } from '../../../services/api/olaLocationService';
import useAddressStore from '../../../store/address/addressStore';
import { useTheme } from '../../../theme/ThemeContext';
import AddressDetailsStep from './AddressDetailsStep';
import AddressReviewStep from './AddressReviewStep';
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

const AddAddressScreen = () => {
  const { getColor, getTypography, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddAddress'>>();
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedAddressDescription, setSelectedAddressDescription] = useState<AddressComponents>({
    country: '',
    state: '',
    city: '',
    postalCode: '',
    formatted_address: '',
    road: '',
    locality: '',
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

  const handleGoToReview = (_details: AddressDetails) => {
    setStep(3);
  };

  const handleAddressSaveSuccess = async () => {
    if (route.params?.source === 'modal') {
      // Came from a header modal — go back to Home and auto-open the address selection modal
      useAddressStore.getState().setPendingOpenAddressModal(true);
      navigation.goBack();
    } else {
      // Came from AddressScreen — go back to it (useFocusEffect refreshes the list)
      navigation.goBack();
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigation.goBack();
    } else {
      setStep(step - 1);
    }
  };

  const themedStyles = StyleSheet.create({
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
    headerTransparent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingTop: Platform.OS === 'ios' ? Math.max(insets.top + 12, 16) : insets.top + 12,
      paddingBottom: Math.max(8, width * 0.02),
      backgroundColor: 'transparent',
    },
    backButtonRound: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: getColor('card'),
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        android: {
          elevation: 4,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        },
      }),
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
    <View
      style={{
        flex: 1,
        backgroundColor: getColor('background'),
        paddingTop: step >= 2 ? insets.top : 0,
        paddingBottom: step >= 2 ? insets.bottom : 0,
      }}
    >
      {/* Header - Transparent for step 1, regular for step 2/3 */}
      {step === 1 ? (
        <View style={themedStyles.headerTransparent} pointerEvents="box-none">
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            style={themedStyles.backButtonRound}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
          </TouchableOpacity>
        </View>
      ) : step === 2 ? (
        <View style={themedStyles.header}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name="arrow-left-thick"
              size={25}
              color={getColor('primary')}
            />
          </TouchableOpacity>
          <Text style={themedStyles.title}>Add Address Details</Text>
          <View style={themedStyles.placeholder} />
        </View>
      ) : (
        <View style={themedStyles.header}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name="arrow-left-thick"
              size={25}
              color={getColor('primary')}
            />
          </TouchableOpacity>
          <Text style={themedStyles.title}>Review Address</Text>
          <View style={themedStyles.placeholder} />
        </View>
      )}

      {/* Body */}
      {step === 1 ? (
        <MapLocationStep onLocationSelect={handleLocationSelect} />
      ) : step === 2 ? (
        <AddressDetailsStep
          location={location}
          selectedAddressDescription={selectedAddressDescription}
          details={addressDetails}
          onDetailsChange={setAddressDetails}
          onSave={handleGoToReview}
          onSuccess={handleAddressSaveSuccess}
          apiError={apiError}
        />
      ) : (
        <AddressReviewStep
          location={location}
          details={addressDetails}
          onChangeAddress={() => setStep(2)}
          onChangeRecipient={() => setStep(2)}
          onSuccess={handleAddressSaveSuccess}
        />
      )}
    </View>
  );
};

export default AddAddressScreen;
