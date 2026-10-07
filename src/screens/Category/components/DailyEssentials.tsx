import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import CachedImage from '../../../components/common/CachedImage';
import { ThemeText } from '../../../components/common/theme/ThemeText';
import { CATALOGUE_ACCENT, CATALOGUE_GUTTER } from '../../../constants/catalogue';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { RootStackParamList } from '../../../routes/AppStack';
import { CatalogGroup, CatalogSubgroup } from '../../../services/catalogGroupsService';
import useEssentialsCartStore from '../../../store/cart/essentialsCartStore';
import useConfigStore from '../../../store/configStore';
import useCatalogGroupsStore from '../../../store/grocery/catalogGroupsStore';
import useGroceryGroupsStore from '../../../store/grocery/groceryGroupsStore';
import { useTheme } from '../../../theme/ThemeContext';
import { wholeRupees } from '../../../utils/price';

/**
 * Daily Essentials — the curated catalogue, rendered from QuickVerse's own data.
 *
 * Two levels here and one further in: each group ("Snacks & Beverages") is a header with its
 * accent bar and badge, over a grid of its subgroups ("Chips & Namkeen") as tiles. A tile opens
 * the store screen (VendorProduct) with the group as the store and its subgroups as the
 * categories, scrolled to the tapped one; no products are listed on this screen. Admin arranges
 * all of it in the web panel, and a subgroup not yet placed in a group is not shown.
 *
 * Subgroups span shops — one can mix products from several kiranas — and nothing here says
 * which: to the customer, Daily Essentials is one shop and one order.
 */

const COLUMNS = 3;
const GAP = 10;
const DEFAULT_ACCENT = CATALOGUE_ACCENT;

