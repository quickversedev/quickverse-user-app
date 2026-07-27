import Icon from '@react-native-vector-icons/material-design-icons';
import React, { useState } from 'react';
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
import { useAuth } from '../../contexts/login/AuthProvider';
import orderFeedbackService from '../../services/api/orderFeedbackService';
import { useTheme } from '../../theme/ThemeContext';
import { Fonts } from './theme/fonts';
import { ThemeText } from './theme/ThemeText';

export interface OrderFeedback {
  id?: string;
  feedbackId?: string;
  orderId?: string;
  shopId?: string;
  customerId?: string;
  customerName?: string;
  mobileNumber?: string;
  type: 'REVIEW' | 'COMPLAINT';
  rating?: number;
  complaintCategory?: string | null;
  message: string;
  attachmentUrl?: string | null;
  status?: string;
  adminReply?: string | null;
  createdAt?: number;
  updatedAt?: number | null;
}

interface RaiseQueryModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  shopId?: string;
  orderDate: string;
  customerName: string;
  orderStatus: string;
  /** If the order already has a complaint on it, we show a read-only
   * status view instead of the submission form, and block re-submission. */
  existingComplaint?: OrderFeedback | null;
  onRefresh?: () => void;
}

interface IssueCategory {
  id: string;
  label: string;
  icon: string;
}

const ISSUE_CATEGORIES: IssueCategory[] = [
  { id: 'food_quality', label: 'Food Quality', icon: 'silverware-fork-knife' },
  { id: 'wrong_item', label: 'Wrong Item', icon: 'swap-horizontal' },
  { id: 'missing_item', label: 'Missing Item', icon: 'package-variant-closed' },
  { id: 'late_delivery', label: 'Late Delivery', icon: 'clock-alert-outline' },
  { id: 'packaging_issue', label: 'Packaging Issue', icon: 'package-variant' },
  { id: 'payment_issue', label: 'Payment Issue', icon: 'credit-card-outline' },
  { id: 'refund_request', label: 'Refund Request', icon: 'cash-refund' },
  { id: 'others', label: 'Others', icon: 'dots-horizontal-circle-outline' },
];

const DESCRIPTION_MAX_LENGTH = 300;

