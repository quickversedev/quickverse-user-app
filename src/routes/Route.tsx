import React from 'react';
import { Text } from 'react-native';
import { AppBootstrap } from '../components/common';
import ForceUpdateChecker from '../components/common/ForceUpdate';
import { useAuth } from '../contexts/login/AuthProvider';
import { AuthStack } from './AuthStack';

export const Route = () => {
  const { authData, loading, skipUserLogin } = useAuth();

  if (loading) {
    return <Text>Loading</Text>;
  }

  return (
    <ForceUpdateChecker>
      {authData || skipUserLogin ? <AppBootstrap /> : <AuthStack />}
    </ForceUpdateChecker>
  );
};
