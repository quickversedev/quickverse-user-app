import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import productDetailsService from '../../../services/productDetailsService';
import useCartStore from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';
import { triggerAddToCartHaptic } from '../../../utils/haptics';
import { cleanHtmlText } from '../../../utils/htmlUtils';
import { getStoreStatus } from '../../../utils/storeUtils';
import { ThemeText } from '../../common/theme/ThemeText';
import ProductImageCarousel from './ProductImageCarousel';
import ProductInfo from './ProductInfo';
import QuantitySelector from './QuantitySelector';
import SuggestedItems from './SuggestedItems';

const { height, width } = Dimensions.get('window');

/**
 * Square hero where the screen allows, clamped so it never eats a small phone.
 * Square matters: the carousel fills with resizeMode 'cover', and product packshots
 * are square, so a square frame crops essentially nothing while still reaching both
 * screen edges. A landscape frame would crop the top and bottom off every photo.
 */
const HERO_HEIGHT = Math.min(width, Math.round(height * 0.45));
const HERO_RADIUS = 28;
const HEADER_BTN = 40;
const STEPPER_H = 38;
const CTA_H = 54;

interface SuggestedItem {
  id: string;
  name: string;
  price: number;
  mrp: number;
  rating: number;
  image: number;
  quantity: number;
}