/** `#RRGGBB` → the same colour at about 10% opacity, for the badge pill. */
const tint = (hex: string) => (/^#[0-9A-Fa-f]{6}$/.test(hex) ? `${hex}1A` : 'rgba(0,0,0,0.06)');

const accentOf = (group: CatalogGroup) =>
  group.accentColor && /^#[0-9A-Fa-f]{6}$/.test(group.accentColor)
    ? group.accentColor
    : DEFAULT_ACCENT;

/** Admin's line when there is one, otherwise the cheapest thing inside. */
const offerLine = (subgroup: CatalogSubgroup) =>
  subgroup.offerText ||
  (subgroup.lowestSellingPrice ? `From ₹${wholeRupees(subgroup.lowestSellingPrice)}` : '');

interface DailyEssentialsProps {
  /** Side margin, to line up with the screen it sits on (the Home screen uses 16). */
  gutter?: number;
}

const DailyEssentials: React.FC<DailyEssentialsProps> = ({ gutter = CATALOGUE_GUTTER }) => {
  const { getColor } = useTheme();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { selectedAddress } = useAuth();
  const nearLat = selectedAddress?.coordinates?.latitude;
  const nearLng = selectedAddress?.coordinates?.longitude;
  const regionId = useConfigStore(s => s.config?.regionId ?? null);

  const groups = useCatalogGroupsStore(s => s.groups);
  const loading = useCatalogGroupsStore(s => s.loading);
  const fetchCatalog = useCatalogGroupsStore(s => s.fetchCatalog);

  // The catalogue near the address being delivered to; a new town or region refetches.
  useEffect(() => {
    fetchCatalog(
      Number.isFinite(nearLat) && Number.isFinite(nearLng)
        ? { latitude: nearLat as number, longitude: nearLng as number }
        : undefined,
      regionId
    );
  }, [fetchCatalog, nearLat, nearLng, regionId]);

  /**
   * Without the server's Essentials cart, items go to per-shop carts, and the cart screen
   * groups those whose shop supplies Daily Essentials (`useEssentialsShopIds`), which it reads
   * from the flat groups list. Kept loaded for that path only.
   */
  const essentialsCartOff = useEssentialsCartStore(s => s.enabled === false);
  const fetchLegacyGroups = useGroceryGroupsStore(s => s.fetchGroups);
  useEffect(() => {
    if (!essentialsCartOff) return;
    fetchLegacyGroups(
      Number.isFinite(nearLat) && Number.isFinite(nearLng)
        ? { latitude: nearLat as number, longitude: nearLng as number }
        : undefined
    );
  }, [essentialsCartOff, fetchLegacyGroups, nearLat, nearLng]);

  const tileWidth = Math.floor((width - gutter * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: { marginHorizontal: gutter, marginTop: 14 },
        sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
        sectionTitle: {
          fontSize: 14,
          lineHeight: 18,
          fontWeight: '700',
          color: getColor('text'),
        },
        group: { marginBottom: 18 },
        groupHead: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 8,
        },
        groupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
        accentBar: { width: 4, height: 18, borderRadius: 2 },
        groupName: {
          fontSize: 15,
          lineHeight: 20,
          fontWeight: '800',
          color: getColor('text'),
          flexShrink: 1,
        },
        badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
        badgeText: { fontSize: 10, lineHeight: 12, fontWeight: '800', letterSpacing: 0.6 },
        grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: 14 },
        tile: { width: tileWidth },
        imageBox: {
          width: tileWidth,
          height: tileWidth,
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: getColor('overlay'),
          alignItems: 'center',
          justifyContent: 'center',
        },
        image: { width: '100%', height: '100%' },
        chip: {
          position: 'absolute',
          top: 6,
          left: 6,
          maxWidth: tileWidth - 12,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 6,
        },
        chipText: { fontSize: 9, lineHeight: 12, fontWeight: '800', color: '#FFFFFF' },
        name: {
          marginTop: 6,
          fontSize: 12,
          lineHeight: 15,
          fontWeight: '700',
          color: getColor('text'),
        },
        offer: {
          marginTop: 2,
          fontSize: 11,
          lineHeight: 14,
          fontWeight: '700',
          color: CATALOGUE_ACCENT,
        },
      }),
    [getColor, tileWidth, gutter]
  );

  // Nothing to show and nothing on the way — take up no space at all.
  if (!loading && groups.length === 0) return null;

  const renderTile = (group: CatalogGroup, subgroup: CatalogSubgroup, accent: string) => {
    const offer = offerLine(subgroup);
    return (
      <TouchableOpacity
        key={subgroup.groupId}
        style={styles.tile}
        activeOpacity={0.8}
        // The store screen, with this group as the store and its subgroups as the categories.
        onPress={() =>
          navigation.navigate('VendorProduct', {
            essentials: { groupId: group.groupId, title: group.name, subgroupId: subgroup.groupId },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`${subgroup.name}${offer ? `, ${offer}` : ''}`}
      >
        <View style={styles.imageBox}>
          {subgroup.imageUrl?.startsWith('http') ? (
            <CachedImage uri={subgroup.imageUrl} style={styles.image} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name="basket-outline" size={28} color={getColor('subText')} />
          )}
          {subgroup.badgeLabel ? (
            <View style={[styles.chip, { backgroundColor: accent }]}>
              <ThemeText style={styles.chipText} numberOfLines={1}>
                {subgroup.badgeLabel}
              </ThemeText>
            </View>
          ) : null}
        </View>
        <ThemeText style={styles.name} numberOfLines={2}>
          {subgroup.name}
        </ThemeText>
        {offer ? (
          <ThemeText style={styles.offer} numberOfLines={1}>
            {offer}
          </ThemeText>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <MaterialCommunityIcons name="basket-outline" size={18} color={getColor('primary')} />
        <ThemeText style={styles.sectionTitle}>Daily Essentials</ThemeText>
      </View>

      {groups.map(group => {
        const accent = accentOf(group);
        return (
          <View key={group.groupId} style={styles.group}>
            <View style={styles.groupHead}>
              <View style={styles.groupTitleRow}>
                <View style={[styles.accentBar, { backgroundColor: accent }]} />
                <ThemeText style={styles.groupName} numberOfLines={1}>
                  {group.name}
                </ThemeText>
              </View>
              {group.badgeText ? (
                <View style={[styles.badge, { backgroundColor: tint(accent) }]}>
                  <ThemeText style={[styles.badgeText, { color: accent }]}>
                    {group.badgeText}
                  </ThemeText>
                </View>
              ) : null}
            </View>
            <View style={styles.grid}>
              {group.subgroups.map(subgroup => renderTile(group, subgroup, accent))}
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default DailyEssentials;
