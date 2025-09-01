import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LoginButton from '../../components/common/LoginButton';
import { useAuth } from '../../contexts/login/AuthProvider';
import deleteUserService from '../../services/deleteUserService';
import { useTheme } from '../../theme/ThemeContext';
import { AppNavigationProp } from '../../types/navigation';
import FeatureButton, { FeatureItem } from './components/FeatureButton';
import ProfileHeader from './components/ProfileHeader';

const ProfileScreen = () => {
  const { signOut, authData } = useAuth();
  const { getColor } = useTheme();
  const navigation = useNavigation<AppNavigationProp>();
  const [isDangerZoneExpanded, setIsDangerZoneExpanded] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);

  const isLoggedIn = Boolean(authData?.jwt);

  const handleDeleteAccount = async () => {
    if (!authData?.jwt) {
      Alert.alert('Error', 'You must be logged in to delete your account.');
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              await deleteUserService.deleteUser(authData.jwt);

              // Show success message
              Alert.alert(
                'Account Deleted',
                'Your account has been successfully deleted. You will be logged out.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Sign out the user
                      signOut();
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Failed to delete account. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const features: FeatureItem[] = [
    ...(isLoggedIn
      ? [
          {
            id: 'addresses',
            title: 'Addresses',
            icon: 'map-marker-outline',
            onPress: () => {
              navigation.navigate('Address');
            },
          },
          {
            id: 'orders',
            title: 'Orders',
            icon: 'package-variant',
            onPress: () => {
              navigation.navigate('Orders');
            },
          },
        ]
      : []),
    {
      id: 'help',
      title: 'Help',
      icon: 'help-circle-outline',
      onPress: () => {
        navigation.navigate('HelpDesk');
      },
    },
    {
      id: 'about',
      title: 'About Us',
      icon: 'information-outline',
      onPress: () => {
        navigation.navigate('AboutUs');
      },
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: getColor('background') }]}>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: getColor('card') }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" size={24} color={getColor('text')} />
        </TouchableOpacity>

        {isLoggedIn ? (
          <ProfileHeader username={authData?.username} phone={authData?.phone} />
        ) : (
          <LoginButton />
        )}

        {/* Features Section */}
        <View style={[styles.featuresContainer, { backgroundColor: getColor('card') }]}>
          {features.map(item => (
            <FeatureButton key={item.id} item={item} />
          ))}
        </View>

        {/* Delete Account Section */}
        {isLoggedIn && (
          <View style={[styles.deleteAccountContainer, { backgroundColor: getColor('card') }]}>
            <TouchableOpacity
              style={styles.deleteAccountHeader}
              onPress={() => setIsDangerZoneExpanded(!isDangerZoneExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.deleteAccountHeaderContent}>
                <Icon name="alert-circle-outline" size={20} color="#FF4444" />
                <Text style={[styles.deleteAccountTitle, { color: getColor('text') }]}>
                  Danger Zone
                </Text>
              </View>
              <Icon
                name={isDangerZoneExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#FF4444"
              />
            </TouchableOpacity>

            {isDangerZoneExpanded && (
              <TouchableOpacity
                style={[styles.deleteAccountButton, { borderColor: getColor('border') }]}
                onPress={handleDeleteAccount}
                disabled={isDeletingAccount}
                activeOpacity={0.7}
              >
                <View style={styles.featureContent}>
                  <Icon name="delete-forever" size={24} color="#FF4444" />
                  <Text style={styles.deleteAccountText}>
                    {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#FF4444" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Logout Button */}
        {isLoggedIn && (
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: getColor('card') }]}
            onPress={signOut}
          >
            <View style={styles.featureContent}>
              <Icon name="logout" size={24} color="#FF4444" />
              <Text style={[styles.logoutText]}>Logout</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#FF4444" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
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
  featuresContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#FF4444',
  },
  deleteAccountContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
  },
  deleteAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 68, 68, 0.1)',
  },
  deleteAccountHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteAccountTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  deleteAccountText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#FF4444',
  },
});

export default ProfileScreen;
