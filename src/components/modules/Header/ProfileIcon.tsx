import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import ProfileAvatar from '../../../assets/svg/header/profile-avatar.svg';
import { RootStackParamList } from '../../../routes/AppStack';

interface ProfileIconProps {
  /**
   * Both variants render the same illustrated avatar; they differ only in size.
   * 'plain'  — 40px (Header.tsx, used on non-home screens).
   * 'avatar' — 36px, sized for the home header row.
   *
   * The SVG carries its own circular background, so no wrapper chrome is needed.
   */
  variant?: 'plain' | 'avatar';
}

export const ProfileIcon = ({ variant = 'plain' }: ProfileIconProps = {}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const size = variant === 'avatar' ? 36 : 40;

  return (
    <TouchableOpacity
      onPress={handleProfilePress}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
      activeOpacity={0.7}
    >
      <ProfileAvatar width={size} height={size} />
    </TouchableOpacity>
  );
};
