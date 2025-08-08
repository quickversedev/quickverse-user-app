import React, { useEffect } from 'react';
import { useLocation } from '../../hooks/Permissions/useLocation';
import HomeMainScreen from './HomeMainScreen';

const HomeScreen = () => {
  const { isDenied, handleDeniedPermissionModal, getCurrentLocation } = useLocation();

  useEffect(() => {
    getCurrentLocation();
  }, []);
  useEffect(() => {
    if (isDenied) {
      handleDeniedPermissionModal();
    }
  }, [handleDeniedPermissionModal, isDenied]);
  return <HomeMainScreen />;
};

export default HomeScreen;
