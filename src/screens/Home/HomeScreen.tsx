import React from 'react';
import { useAddress } from '../../hooks';
import { useLocation } from '../../hooks/Permissions/useLocation';
import useVendorStore from '../../store/vendorStore';
import HomeMainScreen from './HomeMainScreen';

const HomeScreen = () => {
  const { vendors } = useVendorStore();
  const { addresses } = useAddress();
  const { location } = useLocation();
  console.log('moanin screen', vendors, addresses, location);
  return <HomeMainScreen />;
};

export default HomeScreen;
