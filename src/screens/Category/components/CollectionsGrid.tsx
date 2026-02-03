import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Collection } from '../../../data/collectionsData';
import { useNavigation } from '@react-navigation/native';
import SectionDivider from '../../../components/common/SectionDivider';

interface CollectionsGridProps {
    collections: Collection[];
    shopId?: string;
}

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 4;
const SPACING = 16;
const GAP = 8;
// Calculate item width; grid will be centered so use full width for item size
const ITEM_WIDTH = (width - (SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;
const GRID_WIDTH = COLUMN_COUNT * ITEM_WIDTH + (COLUMN_COUNT - 1) * GAP;

const CollectionsGrid: React.FC<CollectionsGridProps> = ({ collections, shopId }) => {
    const navigation = useNavigation<any>();

    const handlePress = (collection: Collection) => {
        // Navigate to a screen where we can show products for this collection
        // Since the prompt didn't specify exactly where, we'll try 'CollectionDetails' or similar if it exists in your app,
        // otherwise fallback to something generic or just log.
        // For now, let's assume we might want to go to a product listing. 
        // The user mentioned "collections will be list of various category grouped", so effectively a filter.
        console.log('Pressed collection:', collection.name);
        console.log('Collection Categories:', JSON.stringify(collection.categories.map(c => ({ name: c.name, id: c.id })), null, 2));

        startNavigation(collection);
    };

    const startNavigation = (collection: Collection) => {
        // Navigate to VendorProduct with collection param
        navigation.navigate('VendorProduct', {
            collection,
            shopId: shopId,
            // vendor: shopId ? { shopId } : undefined // Optional: pass minimal vendor obj if needed by types
        });
    };

    return (
        <View style={styles.container}>
            <SectionDivider text="Collections" style={styles.sectionDivider} />
            <View style={styles.grid}>
                {collections.map((collection) => (
                    <TouchableOpacity
                        key={collection.id}
                        style={styles.itemContainer}
                        onPress={() => handlePress(collection)}
                    >
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: collection.image }}
                                style={styles.image}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.itemText} numberOfLines={2}>
                            {collection.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        paddingHorizontal: SPACING,
        alignItems: 'center',
    },
    sectionDivider: {
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: GAP,
        width: GRID_WIDTH,
    },
    itemContainer: {
        width: ITEM_WIDTH,
        marginBottom: 20,
        alignItems: 'center',
    },
    imageContainer: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        marginBottom: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    itemText: {
        width: ITEM_WIDTH,
        fontSize: 12,
        textAlign: 'center',
        color: '#333',
        fontWeight: '500',
        lineHeight: 16,
        paddingHorizontal: 2,
    },
});

export default CollectionsGrid;
