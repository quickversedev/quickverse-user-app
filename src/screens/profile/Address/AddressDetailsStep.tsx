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
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useAddress } from '../../../hooks/useAddress';

import { AddressComponents } from '../../../services/api/olaLocationService';
import { useTheme } from '../../../theme/ThemeContext';
import { NewAddress } from '../../../types/address';

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
  phoneNumber: string;
  addressLine3?: string;
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
  addressLine3?: string;
  tag?: string;
  isDefaultAddress?: string;
  phoneNumber?: string;
}

interface AddressDetailsStepProps {
  location: Location | null;
  selectedAddressDescription: AddressComponents;
  details: AddressDetails;
  onDetailsChange: (details: AddressDetails) => void;
  onSave: (details: AddressDetails) => void;
  onSuccess: () => void; // Added onSuccess prop
}

const AddressDetailsStep = ({
  location: _location,
  selectedAddressDescription,
  details,
  onDetailsChange,
  onSave,
  onSuccess,
  apiError = null,
}: AddressDetailsStepProps & { apiError?: string | null }) => {
  const { getColor, getTypography, getButtonColor } = useTheme();
  const _navigation = useNavigation();
  const { addAddress, addingLoading } = useAddress(); // Use addingLoading from store
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isCustomTagMode, setIsCustomTagMode] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null); // Keep local error state

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
  }, [
    selectedAddressDescription,
    details.city,
    details.state,
    details.pincode,
    onDetailsChange,
    details,
  ]);
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
      case 'phoneNumber':
        if (!value.trim()) {
          return 'Phone number is required';
        }
        if (!/^\d{10}$/.test(value.trim())) {
          return 'Phone number must be 10 digits';
        }
        break;
      case 'tag':
        if (!value.trim()) {
          return 'Tag is required';
        }
        if (value.trim().length < 2) {
          return 'Tag must be at least 2 characters';
        }
        if (value.trim().length > 20) {
          return 'Tag must be less than 20 characters';
        }
        break;
      case 'addressLine3':
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
      'phoneNumber',
      'tag',
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
      'phoneNumber',
      'addressLine3',
    ];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    if (!validateForm()) {
      return;
    }

    setSubmitError(null);

    // Prepare the new address data
    const newAddress: NewAddress = {
      ...details,
      latitude: _location ? _location.latitude.toString() : undefined,
      longitude: _location ? _location.longitude.toString() : undefined,
    };

    // Make the API call directly
    const result = await addAddress(newAddress);

    if (result.success) {
      // Call parent onSave if provided (for any additional logic)
      if (onSave) {
        onSave(details);
      }

      // Call onSuccess to close modal only on successful save
      if (onSuccess) {
        onSuccess();
      }
    } else {
      // Handle error response from the store
      if (result.error) {
        // The error object from the store contains the ApiError structure
        const apiError = result.error;

        if (apiError.code === '1052') {
          // Tag already exists error
          setSubmitError(`Tag "${details.tag}" already exists. Please change the tag.`);
        } else {
          // Use the message from the API error
          setSubmitError(apiError.message || 'Failed to save address. Please try again.');
        }
      } else {
        // Fallback error handling
        setSubmitError('Failed to save address. Please try again.');
      }
      // Don't call onSuccess here - modal should stay open when API fails
    }
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
      details.phoneNumber.trim() &&
      /^\d{10}$/.test(details.phoneNumber.trim()) &&
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
      backgroundColor: getColor('background') || '#111827', // Fallback to default background
    },
    contentContainer: {
      padding: Math.max(20, width * 0.05),
      paddingBottom: Math.max(40, height * 0.05),
    },

    inputContainer: {
      marginBottom: 20,
    },
    inputRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    inputRowItem: {
      flex: 0.48, // Take up roughly half the width with some spacing
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      height: Math.max(50, height * 0.065),
      paddingHorizontal: Math.max(18, width * 0.045),
      borderRadius: 12, // Use fixed value instead of theme.borderRadius.md
      borderWidth: 1.5,
      backgroundColor: getColor('card'),
      color: getColor('text'),
      fontSize: getTypography('body'),
      includeFontPadding: false,
      textAlignVertical: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
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
      borderRadius: 20, // Use fixed value instead of theme.borderRadius.full
      borderWidth: 1.5,
      marginRight: 12,
      marginBottom: 12,
      borderColor: getColor('border'),
      minHeight: 44,
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
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
      borderRadius: 8, // Use fixed value instead of theme.borderRadius.sm
      alignItems: 'center',
      backgroundColor:
        isFormValid() && !addingLoading
          ? getColor('primary')
          : getButtonColor('disabled', 'background'),
      minHeight: 26,
      justifyContent: 'center',

      opacity: addingLoading ? 0.7 : 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    saveButtonText: {
      fontWeight: 'bold',
      color:
        isFormValid() && !addingLoading
          ? getColor('background') || '#111827'
          : getColor('text') || '#F3F4F6',
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
      borderRadius: 12, // Use fixed value instead of theme.borderRadius.md
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
              {
                borderColor: hasError ? getColor('error') : getColor('border'),
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
            editable={!addingLoading}
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
                  color: hasError ? getColor('error') : getColor('primary'),
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

  const renderInputRow = (
    field1: keyof AddressDetails,
    placeholder1: string,
    field2: keyof AddressDetails,
    placeholder2: string,
    options: {
      required1?: boolean;
      required2?: boolean;
      optional1?: boolean;
      optional2?: boolean;
      keyboardType1?: 'default' | 'numeric';
      keyboardType2?: 'default' | 'numeric';
      autoCapitalize1?: 'none' | 'sentences' | 'words' | 'characters';
      autoCapitalize2?: 'none' | 'sentences' | 'words' | 'characters';
      maxLength1?: number;
      maxLength2?: number;
      returnKeyType1?: 'next' | 'done';
      returnKeyType2?: 'next' | 'done';
    } = {}
  ) => {
    const {
      required1 = false,
      required2 = false,
      optional1 = false,
      optional2 = false,
      keyboardType1 = 'default',
      keyboardType2 = 'default',
      autoCapitalize1 = 'words',
      autoCapitalize2 = 'words',
      maxLength1,
      maxLength2,
      returnKeyType1 = 'next',
      returnKeyType2 = 'next',
    } = options;

    const hasError1 = touched[field1] && errors[field1];
    const hasError2 = touched[field2] && errors[field2];

    const displayPlaceholder1 = required1 ? `${placeholder1} *` : placeholder1;
    const displayPlaceholder2 = required2 ? `${placeholder2} *` : placeholder2;

    const isActive1 = touched[field1] || (details[field1] as string).trim().length > 0;
    const isActive2 = touched[field2] || (details[field2] as string).trim().length > 0;

    return (
      <View style={themedStyles.inputRow}>
        <View style={themedStyles.inputRowItem}>
          <View style={themedStyles.inputWrapper}>
            <TextInput
              style={[
                themedStyles.input,
                hasError1 && themedStyles.inputError,
                {
                  borderColor: hasError1 ? getColor('error') : getColor('border'),
                  paddingTop: isActive1 ? 20 : 0,
                },
              ]}
              placeholder={isActive1 ? '' : displayPlaceholder1}
              placeholderTextColor={getColor('placeholder')}
              value={details[field1] as string}
              onChangeText={text => handleChange(field1, text)}
              onBlur={() => handleBlur(field1)}
              onFocus={() => {
                if (!touched[field1]) {
                  setTouched(prev => ({ ...prev, [field1]: true }));
                }
              }}
              editable={!addingLoading}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Enter ${placeholder1.toLowerCase()}`}
              accessibilityHint={`Type your ${placeholder1.toLowerCase()}`}
              returnKeyType={returnKeyType1}
              autoCapitalize={autoCapitalize1}
              keyboardType={keyboardType1}
              maxLength={maxLength1}
            />
            {isActive1 && (
              <Text
                style={[
                  themedStyles.floatingLabel,
                  {
                    color: hasError1 ? getColor('error') : getColor('primary'),
                  },
                ]}
              >
                {displayPlaceholder1}
              </Text>
            )}
          </View>
          {optional1 && <Text style={themedStyles.optionalText}>(Optional)</Text>}
          {touched[field1] && errors[field1] && (
            <Text style={themedStyles.errorText}>{errors[field1]}</Text>
          )}
        </View>

        <View style={themedStyles.inputRowItem}>
          <View style={themedStyles.inputWrapper}>
            <TextInput
              style={[
                themedStyles.input,
                hasError2 && themedStyles.inputError,
                {
                  borderColor: hasError2 ? getColor('error') : getColor('border'),
                  paddingTop: isActive2 ? 20 : 0,
                },
              ]}
              placeholder={isActive2 ? '' : displayPlaceholder2}
              placeholderTextColor={getColor('placeholder')}
              value={details[field2] as string}
              onChangeText={text => handleChange(field2, text)}
              onBlur={() => handleBlur(field2)}
              onFocus={() => {
                if (!touched[field2]) {
                  setTouched(prev => ({ ...prev, [field2]: true }));
                }
              }}
              editable={!addingLoading}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Enter ${placeholder2.toLowerCase()}`}
              accessibilityHint={`Type your ${placeholder2.toLowerCase()}`}
              returnKeyType={returnKeyType2}
              autoCapitalize={autoCapitalize2}
              keyboardType={keyboardType2}
              maxLength={maxLength2}
            />
            {isActive2 && (
              <Text
                style={[
                  themedStyles.floatingLabel,
                  {
                    color: hasError2 ? getColor('error') : getColor('primary'),
                  },
                ]}
              >
                {displayPlaceholder2}
              </Text>
            )}
          </View>
          {optional2 && <Text style={themedStyles.optionalText}>(Optional)</Text>}
          {touched[field2] && errors[field2] && (
            <Text style={themedStyles.errorText}>{errors[field2]}</Text>
          )}
        </View>
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
        {(apiError || submitError) && (
          <View style={themedStyles.apiErrorContainer}>
            <Text style={themedStyles.apiErrorText}>⚠️ {apiError || submitError}</Text>
          </View>
        )}

        {renderInputRow('name', 'Name(Eg John Wick)', 'phoneNumber', 'Phone Number', {
          required1: true,
          required2: true,
          keyboardType2: 'numeric',
          maxLength2: 10,
        })}
        {renderInput('addressLine1', 'Floor / Flat No. / Building', { required: true })}
        {renderInput('addressLine2', 'Road / Street ', { required: true })}
        {renderInputRow('addressLine3', 'Area / Locality', 'pincode', 'Pincode', {
          optional1: true,
          required2: true,
          keyboardType2: 'numeric',
          maxLength2: 6,
        })}
        {renderInputRow('city', 'City', 'state', 'State', { required1: true, required2: true })}

        {/* custom tag selector */}
        {(() => {
          const presetTags = ['Home', 'Work', 'Other'];
          const currentTag = details.tag;
          const isPreset = presetTags.some(
            t => t.toLowerCase() === currentTag.toLowerCase() && currentTag.length > 0
          );
          const isOtherSelected = isCustomTagMode || (!isPreset && touched.tag);
          const hasError = touched.tag && errors.tag;

          return (
            <View style={themedStyles.tagContainer}>
              <Text style={themedStyles.tagLabel}>Tag Address As *</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                {presetTags.map(option => {
                  const isSelected =
                    option === 'Other'
                      ? isOtherSelected
                      : currentTag.toLowerCase() === option.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        themedStyles.tagButton,
                        {
                          paddingVertical: 6,
                          paddingHorizontal: 16,
                          minHeight: 36,
                        },
                        isSelected && {
                          backgroundColor: `${getColor('primary')}15`,
                          borderColor: getColor('primary'),
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => {
                        if (option === 'Other') {
                          setIsCustomTagMode(true);
                          handleChange('tag', '');
                        } else {
                          setIsCustomTagMode(false);
                          handleChange('tag', option);
                        }
                        if (!touched.tag) {
                          setTouched(prev => ({ ...prev, tag: true }));
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          themedStyles.tagButtonText,
                          {
                            color: isSelected ? getColor('primary') : getColor('text'),
                            fontWeight: isSelected ? '700' : '500',
                            fontSize: getTypography('caption'),
                          },
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {isOtherSelected && (
                <TextInput
                  style={[
                    themedStyles.input,
                    {
                      marginTop: 12,
                      borderColor: hasError ? getColor('error') : getColor('border'),
                    },
                    hasError && themedStyles.inputError,
                  ]}
                  placeholder="Enter custom tag (e.g. Mom's House)"
                  placeholderTextColor={getColor('placeholder')}
                  value={currentTag}
                  onChangeText={text => handleChange('tag', text)}
                  onBlur={() => handleBlur('tag')}
                  maxLength={20}
                  autoFocus
                />
              )}
              {hasError && <Text style={themedStyles.errorText}>{errors.tag}</Text>}
            </View>
          );
        })()}

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
            disabled={addingLoading}
            accessible={true}
            accessibilityRole="switch"
            accessibilityLabel="Set as default address"
            accessibilityHint="Toggles whether this address should be your default address"
            accessibilityState={{ checked: details.isDefaultAddress, disabled: addingLoading }}
          />
        </View>

        <TouchableOpacity
          style={themedStyles.saveButton}
          disabled={!isFormValid() || addingLoading}
          onPress={handleSave}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={addingLoading ? 'Saving address' : 'Save address'}
          accessibilityHint={
            addingLoading
              ? 'Address is being saved'
              : 'Saves the address details and adds it to your saved addresses'
          }
          accessibilityState={{ disabled: !isFormValid() || addingLoading }}
          activeOpacity={0.7}
        >
          {addingLoading ? (
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