const RaiseQueryModal: React.FC<RaiseQueryModalProps> = ({
  visible,
  onClose,
  orderId,
  shopId,
  orderDate,
  customerName,
  orderStatus,
  existingComplaint,
  onRefresh,
}) => {
  const { getColor, getTypography } = useTheme();
  const { authData } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | null>(null);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<any>(null);
  const [attachSheetVisible, setAttachSheetVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const [categoryError, setCategoryError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);

  const hasExistingComplaint = !!existingComplaint;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
    const formattedHours = hours % 12 || 12;
    return `${day} ${month} ${year}, ${formattedHours}:${minutes}${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  const getComplaintStatusColor = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'resolved':
        return '#10B981';
      case 'in_progress':
        return '#FF9800';
      default:
        return getColor('primary');
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const alreadyGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (alreadyGranted) return true;

      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        title: 'Camera Permission',
        message: 'We need access to your camera so you can attach a photo to your complaint.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      });

      if (result === PermissionsAndroid.RESULTS.GRANTED) return true;

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
    } catch {
      return false;
    }
  };

  const handlePickerResponse = (response: ImagePickerResponse) => {
    setAttachSheetVisible(false);
    if (response.didCancel || response.errorCode) return;
    const asset = response.assets?.[0];
    if (asset) {
      setFile({ uri: asset.uri, type: asset.type, fileName: asset.fileName });
    }
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

  const handleSelectCategory = (category: IssueCategory) => {
    setSelectedCategory(category);
    setShowCategorySheet(false);
    if (categoryError) setCategoryError(false);
  };

  const handleSubmit = async () => {
    if (hasExistingComplaint) return;
    if (!authData?.jwt || !authData?.phone) {
      Alert.alert('Login required', 'You must be logged in to submit a query.');
      return;
    }

    const hasCategoryError = !selectedCategory;
    const hasDescriptionError = !description.trim();
    setCategoryError(hasCategoryError);
    setDescriptionError(hasDescriptionError);
    if (hasCategoryError || hasDescriptionError) return;

    setIsSubmitting(true);
    try {
      await orderFeedbackService.submitOrderFeedback(
        {
          orderId,
          shopId,
          customerName: authData?.username || customerName || 'Customer',
          mobileNumber: authData.phone,
          type: 'COMPLAINT',
          complaintCategory: selectedCategory!.label,
          message: description.trim(),
        },
        file
      );
      setSuccessVisible(true);
      onRefresh?.();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setShowCategorySheet(false);
    setDescription('');
    setFile(null);
    setCategoryError(false);
    setDescriptionError(false);
    setIsSubmitting(false);
    onClose();
  };

  const handleSuccessClose = () => {
    setSuccessVisible(false);
    handleClose();
  };

  const isFormValid = Boolean(selectedCategory) && description.trim().length > 0;

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: getColor('background'),
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      // maxHeight: '92%',
      minHeight: '75%',
      overflow: 'hidden',
    },
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: getColor('border'),
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      // paddingHorizontal: 20,
      // paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    headerInfo: { flex: 1 },
    headerDate: {
      fontFamily: Fonts.medium,
      fontSize: 12,
      color: getColor('subText'),
      marginBottom: 2,
    },
    headerCustomer: {
      fontFamily: Fonts.medium,
      fontSize: 12,
      color: getColor('subText'),
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      marginLeft: 8,
    },
    statusText: {
      fontFamily: Fonts.bold,
      color: 'white',
      fontSize: 11,
    },
    titleBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    titleIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: getColor('background'),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    title: {
      fontFamily: Fonts.bold,
      fontSize: 18,
      color: getColor('text'),
      flex: 1,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: getColor('card'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Split into `content` (layout container, no bottom padding — that
    // belongs on contentContainerStyle so it actually extends the
    // scrollable area) and `scrollContent` (contentContainerStyle).
    // Previously paddingBottom lived on `style`, which does NOT add
    // scrollable space, so the submit button hugged the very bottom edge
    // of the sheet and got clipped by the device's home indicator / edge.
    content: {
      flex: 1,
      paddingHorizontal: 20,
      marginTop: 12,
    },
    scrollContent: {
      paddingBottom: Platform.OS === 'ios' ? 40 : 32,
    },
    formSection: { marginBottom: 8 },
    label: {
      fontFamily: Fonts.bold,
      fontSize: 14,
      color: getColor('text'),
      marginBottom: 8,
    },
    // Category input now mirrors FeedbackScreen's dropdownBtn styling —
    // same paddings/radius/border and a simple list sheet, instead of the
    // old icon-chip grid picker.
    categoryInput: {
      backgroundColor: getColor('card'),
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    categoryInputError: {
      borderColor: '#F44336',
    },
    categoryText: {
      fontFamily: Fonts.medium,
      fontSize: 14,
      color: getColor('text'),
      flex: 1,
    },
    placeholderText: {
      color: getColor('placeholder'),
    },
    errorText: {
      fontFamily: Fonts.medium,
      fontSize: 12,
      color: '#F44336',
      marginTop: 6,
    },
    descriptionInput: {
      backgroundColor: getColor('card'),
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 110,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: getColor('border'),
      fontFamily: Fonts.medium,
      fontSize: 14,
      color: getColor('text'),
    },
    charCount: {
      textAlign: 'right',
      marginTop: 6,
      fontFamily: Fonts.medium,
      fontSize: 12,
      color: getColor('subText'),
    },
    attachBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderWidth: 1,
      borderColor: getColor('primary'),
      borderRadius: 12,
      borderStyle: 'dashed',
      gap: 8,
    },
    attachBtnText: {
      fontFamily: Fonts.bold,
      fontSize: 14,
      color: getColor('primary'),
    },
    imagePreviewWrap: {
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: getColor('border'),
      backgroundColor: getColor('card'),
    },
    imagePreview: { width: '100%', height: 150 },
    imagePreviewRemoveBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
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
      fontFamily: Fonts.medium,
      fontSize: 12,
      color: getColor('subText'),
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
      fontFamily: Fonts.bold,
      fontSize: 12,
      color: getColor('primary'),
    },
    // Submit button now sits inside scrollContent's padded area and also
    // carries its own bottom margin, so there is always breathing room
    // beneath it regardless of device / safe-area height.
    submitButton: {
      backgroundColor: getColor('primary'),
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 4,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontFamily: Fonts.bold,
      fontSize: 16,
      color: '#FFFFFF',
    },
    sheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: getColor('card'),
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 24,
      maxHeight: '60%',
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    sheetTitle: {
      fontFamily: Fonts.bold,
      fontSize: 16,
      color: getColor('text'),
    },
    // Simple list-style options, matching FeedbackScreen's category dropdown —
    // replaces the old 2-column icon-chip grid.
    categoryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    categoryOptionSelected: {
      backgroundColor: getColor('background'),
    },
    categoryOptionIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 9,
      backgroundColor: getColor('background'),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    categoryOptionText: {
      fontFamily: Fonts.medium,
      fontSize: 14,
      color: getColor('text'),
      flex: 1,
    },
    categoryOptionTextSelected: {
      fontFamily: Fonts.bold,
      color: getColor('primary'),
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
      fontFamily: Fonts.medium,
      fontSize: 14,
      color: getColor('text'),
    },
    modalOverlayCentered: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    successCard: {
      width: '100%',
      backgroundColor: getColor('card'),
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
    },
    successIconWrap: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: getColor('primary'),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    successTitle: {
      fontFamily: Fonts.bold,
      fontSize: 17,
      color: getColor('text'),
      marginBottom: 8,
      textAlign: 'center',
    },
    successMessage: {
      fontFamily: Fonts.medium,
      fontSize: 14,
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
      fontFamily: Fonts.bold,
      color: '#FFFFFF',
      fontSize: 14,
    },
    // Existing-complaint (read-only) state
    existingBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    existingBadgeText: {
      fontFamily: Fonts.bold,
      fontSize: 12,
      marginLeft: 6,
    },
    existingCard: {
      backgroundColor: getColor('card'),
      borderRadius: 12,
      borderWidth: 1,
      borderColor: getColor('border'),
      padding: 16,
      marginBottom: 16,
    },
    existingCategoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    existingCategoryText: {
      fontFamily: Fonts.bold,
      fontSize: 14,
      color: getColor('text'),
      marginLeft: 8,
    },
    existingMessage: {
      fontFamily: Fonts.regular,
      fontSize: 14,
      color: getColor('text'),
      lineHeight: 20,
    },
    existingMeta: {
      fontFamily: Fonts.medium,
      fontSize: 12,
      color: getColor('subText'),
      marginTop: 10,
    },
    closeOutlineBtn: {
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: getColor('primary'),
    },
    closeOutlineBtnText: {
      fontFamily: Fonts.bold,
      fontSize: 14,
      color: getColor('primary'),
    },
    replyBoxLike: {
      marginTop: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: getColor('border'),
      backgroundColor: getColor('background'),
      padding: 12,
    },
    replyLabelLike: {
      fontFamily: Fonts.bold,
      fontSize: 12,
      color: getColor('primary'),
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
  });

  const renderExistingComplaint = () => (
    <View style={styles.content}>
      <View style={styles.existingBadgeRow}>
        <Icon
          name="check-circle"
          size={18}
          color={getComplaintStatusColor(existingComplaint?.status)}
        />
        <ThemeText
          style={[
            styles.existingBadgeText,
            { color: getComplaintStatusColor(existingComplaint?.status) },
          ]}
        >
          Query already submitted
          {existingComplaint?.status ? ` · ${existingComplaint.status.replace(/_/g, ' ')}` : ''}
        </ThemeText>
      </View>

      <View style={styles.existingCard}>
        <View style={styles.existingCategoryRow}>
          <Icon name="shape-outline" size={16} color={getColor('primary')} />
          <ThemeText style={styles.existingCategoryText}>
            {existingComplaint?.complaintCategory || 'Query'}
          </ThemeText>
        </View>
        <ThemeText style={styles.existingMessage}>{existingComplaint?.message}</ThemeText>
        {existingComplaint?.createdAt ? (
          <ThemeText style={styles.existingMeta}>
            Submitted {formatDate(new Date(existingComplaint.createdAt).toISOString())}
          </ThemeText>
        ) : null}

        {existingComplaint?.adminReply ? (
          <View style={[styles.replyBoxLike]}>
            <ThemeText style={styles.replyLabelLike}>Response from support</ThemeText>
            <ThemeText style={styles.existingMessage}>{existingComplaint.adminReply}</ThemeText>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.closeOutlineBtn} onPress={handleClose} activeOpacity={0.85}>
        <ThemeText style={styles.closeOutlineBtnText}>Close</ThemeText>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={e => e.stopPropagation()}
            >
              <View style={styles.dragHandle} />

              <View style={styles.header}>
                <View style={styles.titleBar}>
                  <View style={styles.titleIconWrap}>
                    <Icon name="message-alert-outline" size={20} color={getColor('primary')} />
                  </View>
                  <ThemeText variant="h2" style={styles.title}>
                    {hasExistingComplaint ? 'Your Query' : 'Raise a Query'}
                  </ThemeText>
                  <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <Icon name="close" size={18} color={getColor('text')} />
                  </TouchableOpacity>
                </View>
              </View>

              {hasExistingComplaint ? (
                renderExistingComplaint()
              ) : (
                <ScrollView
                  style={styles.content}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.formSection}>
                    <ThemeText style={styles.label}>Issue Category</ThemeText>
                    <TouchableOpacity
                      style={[styles.categoryInput, categoryError && styles.categoryInputError]}
                      onPress={() => setShowCategorySheet(true)}
                      activeOpacity={0.7}
                    >
                      <ThemeText
                        style={[styles.categoryText, !selectedCategory && styles.placeholderText]}
                        numberOfLines={1}
                      >
                        {selectedCategory ? selectedCategory.label : 'Select an issue category'}
                      </ThemeText>
                      <Icon name="chevron-down" size={20} color={getColor('placeholder')} />
                    </TouchableOpacity>
                    {categoryError && (
                      <ThemeText style={styles.errorText}>
                        Please select an issue category
                      </ThemeText>
                    )}
                  </View>

                  <View style={styles.formSection}>
                    <ThemeText style={styles.label}>Describe the Issue</ThemeText>
                    <TextInput
                      style={styles.descriptionInput}
                      placeholder="Tell us what went wrong..."
                      placeholderTextColor={getColor('placeholder')}
                      value={description}
                      onChangeText={text => {
                        setDescription(text);
                        if (descriptionError) setDescriptionError(false);
                      }}
                      multiline
                      maxLength={DESCRIPTION_MAX_LENGTH}
                      textAlignVertical="top"
                    />
                    <ThemeText style={styles.charCount}>
                      {description.length}/{DESCRIPTION_MAX_LENGTH}
                    </ThemeText>
                    {descriptionError && (
                      <ThemeText style={styles.errorText}>Please describe your issue</ThemeText>
                    )}
                  </View>

                  <View style={styles.formSection}>
                    <ThemeText style={styles.label}>Attach a Photo (optional)</ThemeText>
                    {file ? (
                      <View style={styles.imagePreviewWrap}>
                        <View>
                          <Image
                            source={{ uri: file.uri }}
                            style={styles.imagePreview}
                            resizeMode="cover"
                          />
                          <TouchableOpacity
                            style={styles.imagePreviewRemoveBtn}
                            onPress={() => setFile(null)}
                            accessibilityLabel="Remove attached image"
                          >
                            <Icon name="close" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.imagePreviewFooter}>
                          <ThemeText style={styles.imagePreviewFileName} numberOfLines={1}>
                            {file.fileName || 'Image attached'}
                          </ThemeText>
                          <TouchableOpacity
                            style={styles.changeImageBtn}
                            onPress={() => setAttachSheetVisible(true)}
                          >
                            <ThemeText style={styles.changeImageBtnText}>Change</ThemeText>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.attachBtn}
                        onPress={() => setAttachSheetVisible(true)}
                      >
                        <Icon name="camera-plus-outline" size={20} color={getColor('primary')} />
                        <ThemeText style={styles.attachBtnText}>
                          Attach a screenshot or photo
                        </ThemeText>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (!isFormValid || isSubmitting) && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <ThemeText style={styles.submitButtonText}>Submit Query</ThemeText>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Category picker sheet — simple list, same pattern as FeedbackScreen's
          category dropdown (single column, row per option) instead of the
          old 2-column icon-chip grid. */}
      <Modal
        visible={showCategorySheet}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setShowCategorySheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowCategorySheet(false)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <ThemeText style={styles.sheetTitle}>Select Issue Category</ThemeText>
              <TouchableOpacity onPress={() => setShowCategorySheet(false)}>
                <Icon name="close" size={20} color={getColor('text')} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ISSUE_CATEGORIES}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedCategory?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.categoryOption, isSelected && styles.categoryOptionSelected]}
                    onPress={() => handleSelectCategory(item)}
                    activeOpacity={0.7}
                  >
                    <ThemeText
                      style={[
                        styles.categoryOptionText,
                        isSelected && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {item.label}
                    </ThemeText>
                    {isSelected && <Icon name="check" size={18} color={getColor('primary')} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Attach image action sheet */}
      <Modal
        visible={attachSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setAttachSheetVisible(false)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <ThemeText style={styles.sheetTitle}>Attach Image</ThemeText>
              <TouchableOpacity onPress={() => setAttachSheetVisible(false)}>
                <Icon name="close" size={20} color={getColor('text')} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.attachSheetOption} onPress={handleTakePhoto}>
              <Icon name="camera" size={18} color={getColor('primary')} />
              <ThemeText style={styles.attachSheetOptionText}>Take Photo</ThemeText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachSheetOption} onPress={handleChooseFromLibrary}>
              <Icon name="image" size={18} color={getColor('primary')} />
              <ThemeText style={styles.attachSheetOptionText}>Choose from Gallery</ThemeText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success modal */}
      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlayCentered}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Icon name="check" size={28} color="#FFFFFF" />
            </View>
            <ThemeText style={styles.successTitle}>Query Submitted!</ThemeText>
            <ThemeText style={styles.successMessage}>
              We've received your query and will get back to you soon.
            </ThemeText>
            <TouchableOpacity style={styles.successBtn} onPress={handleSuccessClose}>
              <ThemeText style={styles.successBtnText}>OK</ThemeText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default RaiseQueryModal;
