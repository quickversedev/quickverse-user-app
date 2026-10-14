import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, NativeModules, Platform } from 'react-native';

import Voice, {
  SpeechEndEvent,
  SpeechErrorEvent,
  SpeechResultsEvent,
  SpeechStartEvent,
} from '@react-native-voice/voice';
import {
  check,
  openSettings,
  PERMISSIONS,
  request,
  RESULTS,
} from 'react-native-permissions';

export type VoiceSearchState = 'idle' | 'requesting_permission' | 'listening' | 'processing' | 'error';

interface UseVoiceSearchReturn {
  /** Current state of the voice search lifecycle */
  state: VoiceSearchState;
  /** The recognised transcript (partial results while listening, final on completion) */
  transcript: string;
  /** Partial results shown in real-time while the user speaks */
  partialTranscript: string;
  /** Human-readable error message, if any */
  errorMessage: string | null;
  /** Start the voice recognition flow (checks permissions first) */
  startListening: () => Promise<void>;
  /** Stop listening and finalise results */
  stopListening: () => Promise<void>;
  /** Cancel listening without keeping results */
  cancelListening: () => Promise<void>;
  /** Reset state back to idle */
  reset: () => void;
  /** Whether Voice is available on this device */
  isAvailable: boolean;
}

const microphonePermission = Platform.select({
  ios: PERMISSIONS.IOS.MICROPHONE,
  android: PERMISSIONS.ANDROID.RECORD_AUDIO,
})!;

const speechRecognitionPermission = Platform.select({
  ios: PERMISSIONS.IOS.SPEECH_RECOGNITION,
  android: undefined, // Android doesn't need a separate speech recognition permission
});

const isNativeVoiceAvailable = Boolean(NativeModules.Voice || NativeModules.RCTVoice);

