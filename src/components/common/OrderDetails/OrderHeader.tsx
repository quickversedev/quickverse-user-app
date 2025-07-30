import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';

interface OrderHeaderProps {
  orderId: string;
  onBackPress: () => void;
}

const OrderHeader: React.FC<OrderHeaderProps> = ({ orderId, onBackPress }) => {
  const { getColor, getTypography } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: getColor('background') }]}>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: getColor('card') }]}
        onPress={onBackPress}
        activeOpacity={0.7}
      >
        <Icon name="arrow-left" size={24} color={getColor('text')} />
      </TouchableOpacity>
      <Text
        style={[
          styles.headerTitle,
          {
            color: getColor('text'),
            fontSize: getTypography('subtitle'),
            fontFamily: 'BricolageGrotesque-Regular',
          },
        ]}
      >
        Order: #{orderId}
      </Text>
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
  placeholder: {
    width: 40,
  },
});

export default OrderHeader;
