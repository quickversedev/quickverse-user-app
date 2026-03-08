import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Order } from '../../../types/order';
import RaiseQueryModal from '../RaiseQueryModal';

interface HelpCardProps {
  onPress?: () => void;
  order?: Order;
}

const HelpCard: React.FC<HelpCardProps> = ({ onPress, order }) => {
  const { getColor } = useTheme();
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

  return (
    <>
      <TouchableOpacity
        style={[styles.helpCard, { backgroundColor: getColor('card') }]}
        onPress={handleGetHelp}
      >
        <View style={styles.helpContent}>
          <View style={styles.helpInfo}>
            <Icon name="help-circle-outline" size={20} color={getColor('text')} />
            <View style={styles.helpText}>
              <Text style={[styles.helpLabel, { color: getColor('subText') }]}>Need Help?</Text>
              <Text style={[styles.helpMessage, { color: getColor('text') }]}>
                We are here for you
              </Text>
            </View>
          </View>
          <Text style={[styles.helpAction, { color: '#FFA500' }]}>Get Help {'>'}</Text>
        </View>
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

const styles = StyleSheet.create({
  helpCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  helpText: {
    marginLeft: 12,
  },
  helpLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  helpMessage: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpAction: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HelpCard;
