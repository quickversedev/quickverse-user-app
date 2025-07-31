import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';

interface AddButtonProps {
  onPress: () => void;
  size?: 'small' | 'regular';
}

const AddButton: React.FC<AddButtonProps> = ({ onPress, size = 'regular' }) => {
  const { getColor, getTypography } = useTheme();

  const styles = StyleSheet.create({
    addButton: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      borderWidth: 1,
      borderColor: getColor('primary'),
      borderRadius: size === 'small' ? getTypography('small') : getTypography('caption'),
      minWidth: size === 'small' ? 50 : 70,
      height: size === 'small' ? 28 : 36,
      paddingHorizontal: 0,
      paddingVertical: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getColor('card'),
      zIndex: 3,
      shadowColor: getColor('shadow').color,
      shadowOffset: getColor('shadow').offset,
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
      elevation: 2,
    },
    addButtonText: {
      color: getColor('primary'),
      fontWeight: 'bold',
      fontSize: size === 'small' ? getTypography('small') : getTypography('caption'),
      marginLeft: 4,
      fontFamily: 'BricolageGrotesque-Regular',
    },
  });

  return (
    <TouchableOpacity style={styles.addButton} onPress={onPress}>
      {size === 'small' ? (
        <MaterialCommunityIcons name="plus" size={20} color={getColor('primary')} />
      ) : (
        <Text style={styles.addButtonText}>ADD +</Text>
      )}
    </TouchableOpacity>
  );
};

export default AddButton;
