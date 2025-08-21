import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeContext';

interface RaiseQueryModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  orderDate: string;
  customerName: string;
  orderStatus: string;
}

interface IssueCategory {
  id: string;
  label: string;
}

const ISSUE_CATEGORIES: IssueCategory[] = [
  { id: 'delivery_delay', label: 'Delay in Delivery' },
  { id: 'wrong_items', label: 'Wrong Items Received' },
  { id: 'quality_issue', label: 'Quality Issue' },
  { id: 'damaged_items', label: 'Damaged Items' },
  { id: 'missing_items', label: 'Missing Items' },
  { id: 'payment_issue', label: 'Payment Issue' },
  { id: 'refund_request', label: 'Refund Request' },
  { id: 'other', label: 'Other' },
];

const RaiseQueryModal: React.FC<RaiseQueryModalProps> = ({
  visible,
  onClose,
  orderId,
  orderDate,
  customerName,
  orderStatus,
}) => {
  const { getColor, getTypography } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select an issue category');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of the issue');
      return;
    }

    if (description.trim().length > 300) {
      Alert.alert('Error', 'Description cannot exceed 300 words');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to submit the query
      // console.log('Submitting query:', {
      //   orderId,
      //   category: selectedCategory,
      //   description: description.trim(),
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Success',
        'Your query has been submitted successfully. We will get back to you soon.',
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setShowCategoryDropdown(false);
    setDescription('');
    setIsSubmitting(false);
    onClose();
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: getColor('background'),
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      minHeight: '80%',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    headerInfo: {
      flex: 1,
    },
    headerDate: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      marginBottom: 2,
    },
    headerCustomer: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: getColor('card'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginLeft: 8,
    },
    statusText: {
      color: 'white',
      fontSize: getTypography('small'),
      fontWeight: '600',
    },
    titleBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: getColor('card'),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    title: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingBottom: 20,
      paddingTop: 8,
    },
    formSection: {
      marginBottom: 24,
    },
    label: {
      fontSize: getTypography('body'),
      color: getColor('subText'),
      marginBottom: 8,
      fontWeight: '500',
    },
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
    categoryText: {
      fontSize: getTypography('body'),
      color: selectedCategory ? getColor('text') : getColor('placeholder'),
      flex: 1,
      marginRight: 8,
    },
    dropdownContainer: {
      backgroundColor: getColor('card'),
      borderRadius: 12,
      marginTop: 4,
      borderWidth: 1,
      borderColor: getColor('border'),
      maxHeight: 200,
      width: '100%',
      position: 'absolute',
      top: 56, // below the input
      left: 0,
      zIndex: 1000,
      elevation: 5,
      shadowColor: getColor('shadow').color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
      overflow: 'hidden',
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      flexDirection: 'row',
      alignItems: 'center',
    },
    dropdownItemText: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      flex: 1,
    },
    descriptionInput: {
      backgroundColor: getColor('card'),
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      minHeight: 120,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: getColor('border'),
      fontSize: getTypography('body'),
      color: getColor('text'),
    },
    imageUploadArea: {
      backgroundColor: getColor('card'),
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: getColor('border'),
      borderStyle: 'dashed',
      minHeight: 120,
    },
    imageUploadIcon: {
      marginBottom: 8,
    },
    imageUploadText: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      fontWeight: '500',
    },
    submitButton: {
      backgroundColor: '#FFD700',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 16,
    },
    submitButtonText: {
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      color: '#000',
    },
    submitButtonDisabled: {
      backgroundColor: getColor('border'),
    },
    submitButtonTextDisabled: {
      color: getColor('subText'),
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header with order info */}
          <View style={[styles.header, { borderBottomColor: getColor('border') }]}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerDate}>{formatDate(orderDate)}</Text>
              <Text style={styles.headerCustomer}>By {customerName}</Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: getColor('card') }]}
              onPress={handleClose}
            >
              <Icon name="close" size={20} color={getColor('text')} />
            </TouchableOpacity>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orderStatus) }]}>
              <Text style={styles.statusText}>{orderStatus.toUpperCase()}</Text>
            </View>
          </View>

          {/* Title bar */}
          <View style={styles.titleBar}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: getColor('card') }]}
              onPress={handleClose}
            >
              <Icon name="arrow-left" size={24} color={getColor('text')} />
            </TouchableOpacity>
            <Text style={styles.title}>Raise a Query</Text>
          </View>

          {/* Form content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Issue Category */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Issue Category</Text>
              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  style={[
                    styles.categoryInput,
                    { backgroundColor: getColor('card'), borderColor: getColor('border') },
                  ]}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: selectedCategory ? getColor('text') : getColor('placeholder') },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedCategory ? selectedCategory.label : 'Select an issue category'}
                  </Text>
                  <Icon
                    name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={getColor('subText')}
                  />
                </TouchableOpacity>

                {showCategoryDropdown && (
                  <View
                    style={[
                      styles.dropdownContainer,
                      { backgroundColor: getColor('card'), borderColor: getColor('border') },
                    ]}
                  >
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {ISSUE_CATEGORIES.map(category => (
                        <TouchableOpacity
                          key={category.id}
                          style={[styles.dropdownItem, { borderBottomColor: getColor('border') }]}
                          onPress={() => {
                            setSelectedCategory(category);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <Text
                            style={[styles.dropdownItemText, { color: getColor('text') }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {category.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Issue Description */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Issue Description (Max 300 words.)</Text>
              <TextInput
                style={[
                  styles.descriptionInput,
                  {
                    backgroundColor: getColor('card'),
                    borderColor: getColor('border'),
                    color: getColor('text'),
                  },
                ]}
                placeholder="Describe your issue in detail..."
                placeholderTextColor={getColor('placeholder')}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={300}
                textAlignVertical="top"
              />
              <Text style={[styles.label, { textAlign: 'right', marginTop: 4 }]}>
                {description.length}/300
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.submitButtonText, isSubmitting && styles.submitButtonTextDisabled]}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Query'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default RaiseQueryModal;