export const useVoiceSearch = (): UseVoiceSearchReturn => {
  const [state, setState] = useState<VoiceSearchState>('idle');
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(isNativeVoiceAvailable);
  const mountedRef = useRef(true);

  // ─── Voice event handlers ────────────────────────────────────────────
  const onSpeechStart = useCallback((_e: SpeechStartEvent) => {
    if (!mountedRef.current) return;
    setState('listening');
    setErrorMessage(null);
  }, []);

  const onSpeechEnd = useCallback((_e: SpeechEndEvent) => {
    if (!mountedRef.current) return;
    setState('processing');
  }, []);

  const onSpeechResults = useCallback((e: SpeechResultsEvent) => {
    if (!mountedRef.current) return;
    const text = e.value?.[0] ?? '';
    setTranscript(text);
    setPartialTranscript('');
    setState('idle');
  }, []);

  const onSpeechPartialResults = useCallback((e: SpeechResultsEvent) => {
    if (!mountedRef.current) return;
    const text = e.value?.[0] ?? '';
    setPartialTranscript(text);
  }, []);

  const onSpeechError = useCallback((e: SpeechErrorEvent) => {
    if (!mountedRef.current) return;
    const code = e.error?.code;
    let message = 'Something went wrong with voice recognition.';

    // Map common error codes to user-friendly messages
    switch (code) {
      case '7': // No match
        message = 'Could not understand. Please try again.';
        break;
      case '6': // Speech timeout
        message = "Didn't hear anything. Please try again.";
        break;
      case '9': // Insufficient permissions
        message = 'Microphone permission is required for voice search.';
        break;
      case '2': // Network error
        message = 'Network error. Please check your connection.';
        break;
      case '5': // Other client side errors
        message = 'Voice recognition error. Please try again.';
        break;
    }

    setErrorMessage(message);
    setState('error');
  }, []);

  // ─── Register / tear-down Voice listeners ────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    if (!NativeModules.Voice && !NativeModules.RCTVoice) {
      setIsAvailable(false);
      return;
    }

    try {
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
      Voice.onSpeechError = onSpeechError;

      // Check availability
      Voice.isAvailable()
        .then((available) => {
          if (mountedRef.current) {
            setIsAvailable(Boolean(available));
          }
        })
        .catch(() => {
          if (mountedRef.current) {
            setIsAvailable(false);
          }
        });
    } catch {
      if (mountedRef.current) {
        setIsAvailable(false);
      }
    }

    return () => {
      mountedRef.current = false;
      if (NativeModules.Voice) {
        try {
          Voice.destroy()
            .then(() => {
              Voice.removeAllListeners();
            })
            .catch(() => {});
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [onSpeechStart, onSpeechEnd, onSpeechResults, onSpeechPartialResults, onSpeechError]);

  // ─── Permission helpers ──────────────────────────────────────────────
  const checkAndRequestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // 1. Check microphone permission
      let micStatus = await check(microphonePermission);

      if (micStatus === RESULTS.DENIED) {
        micStatus = await request(microphonePermission);
      }

      if (micStatus === RESULTS.BLOCKED) {
        Alert.alert(
          'Microphone Access Required',
          'Voice search needs microphone access. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  openSettings().catch(() =>
                    console.warn('Cannot open settings')
                  );
                }
              },
            },
          ]
        );
        return false;
      }

      if (micStatus !== RESULTS.GRANTED && micStatus !== RESULTS.LIMITED) {
        return false;
      }

      // 2. Check speech recognition permission (iOS only)
      if (speechRecognitionPermission) {
        let speechStatus = await check(speechRecognitionPermission);

        if (speechStatus === RESULTS.DENIED) {
          speechStatus = await request(speechRecognitionPermission);
        }

        if (speechStatus === RESULTS.BLOCKED) {
          Alert.alert(
            'Speech Recognition Required',
            'Voice search needs speech recognition access. Please enable it in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Linking.openURL('app-settings:'),
              },
            ]
          );
          return false;
        }

        if (speechStatus !== RESULTS.GRANTED && speechStatus !== RESULTS.LIMITED) {
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error('Permission check failed:', err);
      return false;
    }
  }, []);

  // ─── Public API ──────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    try {
      console.log('[VoiceSearch] startListening called, Native modules:', {
        Voice: !!NativeModules.Voice,
        RCTVoice: !!NativeModules.RCTVoice,
      });

      if (!NativeModules.Voice && !NativeModules.RCTVoice) {
        setErrorMessage('Voice recognition module is not linked or the app needs to be rebuilt.');
        setState('error');
        return;
      }

      setState('requesting_permission');
      setErrorMessage(null);
      setTranscript('');
      setPartialTranscript('');

      const hasPermission = await checkAndRequestPermission();
      if (!hasPermission) {
        setState('idle');
        return;
      }

      // Destroy any existing session first
      try {
        await Voice.destroy();
      } catch {
        // ignore
      }

      setState('listening');
      await Voice.start('en-IN'); // Default to Indian English; user can change
    } catch (err) {
      console.error('Failed to start voice recognition:', err);
      setErrorMessage('Failed to start voice recognition. Please try again.');
      setState('error');
    }
  }, [checkAndRequestPermission]);

  const stopListening = useCallback(async () => {
    try {
      if (NativeModules.Voice || NativeModules.RCTVoice) {
        await Voice.stop();
      }
      setState('processing');
    } catch (err) {
      console.error('Failed to stop voice recognition:', err);
      setState('idle');
    }
  }, []);

  const cancelListening = useCallback(async () => {
    try {
      if (NativeModules.Voice || NativeModules.RCTVoice) {
        await Voice.cancel();
      }
      setTranscript('');
      setPartialTranscript('');
      setState('idle');
    } catch (err) {
      console.error('Failed to cancel voice recognition:', err);
      setState('idle');
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setPartialTranscript('');
    setErrorMessage(null);
    setState('idle');
  }, []);

  return {
    state,
    transcript,
    partialTranscript,
    errorMessage,
    startListening,
    stopListening,
    cancelListening,
    reset,
    isAvailable,
  };
};
