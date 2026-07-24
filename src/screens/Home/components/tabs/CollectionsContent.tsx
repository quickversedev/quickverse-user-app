import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import {
  Collection,
  API_STORE_ID,
  fetchCollectionsFromApi,
} from '../../../../data/collectionsData';
import { RootStackParamList } from '../../../../routes/AppStack';
import { useTheme } from '../../../../theme/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const HORIZONTAL_PADDING = 16;
const NUM_COLUMNS = 4;
const cardWidth = (width - HORIZONTAL_PADDING * 2 - CARD_MARGIN * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

interface CollectionsContentProps {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

interface CollectionCardProps {
  collection: Collection;
  onPress: (collection: Collection) => void;
  width: number;
  theme: {
    colors: {
      text: string;
      subText: string;
      card: string;
      background: string;
    };
  };
}

const CollectionCard: React.FC<CollectionCardProps> = React.memo(
  ({ collection, onPress, width: cardW, theme }) => {
    return (
      <TouchableOpacity
        style={[styles.card, { width: cardW }]}
        onPress={() => onPress(collection)}
        activeOpacity={0.7}
      >
        <View style={[styles.imageContainer, { backgroundColor: '#F5F5F5' }]}>
          <Image source={{ uri: collection.image }} style={styles.cardImage} resizeMode="contain" />
        </View>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {collection.name}
        </Text>
      </TouchableOpacity>
    );
  }
);

CollectionCard.displayName = 'CollectionCard';

const CollectionsContentComponent: React.FC<CollectionsContentProps> = ({
  onScroll,
  scrollEventThrottle,
  contentContainerStyle,
  showsVerticalScrollIndicator,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const collectionsShopId = API_STORE_ID;

  const [sections, setSections] = React.useState<{ title: string; collections: Collection[] }[]>(
    []
  );
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!collectionsShopId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadCollections = async () => {
      try {
        setLoading(true);
        const fetchedSections = await fetchCollectionsFromApi(collectionsShopId);

        if (mounted) {
          setSections(fetchedSections);
        }
      } catch (error) {
        console.error('Failed to load collections:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCollections();

    return () => {
      mounted = false;
    };
  }, [collectionsShopId]);

  const handleCollectionPress = useCallback(
    (collection: Collection) => {
      navigation.navigate('CollectionDetail', { collection });
    },
    [navigation]
  );

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingVertical: 65,
        },
        sectionContainer: {
          marginBottom: 24,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginHorizontal: HORIZONTAL_PADDING,
          marginBottom: 12,
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: HORIZONTAL_PADDING,
        },
      }),
    [theme.colors.background, theme.colors.text]
  );

  const renderSection = useCallback(
    (section: { title: string; collections: Collection[] }, _index: number) => (
      <View key={section.title} style={themedStyles.sectionContainer}>
        <Text style={themedStyles.sectionTitle}>{section.title}</Text>
        <View style={themedStyles.grid}>
          {section.collections.map((collection, colIndex) => (
            <View
              key={collection.id}
              style={{
                marginRight: (colIndex + 1) % NUM_COLUMNS === 0 ? 0 : CARD_MARGIN,
                marginBottom: CARD_MARGIN,
              }}
            >
              <CollectionCard
                collection={collection}
                onPress={handleCollectionPress}
                width={cardWidth}
                theme={theme}
              />
            </View>
          ))}
        </View>
      </View>
    ),
    [themedStyles, handleCollectionPress, theme]
  );

  if (loading) {
    return (
      <View style={[themedStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.text} />
      </View>
    );
  }

  return (
    <Animated.ScrollView
      style={themedStyles.container}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    >
      {sections.map(renderSection)}
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 2,
  },
});

CollectionsContentComponent.displayName = 'CollectionsContent';

export const CollectionsContent = React.memo(CollectionsContentComponent);
