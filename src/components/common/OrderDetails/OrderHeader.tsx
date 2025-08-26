import Clipboard from '@react-native-clipboard/clipboard';
import React from 'react';
import { Alert, Platform, StyleSheet, ToastAndroid, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

interface OrderHeaderProps {
  orderId: string;
  onBackPress: () => void;
}

const OrderHeader: React.FC<OrderHeaderProps> = ({ orderId, onBackPress }) => {
  const { getColor } = useTheme();

  const handleCopyOrderId = () => {
    try {
      Clipboard.setString(orderId);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Order ID copied', ToastAndroid.SHORT);
      } else {
        Alert.alert('Copied', 'Order ID copied to clipboard');
      }
    } catch (_) {
      // no-op
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: getColor('background') }]}>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: getColor('card') }]}
        onPress={onBackPress}
        activeOpacity={0.7}
      >
        <Icon name="arrow-left" size={24} color={getColor('text')} />
      </TouchableOpacity>
      <View style={styles.titleRow}>
        <ThemeText variant="subtitle" style={styles.headerTitle} color={getColor('text')}>
          Order: #{orderId}
        </ThemeText>
        <TouchableOpacity
          style={styles.inlineCopyButton}
          onPress={handleCopyOrderId}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Copy Order ID"
        >
          <Icon name="content-copy" size={16} color={getColor('text')} />
        </TouchableOpacity>
      </View>
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  placeholder: {
    width: 40,
  },
  inlineCopyButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
});

export default OrderHeader;
