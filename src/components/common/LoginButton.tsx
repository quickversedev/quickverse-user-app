// import React from 'react';
// import { StyleSheet, TouchableOpacity } from 'react-native';
// import { useTheme } from '../../theme/ThemeContext';
// import { ThemeText } from './theme/ThemeText';

// interface LoginButtonProps {
//   onPress: () => void;
//   title?: string;
//   disabled?: boolean;
// }

// const LoginButton: React.FC<LoginButtonProps> = ({
//   onPress,
//   title = 'Login',
//   disabled = false,
// }) => {
//   const { getColor, theme } = useTheme();

//   const styles = StyleSheet.create({
//     button: {
//       backgroundColor: getColor('primary'),
//       borderRadius: theme.borderRadius.md,
//       paddingHorizontal: 24,
//       paddingVertical: 12,
//       alignItems: 'center',
//       opacity: disabled ? 0.5 : 1,
//     },
//     buttonText: {
//       color: getColor('white'),
//     },
//   });

//   return (
//     <TouchableOpacity style={styles.button} onPress={onPress} disabled={disabled}>
//       <ThemeText variant="body" color={getColor('white')} style={styles.buttonText}>
//         {title}
//       </ThemeText>
//     </TouchableOpacity>
//   );
// };

// export default LoginButton;
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
    margin: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginButton;
