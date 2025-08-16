import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeContext';

interface VendorTopBarProps {
  title: string;
  onBack: () => void;
  onFavoritePress?: () => void;
  onSearchPress?: () => void;
}

const VendorTopBar: React.FC<VendorTopBarProps> = ({
  title,
  onBack,
  onFavoritePress,
  onSearchPress,
}) => {
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
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      marginLeft: 16,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={onSearchPress}>
          <MaterialCommunityIcons name="magnify" size={24} color={getColor('text')} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onFavoritePress}>
          <MaterialCommunityIcons name="heart-outline" size={24} color={getColor('primary')} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VendorTopBar;