interface ProductDetailModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product;
  vendor: Vendor;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  visible,
  onClose,
  product,
  vendor,
}) => {
  const storeStatus = getStoreStatus({
    storeActive: vendor.storeActive !== false,
    openingTime: vendor.openingTime ?? '00:00',
    closingTime: vendor.closingTime ?? '23:59',
  });
  const isStoreClosed = !storeStatus.isOpen;
  const { getColor, getButtonColor, theme } = useTheme();
  const { authData } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedVariant, setSelectedVariant] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Product[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantsError, setVariantsError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addToCart, increment, decrement, carts } = useCartStore();

  // Create vendor-specific cart ID
  const cartId = `vendor_${vendor.shopId}`;
  // Get current cart
  const cart = carts[cartId];

  // Get display values from selected variant or fallback to product
  const displayImageUrl = selectedVariant?.imageUrl || product.imageUrl || '';
  const displayAdditionalImages =
    selectedVariant?.additionalImages || product.additionalImages || [];
  const displayName = selectedVariant?.name || product.name;
  const displayPrice = selectedVariant?.sellingPrice || product.sellingPrice;
  const displayMrp = selectedVariant?.mrp || product.mrp;
  const displaySku = selectedVariant?.sku || product.sku;
  const displayAttributes = selectedVariant?.attributes || product.attributes;

  /**
   * Composed from real attribute data and rendered only when non-empty — there is
   * no `subtitle` field on Product, and filler text would be worse than nothing.
   */
  const subtitle = [product.brand, displayAttributes?.size, displayAttributes?.unit]
    .filter(Boolean)
    .join(' · ');

  // attributes.description is raw HTML — never render it unsanitised.
  const description = displayAttributes?.description
    ? cleanHtmlText(displayAttributes.description)
    : '';

  // Get current quantity for this product
  const currentQuantity = cart?.products[displaySku]?.quantity || 0;

  /**
   * Keep the product being viewed out of its own suggestions. Both SKUs matter:
   * `displaySku` is the selected variant, `product.sku` the one opened from the
   * list — they differ once a variant is picked. Memoised because SuggestedItems
   * has this in an effect dependency array.
   */
  const excludeSkus = useMemo(() => [displaySku, product.sku], [displaySku, product.sku]);

  useEffect(() => {
    if (visible) {
      fetchVariants();
    }
  }, [visible]);

  // Update selected variant when product changes
  useEffect(() => {
    setSelectedVariant(null); // Reset when product changes
  }, [product.sku]);

  const fetchVariants = async () => {
    setLoadingVariants(true);
    setVariantsError(null);
    try {
      const variantsData = await productDetailsService.getProductVariants(
        product.primarySKU || product.sku
      );

      setVariants(variantsData.data);

      // Auto-select the variant that matches the current product SKU
      const matchingVariant = variantsData.data.find(variant => variant.sku === product.sku);
      if (matchingVariant) {
        setSelectedVariant(matchingVariant);
      }
    } catch (err) {
      setVariantsError(err instanceof Error ? err.message : 'Failed to fetch variants');
    } finally {
      setLoadingVariants(false);
    }
  };

  // Cart handlers
  const handleAddToCart = () => {
    if (isStoreClosed) return;
    addToCart(
      cartId,
      {
        sku: displaySku,
        shopId: vendor.shopId,
        name: selectedVariant?.name || product.name,
        price: displayPrice,
        mrp: displayMrp,
        image: displayImageUrl,
        veg: product.veg,
      },
      authData?.jwt || '',
      authData?.phone || ''
    );
  };

  /**
   * cartStore.addToCart increments an existing line rather than resetting it to 1,
   * so the CTA works at any quantity and needs no branch on currentQuantity.
   * The haptic used to fire inside AddButton, which this replaces.
   */
  const handleCtaPress = () => {
    if (isStoreClosed) return;
    triggerAddToCartHaptic();
    handleAddToCart();
  };

  const handleIncrement = () => {
    if (isStoreClosed) return;
    increment(cartId, displaySku, authData?.jwt || '', authData?.phone || '');
  };

  const handleDecrement = () => {
    if (isStoreClosed) return;
    decrement(cartId, displaySku, authData?.jwt || '', authData?.phone || '');
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        // Card-coloured so the band behind the status bar matches the hero rather
        // than showing a white gap above it. The sheet below repaints its own bg.
        screen: {
          flex: 1,
          backgroundColor: getColor('card'),
        },
        header: {
          position: 'absolute',
          top: insets.top + 8,
          left: 16,
          right: 16,
          flexDirection: 'row',
          alignItems: 'center',
          zIndex: 10,
        },
        headerBtn: {
          width: HEADER_BTN,
          height: HEADER_BTN,
          borderRadius: HEADER_BTN / 2,
          backgroundColor: getColor('card'),
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
          elevation: 3,
        },
        headerTitle: {
          flex: 1,
          textAlign: 'center',
          fontWeight: '700',
        },
        // Keeps the title optically centred without absolute positioning.
        headerSpacer: {
          width: HEADER_BTN,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          paddingBottom: CTA_H + 32,
        },
        // Must never get overflow:'hidden' — the stepper pill overhangs its edge.
        heroWrap: {
          position: 'relative',
          zIndex: 2,
        },
        /**
         * Rounded only at the bottom — the top corners sit on the screen edge.
         * The card background here (and on `screen`) is what makes the hero read as
         * edge-to-edge: any strip above it, including behind the status bar, is
         * painted the same colour rather than white.
         */
        heroClip: {
          overflow: 'hidden',
          borderBottomLeftRadius: HERO_RADIUS,
          borderBottomRightRadius: HERO_RADIUS,
          backgroundColor: getColor('card'),
        },
        stepperFloat: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -(STEPPER_H / 2),
          alignItems: 'center',
        },
        stepperPill: {
          position: 'relative',
          right: undefined,
          bottom: undefined,
          height: STEPPER_H,
          borderRadius: STEPPER_H / 2,
          paddingHorizontal: 6,
          backgroundColor: getColor('card'),
          borderWidth: 1,
          borderColor: getColor('border'),
          // Load-bearing on Android: the sheet is a later sibling and would
          // otherwise paint over the pill's overhang.
          elevation: 6,
        },
        // Everything below the hero sits on the page background, so the card colour
        // on `screen` only ever shows above/behind the hero.
        body: {
          backgroundColor: getColor('background'),
        },
        sheet: {
          paddingHorizontal: 20,
          // Clears the pill's lower half plus breathing room. Constant whether or
          // not the pill renders, so nothing shifts on first add.
          paddingTop: STEPPER_H / 2 + 18,
        },
        productName: {
          fontWeight: '700',
        },
        subtitle: {
          marginTop: 4,
        },
        priceRow: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          marginTop: 12,
          marginBottom: 18,
        },
        priceText: {
          fontSize: 28,
          fontWeight: '700',
          color: getColor('primary'),
        },
        mrpText: {
          color: getColor('subText'),
          textDecorationLine: 'line-through',
          marginLeft: 10,
          marginBottom: 4,
        },
        sectionHeading: {
          fontWeight: '700',
          marginBottom: 8,
        },
        descriptionText: {
          lineHeight: 20,
        },
        ctaBar: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: Math.max(12, insets.bottom),
          backgroundColor: getColor('background'),
        },
        ctaButton: {
          height: CTA_H,
          borderRadius: 14,
          backgroundColor: getColor('primary'),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        ctaButtonDisabled: {
          backgroundColor: getButtonColor('disabled', 'background'),
        },
        ctaLabel: {
          fontWeight: '700',
          fontSize: 17,
        },
        storeClosedText: {
          textAlign: 'center',
          marginBottom: 8,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        },
        loadingText: {
          marginTop: 16,
        },
        errorContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        },
        errorText: {
          color: getColor('error'),
          textAlign: 'center',
          marginBottom: 16,
        },
        retryButton: {
          backgroundColor: getColor('primary'),
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: theme.borderRadius.sm,
        },
        retryButtonText: {
          color: getColor('white'),
        },
      }),
    [getColor, getButtonColor, theme, insets.top, insets.bottom]
  );

  const handleVariantSelect = (variantId: string) => {
    const variant = variants.find(v => v.sku === variantId);
    if (variant) {
      setSelectedVariant(variant);
      setCurrentImageIndex(0); // Reset to first image when variant changes
    }
  };

  const handleImageIndexChange = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleSuggestedItemPress = (_item: SuggestedItem) => {
    // Handle suggested item press - could open product detail modal for this item
  };

  const handleSuggestedItemAdd = (item: SuggestedItem) => {
    const cartProduct = {
      sku: item.id,
      shopId: vendor.shopId,
      name: item.name,
      price: item.price,
      mrp: item.mrp,
      image: item.image.toString(),
      veg: true,
    };
    addToCart(cartId, cartProduct, authData?.jwt || '', authData?.phone || '');
  };

  const handleSuggestedItemIncrement = (item: SuggestedItem) => {
    increment(cartId, item.id, authData?.jwt || '', authData?.phone || '');
  };

  const handleSuggestedItemDecrement = (item: SuggestedItem) => {
    decrement(cartId, item.id, authData?.jwt || '', authData?.phone || '');
  };

  // Create variants for ProductInfo component
  const productVariants =
    variants.length > 0
      ? variants.map(variant => ({
          id: variant.sku,
          name: variant.name,
          value: [variant.attributes?.size, variant.attributes?.color].filter(Boolean).join(' | '),
        }))
      : [];

  const renderHeader = () => (
    // box-none: without it this full-width transparent strip swallows taps on the hero.
    <View style={styles.header} pointerEvents="box-none">
      <TouchableOpacity style={styles.headerBtn} onPress={onClose} accessibilityRole="button">
        <MaterialCommunityIcons name="chevron-left" size={26} color={getColor('text')} />
      </TouchableOpacity>
      <ThemeText variant="subtitle" color={getColor('text')} style={styles.headerTitle}>
        Details
      </ThemeText>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderShell = (children: React.ReactNode) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      hardwareAccelerated={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        {children}
        {renderHeader()}
      </View>
    </Modal>
  );

  // Loading state for variants
  if (loadingVariants && product.numberOfVariants > 1) {
    return renderShell(
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={getColor('primary')} />
        <ThemeText variant="body" color={getColor('subText')} style={styles.loadingText}>
          Loading variants...
        </ThemeText>
      </View>
    );
  }

  // Error state for variants
  if (variantsError && product.numberOfVariants > 1) {
    return renderShell(
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={getColor('error')} />
        <ThemeText variant="body" color={getColor('error')} style={styles.errorText}>
          {variantsError}
        </ThemeText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchVariants}>
          <ThemeText variant="body" color={getColor('white')} style={styles.retryButtonText}>
            Retry
          </ThemeText>
        </TouchableOpacity>
      </View>
    );
  }

  return renderShell(
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <View style={styles.heroWrap}>
          <View style={styles.heroClip}>
            <ProductImageCarousel
              imageUrl={displayImageUrl}
              additionalImages={displayAdditionalImages}
              productName={displayName}
              currentImageIndex={currentImageIndex}
              onImageIndexChange={handleImageIndexChange}
              height={HERO_HEIGHT}
            />
          </View>

          {currentQuantity > 0 && (
            <View style={styles.stepperFloat} pointerEvents="box-none">
              <QuantitySelector
                quantity={currentQuantity}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                size="regular"
                disabled={isStoreClosed}
                containerStyle={styles.stepperPill}
              />
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.sheet}>
            <ThemeText
              variant="h2"
              color={getColor('text')}
              style={styles.productName}
              numberOfLines={2}
            >
              {displayName}
            </ThemeText>

            {subtitle ? (
              <ThemeText variant="small" color={getColor('subText')} style={styles.subtitle}>
                {subtitle}
              </ThemeText>
            ) : null}

            <View style={styles.priceRow}>
              <ThemeText style={styles.priceText}>₹{displayPrice}</ThemeText>
              {displayMrp !== displayPrice && (
                <ThemeText variant="caption" color={getColor('subText')} style={styles.mrpText}>
                  MRP ₹{displayMrp}
                </ThemeText>
              )}
            </View>

            <ProductInfo
              variants={productVariants}
              selectedVariantId={selectedVariant?.sku || product.sku}
              onVariantSelect={handleVariantSelect}
            />

            {description ? (
              <>
                <ThemeText
                  variant="subtitle"
                  color={getColor('text')}
                  style={styles.sectionHeading}
                >
                  Description
                </ThemeText>
                <ThemeText
                  variant="caption"
                  color={getColor('subText')}
                  style={styles.descriptionText}
                >
                  {description}
                </ThemeText>
              </>
            ) : null}
          </View>

          <SuggestedItems
            categories={product.division || ''}
            excludeSkus={excludeSkus}
            onItemPress={handleSuggestedItemPress}
            onAdd={handleSuggestedItemAdd}
            onIncrement={handleSuggestedItemIncrement}
            onDecrement={handleSuggestedItemDecrement}
            isStoreClosed={isStoreClosed}
          />
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        {isStoreClosed && (
          <ThemeText variant="caption" color={getColor('error')} style={styles.storeClosedText}>
            {storeStatus.reason}
          </ThemeText>
        )}
        <TouchableOpacity
          style={[styles.ctaButton, isStoreClosed && styles.ctaButtonDisabled]}
          disabled={isStoreClosed}
          activeOpacity={0.85}
          onPress={handleCtaPress}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="cart-outline"
            size={20}
            color={isStoreClosed ? getButtonColor('disabled', 'text') : getColor('text')}
          />
          <ThemeText
            variant="body"
            color={isStoreClosed ? getButtonColor('disabled', 'text') : getColor('text')}
            style={styles.ctaLabel}
          >
            Add to cart
          </ThemeText>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default ProductDetailModal;
