import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePages } from '../../../hooks/usePages';
import { useTheme } from '../../../theme/ThemeContext';

interface PagesDemoProps {
  regionId?: string;
}

export const PagesDemo: React.FC<PagesDemoProps> = ({ regionId = 'IIMU-313001' }) => {
  const { pages, loading, error, fetchPages, retryFetch } = usePages();
  const { theme } = useTheme();

  useEffect(() => {
    fetchPages(regionId);
  }, [regionId]);

  const handleRetry = () => {
    retryFetch(regionId);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading pages configuration...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleRetry}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Pages Configuration</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Region: {regionId}
      </Text>

      {pages.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No pages configuration found
        </Text>
      ) : (
        pages.map((page, index) => (
          <View key={index} style={[styles.pageCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.pageName, { color: theme.colors.text }]}>{page.pageName}</Text>
            <Text style={[styles.posterLink, { color: theme.colors.textSecondary }]}>
              Poster: {page.posterLink}
            </Text>

            <Text style={[styles.promotionsTitle, { color: theme.colors.text }]}>
              Promotions ({page.promotions.length})
            </Text>

            {page.promotions.map((promotion, promoIndex) => (
              <View
                key={promoIndex}
                style={[styles.promotionCard, { backgroundColor: theme.colors.background }]}
              >
                <Text style={[styles.promotionTitle, { color: theme.colors.text }]}>
                  {promotion.title}
                </Text>
                <Text style={[styles.promotionSubtitle, { color: theme.colors.textSecondary }]}>
                  {promotion.subtitle}
                </Text>
                <Text style={[styles.promotionDetails, { color: theme.colors.textSecondary }]}>
                  Shop ID: {promotion.shopId} | Size: {promotion.size}
                </Text>
                <Text style={[styles.promotionDetails, { color: theme.colors.textSecondary }]}>
                  Background: {promotion.backgroundColor} | Banner:{' '}
                  {promotion.isBannerImage ? 'Yes' : 'No'}
                </Text>
                {promotion.imageURL && (
                  <Text style={[styles.promotionDetails, { color: theme.colors.textSecondary }]}>
                    Image: {promotion.imageURL}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 50,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  pageCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pageName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  posterLink: {
    fontSize: 14,
    marginBottom: 12,
  },
  promotionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  promotionCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  promotionSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  promotionDetails: {
    fontSize: 12,
    marginBottom: 2,
  },
});
