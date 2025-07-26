import React from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import FloatingCartsStack from '../../components/common/Cart/FloatingCartsStack';
import { Header } from '../../components/modules/Header/Header';
import { useTab } from '../../contexts/TabContext';
import { useHeaderAnimation } from '../../hooks/useHeaderAnimation';
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

  const renderContent = () => {
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
      default:
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
    paddingBottom: 20,
  },
});

export default HomeMainScreen;
