import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../../theme/ThemeContext';

interface MapOnboardingOverlayProps {
  step: 1 | 2;
  onNext: () => void;
  visible: boolean;
}

const MapOnboardingOverlay = ({ step, onNext, visible }: MapOnboardingOverlayProps) => {
  const { getColor, getTypography } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View
        style={[
          styles.card,
          { backgroundColor: getColor('background'), paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={[styles.title, { color: getColor('text'), fontSize: getTypography('h2') }]}>
          Adjust Pin to Your Location
        </Text>
        <Text
          style={[styles.subtitle, { color: getColor('subText'), fontSize: getTypography('body') }]}
        >
          Move the pin to your exact delivery location on the map.
        </Text>

        {step === 1 ? (
          <View style={styles.legendContainer}>
            <View style={styles.legendRow}>
              <View style={styles.blueDot} />
              <Text
                style={[
                  styles.legendText,
                  { color: getColor('text'), fontSize: getTypography('body') },
                ]}
              >
                Your current location
              </Text>
            </View>
            <View style={styles.legendRow}>
              <MaterialCommunityIcons name="map-marker" size={22} color="#E53935" />
              <Text
                style={[
                  styles.legendText,
                  { color: getColor('text'), fontSize: getTypography('body') },
                ]}
              >
                Your delivery location
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.gestureContainer}>
            <MaterialCommunityIcons
              name="gesture-swipe"
              size={56}
              color={getColor('subText')}
            />
            <Text
              style={[
                styles.gestureText,
                { color: getColor('text'), fontSize: getTypography('body') },
              ]}
            >
              Move the pin to your exact building{'\n'}or house location
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.nextButton} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
    ...Platform.select({
      android: { elevation: 100 },
    }),
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
    lineHeight: 22,
  },
  legendContainer: {
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  blueDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2196F3',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    marginLeft: 2,
  },
  legendText: {
    fontWeight: '500',
  },
  gestureContainer: {
    alignItems: 'center',
    marginBottom: 8,
    gap: 16,
  },
  gestureText: {
    textAlign: 'center',
    lineHeight: 24,
  },
  nextButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default MapOnboardingOverlay;
