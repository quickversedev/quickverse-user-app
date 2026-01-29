import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../theme/ThemeContext';
import { AppNavigationProp } from '../../../types/navigation';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns

const CategoryCards = () => {
    const navigation = useNavigation<AppNavigationProp>();
    const { theme } = useTheme();

    const handlePress = (category: string) => {
        navigation.navigate('Category', { categoryName: category });
    };

    return (
        <View style={styles.container}>
            <Card
                title="Food Delivery"
                subtitle="(Offer UX copy)"
                image={require('../../../assets/images/food_homeScreen-category.png')}
                onPress={() => handlePress('Food')}
                theme={theme}
            />
            <Card
                title="Grocery"
                subtitle="(Offer UX copy)"
                image={require('../../../assets/images/grocery_homeScreen-category.png')}
                onPress={() => handlePress('Grocery')}
                theme={theme}
            />
        </View>
    );
};

const Card = ({ title, subtitle, onPress, theme, image }: any) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.cardWrapper}
    >
        <LinearGradient
            colors={['#F9FAFB', '#FEDB51']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
                borderRadius: 16,
                padding: 1, // Border width
                flex: 1,
            }}
        >
            <View style={[styles.cardContent, { backgroundColor: theme.colors.card }]}>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.subText }]}>{subtitle}</Text>
                </View>
                {image && (
                    <Image
                        source={image}
                        style={styles.cardImage}
                        resizeMode="contain"
                    />
                )}
            </View>
        </LinearGradient>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    cardWrapper: {
        width: CARD_WIDTH,
        height: 140,
        borderRadius: 16,
        // Elevation/Shadow needs to be on wrapper or handled carefully with gradient
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    cardContent: {
        flex: 1,
        borderRadius: 15, // Slightly less than wrapper (16-1)
        padding: 16,
        justifyContent: 'space-between',
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
    cardImage: {
        position: 'absolute',
        bottom: -5,
        right: -2,
        width: 100,
        height: 100,
        borderBottomRightRadius: 15,
    }
});

export default CategoryCards;
