import React from 'react';
import { StatusBar, Text } from 'react-native';

import AppBootstrap from '../components/common/AppBootstrap';
import ForceUpdateChecker from '../components/common/ForceUpdate';
import { useAuth } from '../contexts/login/AuthProvider';
import { useTheme } from '../theme/ThemeContext';
import { AuthStack } from './AuthStack';

// Helper to determine if a color is dark
const isColorDark = (hexColor: string): boolean => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

export const Route = () => {
  const { authData, loading, skipUserLogin } = useAuth();
  const { getColor } = useTheme();

  const backgroundColor = getColor('background');
  const isDarkBackground = isColorDark(backgroundColor);

  if (loading) {
    return null;
  }

  return (
    <>
      {/*
        translucent + transparent: with edgeToEdgeEnabled=true the system bar is always
        transparent and `backgroundColor` is ignored, so setting it here only created a
        second, conflicting regime. Screens that need their own bar treatment (Home)
        render their own <StatusBar/> later in the tree, which wins.
      */}
      <StatusBar
        barStyle={isDarkBackground ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <ForceUpdateChecker>
        {authData || skipUserLogin ? <AppBootstrap /> : <AuthStack />}
      </ForceUpdateChecker>
    </>
  );
};
