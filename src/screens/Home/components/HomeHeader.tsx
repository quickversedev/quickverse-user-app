import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocationSelector } from '../../../components/modules/Header/LocationSelector';
import { ProfileIcon } from '../../../components/modules/Header/ProfileIcon';

/**
 * Placeholder delivery ETA shown in place of the greeting.
 *
 * TODO: there is no ETA source on this screen today — vendor.preparationTime is
 * per-vendor and only reaches TopStoresNearYou. Replace this with a real value
 * (nearest-vendor prep time, or a server-provided zone ETA) when one exists.
 */
const DELIVERY_ETA_LABEL = '20 mins';

const HomeHeader = () => {
  return (
    <View style={styles.container}>
      <LocationSelector titleOverride={DELIVERY_ETA_LABEL} />
      <ProfileIcon variant="avatar" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    // The status-bar inset is already applied by HomeGradientBand; this is only
    // the extra breathing room below it, so it stays small.
    paddingTop: 4,
    paddingBottom: 8,
  },
});

export default HomeHeader;
