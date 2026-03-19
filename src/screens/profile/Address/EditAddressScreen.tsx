import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useAddress } from '../../../hooks/useAddress';
import { RootStackParamList } from '../../../routes/AppStack';
import { useTheme } from '../../../theme/ThemeContext';
import { Address, NewAddress } from '../../../types/address';

const { width, height } = Dimensions.get('window');

type EditAddressRouteProp = RouteProp<RootStackParamList, 'EditAddress'>;

interface AddressFormState {
  name: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  city: string;
  state: string;
  pincode: string;
  phoneNumber: string;
  tag: string;
}

interface ValidationErrors {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phoneNumber?: string;
  tag?: string;
}

const EditAddressScreen: React.FC = () => {
  const { getColor, getTypography, getButtonColor } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<EditAddressRouteProp>();
  const { address } = route.params;
  const insets = useSafeAreaInsets();
  const { updateAddress, addingLoading } = useAddress();

  const [form, setForm] = useState<AddressFormState>({
    name: address.name || '',
    addressLine1: address.addressLine1 || '',
    addressLine2: address.addressLine2 || '',
    addressLine3: address.addressLine3 || '',
    city: address.city || '',
    state: address.state || '',
    pincode: address.postalCode || '',
    phoneNumber: address.phone || '',
    tag: address.tag || '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isCustomTagMode, setIsCustomTagMode] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check if the tag is a custom one
  useEffect(() => {
    const presetTags = ['home', 'work', 'hotel'];
    if (address.tag && !presetTags.includes(address.tag.toLowerCase())) {
      setIsCustomTagMode(true);
    }
  }, [address.tag]);

  const validateField = (field: keyof AddressFormState, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        break;
      case 'addressLine1':
        if (!value.trim()) return 'House/Flat/Building is required';
        if (value.trim().length < 3) return 'Address must be at least 3 characters';
        break;
      case 'addressLine2':
        if (!value.trim()) return 'Road/Street is required';
        break;
      case 'city':
        if (!value.trim()) return 'City is required';
        if (value.trim().length < 2) return 'City must be at least 2 characters';
        break;
      case 'state':
        if (!value.trim()) return 'State is required';
        if (value.trim().length < 2) return 'State must be at least 2 characters';
        break;
      case 'pincode':
        if (!value.trim()) return 'Pincode is required';
        if (!/^\d{6}$/.test(value.trim())) return 'Pincode must be 6 digits';
        break;
      case 'phoneNumber':
        if (!value.trim()) return 'Phone number is required';
        if (!/^\d{10}$/.test(value.trim())) return 'Phone number must be 10 digits';
        break;
      case 'tag':
        if (!value.trim()) return 'Tag is required';
        if (value.trim().length < 2) return 'Tag must be at least 2 characters';
        if (value.trim().length > 20) return 'Tag must be less than 20 characters';
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    const requiredFields: (keyof AddressFormState)[] = [
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
      const error = validateField(field, form[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof AddressFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (!touched[field]) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
  };

  const handleBlur = (field: keyof AddressFormState) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, form[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSave = useCallback(async () => {
    // Mark all as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach(k => {
      allTouched[k] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) return;

    setSubmitError(null);

    const updatedAddress: NewAddress = {
      ...form,
      latitude: address.coordinates?.latitude?.toString(),
      longitude: address.coordinates?.longitude?.toString(),
      isDefaultAddress: !!address.isDefaultAddress,
    };

    const result = await updateAddress(address.addressID, updatedAddress);

    if (result.success) {
      navigation.goBack();
    } else {
      if (result.error?.code === '1052') {
        setSubmitError(`Tag "${form.tag}" already exists. Please change the tag.`);
      } else {
        setSubmitError(result.error?.message || 'Failed to update address. Please try again.');
      }
    }
  }, [form, address, updateAddress, navigation]);

  const isFormValid = () => {
    return (
      form.name.trim() &&
      form.addressLine1.trim() &&
      form.addressLine2.trim() &&
      form.city.trim() &&
      form.state.trim() &&
      /^\d{6}$/.test(form.pincode.trim()) &&
      /^\d{10}$/.test(form.phoneNumber.trim()) &&
      form.tag.trim()
    );
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: getColor('text'),
      marginLeft: 12,
    },
    contentContainer: {
      padding: Math.max(20, width * 0.05),
      paddingBottom: 16,
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
      flex: 0.48,
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      height: Math.max(50, height * 0.065),
      paddingHorizontal: Math.max(18, width * 0.045),
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: getColor('card'),
      color: getColor('text'),
      fontSize: getTypography('body'),
      includeFontPadding: false,
      textAlignVertical: 'center',
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
      borderWidth: 1.5,
    },
    errorText: {
      color: getColor('error'),
      fontSize: getTypography('caption'),
      marginTop: 6,
      marginLeft: 6,
      fontWeight: '500',
    },
    optionalText: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      fontStyle: 'italic',
      marginLeft: 6,
      marginTop: 4,
    },
    tagContainer: {
      marginBottom: 24,
    },
    tagLabel: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      marginBottom: 12,
    },
    tagButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      borderWidth: 1,
      marginRight: 10,
      marginBottom: 10,
      borderColor: getColor('border'),
      backgroundColor: getColor('card'),
    },
    tagButtonSelected: {
      backgroundColor: `${getColor('primary')}12`,
      borderColor: getColor('primary'),
      borderWidth: 1.5,
    },
    tagIcon: {
      marginRight: 6,
    },
    tagButtonText: {
      fontSize: getTypography('caption'),
      fontWeight: '500',
      color: getColor('text'),
    },
    tagButtonTextSelected: {
      color: getColor('primary'),
      fontWeight: '700',
    },
    saveButtonContainer: {
      paddingHorizontal: Math.max(20, width * 0.05),
      paddingTop: 12,
      paddingBottom: Math.max(insets.bottom, 16),
      backgroundColor: getColor('background'),
      borderTopWidth: 1,
      borderTopColor: getColor('border'),
    },
    saveButton: {
      paddingVertical: 16,
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
      letterSpacing: 0.3,
    },
    apiErrorContainer: {
      backgroundColor: `${getColor('error')}15`,
      borderWidth: 1,
      borderColor: getColor('error'),
      padding: Math.max(14, width * 0.035),
      borderRadius: 12,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    apiErrorText: {
      color: getColor('error'),
      fontSize: getTypography('body'),
      flex: 1,
      fontWeight: '500',
    },
  });

  const renderInput = (
    field: keyof AddressFormState,
    placeholder: string,
    options: {
      required?: boolean;
      optional?: boolean;
      keyboardType?: 'default' | 'numeric';
      maxLength?: number;
    } = {}
  ) => {
    const { required = false, optional = false, keyboardType = 'default', maxLength } = options;
    const hasError = touched[field] && errors[field as keyof ValidationErrors];
    const displayPlaceholder = required ? `${placeholder} *` : placeholder;
    const isActive = touched[field] || form[field].trim().length > 0;

    return (
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              hasError && styles.inputError,
              { borderColor: hasError ? getColor('error') : getColor('border'), paddingTop: isActive ? 20 : 0 },
            ]}
            placeholder={isActive ? '' : displayPlaceholder}
            placeholderTextColor={getColor('placeholder')}
            value={form[field]}
            onChangeText={text => handleChange(field, text)}
            onBlur={() => handleBlur(field)}
            onFocus={() => {
              if (!touched[field]) setTouched(prev => ({ ...prev, [field]: true }));
            }}
            editable={!addingLoading}
            keyboardType={keyboardType}
            maxLength={maxLength}
            autoCapitalize="words"
          />
          {isActive && (
            <Text style={[styles.floatingLabel, { color: hasError ? getColor('error') : getColor('primary') }]}>
              {displayPlaceholder}
            </Text>
          )}
        </View>
        {optional && <Text style={styles.optionalText}>(Optional)</Text>}
        {touched[field] && errors[field as keyof ValidationErrors] && (
          <Text style={styles.errorText}>{errors[field as keyof ValidationErrors]}</Text>
        )}
      </View>
    );
  };

  const renderInputRow = (
    field1: keyof AddressFormState,
    placeholder1: string,
    field2: keyof AddressFormState,
    placeholder2: string,
    options: {
      required1?: boolean;
      required2?: boolean;
      optional1?: boolean;
      optional2?: boolean;
      keyboardType1?: 'default' | 'numeric';
      keyboardType2?: 'default' | 'numeric';
      maxLength1?: number;
      maxLength2?: number;
    } = {}
  ) => {
    const {
      required1 = false, required2 = false,
      optional1 = false, optional2 = false,
      keyboardType1 = 'default', keyboardType2 = 'default',
      maxLength1, maxLength2,
    } = options;

    const hasError1 = touched[field1] && errors[field1 as keyof ValidationErrors];
    const hasError2 = touched[field2] && errors[field2 as keyof ValidationErrors];
    const dp1 = required1 ? `${placeholder1} *` : placeholder1;
    const dp2 = required2 ? `${placeholder2} *` : placeholder2;
    const isActive1 = touched[field1] || form[field1].trim().length > 0;
    const isActive2 = touched[field2] || form[field2].trim().length > 0;

    return (
      <View style={styles.inputRow}>
        <View style={styles.inputRowItem}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, hasError1 && styles.inputError, { borderColor: hasError1 ? getColor('error') : getColor('border'), paddingTop: isActive1 ? 20 : 0 }]}
              placeholder={isActive1 ? '' : dp1}
              placeholderTextColor={getColor('placeholder')}
              value={form[field1]}
              onChangeText={text => handleChange(field1, text)}
              onBlur={() => handleBlur(field1)}
              onFocus={() => { if (!touched[field1]) setTouched(prev => ({ ...prev, [field1]: true })); }}
              editable={!addingLoading}
              keyboardType={keyboardType1}
              maxLength={maxLength1}
              autoCapitalize="words"
            />
            {isActive1 && (
              <Text style={[styles.floatingLabel, { color: hasError1 ? getColor('error') : getColor('primary') }]}>{dp1}</Text>
            )}
          </View>
          {optional1 && <Text style={styles.optionalText}>(Optional)</Text>}
          {hasError1 && <Text style={styles.errorText}>{errors[field1 as keyof ValidationErrors]}</Text>}
        </View>
        <View style={styles.inputRowItem}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, hasError2 && styles.inputError, { borderColor: hasError2 ? getColor('error') : getColor('border'), paddingTop: isActive2 ? 20 : 0 }]}
              placeholder={isActive2 ? '' : dp2}
              placeholderTextColor={getColor('placeholder')}
              value={form[field2]}
              onChangeText={text => handleChange(field2, text)}
              onBlur={() => handleBlur(field2)}
              onFocus={() => { if (!touched[field2]) setTouched(prev => ({ ...prev, [field2]: true })); }}
              editable={!addingLoading}
              keyboardType={keyboardType2}
              maxLength={maxLength2}
              autoCapitalize="words"
            />
            {isActive2 && (
              <Text style={[styles.floatingLabel, { color: hasError2 ? getColor('error') : getColor('primary') }]}>{dp2}</Text>
            )}
          </View>
          {optional2 && <Text style={styles.optionalText}>(Optional)</Text>}
          {hasError2 && <Text style={styles.errorText}>{errors[field2 as keyof ValidationErrors]}</Text>}
        </View>
      </View>
    );
  };

  const presetTags: { label: string; icon: 'home-outline' | 'briefcase-outline' | 'bed-outline' | 'tag-outline' }[] = [
    { label: 'Home', icon: 'home-outline' },
    { label: 'Work', icon: 'briefcase-outline' },
    { label: 'Hotel', icon: 'bed-outline' },
    { label: 'Other', icon: 'tag-outline' },
  ];

  const isPreset = presetTags.some(t => t.label.toLowerCase() === form.tag.toLowerCase() && form.tag.length > 0);
  const isOtherSelected = isCustomTagMode || (!isPreset && touched.tag);
  const tagHasError = touched.tag && errors.tag;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Address</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {submitError && (
            <View style={styles.apiErrorContainer}>
              <Text style={styles.apiErrorText}>{submitError}</Text>
            </View>
          )}

          {renderInputRow('name', 'Name(Eg John Wick)', 'phoneNumber', 'Phone Number', {
            required1: true,
            required2: true,
            keyboardType2: 'numeric',
            maxLength2: 10,
          })}
          {renderInput('addressLine1', 'Floor / Flat No. / Building', { required: true })}
          {renderInput('addressLine2', 'Road / Street', { required: true })}
          {renderInputRow('addressLine3', 'Area / Locality', 'pincode', 'Pincode', {
            optional1: true,
            required2: true,
            keyboardType2: 'numeric',
            maxLength2: 6,
          })}
          {renderInputRow('city', 'City', 'state', 'State', { required1: true, required2: true })}

          {/* Tag selector */}
          <View style={styles.tagContainer}>
            <Text style={styles.tagLabel}>Tag Address As *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {presetTags.map(({ label, icon }) => {
                const isSelected =
                  label === 'Other'
                    ? isOtherSelected
                    : form.tag.toLowerCase() === label.toLowerCase();
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.tagButton, isSelected && styles.tagButtonSelected]}
                    onPress={() => {
                      if (label === 'Other') {
                        setIsCustomTagMode(true);
                        handleChange('tag', '');
                      } else {
                        setIsCustomTagMode(false);
                        handleChange('tag', label);
                      }
                      if (!touched.tag) setTouched(prev => ({ ...prev, tag: true }));
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={icon}
                      size={16}
                      color={isSelected ? getColor('primary') : getColor('subText')}
                      style={styles.tagIcon}
                    />
                    <Text style={[styles.tagButtonText, isSelected && styles.tagButtonTextSelected]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {isOtherSelected && (
              <TextInput
                style={[
                  styles.input,
                  { marginTop: 10, borderColor: tagHasError ? getColor('error') : getColor('border') },
                  tagHasError && styles.inputError,
                ]}
                placeholder="Enter custom tag (e.g. Mom's House)"
                placeholderTextColor={getColor('placeholder')}
                value={form.tag}
                onChangeText={text => handleChange('tag', text)}
                onBlur={() => handleBlur('tag')}
                maxLength={20}
              />
            )}
            {tagHasError && <Text style={styles.errorText}>{errors.tag}</Text>}
          </View>
        </ScrollView>

        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            disabled={!isFormValid() || addingLoading}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            {addingLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color={getColor('background')} />
                <Text style={[styles.saveButtonText, { marginLeft: 10, color: getColor('background') }]}>
                  Updating...
                </Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>Update Address</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditAddressScreen;
