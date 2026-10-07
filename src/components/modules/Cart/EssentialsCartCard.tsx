import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { CATALOGUE_GUTTER } from '../../../constants/catalogue';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

interface EssentialsCartCardProps {
  itemCount: number;
  itemTotal: number;
  onPress: () => void;
  style?: ViewStyle;
}

/**
 * Points from a store cart to the Daily Essentials cart, which checks out on its own. Says
 * nothing of the stores behind it: to the customer it is one cart.
 */
const EssentialsCartCard: React.FC<EssentialsCartCardProps> = ({
  itemCount,
  itemTotal,
  onPress,
  style,
}) => {
  const { getColor } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginHorizontal: CATALOGUE_GUTTER,
          marginTop: 12,
          padding: 12,
          borderRadius: 12,
          backgroundColor: getColor('white'),
          borderWidth: 1,
          borderColor: getColor('primary'),
        },
        text: { flex: 1, minWidth: 0 },
        title: { fontSize: 14, fontWeight: '700', color: getColor('text') },
        sub: { fontSize: 12, marginTop: 2, color: getColor('subText') },
        cta: { fontSize: 13, fontWeight: '700', color: getColor('primary') },
      }),
    [getColor]
  );

  if (itemCount === 0) return null;

  const total = Number.isInteger(itemTotal) ? itemTotal : itemTotal.toFixed(2);

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Daily Essentials cart, ${itemCount} items`}
    >
      <MaterialCommunityIcons name="basket-outline" size={26} color={getColor('primary')} />
      <View style={styles.text}>
        <ThemeText style={styles.title}>Daily Essentials cart</ThemeText>
        <ThemeText style={styles.sub} numberOfLines={1}>
          {itemCount} item{itemCount > 1 ? 's' : ''} · ₹{total}
        </ThemeText>
      </View>
      <ThemeText style={styles.cta}>View</ThemeText>
      <MaterialCommunityIcons name="chevron-right" size={20} color={getColor('primary')} />
    </TouchableOpacity>
  );
};

export default EssentialsCartCard;
