import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../theme/ThemeContext';

type ProfileHeaderProps = {
  username?: string;
  phone?: string;
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ username, phone }) => {
  const { getColor } = useTheme();

  const formattedPhone = React.useMemo(() => {
    if (!phone) return '';
    const trimmed = String(phone).replace(/\s+/g, '');
    if (trimmed.startsWith('+91') && trimmed.length > 3) {
      return `+91 ${trimmed.slice(3)}`;
    }
    if (trimmed.startsWith('91') && trimmed.length > 2) {
      return `+91 ${trimmed.slice(2)}`;
    }
    if (trimmed.startsWith('+')) {
      // Add a space after the country code (first 3 chars) as a simple fallback
      return `${trimmed.slice(0, 3)} ${trimmed.slice(3)}`;
    }
    return `+${trimmed}`;
  }, [phone]);

  return (
    <View style={styles.userSection}>
      <View style={styles.userInfoContainer}>
        <View style={[styles.avatarContainer, { backgroundColor: getColor('card') }]}>
          <Icon name="account" size={40} color={getColor('text')} />
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: getColor('text') }]} numberOfLines={1}>
            {username || 'User'}
          </Text>
          {phone ? (
            <Text style={[styles.userPhone, { color: getColor('subText') }]} numberOfLines={1}>
              {formattedPhone}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
  },
  logo: {
    width: 40,
    height: 40,
    flexShrink: 0,
  },
});

export default ProfileHeader;
