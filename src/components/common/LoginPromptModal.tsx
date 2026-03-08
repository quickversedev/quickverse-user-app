// import React, { useEffect, useRef } from 'react';
// import { Animated, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
// import { useTheme } from '../../theme/ThemeContext';
// import { ThemeText } from './theme/ThemeText';

// interface LoginPromptModalProps {
//   visible: boolean;
//   onClose: () => void;
//   title?: string;
//   message?: string;
// }

// const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
//   visible,
//   onClose,
//   title = 'Login Required',
//   message = 'Please log in to continue.',
// }) => {
//   const { getColor, theme } = useTheme();
//   const wobble = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     if (visible) {
//       wobble.setValue(0);
//       Animated.sequence([
//         Animated.timing(wobble, { toValue: 1, duration: 70, useNativeDriver: true }),
//         Animated.timing(wobble, { toValue: -1, duration: 70, useNativeDriver: true }),
//         Animated.timing(wobble, { toValue: 0.6, duration: 70, useNativeDriver: true }),
//         Animated.timing(wobble, { toValue: -0.6, duration: 70, useNativeDriver: true }),
//         Animated.spring(wobble, {
//           toValue: 0,
//           friction: 4,
//           tension: 80,
//           useNativeDriver: true,
//         }),
//       ]).start();
//     }
//   }, [visible, wobble]);

//   const rotate = wobble.interpolate({
//     inputRange: [-1, 0, 1],
//     outputRange: ['-2deg', '0deg', '2deg'],
//   });
//   const scale = wobble.interpolate({
//     inputRange: [-1, 0, 1],
//     outputRange: [0.98, 1, 1.02],
//   });

//   const styles = StyleSheet.create({
//     modalOverlay: {
//       flex: 1,
//       backgroundColor: 'rgba(0, 0, 0, 0.5)',
//       justifyContent: 'center',
//       alignItems: 'center',
//     },
//     modalContent: {
//       backgroundColor: getColor('card'),
//       borderRadius: theme.borderRadius.lg,
//       padding: 24,
//       marginHorizontal: 32,
//       alignItems: 'center',
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.25,
//       shadowRadius: 8,
//       elevation: 8,
//     },
//     icon: {
//       marginBottom: 16,
//     },
//     title: {
//       color: getColor('text'),
//       textAlign: 'center',
//       marginBottom: 8,
//     },
//     message: {
//       color: getColor('subText'),
//       textAlign: 'center',
//       marginBottom: 24,
//     },
//     closeButton: {
//       backgroundColor: getColor('primary'),
//       borderRadius: theme.borderRadius.md,
//       paddingHorizontal: 24,
//       paddingVertical: 12,
//     },
//     closeButtonText: {
//       color: getColor('white'),
//     },
//   });

//   return (
//     <Modal visible={visible} transparent animationType="fade">
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContent}>
//           <MaterialCommunityIcons
//             name="account-lock-outline"
//             size={48}
//             color={getColor('primary')}
//             style={styles.icon}
//           />
//           <ThemeText variant="h2" color={getColor('text')} style={styles.title}>
//             {title}
//           </ThemeText>
//           <ThemeText variant="body" color={getColor('subText')} style={styles.message}>
//             {message}
//           </ThemeText>
//           <TouchableOpacity style={styles.closeButton} onPress={onClose}>
//             <ThemeText variant="body" color={getColor('white')} style={styles.closeButtonText}>
//               OK
//             </ThemeText>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// export default LoginPromptModal;
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import LoginButton from './LoginButton';

type LoginPromptModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
};

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  visible,
  onClose,
  title = 'Login required',
  message = 'Please log in to continue.',
}) => {
  const { getColor, getTypography, theme } = useTheme();
  const wobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      wobble.setValue(0);
      Animated.sequence([
        Animated.timing(wobble, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: -1, duration: 70, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: 0.6, duration: 70, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: -0.6, duration: 70, useNativeDriver: true }),
        Animated.spring(wobble, {
          toValue: 0,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, wobble]);

  const rotate = wobble.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-2deg', '0deg', '2deg'],
  });
  const scale = wobble.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.98, 1, 1.02],
  });

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      borderRadius: theme.borderRadius.md,
      padding: 16,
      backgroundColor: getColor('card'),
    },
    titleText: {
      fontSize: getTypography('h2'),
      fontWeight: '600',
      marginBottom: 8,
      textAlign: 'center',
      color: getColor('text'),
    },
    messageText: {
      fontSize: getTypography('body'),
      textAlign: 'center',
      marginBottom: 12,
      color: getColor('subText'),
    },
    cancelBtn: {
      marginTop: 8,
      alignSelf: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    cancelText: {
      fontSize: getTypography('body'),
      fontWeight: '600',
      color: getColor('primary'),
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale }, { rotate }] }]}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.messageText}>{message}</Text>
          <LoginButton />
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default LoginPromptModal;
