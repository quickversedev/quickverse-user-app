import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import SectionDivider from '../common/SectionDivider';

interface CategoryHeaderProps {
  title: string;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ title }) => {
  const { getColor, getTypography } = useTheme();

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: getColor('background'),
      paddingHorizontal: 16,
      marginTop: 16,
      marginBottom: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: getColor('primary'),
      fontWeight: 'bold',
      fontSize: getTypography('h2'),
      letterSpacing: 1,
    },
  });

  return (
    <View style={styles.container}>
      <SectionDivider text={title} textStyle={styles.text} />
    </View>
  );
};

export default CategoryHeader;
