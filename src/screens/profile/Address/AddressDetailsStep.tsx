import React, { useEffect, useState } from 'react';
import {
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
import { useAuth } from '../../../contexts/login/AuthProvider';

import { AddressComponents } from '../../../services/api/olaLocationService';
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
  onSuccess: _onSuccess,
  apiError = null,
}: AddressDetailsStepProps & { apiError?: string | null }) => {
  const { getColor, getTypography } = useTheme();
  const insets = useSafeAreaInsets();
  const { authData } = useAuth();
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isCustomTagMode, setIsCustomTagMode] = useState(false);

  // Auto-fill city, state, pincode, road, locality, name, phone from geocoding + auth
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
      if (authData?.username && !details.name) {
        updates.name = authData.username;
      }
      if (authData?.phone && !details.phoneNumber) {
        updates.phoneNumber = authData.phone.slice(-10);
      }
      if (!details.tag) {
        updates.tag = 'Home';
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
        if (!value.trim()) {
          return 'Landmark is required';
        }
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
      'addressLine3',
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

  const handleSave = () => {
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
      'tag',
    ];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    if (!validateForm()) {
      return;
    }

    onSave(details);
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
    autoDetectedBadge: {
      position: 'absolute',
      right: 12,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    autoDetectedText: {
      color: getColor('subText'),
      fontSize: getTypography('caption') - 1,
      fontWeight: '500',
    },
    autoDetectedBadgeSmall: {
      position: 'absolute',
      right: 10,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
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
    tagContainer: {
      marginTop: 4,
      marginBottom: 8,
    },
    tagLabel: {
      color: getColor('text'),
      fontSize: getTypography('caption'),
      fontWeight: '700',
      includeFontPadding: false,
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
      backgroundColor: getColor('primary'),
    },
    saveButtonText: {
      fontWeight: '700',
      color: '#FFFFFF',
      fontSize: getTypography('body'),
      includeFontPadding: false,
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
  });

  const renderInput = (
    field: keyof AddressDetails,
    placeholder: string,
    options: {
      required?: boolean;
      autoDetected?: boolean;
      keyboardType?: 'default' | 'numeric';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      maxLength?: number;
      returnKeyType?: 'next' | 'done';
    } = {}
  ) => {
    const {
      required = false,
      autoDetected = false,
      keyboardType = 'default',
      autoCapitalize = 'words',
      maxLength,
      returnKeyType = 'next',
    } = options;
    const hasError = touched[field] && errors[field];
    const displayPlaceholder = required ? `${placeholder} *` : placeholder;
    const isActive = touched[field] || (details[field] as string).trim().length > 0;
    const showAutoDetected =
      autoDetected && (details[field] as string).trim().length > 0;

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
                paddingRight: showAutoDetected ? 130 : 16,
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
            editable
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
                { color: hasError ? getColor('error') : getColor('primary') },
              ]}
            >
              {displayPlaceholder}
            </Text>
          )}
          {showAutoDetected && (
            <View style={themedStyles.autoDetectedBadge}>
              <Text style={themedStyles.autoDetectedText}>Auto-detected</Text>
              <MaterialCommunityIcons name="check-circle" size={16} color="#22C55E" />
            </View>
          )}
        </View>
        {hasError && <Text style={themedStyles.errorText}>{errors[field]}</Text>}
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
      autoDetected1?: boolean;
      autoDetected2?: boolean;
      keyboardType1?: 'default' | 'numeric';
      keyboardType2?: 'default' | 'numeric';
      maxLength1?: number;
      maxLength2?: number;
    } = {}
  ) => {
    const {
      required1 = false,
      required2 = false,
      autoDetected1 = false,
      autoDetected2 = false,
      keyboardType1 = 'default',
      keyboardType2 = 'default',
      maxLength1,
      maxLength2,
    } = options;

    const hasError1 = touched[field1] && errors[field1];
    const hasError2 = touched[field2] && errors[field2];
    const label1 = required1 ? `${placeholder1} *` : placeholder1;
    const label2 = required2 ? `${placeholder2} *` : placeholder2;
    const isActive1 = touched[field1] || (details[field1] as string).trim().length > 0;
    const isActive2 = touched[field2] || (details[field2] as string).trim().length > 0;
    const showAuto1 = autoDetected1 && (details[field1] as string).trim().length > 0;
    const showAuto2 = autoDetected2 && (details[field2] as string).trim().length > 0;

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
              placeholder={isActive1 ? '' : label1}
              placeholderTextColor={getColor('placeholder')}
              value={details[field1] as string}
              onChangeText={text => handleChange(field1, text)}
              onBlur={() => handleBlur(field1)}
              onFocus={() => {
                if (!touched[field1]) {
                  setTouched(prev => ({ ...prev, [field1]: true }));
                }
              }}
              editable
              keyboardType={keyboardType1}
              maxLength={maxLength1}
              returnKeyType="next"
            />
            {isActive1 && (
              <Text
                style={[
                  themedStyles.floatingLabel,
                  { color: hasError1 ? getColor('error') : getColor('primary') },
                ]}
              >
                {label1}
              </Text>
            )}
            {showAuto1 && (
              <View style={themedStyles.autoDetectedBadgeSmall}>
                <MaterialCommunityIcons name="check-circle" size={14} color="#22C55E" />
              </View>
            )}
          </View>
          {hasError1 && <Text style={themedStyles.errorText}>{errors[field1]}</Text>}
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
              placeholder={isActive2 ? '' : label2}
              placeholderTextColor={getColor('placeholder')}
              value={details[field2] as string}
              onChangeText={text => handleChange(field2, text)}
              onBlur={() => handleBlur(field2)}
              onFocus={() => {
                if (!touched[field2]) {
                  setTouched(prev => ({ ...prev, [field2]: true }));
                }
              }}
              editable
              keyboardType={keyboardType2}
              maxLength={maxLength2}
              returnKeyType="next"
            />
            {isActive2 && (
              <Text
                style={[
                  themedStyles.floatingLabel,
                  { color: hasError2 ? getColor('error') : getColor('primary') },
                ]}
              >
                {label2}
              </Text>
            )}
            {showAuto2 && (
              <View style={themedStyles.autoDetectedBadgeSmall}>
                <MaterialCommunityIcons name="check-circle" size={14} color="#22C55E" />
              </View>
            )}
          </View>
          {hasError2 && <Text style={themedStyles.errorText}>{errors[field2]}</Text>}
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
        {apiError && (
          <View style={themedStyles.apiErrorContainer}>
            <Text style={themedStyles.apiErrorText}>{apiError}</Text>
          </View>
        )}

        {renderInput('name', 'Name', {
          required: true,
          autoDetected: Boolean(authData?.username),
        })}
        {renderInput('phoneNumber', 'Phone Number', {
          required: true,
          keyboardType: 'numeric',
          maxLength: 10,
          autoDetected: Boolean(authData?.phone),
        })}
        {renderInput('addressLine1', 'Flat / House No', { required: true })}
        {renderInput('addressLine2', 'Building / Society', {
          required: true,
          autoDetected: Boolean(selectedAddressDescription?.road),
        })}
        {renderInput('addressLine3', 'Landmark', {
          required: true,
          autoDetected: Boolean(selectedAddressDescription?.locality),
        })}
        {renderInput('pincode', 'Pincode', {
          required: true,
          keyboardType: 'numeric',
          maxLength: 6,
          autoDetected: Boolean(selectedAddressDescription?.postalCode),
        })}
        {renderInputRow('city', 'City', 'state', 'State', {
          required1: true,
          required2: true,
          autoDetected1: Boolean(selectedAddressDescription?.city),
          autoDetected2: Boolean(selectedAddressDescription?.state),
        })}

        {/* Tag selector */}
        {(() => {
          const presetTags: {
            label: string;
            icon: 'home-outline' | 'briefcase-outline' | 'bed-outline' | 'tag-outline';
          }[] = [
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
          disabled={false}
          onPress={handleSave}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Review address"
          accessibilityState={{ disabled: false }}
          activeOpacity={0.7}
        >
          <Text style={themedStyles.saveButtonText}>Review Address</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AddressDetailsStep;
