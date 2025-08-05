import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
import ProductCard from './ProductCard';

interface SuggestedItem {
  id: string;
  name: string;
  price: number;
  mrp: number;
  rating: number;
  image: number;
  quantity: number;
}

interface SuggestedItemsProps {
  items: SuggestedItem[];
  onItemPress: (item: SuggestedItem) => void;
  onViewAllPress: () => void;
  onAdd: (item: SuggestedItem) => void;
  onIncrement: (item: SuggestedItem) => void;
  onDecrement: (item: SuggestedItem) => void;
}

const SuggestedItems: React.FC<SuggestedItemsProps> = ({
  items,
  onItemPress,
  onViewAllPress,
  onAdd,
  onIncrement,
  onDecrement,
}) => {
  const { getColor, getTypography } = useTheme();

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 20,
      backgroundColor: getColor('card'),
      margin: 16,
      marginBottom: 100,
      borderRadius: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    title: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewAllText: {
      fontSize: getTypography('small'),
      color: getColor('primary'),
      fontWeight: '500',
      marginRight: 4,
    },
    itemsList: {
      paddingLeft: 20,
    },
  });

  const renderItem = ({ item }: { item: SuggestedItem }) => (
    <ProductCard
      image={item.image}
      name={item.name}
      price={item.price}
      mrp={item.mrp}
      rating={item.rating || 0}
      quantity={item.quantity}
      onAdd={() => onAdd(item)}
      onIncrement={() => onIncrement(item)}
      onDecrement={() => onDecrement(item)}
      size="xs"
      onPress={() => onItemPress(item)}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add a little somethin&apos;</Text>
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAllPress}>
          <Text style={styles.viewAllText}>View All</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={getColor('primary')} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.itemsList}
      />
    </View>
  );
};

export default SuggestedItems;
