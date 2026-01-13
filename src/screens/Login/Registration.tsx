import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Icons, Images } from '../../assets';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { useAuth } from '../../contexts/login/AuthProvider';
import { LoginStackParamList } from '../../navigation/LoginNavigation';
import { useTheme } from '../../theme/ThemeContext';

const { height } = Dimensions.get('window');
type LoginScreenNavigationProp = StackNavigationProp<LoginStackParamList, 'LoginScreen'>;

interface RegistrationProps {
  onRegistrationSuccess?: () => Promise<void>;
}

const Registration: React.FC<RegistrationProps> = ({ onRegistrationSuccess }) => {
  const _navigation = useNavigation<LoginScreenNavigationProp>();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const auth = useAuth();
  const { theme } = useTheme();

  const validateFields = () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (fullName.trim().length < 3) {
      setError('Full name must be at least 3 characters');
      return false;
    }
    setError('');
    return true;
  };

  const handleRegister = async () => {
    if (!validateFields()) {
      return;
    }

    setLoading(true);

    try {
      await auth.signUp(fullName.trim());
      if (onRegistrationSuccess) {
        await onRegistrationSuccess();
      }
    } catch (err: unknown) {
      const apiError = err as { status?: number; message?: string; code?: string };
      let title = 'Registration Failed';
      let message = 'Failed to create account. Please try again.';

      if (apiError?.code === 'ERR_NETWORK' || apiError?.status === 0) {
        title = 'Network Error';
        message = 'Please check your internet connection and try again.';
      } else if (apiError?.status === 400) {
        title = 'Invalid Information';
        message = apiError.message || 'Please check your information and try again.';
      } else if (apiError?.status === 409) {
        title = 'Account Already Exists';
        message = 'An account with this information already exists.';
      } else if (apiError?.status === 422) {
        title = 'Invalid Data';
        message = apiError.message || 'Please check your information and try again.';
      } else if (apiError?.status && apiError.status >= 500) {
        title = 'Server Error';
        message = 'Our servers are experiencing issues. Please try again later.';
      } else if (apiError?.message) {
        message = apiError.message;
      }

      Alert.alert(title, message, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    auth.resetAuthState();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingBottom: 20,
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
    },
    logoContainer: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 80,
      alignItems: 'center',
      width: '100%',
    },
    backButton: {
      position: 'absolute',
      left: 16,
      top: Platform.OS === 'ios' ? -10 : -30,
      padding: 8,
      zIndex: 10,
    },
    backIcon: {
      width: 24,
      height: 24,
      resizeMode: 'contain',
      tintColor: theme.colors.text,
    },
    topLogo: {
      width: 100,
      height: 100,
      resizeMode: 'contain',
    },
    card: {
      width: '90%',
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
      marginBottom: 20,
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
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontFamily: theme.typography.fontFamily,
    },
    errorText: {
      marginTop: 4,
    },
    registerButton: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 8,
      paddingVertical: 14,
      marginTop: 24,
    },
    registerButtonLoading: {
      opacity: 0.7,
    },
    registerText: {
      textAlign: 'center',
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
              <ImageBackground
                source={Images.bg1}
                style={styles.topBackground}
                resizeMode="cover"
              />
              <View style={styles.logoContainer}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Image source={Icons.backArrow} style={styles.backIcon} />
                </TouchableOpacity>
                <Image style={styles.topLogo} source={Images.logoQv} />
              </View>

              <View style={styles.card}>
                <ThemeText variant="h2" style={styles.title}>
                  What's your name?
                </ThemeText>
                <ThemeText variant="subtitle" color={theme.colors.subText} style={styles.subtitle}>
                  Let us know what to call you
                </ThemeText>

                <View style={styles.inputContainer}>
                  <ThemeText variant="caption" color={theme.colors.subText} style={styles.label}>
                    Full Name
                  </ThemeText>
                  <TextInput
                    value={fullName}
                    onChangeText={text => {
                      setFullName(text);
                      setError('');
                    }}
                    placeholder="Enter your full name"
                    placeholderTextColor={theme.colors.placeholder}
                    autoFocus
                    style={[
                      styles.input,
                      error ? { borderColor: theme.colors.error } : null,
                    ]}
                  />
                  {error ? (
                    <ThemeText
                      variant="caption"
                      color={theme.colors.error}
                      style={styles.errorText}
                    >
                      {error}
                    </ThemeText>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[styles.registerButton, loading && styles.registerButtonLoading]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.background} />
                  ) : (
                    <ThemeText
                      variant="body"
                      color={theme.colors.background}
                      style={styles.registerText}
                    >
                      Continue
                    </ThemeText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default Registration;
