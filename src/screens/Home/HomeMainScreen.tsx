import React, { useState } from 'react';
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
import { FoodContent } from './components/tabs/FoodContent';
import { ForYouContent } from './components/tabs/ForYouContent';
import { GroceryContent } from './components/tabs/GroceryContent';
import { PharmacyContent } from './components/tabs/PharmacyContent';

const HEADER_HEIGHT = 280; // Approximate total header height

const HomeMainScreen = () => {
  const { selectedTab } = useTab();
  const { theme } = useTheme();
  const { translateY, opacity, handleScroll } = useHeaderAnimation();
  const { vendors, loading: vendorLoading } = useVendorStore();
  const { selectedAddress } = useAuth();
  const [showAddressModal, setShowAddressModal] = useState(false);

  const handleChangeAddress = () => {
    setShowAddressModal(true);
  };

  const handleAddressSelect = (_address: unknown) => {
    setShowAddressModal(false);
    // The address will be set through the AuthProvider
  };

  const renderContent = () => {
    // Show zero state if no vendors available and not loading
    if (!vendorLoading && vendors.length === 0) {
      const addressText =
        selectedAddress?.addressLine1 || selectedAddress?.city || 'Current Location';
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

    const contentProps = {
      onScroll: handleScroll,
      scrollEventThrottle: 16,
      contentContainerStyle: styles.scrollContent,
      showsVerticalScrollIndicator: false,
    };
    switch (selectedTab || 'ForYou') {
      case 'food':
        return <FoodContent {...contentProps} />;
      case 'Grocery':
        return <GroceryContent {...contentProps} />;
      case 'Pharmacy':
        return <PharmacyContent {...contentProps} />;
      case 'ForYou':
        return <ForYouContent {...contentProps} />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header translateY={translateY} hiddenSectionsOpacity={opacity} />
        <View style={styles.content}>{renderContent()}</View>
      </View>
      <FloatingCartsStack />

      <AddressSelectionModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelect={handleAddressSelect}
        selectedAddress={selectedAddress}
      />
    </SafeAreaView>
  );
};

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
});

export default HomeMainScreen;
