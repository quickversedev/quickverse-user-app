import Icon from '@react-native-vector-icons/material-design-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../../contexts/login/AuthProvider';
import orderFeedbackService from '../../../services/api/orderFeedbackService';
import { useTheme } from '../../../theme/ThemeContext';
import { Order } from '../../../types/order';
import { Fonts } from '../theme/fonts';

export interface OrderFeedback {
  id?: string;
  feedbackId?: string;
  orderId?: string;
  shopId?: string;
  customerId?: string;
  customerName?: string;
  mobileNumber?: string;
  type: 'REVIEW' | 'COMPLAINT';
  rating?: number;
  complaintCategory?: string | null;
  message: string;
  attachmentUrl?: string | null;
  status?: string;
  adminReply?: string | null;
  createdAt?: number;
  updatedAt?: number | null;
}

export type OrderWithFeedback<T> = T & {
  review?: OrderFeedback | null;
  complaint?: OrderFeedback | null;
};

interface OrderReviewCardProps {
  order: OrderWithFeedback<Order>;
}

const REVIEW_MAX_LENGTH = 300;
const STAR_COLOR = '#FFB800';

const OrderReviewCard: React.FC<OrderReviewCardProps> = ({ order }) => {
  const { getColor, getTypography } = useTheme();
  const { authData } = useAuth();

  // The order payload itself may already carry the review (see the raw
  // API response's `review` field) — trust that first so we don't do a
  // redundant network round-trip and don't flash the form before it.
  const embeddedReview = order.review ?? null;

  const [checkingExisting, setCheckingExisting] = useState(!embeddedReview);
  const [existingReview, setExistingReview] = useState<OrderFeedback | null>(embeddedReview);

  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [ratingError, setRatingError] = useState(false);
  const [messageError, setMessageError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fallback lookup only runs when the order didn't already embed a review
  // (keeps backward compatibility with any endpoint that hasn't been
  // updated to embed feedback yet).
  useEffect(() => {
    if (embeddedReview) return;
    let isActive = true;
    (async () => {
      try {
        const list = await orderFeedbackService.getOrderFeedbacksByOrderId(order.orderId);
        const review = Array.isArray(list) ? list.find(item => item.type === 'REVIEW') : null;
        if (isActive) setExistingReview((review as OrderFeedback) ?? null);
      } catch (error) {
        // If the lookup fails we simply fall back to showing the submission
        // form — better than blocking the whole card on a network blip.
      } finally {
        if (isActive) setCheckingExisting(false);
      }
    })();
    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.orderId]);

  const handleSubmit = async () => {
    const hasRatingError = rating < 1;
    const hasMessageError = !message.trim();
    setRatingError(hasRatingError);
    setMessageError(hasMessageError);
    if (hasRatingError || hasMessageError) return;

    setSubmitError('');
    setSubmitting(true);
    try {
      const trimmedMessage = message.trim();
      const created = await orderFeedbackService.submitOrderFeedback({
        orderId: order.orderId,
        shopId: order.shopId,
        customerName: authData?.username || order.customerName || 'Customer',
        mobileNumber: authData?.phone,
        type: 'REVIEW',
        rating,
        message: trimmedMessage,
      });

      setExistingReview(
        (created as OrderFeedback) ?? {
          type: 'REVIEW',
          rating,
          message: trimmedMessage,
          status: 'NEW',
          createdAt: Date.now(),
        }
      );
      setSuccessVisible(true);
    } catch (error: any) {
      setSubmitError(error?.message || 'Failed to submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: getColor('card'),
      borderRadius: 16,
      borderWidth: 1,
      borderColor: getColor('border'),
      padding: 18,
      marginBottom: 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    title: {
      fontFamily: Fonts.bold,
      fontSize: getTypography('h2'),
      color: getColor('text'),
      marginLeft: 8,
    },
    subtitle: {
      fontFamily: Fonts.regular,
      fontSize: getTypography('caption') ?? 12,
      color: getColor('subText'),
      marginBottom: 16,
    },
    starsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 16,
    },
    starTouchable: {
      padding: 4,
    },
    ratingLabel: {
      fontFamily: Fonts.medium,
      textAlign: 'center',
      fontSize: getTypography('caption') ?? 12,
      color: getColor('subText'),
      marginBottom: 16,
      minHeight: 16,
    },
    input: {
      fontFamily: Fonts.regular,
      borderWidth: 1,
      borderColor: getColor('border'),
      borderRadius: 12,
      padding: 14,
      minHeight: 90,
      fontSize: getTypography('body'),
      color: getColor('text'),
      backgroundColor: getColor('background'),
      textAlignVertical: 'top',
    },
    inputError: {
      borderColor: '#F44336',
    },
    charCounter: {
      fontFamily: Fonts.regular,
      alignSelf: 'flex-end',
      fontSize: getTypography('caption') ?? 12,
      color: getColor('subText'),
      marginTop: 4,
      marginBottom: 4,
    },
    errorText: {
      fontFamily: Fonts.medium,
      fontSize: getTypography('caption') ?? 12,
      color: '#F44336',
      marginBottom: 8,
    },
    submitBtn: {
      backgroundColor: getColor('primary'),
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    submitBtnDisabled: {
      opacity: 0.5,
    },
    submitBtnText: {
      fontFamily: Fonts.bold,
      color: '#FFFFFF',
      fontSize: getTypography('body'),
    },
    submittedBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    submittedBadgeText: {
      fontFamily: Fonts.bold,
      fontSize: getTypography('caption') ?? 12,
      color: '#10B981',
      marginLeft: 6,
    },
    submittedMessage: {
      fontFamily: Fonts.regular,
      fontSize: getTypography('body'),
      color: getColor('text'),
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 4,
    },
    replyBox: {
      marginTop: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: getColor('border'),
      backgroundColor: getColor('background'),
      padding: 12,
    },
    replyHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    replyLabel: {
      fontFamily: Fonts.bold,
      fontSize: getTypography('caption') ?? 12,
      color: getColor('primary'),
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginLeft: 6,
    },
    replyText: {
      fontFamily: Fonts.regular,
      fontSize: getTypography('body'),
      color: getColor('text'),
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    successCard: {
      width: '100%',
      backgroundColor: getColor('card'),
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
    },
    successIconWrap: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: getColor('primary'),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
    },
    successTitle: {
      fontFamily: Fonts.bold,
      fontSize: getTypography('h2'),
      color: getColor('text'),
      marginBottom: 6,
      textAlign: 'center',
    },
    successMessage: {
      fontFamily: Fonts.regular,
      fontSize: getTypography('body'),
      color: getColor('subText'),
      textAlign: 'center',
      marginBottom: 20,
    },
    successBtn: {
      backgroundColor: getColor('primary'),
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 12,
      width: '100%',
      alignItems: 'center',
    },
    successBtnText: {
      fontFamily: Fonts.bold,
      color: '#FFFFFF',
      fontSize: getTypography('body'),
    },
  });

  const renderStars = (value: number, size: number, onSelect?: (n: number) => void) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity
          key={n}
          disabled={!onSelect}
          activeOpacity={0.7}
          style={styles.starTouchable}
          onPress={() => onSelect?.(n)}
        >
          <Icon
            name={n <= value ? 'star' : 'star-outline'}
            size={size}
            color={n <= value ? STAR_COLOR : getColor('border')}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const ratingHintText = (value: number) => {
    switch (value) {
      case 1:
        return 'Not great';
      case 2:
        return 'Could be better';
      case 3:
        return 'Okay';
      case 4:
        return 'Good';
      case 5:
        return 'Excellent!';
      default:
        return 'Tap a star to rate your order';
    }
  };

  if (checkingExisting) {
    return (
      <View style={[styles.card, { alignItems: 'center' }]}>
        <ActivityIndicator color={getColor('primary')} />
      </View>
    );
  }

  // Already reviewed — show the read-only summary and never re-render the form.
  if (existingReview) {
    return (
      <View style={styles.card}>
        <View style={styles.submittedBadgeRow}>
          <Icon name="check-circle" size={18} color="#10B981" />
          <Text style={styles.submittedBadgeText}>Review Submitted</Text>
        </View>
        {renderStars(existingReview.rating ?? 0, 26)}
        <Text style={styles.submittedMessage}>{existingReview.message}</Text>

        {existingReview.adminReply ? (
          <View style={styles.replyBox}>
            <View style={styles.replyHeaderRow}>
              <Icon name="storefront-outline" size={16} color={getColor('primary')} />
              <Text style={styles.replyLabel}>Response from the restaurant</Text>
            </View>
            <Text style={styles.replyText}>{existingReview.adminReply}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Icon name="star-outline" size={22} color={getColor('primary')} />
        <Text style={styles.title}>Share your review</Text>
      </View>
      <Text style={styles.subtitle}>How was your order? Your feedback helps us improve.</Text>

      {renderStars(rating, 34, n => {
        setRating(n);
        if (ratingError) setRatingError(false);
      })}
      <Text style={styles.ratingLabel}>{ratingHintText(rating)}</Text>
      {ratingError && <Text style={styles.errorText}>Please select a rating</Text>}

      <TextInput
        style={[styles.input, messageError && styles.inputError]}
        placeholder="Tell us about the food, delivery, or anything else..."
        placeholderTextColor={getColor('placeholder')}
        multiline
        maxLength={REVIEW_MAX_LENGTH}
        value={message}
        onChangeText={text => {
          setMessage(text);
          if (messageError) setMessageError(false);
        }}
      />
      <Text style={styles.charCounter}>
        {message.length}/{REVIEW_MAX_LENGTH}
      </Text>
      {messageError && <Text style={styles.errorText}>Please write a quick review</Text>}
      {!!submitError && <Text style={styles.errorText}>{submitError}</Text>}

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Review</Text>
        )}
      </TouchableOpacity>

      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Icon name="check" size={30} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Thanks for your review!</Text>
            <Text style={styles.successMessage}>
              We appreciate you taking the time to share your feedback.
            </Text>
            <TouchableOpacity style={styles.successBtn} onPress={() => setSuccessVisible(false)}>
              <Text style={styles.successBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default OrderReviewCard;
