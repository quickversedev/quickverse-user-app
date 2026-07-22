import Icon from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ImagePickerResponse, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { useAuth } from '../../contexts/login/AuthProvider';
import feedbackService from '../../services/api/feedbackService';
import { useTheme } from '../../theme/ThemeContext';
import { AppNavigationProp } from '../../types/navigation';

const CATEGORIES = [
  'App Experience',
  'Delivery Experience',
  'Product Quality',
  'Payment Issue',
  'Bug Report',
  'Suggestion',
  'Complaint',
  'Other',
];

const MESSAGE_MAX_LENGTH = 500;
const OTHER_CATEGORY_MAX_LENGTH = 50;

interface FeedbackItem {
  id?: string | number;
  feedbackId?: string;
  category?: string;
  message: string;
  createdAt?: string | number;
  imageUrl?: string;
  attachmentUrl?: string;
  status?: 'NEW' | 'REVIEWED';
  adminReply?: string | null;
  reviewedAt?: string | null;
  repliedAt?: string | null;
}
type ViewMode = 'loading' | 'list' | 'form';

const FeedbackScreen = () => {
  const { getColor, getTypography, theme } = useTheme();
  const navigation = useNavigation<AppNavigationProp>();
  const { authData } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('loading');
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [fetchError, setFetchError] = useState(false);

  const [category, setCategory] = useState<string>('');
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);
  const [otherCategory, setOtherCategory] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<any>(null);

  const [categoryError, setCategoryError] = useState(false);
  const [otherCategoryError, setOtherCategoryError] = useState(false);
  const [messageError, setMessageError] = useState(false);

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [attachSheetVisible, setAttachSheetVisible] = useState(false);

  const mobileNumber = authData?.phone || '';

  const loadFeedbacks = useCallback(async () => {
    setViewMode('loading');
    setFetchError(false);
    try {
      const data = await feedbackService.getFeedbacksByMobileNumber(mobileNumber);
      const list: FeedbackItem[] = Array.isArray(data) ? data : [];
      setFeedbacks(list);
      setViewMode(list.length > 0 ? 'list' : 'form');
    } catch (error: any) {
      setFetchError(true);
      // Fall back to the submit form so the user is never stuck
      setViewMode('form');
    }
  }, [mobileNumber]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const resetForm = () => {
    setCategory('');
    setOtherCategory('');
    setMessage('');
    setFile(null);
    setCategoryError(false);
    setOtherCategoryError(false);
    setMessageError(false);
  };

  const handlePickerResponse = (response: ImagePickerResponse) => {
    setAttachSheetVisible(false);
    if (response.didCancel || response.errorCode) return;
    const asset = response.assets?.[0];
    if (asset) {
      setFile({
        uri: asset.uri,
        type: asset.type,
        fileName: asset.fileName,
      });
    }
  };

  // Android requires an explicit runtime request for CAMERA before launchCamera
  // will work reliably. iOS surfaces its own system prompt automatically, driven
  // by the NSCameraUsageDescription entry in Info.plist, so we just pass it through.
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const alreadyGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (alreadyGranted) return true;

      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        title: 'Camera Permission',
        message: 'We need access to your camera so you can attach a photo to your feedback.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      });

      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }

      if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Camera Permission Required',
          'Camera access is disabled for this app. Please enable it from Settings to take a photo.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }

      return false;
    } catch (error) {
      return false;
    }
  };

  const handleAttachImage = () => {
    setAttachSheetVisible(true);
  };

  const handleTakePhoto = async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      setAttachSheetVisible(false);
      return;
    }
    launchCamera({ mediaType: 'photo', quality: 0.8 }, handlePickerResponse);
  };

  const handleChooseFromLibrary = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, handlePickerResponse);
  };

  const handleSelectCategory = (cat: string) => {
    setCategory(cat);
    setCategoryDropdownVisible(false);
    if (categoryError) setCategoryError(false);
    if (otherCategoryError) setOtherCategoryError(false);
  };

  const handleSubmit = async () => {
    let hasError = false;

    setCategoryError(false);
    setOtherCategoryError(false);
    setMessageError(false);

    if (!category) {
      setCategoryError(true);
      hasError = true;
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (category === 'Other' && !otherCategory.trim()) {
      setOtherCategoryError(true);
      hasError = true;
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (!message.trim()) {
      setMessageError(true);
      hasError = true;
      scrollViewRef.current?.scrollTo({ y: 300, animated: true });
    }

    if (hasError) return;

    const finalCategory =
      category === 'Other' && otherCategory.trim() ? otherCategory.trim() : category;

    setLoading(true);
    try {
      const created = await feedbackService.submitFeedback(
        {
          customerName: authData?.username || 'Customer',
          mobileNumber,
          category: finalCategory,
          message,
        },
        file
      );

      const newItem: FeedbackItem = {
        id: created?.id ?? `local-${Date.now()}`,
        category: finalCategory,
        message,
        createdAt: created?.createdAt ?? new Date().toISOString(),
        imageUrl: created?.imageUrl,
      };

      setFeedbacks(prev => [newItem, ...prev]);
      resetForm();
      setSuccessModalVisible(true);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setSuccessModalVisible(false);
    setViewMode('list');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    safeArea: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    listWrapper: {
      flex: 1,
    },
    listContentContainer: {
      padding: 20,
      paddingBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      backgroundColor: getColor('card'),
      shadowColor: theme.colors.shadow.color,
      shadowOffset: {
        width: theme.colors.shadow.offset_width,
        height: theme.colors.shadow.offset_height,
      },
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 4,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: getColor('background'),
      marginRight: 16,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: {
        width: theme.colors.shadow.offset_width,
        height: theme.colors.shadow.offset_height,
      },
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 2,
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: 'BricolageGrotesque-Bold',
      color: getColor('text'),
      flex: 1,
    },
    content: {
      padding: 20,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    sectionTitle: {
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: 18,
      color: getColor('text'),
    },
    requiredMark: {
      color: 'red',
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: getTypography('h2'),
      marginLeft: 4,
    },
    subTitle: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('body'),
      color: getColor('placeholder'),
      marginBottom: 16,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    textInput: {
      borderWidth: 1,
      borderColor: getColor('border'),
      borderRadius: 12,
      padding: 16,
      minHeight: 100,
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('body'),
      color: getColor('text'),
      backgroundColor: getColor('card'),
      textAlignVertical: 'top',
      marginBottom: 8,
    },
    inputSmall: {
      minHeight: 50,
    },
    errorBorder: {
      borderColor: 'red',
    },
    errorText: {
      color: 'red',
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('body'),
      marginBottom: 16,
      marginTop: -4,
    },
    charCounter: {
      alignSelf: 'flex-end',
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('caption') ?? 12,
      color: getColor('placeholder'),
      marginBottom: 12,
      marginTop: -2,
    },
    charCounterLimit: {
      color: 'red',
    },
    attachBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderWidth: 1,
      borderColor: getColor('primary'),
      borderRadius: 12,
      borderStyle: 'dashed',
      marginBottom: 16,
      justifyContent: 'center',
      gap: 8,
    },
    attachBtnText: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('body'),
      color: getColor('primary'),
    },
    imagePreviewWrap: {
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: getColor('border'),
      backgroundColor: getColor('card'),
    },
    imagePreview: {
      width: '100%',
      height: 180,
    },
    imagePreviewRemoveBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imagePreviewFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: getColor('border'),
    },
    imagePreviewFileName: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('caption') ?? 12,
      color: getColor('placeholder'),
      flex: 1,
      marginRight: 8,
    },
    changeImageBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: getColor('background'),
    },
    changeImageBtnText: {
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: getTypography('caption') ?? 12,
      color: getColor('primary'),
    },
    submitBtn: {
      backgroundColor: getColor('primary'),
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitBtnText: {
      color: '#FFFFFF',
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: getTypography('h2'),
    },
    disabledBtn: {
      opacity: 0.6,
    },
    dropdownBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: getColor('border'),
      borderRadius: 12,
      padding: 16,
      backgroundColor: getColor('card'),
      marginBottom: 8,
    },
    dropdownBtnError: {
      borderColor: 'red',
    },
    dropdownBtnText: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('body'),
      color: getColor('text'),
    },
    dropdownPlaceholderText: {
      color: getColor('placeholder'),
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalOverlayCentered: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    dropdownSheet: {
      backgroundColor: getColor('card'),
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 24,
      maxHeight: '60%',
    },
    dropdownSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    dropdownSheetTitle: {
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: getTypography('h2'),
      color: getColor('text'),
    },
    dropdownOption: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    dropdownOptionSelected: {
      backgroundColor: getColor('background'),
    },
    dropdownOptionText: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('body'),
      color: getColor('text'),
    },
    dropdownOptionTextSelected: {
      fontFamily: 'BricolageGrotesque-Bold',
      color: getColor('primary'),
    },
    successCard: {
      width: '100%',
      backgroundColor: getColor('card'),
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
    },
    successIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: getColor('primary'),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    successTitle: {
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: getTypography('h2'),
      color: getColor('text'),
      marginBottom: 8,
      textAlign: 'center',
    },
    successMessage: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('body'),
      color: getColor('placeholder'),
      textAlign: 'center',
      marginBottom: 24,
    },
    successBtn: {
      backgroundColor: getColor('primary'),
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      width: '100%',
      alignItems: 'center',
    },
    successBtnText: {
      color: '#FFFFFF',
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: getTypography('body'),
    },
    feedbackCard: {
      backgroundColor: getColor('card'),
      borderRadius: 12,
      borderWidth: 1,
      borderColor: getColor('border'),
      padding: 16,
      marginBottom: 12,
    },
    feedbackStatusBadge: {
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
    },
    feedbackStatusBadgeNew: {
      backgroundColor: 'rgba(59,130,246,0.12)',
      borderColor: 'rgba(59,130,246,0.4)',
    },
    feedbackStatusBadgeReviewed: {
      backgroundColor: 'rgba(16,185,129,0.12)',
      borderColor: 'rgba(16,185,129,0.4)',
    },
    feedbackStatusTextNew: {
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: getTypography('caption') ?? 12,
      color: '#3B82F6',
    },
    feedbackStatusTextReviewed: {
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: getTypography('caption') ?? 12,
      color: '#10B981',
    },
    feedbackReplyBox: {
      marginTop: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(16,185,129,0.3)',
      backgroundColor: 'rgba(16,185,129,0.06)',
      padding: 12,
    },
    feedbackReplyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    feedbackReplyLabel: {
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: getTypography('caption') ?? 12,
      color: '#10B981',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    feedbackReplyText: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('body'),
      color: getColor('text'),
      lineHeight: 20,
    },
    feedbackReplyDate: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('caption') ?? 12,
      color: getColor('placeholder'),
      marginTop: 6,
    },
    feedbackAttachmentThumb: {
      width: '100%',
      height: 140,
      borderRadius: 10,
      marginTop: 10,
      backgroundColor: getColor('background'),
    },
    feedbackPendingNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    feedbackPendingNoteText: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('caption') ?? 12,
      color: getColor('placeholder'),
      fontStyle: 'italic',
    },
    feedbackCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    feedbackCategoryBadge: {
      backgroundColor: getColor('background'),
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    feedbackCategoryText: {
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: getTypography('caption') ?? 12,
      color: getColor('primary'),
    },
    feedbackDate: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('caption') ?? 12,
      color: getColor('placeholder'),
    },
    feedbackMessage: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('body'),
      color: getColor('text'),
    },
    submitAnotherBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: getColor('primary'),
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 10,
      marginBottom: 24,
    },
    submitAnotherBtnText: {
      color: '#FFFFFF',
      fontFamily: 'BricolageGrotesque-Bold',
      fontSize: getTypography('h2'),
    },
    attachSheetOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    attachSheetOptionText: {
      fontFamily: 'BricolageGrotesque-Medium',
      fontSize: getTypography('body'),
      color: getColor('text'),
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      borderTopWidth: 1,
      borderTopColor: getColor('border'),
      backgroundColor: getColor('card'),
    },
  });

  const renderRequiredSectionTitle = (title: string, required = false) => (
    <View style={styles.sectionTitleContainer}>
      <ThemeText variant="h2" style={styles.sectionTitle}>
        {title}
      </ThemeText>
      {required && <ThemeText style={styles.requiredMark}>*</ThemeText>}
    </View>
  );

  const renderFeedbackItem = ({ item }: { item: FeedbackItem }) => {
    const isReviewed = item.status === 'REVIEWED';

    return (
      <View style={styles.feedbackCard}>
        <View style={styles.feedbackCardHeader}>
          {!!item.category && (
            <View style={styles.feedbackCategoryBadge}>
              <ThemeText style={styles.feedbackCategoryText}>{item.category}</ThemeText>
            </View>
          )}
          {!!item.status && (
            <View
              style={[
                styles.feedbackStatusBadge,
                isReviewed ? styles.feedbackStatusBadgeReviewed : styles.feedbackStatusBadgeNew,
              ]}
            >
              <ThemeText
                style={
                  isReviewed ? styles.feedbackStatusTextReviewed : styles.feedbackStatusTextNew
                }
              >
                {isReviewed ? 'Reviewed' : 'Pending'}
              </ThemeText>
            </View>
          )}
        </View>

        {!!item.createdAt && (
          <ThemeText style={styles.feedbackDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </ThemeText>
        )}

        <ThemeText style={[styles.feedbackMessage, { marginTop: 6 }]}>{item.message}</ThemeText>

        {!!(item.imageUrl || item.attachmentUrl) && (
          <Image
            source={{ uri: item.imageUrl || item.attachmentUrl }}
            style={styles.feedbackAttachmentThumb}
            resizeMode="cover"
          />
        )}

        {item.adminReply ? (
          <View style={styles.feedbackReplyBox}>
            <View style={styles.feedbackReplyHeader}>
              <Icon name="reply" size={14} color="#10B981" />
              <ThemeText style={styles.feedbackReplyLabel}>Support Team Reply</ThemeText>
            </View>
            <ThemeText style={styles.feedbackReplyText}>{item.adminReply}</ThemeText>
            {!!item.repliedAt && (
              <ThemeText style={styles.feedbackReplyDate}>
                {new Date(item.repliedAt).toLocaleDateString()}
              </ThemeText>
            )}
          </View>
        ) : isReviewed ? (
          <View style={styles.feedbackPendingNote}>
            <Icon name="check-circle-outline" size={14} color={getColor('placeholder')} />
            <ThemeText style={styles.feedbackPendingNoteText}>
              Reviewed by our team, no reply needed
            </ThemeText>
          </View>
        ) : (
          <View style={styles.feedbackPendingNote}>
            <Icon name="clock-outline" size={14} color={getColor('placeholder')} />
            <ThemeText style={styles.feedbackPendingNoteText}>
              Awaiting review from our team
            </ThemeText>
          </View>
        )}
      </View>
    );
  };

  const renderForm = () => (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {renderRequiredSectionTitle('1. Feedback Category', true)}
      <TouchableOpacity
        style={[styles.dropdownBtn, categoryError && styles.dropdownBtnError]}
        onPress={() => setCategoryDropdownVisible(true)}
      >
        <ThemeText style={[styles.dropdownBtnText, !category && styles.dropdownPlaceholderText]}>
          {category || 'Select an option'}
        </ThemeText>
        <Icon name="chevron-down" size={20} color={getColor('placeholder')} />
      </TouchableOpacity>
      {categoryError && <ThemeText style={styles.errorText}>Please select a category</ThemeText>}

      <Modal
        visible={categoryDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCategoryDropdownVisible(false)}
        >
          <View style={styles.dropdownSheet}>
            <View style={styles.dropdownSheetHeader}>
              <ThemeText style={styles.dropdownSheetTitle}>Select Category</ThemeText>
              <TouchableOpacity onPress={() => setCategoryDropdownVisible(false)}>
                <Icon name="close" size={22} color={getColor('text')} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CATEGORIES}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    category === item && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => handleSelectCategory(item)}
                >
                  <ThemeText
                    style={[
                      styles.dropdownOptionText,
                      category === item && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {item}
                  </ThemeText>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {category === 'Other' && (
        <>
          <TextInput
            style={[styles.textInput, styles.inputSmall, otherCategoryError && styles.errorBorder]}
            placeholder="Please specify..."
            placeholderTextColor={getColor('placeholder')}
            value={otherCategory}
            maxLength={OTHER_CATEGORY_MAX_LENGTH}
            onChangeText={text => {
              setOtherCategory(text);
              if (otherCategoryError) setOtherCategoryError(false);
            }}
          />
          <ThemeText style={styles.charCounter}>
            {otherCategory.length}/{OTHER_CATEGORY_MAX_LENGTH}
          </ThemeText>
          {otherCategoryError && (
            <ThemeText style={styles.errorText}>Please specify the category</ThemeText>
          )}
        </>
      )}

      {renderRequiredSectionTitle('2. Feedback Message', true)}
      <TextInput
        style={[styles.textInput, messageError && styles.errorBorder]}
        placeholder="Tell us what happened or how we can improve."
        placeholderTextColor={getColor('placeholder')}
        multiline
        numberOfLines={4}
        value={message}
        maxLength={MESSAGE_MAX_LENGTH}
        onChangeText={text => {
          setMessage(text);
          if (messageError) setMessageError(false);
        }}
      />
      <ThemeText
        style={[
          styles.charCounter,
          message.length >= MESSAGE_MAX_LENGTH && styles.charCounterLimit,
        ]}
      >
        {message.length}/{MESSAGE_MAX_LENGTH}
      </ThemeText>
      {messageError && (
        <ThemeText style={styles.errorText}>Please enter your feedback message</ThemeText>
      )}

      {renderRequiredSectionTitle('3. Upload Screenshot')}
      <ThemeText style={styles.subTitle}>Attach a screenshot or photo (optional)</ThemeText>

      {file ? (
        <View style={styles.imagePreviewWrap}>
          <View>
            <Image source={{ uri: file.uri }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity
              style={styles.imagePreviewRemoveBtn}
              onPress={() => setFile(null)}
              accessibilityLabel="Remove attached image"
            >
              <Icon name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.imagePreviewFooter}>
            <ThemeText style={styles.imagePreviewFileName} numberOfLines={1}>
              {file.fileName || 'Image attached'}
            </ThemeText>
            <TouchableOpacity style={styles.changeImageBtn} onPress={handleAttachImage}>
              <ThemeText style={styles.changeImageBtnText}>Change</ThemeText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.attachBtn} onPress={handleAttachImage}>
          <Icon name="camera" size={24} color={getColor('primary')} />
          <ThemeText style={styles.attachBtnText}>Attach Image</ThemeText>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  // Fixed footer, rendered outside the ScrollView so it always stays pinned
  // to the bottom of the screen instead of scrolling with the form content.
  const renderSubmitFooter = () => (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.disabledBtn]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <ThemeText style={styles.submitBtnText}>Submit Feedback</ThemeText>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderList = () => (
    <View style={styles.listWrapper}>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContentContainer}
        data={feedbacks}
        keyExtractor={item => String(item.id)}
        renderItem={renderFeedbackItem}
        ListHeaderComponent={<ThemeText style={styles.subTitle}>Your previous feedback</ThemeText>}
        ListFooterComponent={
          <TouchableOpacity style={styles.submitAnotherBtn} onPress={() => setViewMode('form')}>
            <Icon name="plus" size={20} color="#FFFFFF" />
            <ThemeText style={styles.submitAnotherBtnText}>Submit Another Feedback</ThemeText>
          </TouchableOpacity>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: getColor('background') }]}>
      <View style={styles.container}>
        <View style={[styles.header, { borderBottomColor: getColor('border') }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: getColor('card') }]}
            onPress={() =>
              viewMode === 'form' && feedbacks.length > 0
                ? setViewMode('list')
                : navigation.goBack()
            }
          >
            <Icon name="arrow-left" size={24} color={getColor('text')} />
          </TouchableOpacity>
          <ThemeText variant="h2" color={getColor('text')} style={styles.headerTitle}>
            {viewMode === 'list' ? 'Your Feedback' : 'Submit Feedback'}
          </ThemeText>
        </View>

        {viewMode === 'loading' && (
          <View style={styles.centered}>
            <ActivityIndicator color={getColor('primary')} size="large" />
          </View>
        )}

        {viewMode === 'list' && renderList()}

        {viewMode === 'form' && (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            {renderForm()}
            {renderSubmitFooter()}
          </KeyboardAvoidingView>
        )}

        {/* Attach image action sheet */}
        <Modal
          visible={attachSheetVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAttachSheetVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setAttachSheetVisible(false)}
          >
            <View style={styles.dropdownSheet}>
              <View style={styles.dropdownSheetHeader}>
                <ThemeText style={styles.dropdownSheetTitle}>Attach Image</ThemeText>
                <TouchableOpacity onPress={() => setAttachSheetVisible(false)}>
                  <Icon name="close" size={22} color={getColor('text')} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.attachSheetOption} onPress={handleTakePhoto}>
                <Icon name="camera" size={22} color={getColor('primary')} />
                <ThemeText style={styles.attachSheetOptionText}>Take Photo</ThemeText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachSheetOption} onPress={handleChooseFromLibrary}>
                <Icon name="image" size={22} color={getColor('primary')} />
                <ThemeText style={styles.attachSheetOptionText}>Choose from Gallery</ThemeText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Custom success modal, replaces Alert.alert */}
        <Modal
          visible={successModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeSuccessModal}
        >
          <View style={styles.modalOverlayCentered}>
            <View style={styles.successCard}>
              <View style={styles.successIconWrap}>
                <Icon name="check" size={32} color="#FFFFFF" />
              </View>
              <ThemeText style={styles.successTitle}>Thank you for your feedback!</ThemeText>
              <ThemeText style={styles.successMessage}>
                We appreciate your suggestions and will use them to improve your experience.
              </ThemeText>
              <TouchableOpacity style={styles.successBtn} onPress={closeSuccessModal}>
                <ThemeText style={styles.successBtnText}>OK</ThemeText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default FeedbackScreen;
