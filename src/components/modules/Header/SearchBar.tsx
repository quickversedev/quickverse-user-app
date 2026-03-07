import React, { useRef } from 'react';
import { Animated, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../../theme/ThemeContext';

interface SearchBarProps {
  onPress?: () => void;
  placeholder?: string;
}

const SearchBarContent: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const { theme } = useTheme();

  return (
    <LinearGradient
      colors={['#F9FAFB', '#FEDB51']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }} // 180 degrees (approx)
      style={{
        borderRadius: 12,
        padding: 1, // acts as border width
        // shadow/elevation logic if needed (might need to move to wrapper or handle locally)
      }}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: '#F1F2F4', // Search Bar specific background
            borderColor: 'transparent', // Handled by gradient
            borderWidth: 0,
            shadowColor: 'transparent',
            elevation: 0,
          },
        ]}
      >
        <Icon name="search" size={22} color={'#9CA3AF'} style={styles.icon} />
        <TextInput
          placeholder={placeholder || 'Search for shops, products etc.'}
          placeholderTextColor={'#9CA3AF'}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: theme.typography.body,
              lineHeight: theme.typography.body * theme.typography.lineHeightMultiplier,
              fontFamily: theme.typography.fontFamily,
            },
          ]}
          editable={false}
          pointerEvents="none"
        />
      </View>
    </LinearGradient>
  );
};

export const SearchBar: React.FC<SearchBarProps> = ({ onPress, placeholder }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    // Add a small delay to show the press animation before navigation
    setTimeout(() => {
      onPress?.();
    }, 100);
  };

  return (
    <View style={styles.wrapper}>
      {onPress ? (
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            activeOpacity={1}
          >
            <SearchBarContent placeholder={placeholder} />
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <SearchBarContent placeholder={placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 0,
    marginVertical: 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderTopWidth: 0.2,
    borderWidth: 1,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderLeftWidth: 1.5,

    // borderStartWidth: 0.5,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 0,
  },
});
