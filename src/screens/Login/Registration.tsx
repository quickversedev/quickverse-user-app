import DateTimePicker from '@react-native-community/datetimepicker';
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
import { Images } from '../../assets';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { useAuth } from '../../contexts/login/AuthProvider';
import { LoginStackParamList } from '../../navigation/LoginNavigation';
import { useTheme } from '../../theme/ThemeContext';

const { height } = Dimensions.get('window');
type LoginScreenNavigationProp = StackNavigationProp<LoginStackParamList, 'LoginScreen'>;

const Registration: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    gender: '',
    dateOfBirth: '',
  });

  const auth = useAuth();
  const { theme } = useTheme();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dateOfBirth;

    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'set' || event.type === 'dismissed') {
      setDateOfBirth(currentDate);
      setErrors(prev => ({ ...prev, dateOfBirth: '' }));
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const validateFields = () => {
    let valid = true;
    const newErrors = {
      fullName: '',
      email: '',
      gender: '',
      dateOfBirth: '',
    };

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      valid = false;
    } else if (fullName.length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters';
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }

    if (!gender) {
      newErrors.gender = 'Please select your gender';
      valid = false;
    }

    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
      valid = false;
    } else {
      const dateError = validateDate(dateOfBirth);
      if (dateError) {
        newErrors.dateOfBirth = dateError;
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = () => {
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    if (fullName && email && gender && dateOfBirth) {
      try {
        auth.signUp(fullName, gender, email, dateOfBirth.toDateString());
      } catch (error) {
        // Handle error appropriately
        console.error('Registration error:', error);
        Alert.alert('Error', 'Failed to create account. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const validateDate = (date: Date) => {
    const age = calculateAge(date);
    if (age < 13) {
      return 'You must be at least 13 years old';
    }
    if (age > 120) {
      return 'Please enter a valid date of birth';
    }
    return '';
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
    topLogo: {
      width: 100,
      height: 100,
      resizeMode: 'contain',
    },
    card: {
      width: '90%',
      minHeight: height * 0.6,
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
    inputFocused: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    errorText: {
      marginTop: 4,
    },
    datePickerButton: {
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateText: {
      flex: 1,
    },
    genderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    genderButton: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 10,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    genderButtonSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    registerButton: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 8,
      paddingVertical: 14,
      marginTop: 24,
    },
    registerText: {
      textAlign: 'center',
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
              <ImageBackground
                source={Images.bg1}
                style={styles.topBackground}
                resizeMode="cover"
              />
              <View style={styles.logoContainer}>
                <Image style={styles.topLogo} source={Images.logoQv} />
              </View>

              <View style={styles.card}>
                <ThemeText variant="h2" style={styles.title}>
                  Create Account
                </ThemeText>
                <ThemeText variant="subtitle" color={theme.colors.subText} style={styles.subtitle}>
                  Fill in your details to create an account
                </ThemeText>

                <View style={styles.inputContainer}>
                  <ThemeText variant="caption" color={theme.colors.subText} style={styles.label}>
                    Full Name
                  </ThemeText>
                  <TextInput
                    value={fullName}
                    onChangeText={text => {
                      setFullName(text);
                      setErrors(prev => ({ ...prev, fullName: '' }));
                    }}
                    placeholder="Enter your full name"
                    placeholderTextColor={theme.colors.placeholder}
                    style={[
                      styles.input,
                      errors.fullName ? { borderColor: theme.colors.error } : null,
                    ]}
                  />
                  {errors.fullName ? (
                    <ThemeText
                      variant="caption"
                      color={theme.colors.error}
                      style={styles.errorText}
                    >
                      {errors.fullName}
                    </ThemeText>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <ThemeText variant="caption" color={theme.colors.subText} style={styles.label}>
                    Email
                  </ThemeText>
                  <TextInput
                    value={email}
                    onChangeText={text => {
                      setEmail(text);
                      setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.colors.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[
                      styles.input,
                      errors.email ? { borderColor: theme.colors.error } : null,
                    ]}
                  />
                  {errors.email ? (
                    <ThemeText
                      variant="caption"
                      color={theme.colors.error}
                      style={styles.errorText}
                    >
                      {errors.email}
                    </ThemeText>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <ThemeText variant="caption" color={theme.colors.subText} style={styles.label}>
                    Gender
                  </ThemeText>
                  <View style={styles.genderContainer}>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        gender === 'Male' && styles.genderButtonSelected,
                      ]}
                      onPress={() => {
                        setGender('Male');
                        setErrors(prev => ({ ...prev, gender: '' }));
                      }}
                    >
                      <ThemeText
                        variant="body"
                        color={gender === 'Male' ? theme.colors.background : theme.colors.text}
                      >
                        Male
                      </ThemeText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        gender === 'Female' && styles.genderButtonSelected,
                      ]}
                      onPress={() => {
                        setGender('Female');
                        setErrors(prev => ({ ...prev, gender: '' }));
                      }}
                    >
                      <ThemeText
                        variant="body"
                        color={gender === 'Female' ? theme.colors.background : theme.colors.text}
                      >
                        Female
                      </ThemeText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        gender === 'Other' && styles.genderButtonSelected,
                      ]}
                      onPress={() => {
                        setGender('Other');
                        setErrors(prev => ({ ...prev, gender: '' }));
                      }}
                    >
                      <ThemeText
                        variant="body"
                        color={gender === 'Other' ? theme.colors.background : theme.colors.text}
                      >
                        Other
                      </ThemeText>
                    </TouchableOpacity>
                  </View>
                  {errors.gender ? (
                    <ThemeText
                      variant="caption"
                      color={theme.colors.error}
                      style={styles.errorText}
                    >
                      {errors.gender}
                    </ThemeText>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <ThemeText variant="caption" color={theme.colors.subText} style={styles.label}>
                    Date of Birth
                  </ThemeText>
                  <TouchableOpacity
                    style={[
                      styles.datePickerButton,
                      errors.dateOfBirth ? { borderColor: theme.colors.error } : null,
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <ThemeText
                      variant="body"
                      color={dateOfBirth ? theme.colors.text : theme.colors.placeholder}
                      style={styles.dateText}
                    >
                      {dateOfBirth ? formatDate(dateOfBirth) : 'Select your date of birth'}
                    </ThemeText>
                  </TouchableOpacity>
                  {errors.dateOfBirth ? (
                    <ThemeText
                      variant="caption"
                      color={theme.colors.error}
                      style={styles.errorText}
                    >
                      {errors.dateOfBirth}
                    </ThemeText>
                  ) : null}
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={dateOfBirth || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}

                <TouchableOpacity
                  style={[styles.registerButton, loading && { opacity: 0.7 }]}
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
                      Create Account
                    </ThemeText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Registration;
