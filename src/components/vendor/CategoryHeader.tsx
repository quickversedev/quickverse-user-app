import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import SectionDivider from '../common/SectionDivider';

interface CategoryHeaderProps {
  title: string;
  isFirst?: boolean;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ title, isFirst = false }) => {
  const { getColor } = useTheme();

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: getColor('background'),
      paddingHorizontal: 8,
      marginTop: isFirst ? 0 : 12,
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
        fontSize={18}
      />
    </View>
  );
};

export default CategoryHeader;
