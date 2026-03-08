import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeText } from '../common/theme/ThemeText';

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
  const { getColor } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingBottom: 0,
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
      <ThemeText variant="h2" color={getColor('text')} style={{ flex: 1 }}>
        {title}
      </ThemeText>
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
