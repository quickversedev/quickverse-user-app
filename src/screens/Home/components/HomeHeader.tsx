import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocationSelector } from '../../../components/modules/Header/LocationSelector';
import { ProfileIcon } from '../../../components/modules/Header/ProfileIcon';

const HomeHeader = () => {
  return (
    <View style={styles.container}>
      <LocationSelector />
      <ProfileIcon />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
});

export default HomeHeader;
