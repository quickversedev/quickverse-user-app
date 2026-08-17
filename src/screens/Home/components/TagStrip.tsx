import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemeText } from '../../../components/common/theme/ThemeText';
import productsService from '../../../services/productsService';
import { useTheme } from '../../../theme/ThemeContext';
import { AppNavigationProp } from '../../../types/navigation';
import { ProductTagOption } from '../../../types/product';

const TagStrip: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<AppNavigationProp>();
  const [tags, setTags] = useState<ProductTagOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    productsService
      .fetchProductTags()
      .then(result => {
        if (!cancelled) setTags(result);
      })
      .catch(() => {
        // Silently fail — the strip just won't render
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const chipColors = useMemo(
    () => [
      { bg: '#FEF3C7', text: '#92400E' },
      { bg: '#DBEAFE', text: '#1E40AF' },
      { bg: '#D1FAE5', text: '#065F46' },
      { bg: '#FCE7F3', text: '#9D174D' },
      { bg: '#EDE9FE', text: '#5B21B6' },
      { bg: '#FEE2E2', text: '#991B1B' },
      { bg: '#E0F2FE', text: '#075985' },
      { bg: '#FEF9C3', text: '#854D0E' },
      { bg: '#F0FDF4', text: '#166534' },
      { bg: '#FFF7ED', text: '#9A3412' },
    ],
    []
  );

  if (tags.length === 0) return null;

  return (
    <View style={styles.container}>
      <ThemeText style={[styles.sectionTitle, { color: theme.colors.text }]}>
        What are you craving?
      </ThemeText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tags.map((tag, index) => {
          const color = chipColors[index % chipColors.length];
          return (
            <TouchableOpacity
              key={tag.id}
              style={[styles.chip, { backgroundColor: color.bg }]}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('TagProducts', {
                  tagCode: tag.id,
                  tagLabel: tag.label,
                })
              }
            >
              <ThemeText style={[styles.chipText, { color: color.text }]}>{tag.label}</ThemeText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default React.memo(TagStrip);
