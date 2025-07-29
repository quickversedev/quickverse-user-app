import React, { useEffect } from 'react';
import { useAddress } from '../../hooks';
import { useLocation } from '../../hooks/Permissions/useLocation';
import useVendorStore from '../../store/vendorStore';
import HomeMainScreen from './HomeMainScreen';

const HomeScreen = () => {
  const { vendors } = useVendorStore();
  const { addresses } = useAddress();
  const { location, isDenied, handleDeniedPermissionModal, getCurrentLocation } = useLocation();
  console.log('moanin screen', vendors, addresses, location);
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
