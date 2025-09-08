import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import SectionDivider from '../common/SectionDivider';

interface CategoryHeaderProps {
  title: string;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ title }) => {
  const { getColor } = useTheme();

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
  });

  return (
    <View style={styles.container}>
      <SectionDivider
        text={title}
        textStyle={{
          color: getColor('primary'),
          fontWeight: 'bold',
          letterSpacing: 1,
        }}
      />
    </View>
  );
};

export default CategoryHeader;
