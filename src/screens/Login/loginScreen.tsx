import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Images } from '../../assets';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { useAuth } from '../../contexts/login/AuthProvider';
import { LoginStackParamList } from '../../navigation/LoginNavigation';
import { useTheme } from '../../theme/ThemeContext';

const { height } = Dimensions.get('window');
type LoginScreenNavigationProp = StackNavigationProp<LoginStackParamList, 'LoginScreen'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [countryCode, setCountryCode] = useState<string>('IN');
  const [callingCode, setCallingCode] = useState('91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRequestedPhone, setLastRequestedPhone] = useState('');
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lastVerificationId, setLastVerificationId] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { theme } = useTheme();

  const onSelect = (country: { cca2: string; callingCode: string[] }) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
  };
  const auth = useAuth();

  const handleSkipLogin = () => {
    auth.setSkipLogin(true);
  };

  const validatePhoneNumber = (number: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(number);
  };

  const handlePhoneNumberChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setPhoneNumber(numericValue);
    setError('');
  };

  // Timer effect to countdown the cooldown period
  useEffect(() => {
    if (timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Handle screen focus to check if timer should still be active
  useFocusEffect(
    React.useCallback(() => {
      // When screen comes into focus, check if we need to update the timer
      if (lastRequestedPhone && lastRequestTime > 0) {
        const now = Date.now();
        const thirtySeconds = 30 * 1000;
        const timeElapsed = now - lastRequestTime;

        if (timeElapsed < thirtySeconds) {
          // Timer should still be running
          const remaining = Math.ceil((thirtySeconds - timeElapsed) / 1000);
          setTimeRemaining(remaining);
        } else {
          // Timer has expired
          setTimeRemaining(0);
        }
      }
    }, [lastRequestedPhone, lastRequestTime])
  );

  // Check if we can request OTP for the current phone number
  const canRequestOtp = () => {
    const now = Date.now();
    const thirtySeconds = 30 * 1000; // 30 seconds in milliseconds

    // If it's a different phone number, allow request
    if (phoneNumber !== lastRequestedPhone) {
      return true;
    }

    // If it's the same phone number, check if 30 seconds have passed
    return now - lastRequestTime >= thirtySeconds;
  };

  const getTimeRemainingText = () => {
    if (timeRemaining <= 0) return '';
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `Resend OTP in ${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLogin = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    // If the same number is within cooldown, navigate without requesting a new OTP
    if (isCooldownActive && lastVerificationId) {
      navigation.navigate({
        name: 'OTPScreen',
        params: { phoneNumber, verificationId: lastVerificationId },
      });
      return;
    }

    setLoading(true);
    setError('');
    try {
      const verificationId = await auth.sendOtp(phoneNumber);

      // Update the last requested phone and time
      setLastRequestedPhone(phoneNumber);
      setLastRequestTime(Date.now());
      setTimeRemaining(30); // Start 30 second countdown
      setLastVerificationId(verificationId);

      navigation.navigate({
        name: 'OTPScreen',
        params: { phoneNumber, verificationId },
      });
    } catch (err) {
      Alert.alert('Error', 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    topBackground: {
      height: height * 0.55,
      width: '100%',
      position: 'absolute',
      top: Platform.OS === 'ios' ? -50 : -80,
    },
    logoContainer: {
      position: 'absolute',
      top: 60,
      alignItems: 'center',
      width: '100%',
    },
    topLogo: {
      width: 100,
      height: 100,
      resizeMode: 'contain',
    },
    card: {
      width: '90%',
      minHeight: '45%',
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 24,
      marginTop: height * 0.24,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: {
        width: theme.colors.shadow.offset_width,
        height: theme.colors.shadow.offset_height,
      },
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 6,
      borderWidth: 1,
      borderColor: theme.colors.borderHighlight,
      justifyContent: 'space-between',
    },
    title: {
      fontFamily: 'BricolageGrotesque-Bold',
      textAlign: 'center',
    },
    subtitle: {
      textAlign: 'center',
      marginTop: 5,
      marginBottom: 20,
    },
    skipContainer: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: theme.colors.overlay,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      elevation: 2,
    },
    phoneLabel: {
      marginTop: 36,
      marginBottom: 6,
    },
    phoneInputWrapper: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 50,
    },
    phoneInputError: {
      borderColor: theme.colors.error,
      borderWidth: 1,
    },
    countryPicker: {
      marginRight: 6,
    },
    callingCode: {
      marginRight: 6,
    },
    input: {
      flex: 1,
      fontSize: theme.typography.body,
      color: theme.colors.text,
      paddingVertical: Platform.OS === 'ios' ? 10 : 6,
      fontFamily: theme.typography.fontFamily,
    },
    errorText: {
      marginTop: 4,
      marginBottom: 8,
    },
    countdownText: {
      marginTop: 4,
      marginBottom: 8,
    },
    otpButton: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 8,
      paddingVertical: 14,
      marginTop: 'auto',
    },
    otpButtonDisabled: {
      backgroundColor: theme.colors.overlay,
    },
    otpText: {
      textAlign: 'center',
      fontFamily: 'BricolageGrotesque-Bold',
    },
    partneredContainer: {
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 30 : 20,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    amazonLogo: {
      height: 24,
      width: 100,
      resizeMode: 'contain',
      marginTop: 8,
    },
  });

  const isCooldownActive = timeRemaining > 0 && phoneNumber === lastRequestedPhone;
  const isButtonDisabled = loading || !phoneNumber || phoneNumber.length !== 10 || isCooldownActive;

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ImageBackground source={Images.bg1} style={styles.topBackground} resizeMode="cover" />
          <View style={styles.logoContainer}>
            <Image style={styles.topLogo} source={Images.logoQv} />
          </View>

          <View style={styles.card}>
            <ThemeText variant="h2" style={styles.title}>
              Login
            </ThemeText>
            <ThemeText variant="subtitle" color={theme.colors.subText} style={styles.subtitle}>
              Log In to your Quickverse account
            </ThemeText>

            <TouchableOpacity style={styles.skipContainer} onPress={handleSkipLogin}>
              <ThemeText variant="caption" color={theme.colors.text}>
                Skip
              </ThemeText>
            </TouchableOpacity>

            <ThemeText variant="caption" color={theme.colors.subText} style={styles.phoneLabel}>
              Phone number
            </ThemeText>
            <View style={[styles.phoneInputWrapper, error && styles.phoneInputError]}>
              <Text style={{ fontSize: 28, marginRight: 4 }}>🇮🇳</Text>
              <ThemeText variant="body" color={theme.colors.text} style={styles.callingCode}>
                +{callingCode}
              </ThemeText>
              <TextInput
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                placeholder="Enter phone number"
                placeholderTextColor={theme.colors.placeholder}
                keyboardType="phone-pad"
                style={styles.input}
                maxLength={10}
              />
            </View>
            {error ? (
              <ThemeText variant="caption" color={theme.colors.error} style={styles.errorText}>
                {error}
              </ThemeText>
            ) : null}

            {isCooldownActive && (
              <ThemeText
                variant="caption"
                color={theme.colors.subText}
                style={styles.countdownText}
              >
                {getTimeRemainingText()}
              </ThemeText>
            )}

            <TouchableOpacity
              style={[styles.otpButton, (loading || isCooldownActive) && { opacity: 0.5 }]}
              onPress={handleLogin}
              disabled={isButtonDisabled}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.background} />
              ) : (
                <ThemeText
                  variant="body"
                  color={theme.colors.background}
                  style={styles.otpText}
                >
                  Get OTP
                </ThemeText>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {!isKeyboardVisible && (
        <View style={styles.partneredContainer}>
          <ThemeText variant="caption" color={theme.colors.subText}>
            Partnered With
          </ThemeText>
          <Image source={Images.amazonLogo} style={styles.amazonLogo} />
        </View>
      )}
    </SafeAreaView>
  );
};

export default LoginScreen;
