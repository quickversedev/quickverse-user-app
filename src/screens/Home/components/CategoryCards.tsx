import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { AppNavigationProp } from '../../../types/navigation';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns

const CategoryCards = () => {
    //   const navigation = useNavigation<AppNavigationProp>();
    const { theme } = useTheme();

    const handlePress = (category: string) => {
        console.log('Navigate to category:', category);
        // navigation.navigate('Explore'); // Optional: Navigate to Explore tab
    };

    return (
        <View style={styles.container}>
            <Card
                title="Food Delivery"
                subtitle="(Offer UX copy)"
                // color="#FF6B35" 
                // image={require('../../../assets/food.png')} 
                onPress={() => handlePress('food')}
                theme={theme}
            />
            <Card
                title="Grocery"
                subtitle="(Offer UX copy)"
                // color="#2D6A4F" 
                // image={require('../../../assets/grocery.png')} 
                onPress={() => handlePress('Grocery')}
                theme={theme}
            />
        </View>
    );
};

const Card = ({ title, subtitle, onPress, theme }: any) => (
    <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.card }]}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.subText }]}>{subtitle}</Text>
        </View>
        <View style={styles.imagePlaceholder}>
            {/* Placeholder for image */}
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.border }} />
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    card: {
        width: CARD_WIDTH,
        height: 140,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
    },
    imagePlaceholder: {
        alignSelf: 'flex-end',
        marginTop: 8,
    }
});

export default CategoryCards;
