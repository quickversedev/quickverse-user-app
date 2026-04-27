import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../theme/ThemeContext';

interface NoInternetOverlayProps {
  visible: boolean;
  onRetry: () => Promise<void> | void;
}

const NoInternetOverlay: React.FC<NoInternetOverlayProps> = ({ visible, onRetry }) => {
  const { getColor, theme } = useTheme();
  const [retrying, setRetrying] = useState(false);

  if (!visible) return null;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View style={[styles.overlay, { backgroundColor: getColor('background') }]}>
      <MaterialCommunityIcons name="wifi-off" size={72} color={getColor('subText')} />
      <Text style={[styles.title, { color: getColor('text') }]}>No Internet Connection</Text>
      <Text style={[styles.message, { color: getColor('subText') }]}>
        Please check your connection and try again.
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: getColor('primary') }]}
        onPress={handleRetry}
        activeOpacity={0.8}
        disabled={retrying}
      >
        {retrying ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={[styles.retryText, { color: '#fff', fontSize: theme.typography.body }]}>
            Try Again
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 999,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  retryButton: {
    borderRadius: 10,
    paddingHorizontal: 40,
    paddingVertical: 14,
    minWidth: 160,
    alignItems: 'center',
  },
  retryText: {
    fontWeight: '600',
  },
});

export default NoInternetOverlay;
