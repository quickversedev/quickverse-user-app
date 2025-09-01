import React, { useEffect, useRef } from 'react';
import { useLocation } from '../../hooks/Permissions/useLocation';
import HomeMainScreen from './HomeMainScreen';

const HomeScreen = () => {
  const { isDenied,isBlocked, handleDeniedPermissionModal } = useLocation();
  const modalShownRef = useRef(false);

  useEffect(() => {
    // Ensure the denied permission modal is shown only once per mount
    // even if the component re-renders due to state/prop changes.
    const hasShownRef = modalShownRef.current;
    if ((isDenied || isBlocked) && !hasShownRef) {
      modalShownRef.current = true;
      handleDeniedPermissionModal();
    }
  }, [handleDeniedPermissionModal, isDenied, isBlocked]);
  return <HomeMainScreen />;
};

export default HomeScreen;
