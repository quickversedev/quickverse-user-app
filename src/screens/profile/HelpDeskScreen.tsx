import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RaiseQueryModal from '../../components/common/RaiseQueryModal';
import SectionDivider from '../../components/common/SectionDivider';
import { useAuth } from '../../contexts/login/AuthProvider';
import useOrderStore from '../../store/cart/orderStore';
import { useTheme } from '../../theme/ThemeContext';
import { AppNavigationProp } from '../../types/navigation';
import { Order } from '../../types/order';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'How do i contact customer care',
    answer:
      'You can contact our customer care team through email at support@example.com, by calling us at +91-XXXXXXXXXX (available Monday to Saturday, 9 AM - 6 PM IST), or by using the live chat feature in the "Help" section of our website/app. Our team is always happy to assist you, and we aim to respond to all queries within 24 hours.',
  },
  {
    id: '2',
    question: 'How do i track my order',
    answer:
      'You can track your order by going to the "Orders" section in your profile. Click on any order to see its current status and estimated delivery time. You will also receive SMS and email updates about your order status.',
  },
  {
    id: '3',
    question: 'What payment methods do you accept',
    answer:
      'We accept various payment methods including Cash on Delivery (COD), Credit/Debit cards, UPI, and digital wallets like Paytm, PhonePe, and Google Pay. All online payments are secured with SSL encryption.',
  },
  {
    id: '4',
    question: 'How do i cancel my order',
    answer:
      'You can cancel your order within 30 minutes of placing it. Go to the "Orders" section, select the order you want to cancel, and click on the "Cancel Order" button. Please note that orders that are already being prepared cannot be cancelled.',
  },
  {
    id: '5',
    question: 'What is your refund policy',
    answer:
      'We offer full refunds for cancelled orders and orders with quality issues. Refunds are processed within 3-5 business days and will be credited back to your original payment method. For COD orders, refunds are processed via bank transfer.',
  },
];

