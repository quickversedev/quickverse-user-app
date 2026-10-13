import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export const formatDistance = (km: number) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;

interface FarFromYouDialogProps {
  /** How far the chosen spot is from the phone, in km; null hides the dialog. */
  distanceKm: number | null;
  /** The spot in words for the message, e.g. "The pin" or "Home". */
  subject: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelText: string;
  confirmText: string;
}

/**
 * "This isn&apos;t your current location": shown before an order or a saved address goes somewhere
 * the customer isn't standing. Orders are delivered to the address, not to the phone, so a
 * mistaken pin or the wrong saved address is caught while it can still be changed.
 */
const FarFromYouDialog: React.FC<FarFromYouDialogProps> = ({
  distanceKm,
  subject,
  onCancel,
  onConfirm,
  cancelText,
  confirmText,
}) => {
  const { getColor } = useTheme();
  return (
    <Modal visible={distanceKm !== null} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: getColor('card') }]}>
          <View style={styles.icon}>
            <MaterialCommunityIcons name="map-marker-alert-outline" size={28} color="#D97706" />
          </View>
          <Text style={[styles.title, { color: getColor('text') }]}>
            This isn&apos;t your current location
          </Text>
          <Text style={[styles.message, { color: getColor('subText') }]}>
            {subject} is {distanceKm !== null ? formatDistance(distanceKm) : ''} from where you are
            now. Orders will be delivered there, so make sure it&apos;s the right place.
          </Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { borderColor: getColor('border') }]}
              onPress={onCancel}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, { color: getColor('text') }]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                { backgroundColor: getColor('primary') },
              ]}
              onPress={onConfirm}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 20, alignItems: 'center' },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' },
  button: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  buttonPrimary: { borderWidth: 0 },
  buttonText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  buttonTextPrimary: { color: '#FFFFFF' },
});

export default FarFromYouDialog;
