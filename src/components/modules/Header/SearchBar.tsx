import React, { useRef } from 'react';
import { Animated, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';

interface SearchBarProps {
  onPress?: () => void;
}

const SearchBarContent: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.primary,
          shadowColor: theme.colors.primary,
        },
      ]}
    >
      <Icon name="magnify" size={22} color={theme.colors.subText} style={styles.icon} />
      <TextInput
        placeholder="Search for 'Shwarma'"
        placeholderTextColor={theme.colors.subText}
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
  );
};

export const SearchBar: React.FC<SearchBarProps> = ({ onPress }) => {
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
            <SearchBarContent />
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <SearchBarContent />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 8,
    marginVertical: 8,
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
