import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import FloatingCartsStack from '../../components/common/Cart/FloatingCartsStack';
import VendorLocationEmptyState from '../../components/common/VendorLocationEmptyState';
import { AddressSelectionModal } from '../../components/modules/Header/AddressSelectionModal';
import { Header } from '../../components/modules/Header/Header';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useTab } from '../../contexts/TabContext';
import { useHeaderAnimation } from '../../hooks/useHeaderAnimation';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { Address } from '../../types/address';
import { AppNavigationProp } from '../../types/navigation';
import { FoodContent } from './components/tabs/FoodContent';
import { ForYouContent } from './components/tabs/ForYouContent';
import { GroceryContent } from './components/tabs/GroceryContent';
import { PharmacyContent } from './components/tabs/PharmacyContent';

const HEADER_HEIGHT = 280; // Approximate total header height

const HomeMainScreen = React.memo(() => {
  const { selectedTab } = useTab();
  const { theme } = useTheme();
  const { translateY, opacity, handleScroll } = useHeaderAnimation();
  const { vendors, loading: vendorLoading } = useVendorStore();
  const { selectedAddress } = useAuth();

  const { setSelectedAddress, permissionDataInAuth } = useAuth();
  const { authData } = useAuth();
  const loggedIn = useMemo(() => Boolean(authData?.jwt), [authData?.jwt]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const _navigation = useNavigation<AppNavigationProp>();

  const handleChangeAddress = useCallback(() => {
    setShowAddressModal(true);
  }, []);

  const handleAddressSelect = useCallback(
    (address: Address) => {
      setSelectedAddress(address);
      setShowAddressModal(false);
      // The address will be set through the AuthProvider
    },
    [setSelectedAddress]
  );

  const handleCloseAddressModal = useCallback(() => {
    setShowAddressModal(false);
  }, []);

  // Check if we need to show the compulsory address modal
  useEffect(() => {
    const shouldShowCompulsoryModal = permissionDataInAuth?.permission !== 'granted'; // Selected address is not a saved address

    if (shouldShowCompulsoryModal) {
      setShowAddressModal(true);
    }
  }, [permissionDataInAuth?.permission]);

  // Memoize content props to prevent unnecessary re-renders
  const contentProps = useMemo(
    () => ({
      onScroll: handleScroll,
      scrollEventThrottle: 16,
      contentContainerStyle: styles.scrollContent,
      showsVerticalScrollIndicator: false,
    }),
    [handleScroll]
  );

  // Memoize address text
  const addressText = useMemo(
    () => selectedAddress?.addressLine1 || selectedAddress?.city || 'Current Location',
    [selectedAddress?.addressLine1, selectedAddress?.city]
  );

  // Memoize needCompulsoryAddress calculation
  const needCompulsoryAddress = useMemo(
    () =>
      permissionDataInAuth?.permission !== 'granted' ||
      (selectedAddress && selectedAddress.isSavedAddress === false) ||
      false,
    [permissionDataInAuth?.permission, selectedAddress]
  );

  const renderContent = useCallback(() => {
    // Show zero state if no vendors available and not loading
    if (!vendorLoading && vendors.length === 0) {
      return (
        <View
          style={[styles.safeArea, { backgroundColor: theme.colors.background, marginTop: 100 }]}
        >
          <VendorLocationEmptyState
            onChangeAddress={handleChangeAddress}
            selectedAddress={addressText}
          />
        </View>
      );
    }

    switch (selectedTab || 'ForYou') {
      case 'food':
        return <FoodContent {...contentProps} />;
      case 'Grocery':
        return <GroceryContent {...contentProps} />;
      case 'Pharmacy':
        return <PharmacyContent {...contentProps} />;
      case 'ForYou':
        return <ForYouContent {...contentProps} />;
      default:
        return <ForYouContent {...contentProps} />;
    }
  }, [
    vendorLoading,
    vendors.length,
    theme.colors.background,
    handleChangeAddress,
    addressText,
    selectedTab,
    contentProps,
  ]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header translateY={translateY} hiddenSectionsOpacity={opacity} />
        <View style={styles.content}>{renderContent()}</View>
      </View>

      <FloatingCartsStack />

      {loggedIn && (
        <AddressSelectionModal
          visible={showAddressModal}
          onClose={handleCloseAddressModal}
          onAddressSelect={handleAddressSelect}
          selectedAddress={selectedAddress}
          needCompulsoryAddress={needCompulsoryAddress}
        />
      )}
    </SafeAreaView>
  );
});

HomeMainScreen.displayName = 'HomeMainScreen';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT,
    paddingBottom: 160, // Tab bar (60px) + floating cart stack (56px) + extra space for comfort
  },
  demoButtonWrapper: {
    position: 'absolute',
    right: 16,
    bottom: 220, // keep above FloatingCartsStack
  },
  demoButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoButtonText: {
    fontWeight: '600',
  },
});

export default HomeMainScreen;
