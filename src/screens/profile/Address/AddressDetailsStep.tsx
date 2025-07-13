import React, { useState } from 'react';
import {
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
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
      'landmark',
    ];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    if (validateForm()) {
      onSave();
    }
  };

  const isFormValid = () => {
    return (
      details.name.trim() &&
      details.addressLine1.trim() &&
      details.addressLine2.trim() &&
      details.city.trim() &&
      details.state.trim() &&
      details.pincode.trim() &&
      /^\d{6}$/.test(details.pincode.trim()) &&
      Object.keys(errors).length === 0
    );
  };

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    contentContainer: {
      padding: Math.max(16, width * 0.04),
      paddingBottom: Math.max(32, height * 0.04),
    },
    locationPreview: {
      marginBottom: 16,
      padding: Math.max(12, width * 0.03),
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      backgroundColor: getColor('card'),
      minHeight: 60,
      justifyContent: 'center',
    },
    locationText: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      textAlign: 'center',
      includeFontPadding: false,
    },
    inputContainer: {
      marginBottom: 16,
    },
    input: {
      height: Math.max(48, height * 0.06),
      paddingHorizontal: Math.max(16, width * 0.04),
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      backgroundColor: getColor('card'),
      color: getColor('text'),
      fontSize: getTypography('body'),
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    inputError: {
      borderColor: getColor('error'),
      borderWidth: 2,
    },
    inputValid: {
      borderColor: '#4CAF50', // Green color for valid state
    },
    errorText: {
      color: getColor('error'),
      fontSize: getTypography('caption'),
      marginTop: 4,
      marginLeft: 4,
      includeFontPadding: false,
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
    },
    tagContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      flexWrap: 'wrap',
    },
    tagLabel: {
      marginRight: 12,
      color: getColor('text'),
      fontSize: getTypography('body'),
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    tagButton: {
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingVertical: 8,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      marginRight: 8,
      marginBottom: 8,
      borderColor: getColor('border'),
      minHeight: 36,
      justifyContent: 'center',
    },
    tagButtonText: {
      fontSize: getTypography('body'),
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    saveButton: {
      padding: Math.max(16, height * 0.02),
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      backgroundColor: isFormValid() ? getColor('primary') : getColor('button').disabled.background,
      minHeight: 48,
      justifyContent: 'center',
      marginTop: 16,
    },
    saveButtonText: {
      fontWeight: 'bold',
      color: isFormValid() ? getColor('white') : getColor('text'),
      fontSize: getTypography('body'),
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    defaultContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      minHeight: 44,
    },
    defaultLabel: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      includeFontPadding: false,
      textAlignVertical: 'center',
      flex: 1,
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

    return (
      <View style={themedStyles.inputContainer}>
        <TextInput
          style={[
            themedStyles.input,
            hasError && themedStyles.inputError,
            isValid && themedStyles.inputValid,
            {
              borderColor: hasError ? getColor('error') : isValid ? '#4CAF50' : getColor('border'),
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={getColor('placeholder')}
          value={details[field] as string}
          onChangeText={text => handleChange(field, text)}
          onBlur={() => handleBlur(field)}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Enter ${placeholder.toLowerCase()}`}
          accessibilityHint={`Type your ${placeholder.toLowerCase()}`}
          returnKeyType={returnKeyType}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          maxLength={maxLength}
        />
        {hasError && <Text style={themedStyles.errorText}>{errors[field]}</Text>}
        {required && !details[field] && (
          <Text style={themedStyles.requiredIndicator}>* Required</Text>
        )}
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
            Save as:
          </Text>
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
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Save as ${tag}`}
              accessibilityHint={`Marks this address as ${tag.toLowerCase()}`}
              accessibilityState={{ selected: details.tag === tag }}
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
            accessible={true}
            accessibilityRole="switch"
            accessibilityLabel="Set as default address"
            accessibilityHint="Toggles whether this address should be your default address"
            accessibilityState={{ checked: details.isDefaultAddress }}
          />
        </View>

        <TouchableOpacity
          style={themedStyles.saveButton}
          disabled={!isFormValid()}
          onPress={handleSave}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Save address"
          accessibilityHint="Saves the address details and adds it to your saved addresses"
          accessibilityState={{ disabled: !isFormValid() }}
          activeOpacity={0.7}
        >
          <Text style={themedStyles.saveButtonText}>Save Address</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddressDetailsStep;
