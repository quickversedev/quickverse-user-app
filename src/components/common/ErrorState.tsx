// import React from 'react';
// import { StyleSheet, TouchableOpacity, View } from 'react-native';
// import { useTheme } from '../../theme/ThemeContext';
// import { ThemeText } from './theme/ThemeText';

// interface ErrorStateProps {
//   title?: string;
//   message?: string;
//   onRetry?: () => void;
//   retryText?: string;
// }

// const ErrorState: React.FC<ErrorStateProps> = ({
//   title = 'Something went wrong',
//   message = 'Please try again later.',
//   onRetry,
//   retryText = 'Retry',
// }) => {
//   const { getColor, theme } = useTheme();

//   const styles = StyleSheet.create({
//     container: {
//       flex: 1,
//       justifyContent: 'center',
//       alignItems: 'center',
//       paddingHorizontal: 32,
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
//     retryButton: {
//       backgroundColor: getColor('primary'),
//       borderRadius: theme.borderRadius.md,
//       paddingHorizontal: 24,
//       paddingVertical: 12,
//     },
//     retryButtonText: {
//       color: getColor('white'),
//     },
//   });

//   return (
//     <View style={styles.container}>
//       <MaterialCommunityIcons
//         name="alert-circle-outline"
//         size={64}
//         color={getColor('error')}
//         style={styles.icon}
//       />
//       <ThemeText variant="h2" color={getColor('text')} style={styles.title}>
//         {title}
//       </ThemeText>
//       <ThemeText variant="body" color={getColor('subText')} style={styles.message}>
//         {message}
//       </ThemeText>
//       {onRetry && (
//         <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
//           <ThemeText variant="body" color={getColor('white')} style={styles.retryButtonText}>
//             {retryText}
//           </ThemeText>
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// };

// export default ErrorState;
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface ErrorStateProps {
  onRetry: () => void;
  title?: string;
  message?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  onRetry,
  title = 'Error? Yeah, That Just Happened.',
  message = "Hang tight—we're putting the pixels back where they belong.",
}) => {
  const { getColor } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: getColor('background') }]}>
      {/* Spilled Cup Illustration */}
      <View style={styles.illustrationContainer}>
        <View style={styles.cupContainer}>
          <View style={[styles.cup, { borderColor: getColor('primary') }]}>
            <View style={[styles.cupHandle, { borderColor: getColor('primary') }]} />
          </View>
          <View style={[styles.spill, { backgroundColor: getColor('white') }]} />
        </View>
      </View>

      {/* Error Title */}
      <Text style={[styles.title, { color: getColor('white') }]}>{title}</Text>

      {/* Error Message */}
      <Text style={[styles.message, { color: getColor('white') }]}>{message}</Text>

      {/* Retry Button */}
      <TouchableOpacity
        style={[styles.retryButton, { borderColor: getColor('primary') }]}
        onPress={onRetry}
        activeOpacity={0.8}
      >
        <Text style={[styles.retryText, { color: getColor('white') }]}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  illustrationContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  cupContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  cup: {
    width: 80,
    height: 60,
    borderWidth: 4,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    position: 'relative',
    transform: [{ rotate: '15deg' }],
  },
  cupHandle: {
    position: 'absolute',
    right: -12,
    top: 15,
    width: 16,
    height: 30,
    borderWidth: 4,
    borderLeftWidth: 0,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  spill: {
    position: 'absolute',
    bottom: -20,
    left: 10,
    width: 60,
    height: 40,
    borderRadius: 30,
    opacity: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
    opacity: 0.8,
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorState;
