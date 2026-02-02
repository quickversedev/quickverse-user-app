import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Collection } from '../../../data/collectionsData';
import { useNavigation } from '@react-navigation/native';

interface CollectionsGridProps {
    collections: Collection[];
    shopId?: string;
}

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 4;
const SPACING = 16;
// Calculate item width based on available width and spacing
const ITEM_WIDTH = (width - (SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

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
            <Text style={styles.sectionTitle}>Collections</Text>
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
                                resizeMode="cover"
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
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        color: '#111',
        fontFamily: 'serif', // Matching existing serene typography if used elsewhere
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 8, // Row/Column gap if supported (RN 0.71+), else use margin
    },
    itemContainer: {
        width: ITEM_WIDTH,
        marginBottom: 20,
        alignItems: 'center',
        marginRight: (width - SPACING * 2 - ITEM_WIDTH * COLUMN_COUNT) / (COLUMN_COUNT - 1) > 0 ? 0 : 4, // slight adjustment fallback
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
    },
    image: {
        width: '100%',
        height: '100%',
    },
    itemText: {
        fontSize: 12,
        textAlign: 'center',
        color: '#333',
        fontWeight: '500',
        lineHeight: 16,
    },
});

export default CollectionsGrid;
