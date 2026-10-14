import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from '@react-native-vector-icons/feather';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../theme/ThemeContext';
import VoiceSearchModal from '../../search/VoiceSearchModal';

interface SearchBarProps {
  onPress?: () => void;
  onVoiceSearch?: (query: string) => void;
  placeholder?: string;
}

const SearchBarContent: React.FC<{
  placeholder?: string;
  onMicPress?: () => void;
}> = ({ placeholder, onMicPress }) => {
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
            backgroundColor: 'rgba(241, 242, 244, 0.75)',
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
        {onMicPress && (
          <TouchableOpacity
            onPress={onMicPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.micIcon}
          >
            <MaterialCommunityIcons name="microphone-outline" size={22} color={'#9CA3AF'} />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
};

export const SearchBar: React.FC<SearchBarProps> = ({ onPress, onVoiceSearch, placeholder }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

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

  const handleMicPress = () => {
    setVoiceModalVisible(true);
  };

  const handleVoiceSearch = (query: string) => {
    setVoiceModalVisible(false);
    if (onVoiceSearch) {
      onVoiceSearch(query);
    }
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
            <SearchBarContent placeholder={placeholder} onMicPress={handleMicPress} />
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <SearchBarContent placeholder={placeholder} onMicPress={handleMicPress} />
      )}

      <VoiceSearchModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onSearch={handleVoiceSearch}
      />
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
  micIcon: {
    marginLeft: 8,
    padding: 4,
  },
});
