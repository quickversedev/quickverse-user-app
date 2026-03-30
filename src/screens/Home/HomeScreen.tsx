import React, { useCallback, useEffect, useRef } from 'react';
import { BackHandler, ToastAndroid } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocation } from '../../hooks/Permissions/useLocation';
import HomeMainScreen_2 from './HomeMainScreen_2';

const HomeScreen = () => {
  const { isDenied, isBlocked, handleDeniedPermissionModal } = useLocation();
  const modalShownRef = useRef(false);
  const lastBackPressRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPressRef.current = now;
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, []),
  );

  useEffect(() => {
    // Ensure the denied permission modal is shown only once per mount
    // even if the component re-renders due to state/prop changes.
    const hasShownRef = modalShownRef.current;
    if ((isDenied || isBlocked) && !hasShownRef) {
      modalShownRef.current = true;
      handleDeniedPermissionModal();
    }
  }, [handleDeniedPermissionModal, isDenied, isBlocked]);
  return <HomeMainScreen_2 />;
};

export default HomeScreen;
