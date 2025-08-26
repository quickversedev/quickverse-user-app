import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeText } from './theme/ThemeText';

interface LoginButtonProps {
  onPress: () => void;
  title?: string;
  disabled?: boolean;
}

const LoginButton: React.FC<LoginButtonProps> = ({
  onPress,
  title = 'Login',
  disabled = false,
}) => {
  const { getColor, theme } = useTheme();

  const styles = StyleSheet.create({
    button: {
      backgroundColor: getColor('primary'),
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 24,
      paddingVertical: 12,
      alignItems: 'center',
      opacity: disabled ? 0.5 : 1,
    },
    buttonText: {
      color: getColor('white'),
    },
  });

  return (
    <TouchableOpacity style={styles.button} onPress={onPress} disabled={disabled}>
      <ThemeText variant="body" color={getColor('white')} style={styles.buttonText}>
        {title}
      </ThemeText>
    </TouchableOpacity>
  );
};

export default LoginButton;
