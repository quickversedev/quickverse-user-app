/**
 * Comprehensive food and restaurant database for search suggestions
 * This database is used to provide smart search suggestions with partial word matching
 */

export interface FoodCategory {
  name: string;
  items: string[];
  priority: number;
}

export const searchSuggestionsDatabase = {
  // Popular food items with high search frequency
  foods: [
    'Pizza',
    'Burger',
    'Sushi',
    'Pasta',
    'Chicken',
    'Fish',
    'Beef',
    'Lamb',
    'Rice',
    'Noodles',
    'Bread',
    'Sandwich',
    'Wrap',
    'Salad',
    'Soup',
    'Ice Cream',
    'Cake',
    'Cookie',
    'Brownie',
    'Donut',
    'Muffin',
    'Coffee',
    'Tea',
    'Juice',
    'Smoothie',
    'Milkshake',
    'Soda',
    'French Fries',
    'Onion Rings',
    'Nuggets',
    'Wings',
    'Tenders',
    'Shawarma',
    'Kebab',
    'Falafel',
    'Hummus',
    'Pita',
    'Gyro',
    'Taco',
    'Burrito',
    'Quesadilla',
    'Nachos',
    'Guacamole',
    'Curry',
    'Biryani',
    'Naan',
    'Roti',
    'Dal',
    'Paneer',
    'Sushi Roll',
    'Sashimi',
    'Ramen',
    'Udon',
    'Tempura',
    'Steak',
    'Ribs',
    'Brisket',
    'Pulled Pork',
    'BBQ',
    'Pancake',
    'Waffle',
    'Omelette',
    'Scrambled Eggs',
    'Bacon',
    'Cereal',
    'Oatmeal',
    'Yogurt',
    'Granola',
    'Smoothie Bowl',
  ],

  // Restaurant types and cuisines
  cuisines: [
    'Italian',
    'Chinese',
    'Japanese',
    'Indian',
    'Mexican',
    'Thai',
    'American',
    'French',
    'Mediterranean',
    'Greek',
    'Turkish',
    'Korean',
    'Vietnamese',
    'Lebanese',
    'Persian',
    'Moroccan',
    'Spanish',
    'Portuguese',
    'German',
    'Russian',
    'Polish',
    'Fast Food',
    'Fine Dining',
    'Casual Dining',
    'Street Food',
    'Vegetarian',
    'Vegan',
    'Gluten Free',
    'Halal',
    'Kosher',
  ],

  // Popular restaurant chains and brands
  restaurants: [
    "McDonald's",
    'KFC',
    'Pizza Hut',
    "Domino's",
    'Subway',
    'Burger King',
    "Wendy's",
    'Taco Bell',
    'Chipotle',
    'Starbucks',
    "Dunkin'",
    'Tim Hortons',
    'Costa Coffee',
    "Papa John's",
    'Little Caesars',
    'Pizza Express',
    "Nando's",
    'Wagamama',
    'Yo! Sushi',
    'Itsu',
    'Shake Shack',
    'Five Guys',
    'In-N-Out',
    'Whataburger',
  ],

  // Food categories and meal types
  categories: [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Dessert',
    'Snacks',
    'Appetizers',
    'Main Course',
    'Side Dishes',
    'Beverages',
    'Alcoholic Drinks',
    'Non-Alcoholic Drinks',
    'Hot Drinks',
    'Cold Drinks',
    'Fresh Juices',
    'Smoothies',
    'Milkshakes',
  ],

  // Dietary preferences and restrictions
  dietary: [
    'Vegetarian',
    'Vegan',
    'Gluten Free',
    'Dairy Free',
    'Nut Free',
    'Halal',
    'Kosher',
    'Low Carb',
    'Keto',
    'Paleo',
    'Organic',
    'Non-GMO',
    'Sugar Free',
    'Low Sodium',
  ],

  // Popular food descriptions and attributes
  attributes: [
    'Spicy',
    'Sweet',
    'Sour',
    'Salty',
    'Bitter',
    'Umami',
    'Fresh',
    'Organic',
    'Homemade',
    'Artisanal',
    'Gourmet',
    'Traditional',
    'Fusion',
    'Street Style',
    'Fine Dining',
    'Comfort Food',
    'Healthy',
    'Light',
    'Hearty',
    'Crispy',
    'Tender',
    'Juicy',
    'Creamy',
    'Crunchy',
    'Soft',
    'Chewy',
  ],
};

/**
 * Get all searchable terms from the database
 */
export const getAllSearchTerms = (): string[] => {
  const allTerms: string[] = [];

  Object.values(searchSuggestionsDatabase).forEach(category => {
    if (Array.isArray(category)) {
      allTerms.push(...category);
    }
  });

  return allTerms;
};

/**
 * Smart search function that matches partial words and provides suggestions
 */
export const getSmartSuggestions = (query: string, recentSearches: string[] = []): string[] => {
  if (!query.trim()) return [];

  const searchTerm = query.toLowerCase().trim();
  const allTerms = getAllSearchTerms();
  const suggestions: Array<{ term: string; score: number }> = [];

  // Add recent searches first (higher priority)
  recentSearches.forEach(recent => {
    if (recent.toLowerCase().includes(searchTerm)) {
      suggestions.push({ term: recent, score: 100 });
    }
  });

  // Search through all terms
  allTerms.forEach(term => {
    const termLower = term.toLowerCase();
    let score = 0;

    // Exact match gets highest score
    if (termLower === searchTerm) {
      score = 1000;
    }
    // Starts with query gets high score
    else if (termLower.startsWith(searchTerm)) {
      score = 500;
    }
    // Contains query gets medium score
    else if (termLower.includes(searchTerm)) {
      score = 200;
    }
    // Partial word matching (e.g., "piz" matches "Pizza")
    else if (searchTerm.length >= 2) {
      const words = termLower.split(' ');
      for (const word of words) {
        if (word.startsWith(searchTerm)) {
          score = 300;
          break;
        }
      }
    }

    if (score > 0) {
      suggestions.push({ term, score });
    }
  });

  // Sort by score (highest first) and remove duplicates
  const uniqueSuggestions = suggestions
    .sort((a, b) => b.score - a.score)
    .filter(
      (suggestion, index, self) =>
        self.findIndex(s => s.term.toLowerCase() === suggestion.term.toLowerCase()) === index
    )
    .slice(0, 10) // Limit to top 10 suggestions
    .map(suggestion => suggestion.term);

  return uniqueSuggestions;
};
