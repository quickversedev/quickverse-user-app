import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Dimensions, Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SectionDivider from '../../../components/common/SectionDivider';
import { Collection } from '../../../data/collectionsData';
import { useTheme } from '../../../theme/ThemeContext';

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
    const { getColor, getTypography } = useTheme();
    const [showAgeModal, setShowAgeModal] = useState(false);
    const [pendingCollection, setPendingCollection] = useState<Collection | null>(null);

    const handlePress = (collection: Collection) => {
        // Navigate to a screen where we can show products for this collection
        // Since the prompt didn't specify exactly where, we'll try 'CollectionDetails' or similar if it exists in your app,
        // otherwise fallback to something generic or just log.
        // For now, let's assume we might want to go to a product listing.
        // The user mentioned "collections will be list of various category grouped", so effectively a filter.
        console.log('Pressed collection:', collection.name);
        console.log('Collection Categories:', JSON.stringify(collection.categories.map(c => ({ name: c.name, id: c.id })), null, 2));

        const isPanCorner = collection.name.toLowerCase().includes('pan corner');
        if (isPanCorner) {
            setPendingCollection(collection);
            setShowAgeModal(true);
            return;
        }

        startNavigation(collection);
    };

    const handleConfirmAge = () => {
        setShowAgeModal(false);
        if (pendingCollection) {
            startNavigation(pendingCollection);
            setPendingCollection(null);
        }
    };

    const handleCancelAge = () => {
        setShowAgeModal(false);
        setPendingCollection(null);
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
                {collections.map((collection, index) => {
                    const isLastItem = index === collections.length - 1;
                    return (
                    <TouchableOpacity
                        key={collection.id}
                        style={[
                            styles.itemContainer,
                            isLastItem && { marginBottom: 54 }
                        ]}
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
                    );
                })}
            </View>

            {/* Age Verification Custom Modal */}
            <Modal
                transparent={true}
                visible={showAgeModal}
                animationType="fade"
                onRequestClose={handleCancelAge}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: getColor('card') }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: getColor('text'), fontSize: 20 }]}>Age Verification</Text>
                        </View>
                        <View style={styles.modalBody}>
                           <Text style={[styles.modalText, { color: getColor('subText'), fontSize: 16 }]}>
                               You must be 18 years of age or older to view these items. Are you 18 or older?
                           </Text>
                        </View>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={handleCancelAge}>
                                <Text style={styles.modalButtonCancelText}>No, I'm under 18</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: getColor('primary') }]} onPress={handleConfirmAge}>
                                <Text style={styles.modalButtonConfirmText}>Yes, I'm 18+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        marginBottom: 14,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 20,
        padding: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    modalHeader: {
        marginBottom: 16,
        alignItems: 'center',
    },
    modalTitle: {
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    modalBody: {
        marginBottom: 28,
        paddingHorizontal: 12,
    },
    modalText: {
        textAlign: 'center',
        lineHeight: 24,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#F3F4F6',
    },
    modalButtonCancelText: {
        color: '#4B5563',
        fontWeight: '600',
        fontSize: 15,
    },
    modalButtonConfirmText: {
        color: '#1F2937',
        fontWeight: '700',
        fontSize: 15,
    },
});

export default CollectionsGrid;
