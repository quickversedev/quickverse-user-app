import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,

  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const { addAddress, addingLoading } = useAddress(); // Use addingLoading from store
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isCustomTagMode, setIsCustomTagMode] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null); // Keep local error state

  // Auto-fill city, state, pincode, road, and locality from selectedAddressDescription
  useEffect(() => {
    if (selectedAddressDescription) {
      const updates: Partial<AddressDetails> = {};

      if (selectedAddressDescription.city) {
        updates.city = selectedAddressDescription.city;
      }
      if (selectedAddressDescription.state) {
        updates.state = selectedAddressDescription.state;
      }
      if (selectedAddressDescription.postalCode) {
        updates.pincode = selectedAddressDescription.postalCode;
      }
      if (selectedAddressDescription.road) {
        updates.addressLine2 = selectedAddressDescription.road;
      }
      if (selectedAddressDescription.locality) {
        updates.addressLine3 = selectedAddressDescription.locality;
      }

      if (Object.keys(updates).length > 0) {
        onDetailsChange({
          ...details,
          ...updates,
        });
      }
    }
    // Only re-run when the geocode result changes, not on every details change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressDescription]);
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
      backgroundColor: getColor('background'),
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
    },
    inputContainer: {
      marginBottom: 14,
    },
    inputRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 14,
      gap: 12,
    },
    inputRowItem: {
      flex: 1,
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      height: 52,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      backgroundColor: getColor('card'),
      color: getColor('text'),
      fontSize: getTypography('body'),
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    floatingLabel: {
      position: 'absolute',
      top: 6,
      left: 16,
      fontSize: getTypography('caption') - 1,
      fontWeight: '600',
      includeFontPadding: false,
      zIndex: 1,
    },
    inputError: {
      borderColor: getColor('error'),
      borderWidth: 1.5,
    },
    errorText: {
      color: getColor('error'),
      fontSize: getTypography('caption'),
      marginTop: 4,
      marginLeft: 4,
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
      marginLeft: 4,
      marginTop: 2,
    },
    tagContainer: {
      marginTop: 4,
      marginBottom: 8,
    },
    tagLabel: {
      color: getColor('text'),
      fontSize: getTypography('caption'),
      fontWeight: '700',
      includeFontPadding: false,
      textAlignVertical: 'center',
      marginBottom: 10,
      letterSpacing: 0.3,
    },
    tagButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
      marginBottom: 8,
      borderColor: getColor('border'),
      backgroundColor: getColor('card'),
    },
    tagButtonSelected: {
      backgroundColor: `${getColor('primary')}15`,
      borderColor: getColor('primary'),
      borderWidth: 1.5,
    },
    tagIcon: {
      marginRight: 6,
    },
    tagButtonText: {
      fontSize: getTypography('caption'),
      fontWeight: '500',
      includeFontPadding: false,
      color: getColor('text'),
    },
    tagButtonTextSelected: {
      color: getColor('primary'),
      fontWeight: '700',
    },
    saveButtonContainer: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: Math.max(insets.bottom, 12),
      backgroundColor: getColor('background'),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: getColor('border'),
    },
    saveButton: {
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        isFormValid() && !addingLoading
          ? getColor('primary')
          : getButtonColor('disabled', 'background'),
      opacity: addingLoading ? 0.7 : 1,
    },
    saveButtonText: {
      fontWeight: '700',
      color:
        isFormValid() && !addingLoading
          ? getColor('background')
          : getColor('subText'),
      fontSize: getTypography('body'),
      includeFontPadding: false,
      textAlignVertical: 'center',
      letterSpacing: 0.5,
    },
    apiErrorContainer: {
      backgroundColor: `${getColor('error')}12`,
      borderWidth: 1,
      borderColor: getColor('error'),
      padding: 12,
      borderRadius: 10,
      marginBottom: 14,
      flexDirection: 'row',
      alignItems: 'center',
    },
    apiErrorText: {
      color: getColor('error'),
      fontSize: getTypography('caption'),
      flex: 1,
      includeFontPadding: false,
      lineHeight: getTypography('caption') * 1.4,
      fontWeight: '500',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      color: getColor('background'),
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
                paddingTop: isActive ? 18 : 0,
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
                  paddingTop: isActive1 ? 18 : 0,
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
                  paddingTop: isActive2 ? 18 : 0,
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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

        {renderInput('name', 'Name', { required: true })}
        {renderInput('phoneNumber', 'Phone Number', {
          required: true,
          keyboardType: 'numeric',
          maxLength: 10,
        })}
        {renderInput('addressLine1', 'Floor / Flat No. / Building', { required: true })}
        {renderInput('addressLine2', 'Road / Street ', { required: true })}
        {renderInputRow('addressLine3', 'Area / Locality', 'pincode', 'Pincode', {
          required2: true,
          keyboardType2: 'numeric',
          maxLength2: 6,
        })}
        {renderInputRow('city', 'City', 'state', 'State', { required1: true, required2: true })}

        {/* Tag selector */}
        {(() => {
          const presetTags: { label: string; icon: 'home-outline' | 'briefcase-outline' | 'bed-outline' | 'tag-outline' }[] = [
            { label: 'Home', icon: 'home-outline' },
            { label: 'Work', icon: 'briefcase-outline' },
            { label: 'Hotel', icon: 'bed-outline' },
            { label: 'Other', icon: 'tag-outline' },
          ];
          const currentTag = details.tag;
          const isPreset = presetTags.some(
            t => t.label.toLowerCase() === currentTag.toLowerCase() && currentTag.length > 0
          );
          const isOtherSelected = isCustomTagMode || (!isPreset && touched.tag);
          const hasError = touched.tag && errors.tag;

          return (
            <View style={themedStyles.tagContainer}>
              <Text style={themedStyles.tagLabel}>Tag Address As *</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {presetTags.map(({ label, icon }) => {
                  const isSelected =
                    label === 'Other'
                      ? isOtherSelected
                      : currentTag.toLowerCase() === label.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={label}
                      style={[
                        themedStyles.tagButton,
                        isSelected && themedStyles.tagButtonSelected,
                      ]}
                      onPress={() => {
                        if (label === 'Other') {
                          setIsCustomTagMode(true);
                          handleChange('tag', '');
                        } else {
                          setIsCustomTagMode(false);
                          handleChange('tag', label);
                        }
                        if (!touched.tag) {
                          setTouched(prev => ({ ...prev, tag: true }));
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={icon}
                        size={16}
                        color={isSelected ? getColor('primary') : getColor('subText')}
                        style={themedStyles.tagIcon}
                      />
                      <Text
                        style={[
                          themedStyles.tagButtonText,
                          isSelected && themedStyles.tagButtonTextSelected,
                        ]}
                      >
                        {label}
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
                      marginTop: 10,
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


      </ScrollView>

      <View style={themedStyles.saveButtonContainer}>
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
              <ActivityIndicator size="small" color={getColor('background')} />
              <Text style={themedStyles.loadingText}>Saving Address...</Text>
            </View>
          ) : (
            <Text style={themedStyles.saveButtonText}>Save Address</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AddressDetailsStep;
