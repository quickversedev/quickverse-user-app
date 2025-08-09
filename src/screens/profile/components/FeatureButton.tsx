import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';

export type FeatureItem = {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
};

const FeatureButton = ({ item }: { item: FeatureItem }) => {
  const { getColor } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.featureButton, { backgroundColor: getColor('card') }]}
      onPress={item.onPress}
    >
      <View style={styles.featureContent}>
        <Icon name={item.icon} size={24} color={getColor('text')} />
        <Text style={[styles.featureText, { color: getColor('text') }]}>{item.title}</Text>
      </View>
      <Icon name="chevron-right" size={24} color={getColor('text')} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  featureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default FeatureButton;
