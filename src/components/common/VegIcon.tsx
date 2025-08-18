import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

interface VegIconProps {
  veg: boolean;
  size?: 'xs' | 'small' | 'regular';
}

// eslint-disable-next-line react/prop-types
const VegIcon: React.FC<VegIconProps> = memo(({ veg, size = 'regular' }) => {
  const styles = StyleSheet.create({
    container: {
      width: size === 'xs' ? 12 : 14,
      height: size === 'xs' ? 12 : 14,
      borderWidth: 1,
      borderColor: veg ? '#4CAF50' : '#FF6B6B',
      backgroundColor: 'transparent',
      marginRight: size === 'xs' ? 4 : 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    vegCircle: {
      width: size === 'xs' ? 6 : 8,
      height: size === 'xs' ? 6 : 8,
      borderRadius: size === 'xs' ? 3 : 4,
      backgroundColor: '#4CAF50',
    },
    nonVegTriangle: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: size === 'xs' ? 3 : 4,
      borderRightWidth: size === 'xs' ? 3 : 4,
      borderBottomWidth: size === 'xs' ? 6 : 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: '#FF6B6B',
    },
  });

  return (
    <View style={styles.container}>
      {veg ? <View style={styles.vegCircle} /> : <View style={styles.nonVegTriangle} />}
    </View>
  );
});

VegIcon.displayName = 'VegIcon';

export default VegIcon;