const HelpDeskScreen: React.FC = () => {
  const { getColor, getTypography } = useTheme();
  const { authData } = useAuth();
  const navigation = useNavigation<AppNavigationProp>();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>('2'); // Start with second FAQ expanded
  const [showMoreOrders, setShowMoreOrders] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { orders, loading, fetchOrders, pagination } = useOrderStore();
  const [loadingMore, setLoadingMore] = useState(false);

  // Get recent 3 orders initially, or more if showMoreOrders is true
  const displayedOrders = showMoreOrders ? orders : orders.slice(0, 3);

  useEffect(() => {
    if (authData?.jwt && authData?.phone) {
      // Always fetch 6 orders initially, but display only 3 until "Show More" is clicked
      fetchOrders(authData.jwt, authData.phone, null, 6);
    }
  }, [authData?.jwt, authData?.phone]);

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleShowMore = async () => {
    setShowMoreOrders(true);
    setLoadingMore(true);
    // If we have more orders to fetch and pagination allows it
    if (pagination.hasMore && authData?.jwt && authData?.phone) {
      try {
        await fetchOrders(authData.jwt, authData.phone, pagination.cursor, 3);
      } finally {
        setLoadingMore(false);
      }
    } else {
      setLoadingMore(false);
    }
  };

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowQueryModal(true);
  };

  const handleCloseQueryModal = () => {
    setShowQueryModal(false);
    setSelectedOrder(null);
  };

  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
    const formattedHours = hours % 12 || 12;

    return `${day} ${month} ${year} • ${formattedHours}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
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

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return 'SUCCESSFUL';
      case 'cancelled':
        return 'CANCELLED';
      case 'pending':
        return 'PENDING';
      case 'confirmed':
        return 'CONFIRMED';
      case 'preparing':
        return 'PREPARING';
      case 'ready':
        return 'READY';
      default:
        return String(status).toUpperCase();
    }
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      marginRight: 12,
    },
    headerTitle: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginTop: 24,
      marginBottom: 16,
    },
    sectionDivider: {
      marginTop: 16,
      marginBottom: 16,
    },
    orderCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: getColor('shadow').color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
      elevation: 3,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    orderId: {
      fontSize: getTypography('subtitle'),
      fontWeight: 'bold',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusText: {
      color: 'white',
      fontSize: getTypography('small'),
      fontWeight: '600',
    },
    orderItemName: {
      fontSize: getTypography('body'),
      marginBottom: 4,
    },
    orderDate: {
      fontSize: getTypography('caption'),
    },
    showMoreButton: {
      borderWidth: 1,
      borderColor: getColor('primary'),
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    showMoreText: {
      color: getColor('primary'),
      fontSize: getTypography('body'),
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: getColor('border'),
      marginVertical: 24,
    },
    faqItem: {
      borderRadius: 12,
      marginBottom: 8,
      overflow: 'hidden',
      shadowColor: getColor('shadow').color,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
      elevation: 2,
    },
    faqHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    faqQuestion: {
      fontSize: getTypography('body'),
      fontWeight: '500',
      flex: 1,
      marginRight: 12,
    },
    faqAnswer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    faqAnswerText: {
      fontSize: getTypography('caption'),
      lineHeight: getTypography('caption') * 1.4,
    },
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: getColor('background') }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: getColor('border') }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: getColor('card') }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={getColor('text')} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help Desk</Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Previous Orders Section */}
          <SectionDivider text="PREVIOUS ORDERS" style={styles.sectionDivider} fontSize={16} />

          {loading && orders.length === 0 ? (
            <View style={[styles.orderCard, { backgroundColor: getColor('card') }]}>
              <Text style={[styles.orderItemName, { color: getColor('subText') }]}>
                Loading orders...
              </Text>
            </View>
          ) : displayedOrders.length === 0 ? (
            <View style={[styles.orderCard, { backgroundColor: getColor('card') }]}>
              <Text style={[styles.orderItemName, { color: getColor('subText') }]}>
                No orders found
              </Text>
            </View>
          ) : (
            <>
              {displayedOrders.map(order => (
                <TouchableOpacity
                  key={order.orderId}
                  style={[styles.orderCard, { backgroundColor: getColor('card') }]}
                  onPress={() => handleOrderPress(order)}
                  activeOpacity={0.7}
                >
                  <View style={styles.orderHeader}>
                    <Text style={[styles.orderId, { color: getColor('text') }]}>
                      Order: #{order.orderId}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(order.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.orderItemName, { color: getColor('text') }]}>
                    {order.items[0]?.name || 'Order Items'}
                  </Text>
                  <Text style={[styles.orderDate, { color: getColor('subText') }]}>
                    {formatOrderDate(order.orderDate)}
                  </Text>
                </TouchableOpacity>
              ))}

              {!showMoreOrders && orders.length > 3 && pagination.hasMore && (
                <TouchableOpacity
                  style={[styles.showMoreButton, { borderColor: getColor('primary') }]}
                  onPress={handleShowMore}
                  activeOpacity={0.7}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={getColor('primary')} />
                  ) : (
                    <Text style={[styles.showMoreText, { color: getColor('primary') }]}>
                      SHOW MORE
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: getColor('border') }]} />

          {/* FAQs Section */}
          <SectionDivider text="FAQs" style={styles.sectionDivider} fontSize={16} />

          {FAQ_DATA.map(faq => {
            const isExpanded = expandedFAQ === faq.id;

            return (
              <View key={faq.id} style={[styles.faqItem, { backgroundColor: getColor('card') }]}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleFAQ(faq.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.faqQuestion, { color: getColor('text') }]}>
                    {faq.question}
                  </Text>
                  <Icon
                    name={isExpanded ? 'minus' : 'chevron-down'}
                    size={20}
                    color={getColor('subText')}
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.faqAnswer}>
                    <Text style={[styles.faqAnswerText, { color: getColor('subText') }]}>
                      {faq.answer}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Raise Query Modal */}
      {selectedOrder && (
        <RaiseQueryModal
          visible={showQueryModal}
          onClose={handleCloseQueryModal}
          orderId={selectedOrder.orderId}
          orderDate={selectedOrder.orderDate}
          customerName={selectedOrder.customerName}
          orderStatus={selectedOrder.status}
        />
      )}
    </SafeAreaView>
  );
};

export default HelpDeskScreen;
