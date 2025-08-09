import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useTheme } from '../../theme/ThemeContext';

type LoginButtonProps = {
  onPress?: () => void;
};

const LoginButton: React.FC<LoginButtonProps> = ({ onPress }) => {
  const { getColor } = useTheme();
  const { setSkipLogin } = useAuth();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    // Switch app flow to AuthStack by disabling skip login
    setSkipLogin(false);
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: getColor('secondary') }]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Login"
    >
      <Text style={[styles.text, { color: getColor('background') }]}>Login</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginButton;
