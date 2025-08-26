import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
import { Order } from '../../../types/order';
import RaiseQueryModal from '../RaiseQueryModal';
import { ThemeText } from '../theme/ThemeText';

interface HelpCardProps {
  onPress?: () => void;
  order?: Order;
}

const HelpCard: React.FC<HelpCardProps> = ({ onPress, order }) => {
  const { getColor, theme } = useTheme();
  const [showQueryModal, setShowQueryModal] = useState(false);

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
    container: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      marginRight: 12,
    },
    content: {
      flex: 1,
    },
    title: {
      color: getColor('text'),
      marginBottom: 4,
    },
    message: {
      color: getColor('subText'),
    },
    actionButton: {
      backgroundColor: getColor('primary'),
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    actionButtonText: {
      color: getColor('white'),
    },
  });

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={handleGetHelp} activeOpacity={0.8}>
        <MaterialCommunityIcons
          name="help-circle-outline"
          size={24}
          color={getColor('primary')}
          style={styles.icon}
        />
        <View style={styles.content}>
          <ThemeText variant="subtitle" color={getColor('text')} style={styles.title}>
            Need Help?
          </ThemeText>
          <ThemeText variant="caption" color={getColor('subText')} style={styles.message}>
            We are here for you
          </ThemeText>
        </View>
        {onPress && (
          <TouchableOpacity style={styles.actionButton}>
            <ThemeText variant="caption" color={getColor('white')} style={styles.actionButtonText}>
              Get Help {'>'}
            </ThemeText>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Raise Query Modal */}
      {order && (
        <RaiseQueryModal
          visible={showQueryModal}
          onClose={handleCloseQueryModal}
          orderId={order.orderId}
          orderDate={order.orderDate}
          customerName={order.customerName}
          orderStatus={order.status}
        />
      )}
    </>
  );
};

export default HelpCard;
