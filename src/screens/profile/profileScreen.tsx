import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginButton from '../../components/common/LoginButton';
import { Fonts } from '../../components/common/theme/fonts';
import { useAuth } from '../../contexts/login/AuthProvider';
import deleteUserService from '../../services/deleteUserService';
import { useTheme } from '../../theme/ThemeContext';
import { AppNavigationProp } from '../../types/navigation';

// ---- Types ----
type FeatureItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  onPress: () => void;
};

const ProfileScreen = () => {
  const { signOut, authData } = useAuth();
  const { getColor } = useTheme();
  const navigation = useNavigation<AppNavigationProp>();
  const [isDangerZoneExpanded, setIsDangerZoneExpanded] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = React.useState(false);

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
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              await deleteUserService.deleteUser(authData.jwt);
              Alert.alert(
                'Account Deleted',
                'Your account has been successfully deleted. You will be logged out.',
                [{ text: 'OK', onPress: () => signOut() }]
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

  const handleConfirmLogout = () => {
    setIsLogoutModalVisible(false);
    signOut();
  };

  const accountFeatures: FeatureItem[] = isLoggedIn
    ? [
        {
          id: 'addresses',
          title: 'Addresses',
          subtitle: 'Manage delivery locations',
          icon: 'location-on',
          onPress: () => navigation.navigate('Address'),
        },
        {
          id: 'orders',
          title: 'Orders',
          subtitle: 'Track and review your orders',
          icon: 'inventory-2',
          onPress: () => navigation.navigate('Orders'),
        },
        {
          id: 'feedback',
          title: 'Feedback',
          subtitle: 'Tell us what you think',
          icon: 'chat-bubble-outline',
          onPress: () => navigation.navigate('Feedback'),
        },
      ]
    : [];

  const supportFeatures: FeatureItem[] = [
    {
      id: 'help',
      title: 'Help',
      subtitle: 'FAQs and support',
      icon: 'help-outline',
      onPress: () => navigation.navigate('HelpDesk'),
    },
    {
      id: 'about',
      title: 'About Us',
      subtitle: 'Learn more about the app',
      icon: 'info-outline',
      onPress: () => navigation.navigate('AboutUs'),
    },
  ];

  const initials = (authData?.username || '?')
    .trim()
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const renderFeatureRow = (item: FeatureItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.row,
        !isLast && [styles.rowDivider, { borderBottomColor: getColor('border') }],
      ]}
      onPress={item.onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: getColor('primary') + '1A' }]}>
        <MaterialIcons name={item.icon as any} size={20} color={getColor('primary')} />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitle, { color: getColor('text') }]}>{item.title}</Text>
        {!!item.subtitle && (
          <Text style={[styles.rowSubtitle, { color: getColor('text') }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
      </View>
      <MaterialIcons name="chevron-right" size={22} color={getColor('text')} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: getColor('background') }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: getColor('card') }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={22} color={getColor('text')} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: getColor('text') }]}>Profile</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.container}>
        {/* Profile header card */}
        {isLoggedIn ? (
          <View style={[styles.profileCard, { backgroundColor: getColor('card') }]}>
            <View style={[styles.avatar, { backgroundColor: getColor('primary') }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: getColor('text') }]} numberOfLines={1}>
                {authData?.username || 'Your Account'}
              </Text>
              {!!authData?.phone && (
                <Text style={[styles.profilePhone, { color: getColor('text') }]}>
                  {authData.phone}
                </Text>
              )}
            </View>
            <MaterialIcons name="verified" size={20} color={getColor('primary')} />
          </View>
        ) : (
          <View style={[styles.loginCard, { backgroundColor: getColor('card') }]}>
            <View style={[styles.avatar, { backgroundColor: getColor('border') }]}>
              <MaterialIcons name="person-outline" size={28} color={getColor('text')} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: getColor('text') }]}>Welcome</Text>
              <Text style={[styles.profilePhone, { color: getColor('text') }]}>
                Sign in to access your account
              </Text>
            </View>
            <LoginButton />
          </View>
        )}

        {/* Account section */}
        {accountFeatures.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: getColor('text') }]}>ACCOUNT</Text>
            <View style={[styles.sectionCard, { backgroundColor: getColor('card') }]}>
              {accountFeatures.map((item, i) =>
                renderFeatureRow(item, i === accountFeatures.length - 1)
              )}
            </View>
          </>
        )}

        {/* Support section */}
        <Text style={[styles.sectionLabel, { color: getColor('text') }]}>SUPPORT</Text>
        <View style={[styles.sectionCard, { backgroundColor: getColor('card') }]}>
          {supportFeatures.map((item, i) =>
            renderFeatureRow(item, i === supportFeatures.length - 1)
          )}
        </View>

        {/* Danger zone */}
        {isLoggedIn && (
          <View
            style={[
              styles.dangerCard,
              { backgroundColor: getColor('card'), borderColor: 'rgba(255, 68, 68, 0.25)' },
            ]}
          >
            <TouchableOpacity
              style={styles.dangerHeader}
              onPress={() => setIsDangerZoneExpanded(!isDangerZoneExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.dangerHeaderContent}>
                <MaterialIcons name="warning-amber" size={18} color="#FF4444" />
                <Text style={styles.dangerTitle}>Danger Zone</Text>
              </View>
              <MaterialIcons
                name={isDangerZoneExpanded ? 'expand-less' : 'expand-more'}
                size={22}
                color="#FF4444"
              />
            </TouchableOpacity>

            {isDangerZoneExpanded && (
              <TouchableOpacity
                style={[styles.dangerRow, { borderTopColor: 'rgba(255, 68, 68, 0.12)' }]}
                onPress={handleDeleteAccount}
                disabled={isDeletingAccount}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(255, 68, 68, 0.12)' }]}>
                  <MaterialIcons name="delete-forever" size={20} color="#FF4444" />
                </View>
                <Text style={styles.dangerRowText}>
                  {isDeletingAccount ? 'Deleting account…' : 'Delete Account'}
                </Text>
                <MaterialIcons name="chevron-right" size={22} color="#FF4444" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Logout */}
        {isLoggedIn && (
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: getColor('card') }]}
            onPress={() => setIsLogoutModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(255, 68, 68, 0.12)' }]}>
              <MaterialIcons name="logout" size={20} color="#FF4444" />
            </View>
            <Text style={styles.logoutText}>Log Out</Text>
            <MaterialIcons name="chevron-right" size={22} color="#FF4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Logout confirmation modal */}
      <Modal
        visible={isLogoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsLogoutModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: getColor('card') }]}>
            <View style={styles.modalIconWrap}>
              <MaterialIcons name="logout" size={26} color="#FF4444" />
            </View>

            <Text style={[styles.modalTitle, { color: getColor('text') }]}>Log Out</Text>
            <Text style={[styles.modalMessage, { color: getColor('text') }]}>
              Are you sure you want to log out of your account?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: getColor('border') }]}
                onPress={() => setIsLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelText, { color: getColor('text') }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 8,
  },
  topBarTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
    marginBottom: 24,
  },
  loginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
    marginBottom: 24,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  rowSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 1,
  },
  dangerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  dangerHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dangerTitle: {
    marginLeft: 8,
    fontSize: 13,
    fontFamily: Fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#FF4444',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dangerRowText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: '#FF4444',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: '#FF4444',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#FF4444',
  },
  modalConfirmText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: '#FFFFFF',
  },
});

export default ProfileScreen;
