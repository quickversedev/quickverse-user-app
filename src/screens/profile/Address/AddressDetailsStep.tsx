import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

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

interface AddressDetailsStepProps {
  location: Location | null;
  details: AddressDetails;
  onDetailsChange: (details: AddressDetails) => void;
  onSave: () => void;
}

const AddressDetailsStep = ({
  location: _location,
  details,
  onDetailsChange,
  onSave,
}: AddressDetailsStepProps) => {
  const { getColor, getTypography, theme } = useTheme();

  const handleChange = (field: keyof AddressDetails, value: string | boolean) => {
    onDetailsChange({
      ...details,
      [field]: value,
    });
  };

  const isFormValid = () => {
    return (
      details.name.trim() &&
      details.addressLine1.trim() &&
      details.city.trim() &&
      details.state.trim() &&
      details.pincode.trim()
    );
  };

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    contentContainer: {
      padding: 16,
    },
    locationPreview: {
      marginBottom: 16,
      padding: 12,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      backgroundColor: getColor('card'),
    },
    locationText: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
    },
    input: {
      height: 48,
      paddingHorizontal: 16,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      marginBottom: 16,
      backgroundColor: getColor('card'),
      color: getColor('text'),
      borderColor: getColor('border'),
      fontSize: getTypography('body'),
    },
    tagContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    tagLabel: {
      marginRight: 12,
      color: getColor('text'),
      fontSize: getTypography('body'),
    },
    tagButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      marginRight: 8,
      borderColor: getColor('border'),
    },
    tagButtonText: {
      fontSize: getTypography('body'),
    },
    saveButton: {
      padding: 16,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      backgroundColor: isFormValid() ? getColor('primary') : getColor('button').disabled.background,
    },
    saveButtonText: {
      fontWeight: 'bold',
      color: isFormValid() ? getColor('white') : getColor('text'),
      fontSize: getTypography('body'),
    },
    defaultContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    defaultLabel: {
      color: getColor('text'),
      fontSize: getTypography('body'),
    },
  });

  return (
    <ScrollView
      style={themedStyles.container}
      contentContainerStyle={themedStyles.contentContainer}
    >
      <TextInput
        style={themedStyles.input}
        placeholder="Name (Eg. Rahul Yadav)"
        placeholderTextColor={getColor('placeholder')}
        value={details.name}
        onChangeText={text => handleChange('name', text)}
      />

      <TextInput
        style={themedStyles.input}
        placeholder="House No. / Flat No. / Building"
        placeholderTextColor={getColor('placeholder')}
        value={details.addressLine1}
        onChangeText={text => handleChange('addressLine1', text)}
      />

      <TextInput
        style={themedStyles.input}
        placeholder="Floor (Optional)"
        placeholderTextColor={getColor('placeholder')}
        value={details.addressLine2}
        onChangeText={text => handleChange('addressLine2', text)}
      />

      <TextInput
        style={themedStyles.input}
        placeholder="Tower/Block (Optional)"
        placeholderTextColor={getColor('placeholder')}
        value={details.landmark}
        onChangeText={text => handleChange('landmark', text)}
      />

      <TextInput
        style={themedStyles.input}
        placeholder="City"
        placeholderTextColor={getColor('placeholder')}
        value={details.city}
        onChangeText={text => handleChange('city', text)}
      />

      <TextInput
        style={themedStyles.input}
        placeholder="State"
        placeholderTextColor={getColor('placeholder')}
        value={details.state}
        onChangeText={text => handleChange('state', text)}
      />

      <TextInput
        style={themedStyles.input}
        placeholder="Pincode"
        placeholderTextColor={getColor('placeholder')}
        value={details.pincode}
        onChangeText={text => handleChange('pincode', text)}
        keyboardType="numeric"
      />

      <View style={themedStyles.tagContainer}>
        <Text style={themedStyles.tagLabel}>Save as:</Text>
        {['Home', 'Work', 'Other'].map(tag => (
          <TouchableOpacity
            key={tag}
            style={[
              themedStyles.tagButton,
              {
                backgroundColor: details.tag === tag ? getColor('primary') : getColor('card'),
              },
            ]}
            onPress={() => handleChange('tag', tag)}
          >
            <Text
              style={[
                themedStyles.tagButtonText,
                {
                  color: details.tag === tag ? getColor('white') : getColor('text'),
                },
              ]}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={themedStyles.defaultContainer}>
        <Text style={themedStyles.defaultLabel}>Set as default address</Text>
        <Switch
          value={details.isDefaultAddress}
          onValueChange={value => handleChange('isDefaultAddress', value)}
          trackColor={{ false: getColor('border'), true: getColor('primary') }}
          thumbColor={getColor('white')}
          ios_backgroundColor={getColor('border')}
        />
      </View>

      <TouchableOpacity style={themedStyles.saveButton} disabled={!isFormValid()} onPress={onSave}>
        <Text style={themedStyles.saveButtonText}>Save Address</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddressDetailsStep;
