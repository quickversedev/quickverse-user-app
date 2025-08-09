import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import BadgeTag from './BadgeTag';

const BadgeTagDemo: React.FC = () => {
  const { getColor, getTypography } = useTheme();

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: getColor('background'),
    },
    title: {
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginBottom: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: getTypography('subtitle'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12,
    },
    label: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      width: 80,
    },
    badgeContainer: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BadgeTag Demo</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Different Values (Vertical)</Text>
        <View style={styles.badgeContainer}>
          <BadgeTag value={50} />
          <BadgeTag value={25} />
          <BadgeTag value={75} />
          <BadgeTag value="SALE" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Different Colors</Text>
        <View style={styles.badgeContainer}>
          <BadgeTag value={30} color="#F44336" /> {/* Red */}
          <BadgeTag value={40} color="#4CAF50" /> {/* Green */}
          <BadgeTag value={60} color="#2196F3" /> {/* Blue */}
          <BadgeTag value={20} color="#FF9800" /> {/* Orange */}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Different Sizes</Text>
        <View style={styles.badgeContainer}>
          <BadgeTag value={50} size="small" />
          <BadgeTag value={50} size="medium" />
          <BadgeTag value={50} size="large" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vertical vs Horizontal</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Vertical:</Text>
          <BadgeTag value={50} orientation="vertical" />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Horizontal:</Text>
          <BadgeTag value={50} orientation="horizontal" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Styles</Text>
        <View style={styles.badgeContainer}>
          <BadgeTag value={50} style={{ transform: [{ rotate: '-15deg' }] }} />
          <BadgeTag value="HOT" color="#FF5722" style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );
};

export default BadgeTagDemo;
