import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { Images } from '../../assets';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { useAuth } from '../../contexts/login/AuthProvider';
import { LoginStackParamList } from '../../navigation/LoginNavigation';
import { useTheme } from '../../theme/ThemeContext';

const { height } = Dimensions.get('window');
type LoginScreenNavigationProp = StackNavigationProp<LoginStackParamList, 'LoginScreen'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [callingCode, setCallingCode] = useState('91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const onSelect = (country: Country) => {
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

  const handleLogin = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const verificationId = await auth.sendOtp(phoneNumber);

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
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 6,
      borderWidth: 1,
      borderColor: theme.colors.borderHighlight,
      justifyContent: 'space-between',
    },
    title: {
      fontWeight: 'bold',
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
      fontWeight: 'bold',
    },
  });

  const isButtonDisabled = loading || !phoneNumber || phoneNumber.length !== 10;

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <CountryPicker
              countryCode={countryCode}
              withFilter
              withFlag
              withCallingCode
              withEmoji
              onSelect={onSelect}
              containerButtonStyle={styles.countryPicker}
            />
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

          <TouchableOpacity
            style={[
              styles.otpButton,
              isButtonDisabled && styles.otpButtonDisabled,
              loading && { opacity: 0.7 },
            ]}
            onPress={handleLogin}
            disabled={isButtonDisabled}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : (
              <ThemeText
                variant="body"
                color={isButtonDisabled ? theme.colors.text : theme.colors.background}
                style={styles.otpText}
              >
                Get OTP
              </ThemeText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
