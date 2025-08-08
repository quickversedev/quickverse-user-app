import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeContext';

interface VendorTopBarProps {
  title: string;
  onBack: () => void;
  onFavoritePress?: () => void;
}

const VendorTopBar: React.FC<VendorTopBarProps> = ({ title, onBack, onFavoritePress }) => {
  const { getColor, getTypography } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingBottom: 0,
    },
    title: {
      color: getColor('text'),
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      flex: 1,
    },
    backButton: {
      marginRight: 12,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={onFavoritePress}>
        <MaterialCommunityIcons name="heart-outline" size={24} color={getColor('primary')} />
      </TouchableOpacity>
    </View>
  );
};

export default VendorTopBar;
