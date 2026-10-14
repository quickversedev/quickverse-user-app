import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useVoiceSearch, VoiceSearchState } from '../../hooks/useVoiceSearch';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

// ─── Ripple animation ring ──────────────────────────────────────────
const PulseRing: React.FC<{ delay: number; isActive: boolean }> = ({ delay, isActive }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isActive) {
      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 2.2,
              duration: 1500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      animRef.current.start();
    } else {
      animRef.current?.stop();
      scale.setValue(1);
      opacity.setValue(0);
    }

    return () => {
      animRef.current?.stop();
    };
  }, [isActive, delay, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

// ─── Mic button with animated background ────────────────────────────
const MicButton: React.FC<{
  state: VoiceSearchState;
  onPress: () => void;
}> = ({ state, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isListening = state === 'listening';

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.stopAnimation();
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isListening, scaleAnim]);

  const backgroundColor = isListening ? '#EF4444' : '#FEDB51';
  const iconColor = isListening ? '#FFFFFF' : '#1F2937';

  return (
    <View style={styles.micButtonContainer}>
      {/* Pulse rings only while listening */}
      <PulseRing delay={0} isActive={isListening} />
      <PulseRing delay={400} isActive={isListening} />
      <PulseRing delay={800} isActive={isListening} />

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={[styles.micButton, { backgroundColor }]}
        >
          <MaterialCommunityIcons
            name={isListening ? 'microphone' : 'microphone-outline'}
            size={36}
            color={iconColor}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Main modal ─────────────────────────────────────────────────────
const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  visible,
  onClose,
  onSearch,
}) => {
  const { getColor } = useTheme();
  const {
    state,
    transcript,
    partialTranscript,
    errorMessage,
    startListening,
    stopListening,
    cancelListening,
    reset,
  } = useVoiceSearch();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Open/close animations
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-start listening when the modal opens
      const timer = setTimeout(() => {
        startListening();
      }, 400);
      return () => clearTimeout(timer);
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = useCallback(async () => {
    await cancelListening();
    reset();
    onClose();
  }, [cancelListening, reset, onClose]);

  const handleMicPress = useCallback(async () => {
    if (state === 'listening') {
      await stopListening();
    } else {
      await startListening();
    }
  }, [state, startListening, stopListening]);

  const handleSearch = useCallback(() => {
    const query = transcript.trim();
    if (query) {
      onSearch(query);
      reset();
      onClose();
    }
  }, [transcript, onSearch, reset, onClose]);

  const handleRetry = useCallback(async () => {
    reset();
    await startListening();
  }, [reset, startListening]);

  // ─── Status text ──────────────────────────────────────────────────
  const getStatusText = () => {
    switch (state) {
      case 'requesting_permission':
        return 'Requesting microphone access…';
      case 'listening':
        return 'Listening…';
      case 'processing':
        return 'Processing…';
      case 'error':
        return errorMessage || 'Something went wrong';
      default:
        return 'Tap the microphone to speak';
    }
  };

  const displayedText = state === 'listening' ? partialTranscript : transcript;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: getColor('background'),
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="close" size={24} color={getColor('subText')} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={[styles.title, { color: getColor('text') }]}>Voice Search</Text>

          {/* Status text */}
          <Text
            style={[
              styles.statusText,
              {
                color: state === 'error' ? '#EF4444' : getColor('subText'),
              },
            ]}
          >
            {getStatusText()}
          </Text>

          {/* Transcript display area */}
          <View style={[styles.transcriptContainer, { borderColor: getColor('border') }]}>
            {displayedText ? (
              <Text style={[styles.transcriptText, { color: getColor('text') }]}>
                {displayedText}
              </Text>
            ) : (
              <Text style={[styles.transcriptPlaceholder, { color: getColor('subText') }]}>
                {state === 'listening'
                  ? 'Start speaking…'
                  : 'Your speech will appear here'}
              </Text>
            )}
          </View>

          {/* Mic button */}
          <MicButton state={state} onPress={handleMicPress} />

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            {state === 'error' && (
              <TouchableOpacity
                onPress={handleRetry}
                style={[styles.actionButton, styles.retryButton]}
              >
                <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            )}

            {transcript.trim().length > 0 && state !== 'listening' && (
              <TouchableOpacity
                onPress={handleSearch}
                style={[styles.actionButton, styles.searchButton]}
              >
                <MaterialCommunityIcons name="magnify" size={18} color="#1F2937" />
                <Text style={styles.searchText}>Search</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Hint at bottom */}
          <Text style={[styles.hintText, { color: getColor('subText') }]}>
            {state === 'listening' ? 'Tap mic to stop' : 'Tap mic to start speaking'}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  transcriptContainer: {
    width: '100%',
    minHeight: 80,
    maxHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 28,
    backgroundColor: 'rgba(0,0,0,0.02)',
    justifyContent: 'center',
  },
  transcriptText: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  transcriptPlaceholder: {
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.6,
  },
  micButtonContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    minHeight: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryButton: {
    backgroundColor: '#6B7280',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#FEDB51',
  },
  searchText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    opacity: 0.6,
  },
});

export default VoiceSearchModal;
