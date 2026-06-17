import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { StackNavigationProp } from '@react-navigation/stack';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import { useOtpVerify } from 'react-native-otp-verify';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../../assets';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { useAuth } from '../../contexts/login/AuthProvider';
import { LoginStackParamList } from '../../navigation/LoginNavigation';
import { useTheme } from '../../theme/ThemeContext';

const { height } = Dimensions.get('window');

const CELL_COUNT = 4;
type LoginScreenRouteProp = RouteProp<LoginStackParamList, 'OTPScreen'>;
type OTPScreenNavigationProp = StackNavigationProp<LoginStackParamList, 'OTPScreen'>;

const OTPScreen: React.FC = () => {
  const route = useRoute<LoginScreenRouteProp>();
  const { phoneNumber, verificationId } = route.params;
  const navigation = useNavigation<OTPScreenNavigationProp>();
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState('');

  // Resend OTP Timer
  const [resendTimeout, setResendTimeout] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [currentVerificationId, setCurrentVerificationId] = useState(verificationId);

  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });
  const auth = useAuth();
  const { theme } = useTheme();

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (!canResend && resendTimeout > 0) {
      interval = setInterval(() => {
        setResendTimeout(prev => prev - 1);
      }, 1000);
    } else if (resendTimeout === 0) {
      setCanResend(true);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [canResend, resendTimeout]);

  // OTP Auto-fill for Android using useOtpVerify hook
  const { otp: autoOtp, startListener, hash } = useOtpVerify({ numberOfDigits: CELL_COUNT });
  const hasAutoSubmitted = useRef(false);

  // Log app hash for backend SMS setup
  useEffect(() => {
    if (Platform.OS === 'android' && hash?.length > 0) {
      console.log('App Hash for SMS:', hash);
    }
  }, [hash]);

  // Sync hook's auto-detected OTP into input state
  useEffect(() => {
    if (autoOtp) {
      setValue(autoOtp);
    }
  }, [autoOtp]);

  const getOtpFriendlyErrorMessage = useCallback((err: unknown) => {
    const error = err as { status?: number; message?: string; response?: { data?: unknown } };
    const rawMessage =
      error.message ||
      (typeof error.response?.data === 'string' ? error.response.data : '') ||
      JSON.stringify(error.response?.data ?? '');

    if (
      error.status === 401 ||
      error.status === 422 ||
      /invalid otp|expired otp|otp has expired|verify.*otp|wrong otp|invalid or expired/i.test(
        rawMessage
      )
    ) {
      return 'Invalid or expired OTP entered. Please try again.';
    }

    if (/valid 6-digit otp|verification id|required|format/i.test(rawMessage)) {
      return 'Please enter the OTP carefully and try again.';
    }

    return 'Something went wrong while verifying the OTP. Please try again.';
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const verifyOTP = useCallback(async () => {
    if (value.length !== CELL_COUNT) {
      setOtpErrorMessage('Please enter all 4 digits of the OTP.');
      return;
    }

    setLoading(true);
    setOtpErrorMessage('');
    try {
      await auth.verifyOtp(phoneNumber, value, currentVerificationId);
    } catch (err) {
      setOtpErrorMessage(getOtpFriendlyErrorMessage(err));
      console.error('login otp error', err);
    } finally {
      setLoading(false);
    }
  }, [value, auth, phoneNumber, currentVerificationId, getOtpFriendlyErrorMessage]);

  // Auto-submit when all 4 digits are filled
  useEffect(() => {
    if (value.length === CELL_COUNT && !hasAutoSubmitted.current && !loading) {
      hasAutoSubmitted.current = true;
      verifyOTP();
    }
    if (value.length < CELL_COUNT) {
      hasAutoSubmitted.current = false;
    }
  }, [value, loading, verifyOTP]);

  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      setLoading(true);
      setOtpErrorMessage('');
      const newVerificationId = await auth.sendOtp(phoneNumber);
      setCurrentVerificationId(newVerificationId);
      setValue('');
      hasAutoSubmitted.current = false;
      if (Platform.OS === 'android') {
        startListener();
      }
      setResendTimeout(60);
      setCanResend(false);
    } catch (error) {
      setOtpErrorMessage('Unable to resend OTP right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    navigation.goBack();
  };

  const handleOtpChange = (text: string) => {
    setValue(text);
    if (otpErrorMessage) {
      setOtpErrorMessage('');
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
      marginTop: 8,
      marginBottom: 20,
    },
    codeFieldRoot: {
      marginTop: 24,
      marginBottom: 16,
      justifyContent: 'space-between',
      flexDirection: 'row',
    },
    otpErrorText: {
      textAlign: 'center',
      marginTop: -4,
      marginBottom: 12,
      color: '#D92D20',
      fontFamily: 'BricolageGrotesque-Regular',
    },
    cell: {
      width: 50,
      height: 50,
      lineHeight: 48,
      borderWidth: 1,
      borderRadius: 8,
      textAlign: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
    },
    focusCell: {
      borderWidth: 2,
      borderColor: theme.colors.main,
    },
    unfocusedCell: {
      borderColor: theme.colors.border,
    },
    subTitle_2: {
      textAlign: 'center',
      marginTop: 12,
    },
    link: {
      color: theme.colors.main,
      textDecorationLine: 'underline',
    },
    otpButton: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 8,
      paddingVertical: 14,
      marginTop: 24,
    },
    otpText: {
      textAlign: 'center',
      fontFamily: 'BricolageGrotesque-Bold',
    },
    resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
    },
    resendText: {
      marginRight: 4,
    },
    timerText: {
      marginLeft: 4,
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
              Verify OTP
            </ThemeText>
            <ThemeText variant="subtitle" color={theme.colors.subText} style={styles.subtitle}>
              Enter the OTP sent to +91 {phoneNumber}
            </ThemeText>

            <CodeField
              ref={ref}
              {...props}
              value={value}
              onChangeText={handleOtpChange}
              cellCount={CELL_COUNT}
              rootStyle={styles.codeFieldRoot}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoFocus={true}
              renderCell={({ index, symbol, isFocused }) => (
                <View
                  key={index}
                  style={[styles.cell, isFocused ? styles.focusCell : styles.unfocusedCell]}
                  onLayout={getCellOnLayoutHandler(index)}
                >
                  <ThemeText variant="h2" color={theme.colors.text}>
                    {symbol || (isFocused ? <Cursor /> : null)}
                  </ThemeText>
                </View>
              )}
            />

            {!!otpErrorMessage && (
              <ThemeText variant="caption" style={styles.otpErrorText} color="#D92D20">
                {otpErrorMessage}
              </ThemeText>
            )}

            <View style={styles.resendContainer}>
              <ThemeText variant="caption" color={theme.colors.subText} style={styles.resendText}>
                Didn't receive OTP?
              </ThemeText>
              <TouchableOpacity onPress={handleResendOtp} disabled={!canResend || loading}>
                <ThemeText
                  variant="caption"
                  color={canResend ? theme.colors.main : theme.colors.subText}
                  style={styles.link}
                >
                  Resend
                </ThemeText>
              </TouchableOpacity>
              {!canResend && (
                <ThemeText variant="caption" color={theme.colors.subText} style={styles.timerText}>
                  ({resendTimeout}s)
                </ThemeText>
              )}
            </View>

            <TouchableOpacity
              style={[styles.otpButton, loading && { opacity: 0.7 }]}
              onPress={verifyOTP}
              disabled={loading || value.length !== CELL_COUNT}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.background} />
              ) : (
                <ThemeText variant="body" color={theme.colors.background} style={styles.otpText}>
                  Verify OTP
                </ThemeText>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleChangeNumber}>
              <ThemeText
                variant="caption"
                color={theme.colors.main}
                style={[styles.link, { textAlign: 'center' }]}
              >
                Change Number
              </ThemeText>
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

export default OTPScreen;
