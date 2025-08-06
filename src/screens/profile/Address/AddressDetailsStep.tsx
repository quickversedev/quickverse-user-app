import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AddressComponents } from '../../../services/api/olaLocationService';
import { useTheme } from '../../../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

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

interface ValidationErrors {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  tag?: string;
  isDefaultAddress?: string;
}

interface AddressDetailsStepProps {
  location: Location | null;
  selectedAddressDescription: AddressComponents;
  details: AddressDetails;
  onDetailsChange: (details: AddressDetails) => void;
  onSave: (details: AddressDetails) => void;
}

const AddressDetailsStep = ({
  location: _location,
  selectedAddressDescription,
  details,
  onDetailsChange,
  onSave,
  isLoading = false,
  apiError = null,
}: AddressDetailsStepProps & { isLoading?: boolean; apiError?: string | null }) => {
  const { getColor, getTypography, theme } = useTheme();
  const _navigation = useNavigation();
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Auto-fill city, state, and pincode from selectedAddressDescription
  useEffect(() => {
    if (selectedAddressDescription) {
      const updates: Partial<AddressDetails> = {};

      // Only auto-fill if the field is empty or hasn't been manually edited
      if (!details.city.trim() && selectedAddressDescription.city) {
        updates.city = selectedAddressDescription.city;
      }
      if (!details.state.trim() && selectedAddressDescription.state) {
        updates.state = selectedAddressDescription.state;
      }
      if (!details.pincode.trim() && selectedAddressDescription.postalCode) {
        updates.pincode = selectedAddressDescription.postalCode;
      }

      // Only update if there are changes to make
      if (Object.keys(updates).length > 0) {
        onDetailsChange({
          ...details,
          ...updates,
        });
      }
    }
  }, [selectedAddressDescription, details.city, details.state, details.pincode, onDetailsChange]);
  // Validation rules
  const validateField = (field: keyof AddressDetails, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) {
          return 'Name is required';
        }
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        break;
      case 'addressLine1':
        if (!value.trim()) {
          return 'House/Flat/Building is required';
        }
        if (value.trim().length < 3) {
          return 'Address must be at least 3 characters';
        }
        break;
      case 'addressLine2':
        if (!value.trim()) {
          return 'Floor is required';
        }
        break;
      case 'city':
        if (!value.trim()) {
          return 'City is required';
        }
        if (value.trim().length < 2) {
          return 'City must be at least 2 characters';
        }
        break;
      case 'state':
        if (!value.trim()) {
          return 'State is required';
        }
        if (value.trim().length < 2) {
          return 'State must be at least 2 characters';
        }
        break;
      case 'pincode':
        if (!value.trim()) {
          return 'Pincode is required';
        }
        if (!/^\d{6}$/.test(value.trim())) {
          return 'Pincode must be 6 digits';
        }
        break;
      case 'landmark':
        // Optional field - no validation needed
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate required fields
    const requiredFields: (keyof AddressDetails)[] = [
      'name',
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      'pincode',
    ];

    requiredFields.forEach(field => {
      const error = validateField(field, details[field] as string);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof AddressDetails, value: string | boolean) => {
    onDetailsChange({
      ...details,
      [field]: value,
    });

    // Clear error when user starts typing
    if (typeof value === 'string' && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Clear API error when user makes changes
    if (apiError) {
      // setApiError(null); // This line is removed as per the new_code
    }

    // Mark field as touched when user starts typing
    if (!touched[field]) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
  };

  const handleBlur = (field: keyof AddressDetails) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate field on blur
    const error = validateField(field, details[field] as string);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSave = async () => {
    // Mark all fields as touched
    const allFields = [
      'name',
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      'pincode',
      'landmark',
    ];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    if (!validateForm()) {
      return;
    }

    // Call parent onSave with all details
    onSave(details);
  };

  const isFormValid = () => {
    // Check if all required fields are filled
    const requiredFieldsFilled =
      details.name.trim() &&
      details.addressLine1.trim() &&
      details.addressLine2.trim() &&
      details.city.trim() &&
      details.state.trim() &&
      details.pincode.trim() &&
      /^\d{6}$/.test(details.pincode.trim()) &&
      details.tag &&
      details.tag.trim(); // Tag is also required

    // Only check for errors if the field has been touched
    const hasErrors = Object.keys(errors).some(key => {
      const field = key as keyof AddressDetails;
      return touched[field] && errors[field] && errors[field]!.trim().length > 0;
    });

    return requiredFieldsFilled && !hasErrors;
  };

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    contentContainer: {
      padding: Math.max(20, width * 0.05),
      paddingBottom: Math.max(40, height * 0.05),
    },
    locationPreview: {
      marginBottom: 24,
      padding: Math.max(16, width * 0.04),
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      backgroundColor: getColor('card'),
      minHeight: 70,
      justifyContent: 'center',
      // borderWidth: 1,
      // borderColor: getColor('border'),
      // shadowColor: theme.colors.shadow.color,
      // shadowOffset: theme.colors.shadow.offset,
      // shadowOpacity: theme.colors.shadow.opacity * 0.3,
      // shadowRadius: theme.colors.shadow.radius,
      // elevation: 2,
    },
    locationText: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      textAlign: 'center',
      includeFontPadding: false,
      lineHeight: getTypography('body') * 1.3,
      marginBottom: 12,
    },
    changeLocationButton: {
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.md,
      // backgroundColor: getColor('primary'),
      minHeight: 36,
      borderWidth: 2,
      borderColor: getColor('primary'),
      justifyContent: 'center',
    },
    changeLocationButtonText: {
      color: getColor('white'),
      fontSize: getTypography('caption'),
      fontWeight: '600',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      height: Math.max(52, height * 0.065),
      paddingHorizontal: Math.max(18, width * 0.045),
      borderRadius: theme.borderRadius.md,
      borderWidth: 1.5,
      backgroundColor: getColor('card'),
      color: getColor('text'),
      fontSize: getTypography('body'),
      includeFontPadding: false,
      textAlignVertical: 'center',
      shadowColor: theme.colors.shadow.color,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.colors.shadow.opacity * 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    floatingLabel: {
      position: 'absolute',
      top: 8,
      left: Math.max(18, width * 0.045),
      fontSize: getTypography('caption'),
      fontWeight: '600',
      includeFontPadding: false,
      zIndex: 1,
    },
    inputError: {
      borderColor: getColor('error'),
      borderWidth: 2,
      shadowColor: getColor('error'),
      shadowOpacity: 0.3,
    },
    inputValid: {
      borderColor: '#4CAF50', // Green color for valid state
      shadowColor: '#4CAF50',
      shadowOpacity: 0.2,
    },
    errorText: {
      color: getColor('error'),
      fontSize: getTypography('caption'),
      marginTop: 6,
      marginLeft: 6,
      includeFontPadding: false,
      fontWeight: '500',
    },
    requiredIndicator: {
      color: getColor('error'),
      fontSize: getTypography('caption'),
      marginLeft: 4,
    },
    optionalText: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      fontStyle: 'italic',
      marginLeft: 6,
      marginTop: 4,
    },
    tagContainer: {
      marginBottom: 28,
    },
    tagLabel: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      includeFontPadding: false,
      textAlignVertical: 'center',
      marginBottom: 12,
    },
    tagButton: {
      paddingHorizontal: Math.max(20, width * 0.05),
      paddingVertical: 8,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1.5,
      marginRight: 12,
      marginBottom: 12,
      borderColor: getColor('border'),
      minHeight: 44,
      justifyContent: 'center',
      shadowColor: theme.colors.shadow.color,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.colors.shadow.opacity * 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    tagButtonText: {
      fontSize: getTypography('body'),
      fontWeight: '500',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    saveButton: {
      padding: 16,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      backgroundColor:
        isFormValid() && !isLoading ? getColor('primary') : getColor('button').disabled.background,
      minHeight: 26,
      justifyContent: 'center',

      opacity: isLoading ? 0.7 : 1,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.colors.shadow.opacity * 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    saveButtonText: {
      fontWeight: 'bold',
      color: isFormValid() && !isLoading ? getColor('white') : getColor('text'),
      fontSize: getTypography('body'),
      includeFontPadding: false,
      textAlignVertical: 'center',
      letterSpacing: 0.5,
    },
    defaultContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',

      minHeight: 48,
      paddingHorizontal: 4,
    },
    defaultLabel: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: '500',
      includeFontPadding: false,
      textAlignVertical: 'center',
      flex: 1,
    },
    apiErrorContainer: {
      backgroundColor: getColor('error'),
      padding: Math.max(16, width * 0.04),
      borderRadius: theme.borderRadius.md,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: getColor('error'),
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    apiErrorText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      flex: 1,
      includeFontPadding: false,
      lineHeight: getTypography('body') * 1.3,
      fontWeight: '500',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      marginLeft: 10,
      includeFontPadding: false,
    },
  });

  const renderInput = (
    field: keyof AddressDetails,
    placeholder: string,
    options: {
      required?: boolean;
      optional?: boolean;
      keyboardType?: 'default' | 'numeric';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      maxLength?: number;
      returnKeyType?: 'next' | 'done';
    } = {}
  ) => {
    const {
      required = false,
      optional = false,
      keyboardType = 'default',
      autoCapitalize = 'words',
      maxLength,
      returnKeyType = 'next',
    } = options;
    const hasError = touched[field] && errors[field];
    const isValid =
      touched[field] &&
      !errors[field] &&
      details[field] &&
      (details[field] as string).trim().length > 0;

    // Add asterisk to placeholder if required
    const displayPlaceholder = required ? `${placeholder} *` : placeholder;

    // Check if input is focused or has content
    const isActive = touched[field] || (details[field] as string).trim().length > 0;

    return (
      <View style={themedStyles.inputContainer}>
        <View style={themedStyles.inputWrapper}>
          <TextInput
            style={[
              themedStyles.input,
              hasError && themedStyles.inputError,
              isValid && themedStyles.inputValid,
              {
                borderColor: hasError
                  ? getColor('error')
                  : isValid
                  ? '#4CAF50'
                  : getColor('border'),
                paddingTop: isActive ? 20 : 0,
              },
            ]}
            placeholder={isActive ? '' : displayPlaceholder}
            placeholderTextColor={getColor('placeholder')}
            value={details[field] as string}
            onChangeText={text => handleChange(field, text)}
            onBlur={() => handleBlur(field)}
            onFocus={() => {
              if (!touched[field]) {
                setTouched(prev => ({ ...prev, [field]: true }));
              }
            }}
            editable={!isLoading}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`Enter ${placeholder.toLowerCase()}`}
            accessibilityHint={`Type your ${placeholder.toLowerCase()}`}
            returnKeyType={returnKeyType}
            autoCapitalize={autoCapitalize}
            keyboardType={keyboardType}
            maxLength={maxLength}
          />
          {isActive && (
            <Text
              style={[
                themedStyles.floatingLabel,
                {
                  color: hasError ? getColor('error') : isValid ? '#4CAF50' : getColor('primary'),
                },
              ]}
            >
              {displayPlaceholder}
            </Text>
          )}
        </View>

        {optional && <Text style={themedStyles.optionalText}>(Optional)</Text>}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={themedStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={themedStyles.container}
        contentContainerStyle={themedStyles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        accessible={true}
        accessibilityLabel="Address details form"
      >
        {apiError && (
          <View style={themedStyles.apiErrorContainer}>
            <Text style={themedStyles.apiErrorText}>⚠️ {apiError}</Text>
          </View>
        )}

        {renderInput('name', 'Name (Eg. Rahul Yadav)', { required: true })}
        {renderInput('addressLine1', 'House No. / Flat No. / Building', { required: true })}
        {renderInput('addressLine2', 'Floor', { required: true })}
        {renderInput('landmark', 'Tower/Block', { optional: true })}
        {renderInput('city', 'City', { required: true })}
        {renderInput('state', 'State', { required: true })}
        {renderInput('pincode', 'Pincode', {
          required: true,
          keyboardType: 'numeric',
          maxLength: 6,
          returnKeyType: 'done',
        })}

        <View style={themedStyles.tagContainer}>
          <Text
            style={themedStyles.tagLabel}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Save address as"
          >
            Save as *
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
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
                disabled={isLoading}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Save as ${tag}`}
                accessibilityHint={`Marks this address as ${tag.toLowerCase()}`}
                accessibilityState={{ selected: details.tag === tag, disabled: isLoading }}
                activeOpacity={0.7}
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
        </View>

        <View style={themedStyles.defaultContainer}>
          <Text
            style={themedStyles.defaultLabel}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Set as default address"
          >
            Set as default address
          </Text>
          <Switch
            value={details.isDefaultAddress}
            onValueChange={value => handleChange('isDefaultAddress', value)}
            trackColor={{ false: getColor('border'), true: getColor('primary') }}
            thumbColor={getColor('white')}
            ios_backgroundColor={getColor('border')}
            disabled={isLoading}
            accessible={true}
            accessibilityRole="switch"
            accessibilityLabel="Set as default address"
            accessibilityHint="Toggles whether this address should be your default address"
            accessibilityState={{ checked: details.isDefaultAddress, disabled: isLoading }}
          />
        </View>

        <TouchableOpacity
          style={themedStyles.saveButton}
          disabled={!isFormValid() || isLoading}
          onPress={handleSave}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isLoading ? 'Saving address' : 'Save address'}
          accessibilityHint={
            isLoading
              ? 'Address is being saved'
              : 'Saves the address details and adds it to your saved addresses'
          }
          accessibilityState={{ disabled: !isFormValid() || isLoading }}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <View style={themedStyles.loadingContainer}>
              <ActivityIndicator size="small" color={getColor('white')} />
              <Text style={themedStyles.loadingText}>Saving Address...</Text>
            </View>
          ) : (
            <Text style={themedStyles.saveButtonText}>Save Address</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddressDetailsStep;
