import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoginPromptModal from '../../../components/common/LoginPromptModal';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { useAddress } from '../../../hooks/useAddress';
import { useTheme } from '../../../theme/ThemeContext';
import { NewAddress } from '../../../types/address';

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

interface AddressReviewStepProps {
  location: Location | null;
  details: AddressDetails;
  onChangeAddress: () => void;
  onChangeRecipient: () => void;
  onSuccess: (data: any) => void;
}

const TAG_ICONS: Record<
  string,
  'home-outline' | 'briefcase-outline' | 'bed-outline' | 'tag-outline'
> = {
  home: 'home-outline',
  work: 'briefcase-outline',
  hotel: 'bed-outline',
};

const AddressReviewStep = ({
  location,
  details,
  onChangeAddress,
  onChangeRecipient,
  onSuccess,
}: AddressReviewStepProps) => {
  const { getColor, getTypography, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { authData } = useAuth();
  const { addAddress, addingLoading } = useAddress();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const addressLine1 = [details.addressLine1, details.addressLine2].filter(Boolean).join(', ');
  const addressLine2 = [details.city, details.state, details.pincode].filter(Boolean).join(', ');

  const handleSave = async () => {
    if (!authData?.jwt) {
      setShowLoginModal(true);
      return;
    }

    setSubmitError(null);

    const newAddress: NewAddress = {
      ...details,
      latitude: location ? location.latitude.toString() : undefined,
      longitude: location ? location.longitude.toString() : undefined,
    };

    const result: { success: boolean; data?: any; error?: { code: string; message: string } } =
      await addAddress(newAddress);

    if (result.success) {
      onSuccess(result?.data);
    } else if (result.error) {
      if (result.error.code === '1052') {
        setSubmitError(`Tag "${details.tag}" already exists. Please change the tag.`);
      } else {
        setSubmitError(result.error.message || 'Failed to save address. Please try again.');
      }
    } else {
      setSubmitError('Failed to save address. Please try again.');
    }
  };

  const tagIcon = TAG_ICONS[details.tag.toLowerCase()] || 'tag-outline';

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: getColor('background') },
    scroll: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32 },
    subtitle: {
      fontSize: getTypography('body'),
      color: getColor('subText'),
      marginBottom: 28,
      lineHeight: 22,
    },
    section: { marginBottom: 24 },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: getColor('subText'),
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    card: {
      backgroundColor: getColor('card'),
      borderRadius: 16,
      padding: 18,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
      }),
    },
    cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${getColor('primary')}12`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    cardBody: { flex: 1 },
    addressPrimary: {
      fontSize: getTypography('body'),
      fontWeight: '600',
      color: getColor('text'),
      lineHeight: 22,
    },
    addressSecondary: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      marginTop: 3,
      lineHeight: 20,
    },
    landmark: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      fontStyle: 'italic',
      marginTop: 6,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: getColor('border'),
      marginVertical: 14,
    },
    changeRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    changeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    changeText: {
      fontSize: getTypography('caption'),
      fontWeight: '600',
      color: getColor('primary'),
      marginRight: 2,
    },
    recipientName: {
      fontSize: getTypography('body'),
      fontWeight: '600',
      color: getColor('text'),
    },
    recipientPhone: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      marginTop: 3,
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 24,
      backgroundColor: `${getColor('primary')}12`,
      borderWidth: 1.5,
      borderColor: getColor('primary'),
    },
    tagIcon: { marginRight: 8 },
    tagText: {
      fontSize: getTypography('caption'),
      fontWeight: '700',
      color: getColor('primary'),
    },
    errorBox: {
      backgroundColor: `${getColor('error')}10`,
      borderWidth: 1,
      borderColor: getColor('error'),
      borderRadius: 12,
      padding: 14,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorText: {
      color: getColor('error'),
      fontSize: getTypography('caption'),
      fontWeight: '500',
      flex: 1,
      marginLeft: 8,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Math.max(insets.bottom, 16),
      backgroundColor: getColor('background'),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: getColor('border'),
    },
    saveBtn: {
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: addingLoading ? getColor('border') : getColor('primary'),
      ...Platform.select({
        ios: {
          shadowColor: getColor('primary'),
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: addingLoading ? 0 : 0.25,
          shadowRadius: 8,
        },
        android: { elevation: addingLoading ? 0 : 6 },
      }),
    },
    saveBtnText: {
      fontWeight: '700',
      color: addingLoading ? getColor('subText') : '#FFFFFF',
      fontSize: getTypography('body'),
      letterSpacing: 0.5,
    },
    loadingRow: { flexDirection: 'row', alignItems: 'center' },
    loadingText: {
      color: '#FFFFFF',
      fontSize: getTypography('body'),
      fontWeight: '600',
      marginLeft: 10,
    },
  });

  return (
    <View style={s.root}>
      <ScrollView
        style={s.root}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.subtitle}>Please confirm your delivery address before saving.</Text>

        {submitError && (
          <View style={s.errorBox}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color={getColor('error')}
            />
            <Text style={s.errorText}>{submitError}</Text>
          </View>
        )}

        {/* Delivery Address */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Delivery Address</Text>
          <View style={s.card}>
            <View style={s.cardRow}>
              <View style={s.iconCircle}>
                <MaterialCommunityIcons name="map-marker" size={20} color={getColor('primary')} />
              </View>
              <View style={s.cardBody}>
                <Text style={s.addressPrimary}>{addressLine1}</Text>
                <Text style={s.addressSecondary}>{addressLine2}</Text>
                {details.addressLine3 ? (
                  <Text style={s.landmark}>Near {details.addressLine3}</Text>
                ) : null}
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.changeRow}>
              <TouchableOpacity style={s.changeBtn} onPress={onChangeAddress} activeOpacity={0.7}>
                <Text style={s.changeText}>Change</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color={getColor('primary')}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recipient */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Recipient Details</Text>
          <View style={s.card}>
            <View style={s.cardRow}>
              <View style={s.iconCircle}>
                <MaterialCommunityIcons name="account" size={20} color={getColor('primary')} />
              </View>
              <View style={s.cardBody}>
                <Text style={s.recipientName}>{details.name}</Text>
                <Text style={s.recipientPhone}>+91 {details.phoneNumber}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.changeRow}>
              <TouchableOpacity style={s.changeBtn} onPress={onChangeRecipient} activeOpacity={0.7}>
                <Text style={s.changeText}>Change</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color={getColor('primary')}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Address Type */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Address Type</Text>
          <View style={s.tagChip}>
            <MaterialCommunityIcons
              name={tagIcon}
              size={18}
              color={getColor('primary')}
              style={s.tagIcon}
            />
            <Text style={s.tagText}>{details.tag}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={s.saveBtn}
          disabled={addingLoading}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          {addingLoading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={s.loadingText}>Saving...</Text>
            </View>
          ) : (
            <Text style={s.saveBtnText}>Save Address</Text>
          )}
        </TouchableOpacity>
      </View>

      <LoginPromptModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Login to Save Address"
        message="Please login to save your delivery address."
      />
    </View>
  );
};

export default AddressReviewStep;
