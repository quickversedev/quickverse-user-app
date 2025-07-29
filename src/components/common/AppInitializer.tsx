import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAddress } from '../../hooks';
import TabNavigation from '../../navigation/TabNavigation';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import ErrorState from './ErrorState';

interface AppInitializerProps {
  children?: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const { getColor } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);

  // Store hooks
  const { fetchVendors, loading: vendorLoading, error: vendorError } = useVendorStore();

  const { fetchAddresses, loading: addressLoading, error: addressError } = useAddress();

  // Combined loading state
  const isLoading = vendorLoading || addressLoading;

  // Combined error state
  const error = vendorError || addressError;
  console.log('error', addressError, vendorError);
  const initializeApp = async () => {
    try {
      // Call all necessary initialization APIs in parallel
      await Promise.all([
        // Fetch vendors data
        fetchVendors().catch(error => {
          console.warn('Vendor fetch failed:', error);
          return null; // Allow fallback to mock data
        }),

        fetchAddresses().catch(error => {
          console.warn('Address fetch failed:', error);
          return null; // Allow fallback to empty addresses
        }),
      ]);

      setIsInitialized(true);
    } catch (error: unknown) {
      console.error('App initialization failed:', error);
      // Error will be handled by the store states
    }
  };

  const handleRetry = () => {
    setIsInitialized(false);
    initializeApp();
  };

  useEffect(() => {
    if (!isInitialized) {
      initializeApp();
    }
  }, [isInitialized]);

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: getColor('background') }]}>
        <ActivityIndicator size="large" color={getColor('primary')} />
      </View>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <ErrorState
        onRetry={handleRetry}
        title="App Initialization Failed"
        message="We couldn't load the necessary app data. Please check your internet connection and try again."
      />
    );
  }

  // Show main app if initialization successful
  if (isInitialized) {
    return children || <TabNavigation />;
  }

  // Fallback loading state
  return (
    <View style={[styles.container, { backgroundColor: getColor('background') }]}>
      <ActivityIndicator size="large" color={getColor('primary')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppInitializer;
