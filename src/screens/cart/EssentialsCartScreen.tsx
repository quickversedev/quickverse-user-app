import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageSourcePropType,
  Platform,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginPromptModal from '../../components/common/LoginPromptModal';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { CartHeader } from '../../components/modules/Cart';
import QuantitySelector from '../../components/modules/Product/QuantitySelector';
import { CATALOGUE_ACCENT, CATALOGUE_GUTTER } from '../../constants/catalogue';
import { useAuth } from '../../contexts/login/AuthProvider';
import { RootStackParamList } from '../../routes/AppStack';
import useEssentialsCartStore, {
  EssentialsDisplayLine,
  useEssentialsLines,
  useEssentialsSummary,
} from '../../store/cart/essentialsCartStore';
import { useTheme } from '../../theme/ThemeContext';

/**
 * The Daily Essentials cart: everything added from the Daily Essentials section, across
 * kiranas, as one order.
 *
 * A screen of its own rather than a mode of CartScreen. CartScreen is built around one
 * SmartBiz cart — one shop's payment methods, coupons, distance and open hours — and the
 * Essentials cart has none of those per shop: it is billed once, by the server, for the
 * whole order. Lines are grouped under their kirana so the customer can see where each
 * item comes from, but it is still one cart and one checkout.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PLACEHOLDER = require('../../assets/images/food.png');

const imageSourceFor = (image?: string | null): ImageSourcePropType => {
  const cleanUrl = typeof image === 'string' ? image.trim().replace(/^@+/, '') : '';
  return cleanUrl.startsWith('http') ? { uri: cleanUrl } : PLACEHOLDER;
};

const UNAVAILABLE_LABEL: Record<string, string> = {
  OUT_OF_STOCK: 'Out of stock',
  DEACTIVATED: 'No longer sold',
  SHOP_CLOSED: 'Store closed',
  NOT_IN_ESSENTIALS: 'No longer in Daily Essentials',
  NOT_FOUND: 'No longer available',
};

const formatRupees = (amount: number) =>
  `₹${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;

const showMessage = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Daily Essentials', message);
  }
};

type Nav = StackNavigationProp<RootStackParamList, 'EssentialsCart'>;

const EssentialsCartScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { getColor, theme } = useTheme();
  const { authData } = useAuth();

  const lines = useEssentialsLines();
  const summary = useEssentialsSummary();
  const maxStores = useEssentialsCartStore(s => s.view?.maxStores ?? 3);
  const fetchCart = useEssentialsCartStore(s => s.fetchCart);
  const setQuantity = useEssentialsCartStore(s => s.setQuantity);
  const clear = useEssentialsCartStore(s => s.clear);

  useFocusEffect(
    useCallback(() => {
      fetchCart(authData?.jwt, authData?.phone);
    }, [fetchCart, authData?.jwt, authData?.phone])
  );

  /** Lines under their kirana, kiranas in the order their first item was added. */
  const byShop = useMemo(() => {
    const groups = new Map<string, { shopName: string | null; lines: EssentialsDisplayLine[] }>();
    lines.forEach(line => {
      const group = groups.get(line.shopId) ?? { shopName: line.shopName, lines: [] };
      group.shopName = group.shopName ?? line.shopName;
      group.lines.push(line);
      groups.set(line.shopId, group);
    });
    return Array.from(groups.entries());
  }, [lines]);

  const change = useCallback(
    async (line: EssentialsDisplayLine, quantity: number) => {
      const result = await setQuantity(
        {
          sku: line.sku,
          shopId: line.shopId,
          shopName: line.shopName,
          name: line.name ?? '',
          price: line.unitPrice,
          mrp: line.mrp,
          imageUrl: line.imageUrl,
        },
        quantity,
        authData?.jwt,
        authData?.phone
      );
      if (!result.ok && result.message) showMessage(result.message);
    },
    [setQuantity, authData]
  );

  const handleClear = useCallback(async () => {
    const result = await clear(authData?.jwt, authData?.phone);
    if (!result.ok && result.message) showMessage(result.message);
  }, [clear, authData]);

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  /**
   * Checkout is where the bill is built, so it is reachable even with unavailable lines:
   * the checkout lists them and lets the customer remove them there.
   */
  const handleCheckout = useCallback(() => {
    if (!authData?.jwt) {
      setShowLoginPrompt(true);
      return;
    }
    navigation.navigate('EssentialsCheckout');
  }, [authData?.jwt, navigation]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainApp');
  }, [navigation]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: getColor('background') },
        scroll: { paddingHorizontal: CATALOGUE_GUTTER, paddingBottom: 140 },
        banner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 12,
          padding: 12,
          borderRadius: 12,
          backgroundColor: getColor('overlay'),
        },
        bannerText: { flex: 1, fontSize: 12, lineHeight: 17, color: getColor('text') },
        shopCard: {
          marginTop: 12,
          borderRadius: 12,
          backgroundColor: getColor('white'),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: getColor('border'),
          overflow: 'hidden',
        },
        shopHead: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: getColor('border'),
        },
        shopName: { flex: 1, fontSize: 13, fontWeight: '700', color: getColor('text') },
        shopTotal: { fontSize: 12, fontWeight: '700', color: getColor('subText') },
        line: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
        },
        lineDivider: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: getColor('border'),
        },
        thumbWrap: {
          width: 48,
          height: 48,
          borderRadius: 8,
          padding: 4,
          backgroundColor: getColor('overlay'),
        },
        thumb: { width: '100%', height: '100%' },
        lineText: { flex: 1, minWidth: 0 },
        lineName: { fontSize: 13, lineHeight: 17, fontWeight: '600', color: getColor('text') },
        priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 3 },
        price: { fontSize: 13, fontWeight: '800', color: getColor('text') },
        mrp: {
          fontSize: 11,
          color: getColor('subText'),
          textDecorationLine: 'line-through',
        },
        note: { fontSize: 11, lineHeight: 14, marginTop: 3, color: getColor('subText') },
        unavailable: { fontSize: 11, lineHeight: 14, marginTop: 3, color: getColor('error') },
        dimmed: { opacity: 0.5 },
        stepper: {
          position: 'relative',
          right: 0,
          bottom: 0,
          minWidth: 84,
          height: 30,
          borderRadius: 8,
          backgroundColor: CATALOGUE_ACCENT,
          borderColor: CATALOGUE_ACCENT,
        },
        removeBtn: {
          paddingHorizontal: 12,
          height: 30,
          borderRadius: 8,
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: getColor('error'),
        },
        removeText: { fontSize: 11, fontWeight: '700', color: getColor('error') },
        footer: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: CATALOGUE_GUTTER,
          paddingBottom: CATALOGUE_GUTTER + 4,
          backgroundColor: getColor('white'),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: getColor('border'),
          shadowColor: theme.colors.shadow.color,
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: 6,
          elevation: 8,
        },
        totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
        totalLabel: { fontSize: 13, color: getColor('subText') },
        totalValue: { fontSize: 15, fontWeight: '800', color: getColor('text') },
        checkoutBtn: {
          height: 48,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: getColor('primary'),
        },
        checkoutText: { fontSize: 15, fontWeight: '800', color: '#fff' },
        checkoutHint: {
          fontSize: 11,
          textAlign: 'center',
          marginTop: 6,
          color: getColor('subText'),
        },
        empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
        emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, color: getColor('text') },
        emptyText: {
          fontSize: 14,
          textAlign: 'center',
          marginTop: 8,
          color: getColor('subText'),
        },
        shopBtn: {
          marginTop: 20,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 12,
          backgroundColor: getColor('primary'),
        },
      }),
    [getColor, theme]
  );

  const renderLine = (line: EssentialsDisplayLine, index: number) => {
    const discounted = line.mrp != null && line.mrp > line.unitPrice;
    return (
      <View key={line.sku} style={[styles.line, index > 0 && styles.lineDivider]}>
        <View style={[styles.thumbWrap, !line.available && styles.dimmed]}>
          <Image
            source={imageSourceFor(line.imageUrl)}
            style={styles.thumb}
            resizeMode="contain"
            defaultSource={PLACEHOLDER}
          />
        </View>
        <View style={styles.lineText}>
          <ThemeText style={[styles.lineName, !line.available && styles.dimmed]} numberOfLines={2}>
            {line.name}
          </ThemeText>
          <View style={styles.priceRow}>
            <ThemeText style={styles.price}>{formatRupees(line.lineTotal)}</ThemeText>
            {discounted ? (
              <ThemeText style={styles.mrp}>
                {formatRupees((line.mrp ?? 0) * line.quantity)}
              </ThemeText>
            ) : null}
          </View>
          {!line.available ? (
            <ThemeText style={styles.unavailable}>
              {UNAVAILABLE_LABEL[line.unavailableReason ?? ''] ?? 'Not available'} · remove to
              continue
            </ThemeText>
          ) : line.priceChanged && line.priceAtAdd != null ? (
            <ThemeText style={styles.note}>
              Price changed from {formatRupees(line.priceAtAdd)} to {formatRupees(line.unitPrice)}
            </ThemeText>
          ) : null}
        </View>
        {line.available ? (
          <QuantitySelector
            quantity={line.quantity}
            onIncrement={() => change(line, line.quantity + 1)}
            onDecrement={() => change(line, line.quantity - 1)}
            size="small"
            containerStyle={styles.stepper}
            tintColor={getColor('white')}
            quantityColor={getColor('white')}
          />
        ) : (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => change(line, 0)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${line.name}`}
          >
            <ThemeText style={styles.removeText}>REMOVE</ThemeText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (lines.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <CartHeader title="Daily Essentials" onBack={goBack} onClearCart={handleClear} />
        <View style={styles.empty}>
          <MaterialCommunityIcons name="basket-outline" size={72} color={getColor('subText')} />
          <ThemeText style={styles.emptyTitle}>Your Daily Essentials cart is empty</ThemeText>
          <ThemeText style={styles.emptyText}>
            Add items from Daily Essentials — even from different stores — and they arrive as one
            order.
          </ThemeText>
          <TouchableOpacity style={styles.shopBtn} onPress={goBack}>
            <ThemeText style={styles.checkoutText}>Browse Daily Essentials</ThemeText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <CartHeader
        title="Daily Essentials"
        onBack={goBack}
        onClearCart={handleClear}
        itemCount={summary.itemCount}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.banner}>
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={20}
            color={getColor('primary')}
          />
          <ThemeText style={styles.bannerText}>
            {byShop.length > 1
              ? `One order from ${byShop.length} stores, billed together.`
              : 'One order, billed together.'}{' '}
            Up to {maxStores} stores per order.
          </ThemeText>
        </View>

        {byShop.map(([shopId, group]) => {
          const shopTotal = group.lines
            .filter(l => l.available)
            .reduce((sum, l) => sum + l.lineTotal, 0);
          return (
            <View key={shopId} style={styles.shopCard}>
              <View style={styles.shopHead}>
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={16}
                  color={getColor('subText')}
                />
                <ThemeText style={styles.shopName} numberOfLines={1}>
                  {group.shopName ?? 'Store'}
                </ThemeText>
                <ThemeText style={styles.shopTotal}>
                  {formatRupees(Math.round(shopTotal * 100) / 100)}
                </ThemeText>
              </View>
              {group.lines.map(renderLine)}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <ThemeText style={styles.totalLabel}>
            Item total · {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}
          </ThemeText>
          <ThemeText style={styles.totalValue}>{formatRupees(summary.itemTotal)}</ThemeText>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handleCheckout}
          accessibilityRole="button"
          accessibilityLabel="Checkout"
        >
          <ThemeText style={styles.checkoutText}>Checkout</ThemeText>
        </TouchableOpacity>
        <ThemeText style={styles.checkoutHint}>
          {summary.hasUnavailable
            ? 'Unavailable items are left out; you can remove them at checkout.'
            : 'Delivery and fees are added at checkout, once for the whole order.'}
        </ThemeText>
      </View>
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Login to check out"
        message="Please log in to see your bill and place this order."
      />
    </SafeAreaView>
  );
};

export default EssentialsCartScreen;
