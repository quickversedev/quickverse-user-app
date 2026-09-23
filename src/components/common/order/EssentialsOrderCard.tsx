import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React, { useMemo } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { displayStatusOf, EssentialsOrder } from '../../../services/essentialsOrderService';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../theme/ThemeText';

const STATUS: Record<string, { label: string; color: string }> = {
  PLACING: { label: 'PLACING', color: '#42A5F5' },
  CONFIRMED: { label: 'PLACED', color: '#2196F3' },
  PARTIALLY_CONFIRMED: { label: 'PARTLY PLACED', color: '#FFA726' },
  AWAITING_STORES: { label: 'WAITING FOR STORES', color: '#42A5F5' },
  ACCEPTED: { label: 'CONFIRMED', color: '#2196F3' },
  PARTIALLY_ACCEPTED: { label: 'CONFIRMED · UPDATED', color: '#FFA726' },
  FAILED: { label: 'NOT PLACED', color: '#EF5350' },
  CANCELLED: { label: 'CANCELLED', color: '#EF5350' },
  DELIVERED: { label: 'DELIVERED', color: '#66BB6A' },
};

const formatDate = (millis: string) => {
  const date = new Date(Number(millis));
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
};

/** One Daily Essentials order in order history — one card however many kiranas it spans. */
const EssentialsOrderCard: React.FC<{ order: EssentialsOrder; onPress: () => void }> = ({
  order,
  onPress,
}) => {
  const { getColor } = useTheme();
  const status = STATUS[displayStatusOf(order)] ?? STATUS.PLACING;
  const images = order.shops
    .flatMap(s => s.items)
    .map(i => i.imageUrl)
    .filter((url): url is string => !!url && url.startsWith('http'))
    .slice(0, 2);
  const stores = order.shops.map(s => s.shopName).filter(Boolean);
  const amount = Number.isInteger(order.amountToPay)
    ? order.amountToPay
    : order.amountToPay.toFixed(2);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: 'row',
          gap: 12,
          padding: 12,
          marginBottom: 12,
          borderRadius: 16,
          backgroundColor: getColor('card'),
        },
        thumbs: {
          width: 64,
          height: 64,
          borderRadius: 12,
          overflow: 'hidden',
          flexDirection: 'row',
          backgroundColor: getColor('overlay'),
          alignItems: 'center',
          justifyContent: 'center',
        },
        thumb: { flex: 1, height: '100%' },
        body: { flex: 1, minWidth: 0 },
        titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        title: { flex: 1, fontSize: 14, fontWeight: '700', color: getColor('text') },
        amount: { fontSize: 15, fontWeight: '800', color: getColor('text') },
        sub: { fontSize: 12, marginTop: 3, color: getColor('subText') },
        badge: {
          alignSelf: 'flex-start',
          marginTop: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          backgroundColor: status.color,
        },
        badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
      }),
    [getColor, status.color]
  );

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.thumbs}>
        {images.length > 0 ? (
          images.map(url => (
            <Image key={url} source={{ uri: url }} style={styles.thumb} resizeMode="contain" />
          ))
        ) : (
          <MaterialCommunityIcons name="basket-outline" size={28} color={getColor('primary')} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="basket-outline" size={16} color={getColor('primary')} />
          <ThemeText style={styles.title} numberOfLines={1}>
            Daily Essentials
          </ThemeText>
          <ThemeText style={styles.amount}>₹{amount}</ThemeText>
        </View>
        <ThemeText style={styles.sub} numberOfLines={1}>
          {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} · {stores.join(', ')}
        </ThemeText>
        <ThemeText style={styles.sub}>{formatDate(order.createdAt)}</ThemeText>
        <View style={styles.badge}>
          <ThemeText style={styles.badgeText}>{status.label}</ThemeText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default EssentialsOrderCard;
