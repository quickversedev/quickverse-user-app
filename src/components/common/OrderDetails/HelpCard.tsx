import Icon from '@react-native-vector-icons/material-design-icons';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Order } from '../../../types/order';
import RaiseQueryModal from '../RaiseQueryModal';
import { Fonts } from '../theme/fonts';
import { ThemeText } from '../theme/ThemeText';

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

interface HelpCardProps {
  onPress?: () => void;
  order?: OrderWithFeedback<Order>;
  onRefresh?: () => void;
}

const HelpCard: React.FC<HelpCardProps> = ({ onPress, order, onRefresh }) => {
  const { getColor, getTypography } = useTheme();
  const [showQueryModal, setShowQueryModal] = useState(false);

  const existingComplaint = order?.complaint ?? null;

  const handleGetHelp = () => {
    if (order) {
      setShowQueryModal(true);
    } else if (onPress) {
      onPress();
    }
  };

  const handleCloseQueryModal = () => {
    setShowQueryModal(false);
  };

  const styles = StyleSheet.create({
    helpCard: {
      backgroundColor: getColor('card'),
      borderRadius: 16,
      padding: 18,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    helpContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    helpInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: getColor('background'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    helpText: {
      marginLeft: 14,
      flex: 1,
    },
    helpLabel: {
      fontFamily: Fonts.medium,
      fontSize: getTypography('caption') ?? 12,
      color: getColor('subText'),
      marginBottom: 3,
    },
    helpMessage: {
      fontFamily: Fonts.bold,
      fontSize: getTypography('body'),
      color: getColor('text'),
    },
    helpActionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('background'),
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      gap: 4,
    },
    helpActionText: {
      fontFamily: Fonts.bold,
      fontSize: getTypography('caption') ?? 12,
      color: getColor('primary'),
    },
  });

  return (
    <>
      <TouchableOpacity style={styles.helpCard} onPress={handleGetHelp} activeOpacity={0.85}>
        <View style={styles.helpContent}>
          <View style={styles.helpInfo}>
            <View style={styles.iconWrap}>
              <Icon
                name={existingComplaint ? 'message-check-outline' : 'help-circle-outline'}
                size={22}
                color={getColor('primary')}
              />
            </View>
            <View style={styles.helpText}>
              <ThemeText style={styles.helpLabel}>
                {existingComplaint ? 'Query Status' : 'Need Help?'}
              </ThemeText>
              <ThemeText style={styles.helpMessage}>
                {existingComplaint ? 'You raised a query for this order' : 'We are here for you'}
              </ThemeText>
            </View>
          </View>
          <View style={styles.helpActionPill}>
            <ThemeText style={styles.helpActionText}>
              {existingComplaint ? 'View' : 'Get Help'}
            </ThemeText>
            <Icon name="chevron-right" size={16} color={getColor('primary')} />
          </View>
        </View>
      </TouchableOpacity>

      {order && (
        <RaiseQueryModal
          visible={showQueryModal}
          onClose={handleCloseQueryModal}
          orderId={order.orderId}
          shopId={order.shopId}
          orderDate={order.orderDate}
          customerName={order.customerName}
          orderStatus={order.status}
          existingComplaint={existingComplaint}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
};

export default HelpCard;
