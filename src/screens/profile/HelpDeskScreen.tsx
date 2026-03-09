import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import RaiseQueryModal from '../../components/common/RaiseQueryModal';
import SectionDivider from '../../components/common/SectionDivider';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useFAQs } from '../../hooks/useFAQs';
import useOrderStore from '../../store/cart/orderStore';
import { useTheme } from '../../theme/ThemeContext';
import { AppNavigationProp } from '../../types/navigation';
import { Order } from '../../types/order';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  title: string;
}

const HelpDeskScreen: React.FC = () => {
  const { getColor, getTypography } = useTheme();
  const { authData } = useAuth();
  const navigation = useNavigation<AppNavigationProp>();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showMoreOrders, setShowMoreOrders] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { orders, loading, fetchOrders, pagination } = useOrderStore();
  const [loadingMore, setLoadingMore] = useState(false);
  const { faqs, loading: faqsLoading, error: faqsError, refetch: refetchFAQs } = useFAQs();

  const isLoggedIn = Boolean(authData?.jwt && authData?.phone);

  // Get recent 3 orders initially, or more if showMoreOrders is true
  const displayedOrders = showMoreOrders ? orders : orders.slice(0, 3);

  // Guard to prevent fetching on every screen mount
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (
      !hasFetchedRef.current &&
      authData?.jwt &&
      authData?.phone &&
      !loading &&
      orders.length === 0
    ) {
      hasFetchedRef.current = true;
      // Always fetch 6 orders initially, but display only 3 until "Show More" is clicked
      fetchOrders(authData.jwt, authData.phone, null, 6);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authData?.jwt, authData?.phone]);

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  // Group FAQs by title for better organization
  const groupedFAQs = faqs.reduce(
    (acc, faq, index) => {
      const id = index.toString();
      if (!acc[faq.title]) {
        acc[faq.title] = [];
      }
      acc[faq.title].push({ ...faq, id });
      return acc;
    },
    {} as Record<string, FAQItem[]>
  );

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
      case 'processing':
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
      case 'processing':
        return 'PENDING';
      case 'confirmed':
        return 'CONFIRMED';

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
      marginVertical: 10,
    },
    orderCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      backgroundColor: getColor('card'),
      borderWidth: Platform.OS === 'ios' ? 1 : 0,
      borderColor: getColor('border'),
      // iOS shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      // Android elevation
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
    orderDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
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
      color: getColor('main'),
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
      backgroundColor: getColor('card'),
      borderWidth: Platform.OS === 'ios' ? 1 : 0,
      borderColor: getColor('border'),
      // iOS shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      // Android elevation
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
          <ThemeText variant="h2" color={getColor('text')} style={styles.headerTitle}>
            Help Desk
          </ThemeText>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Previous Orders Section (only when logged in) */}
          {isLoggedIn && (
            <>
              <SectionDivider text="PREVIOUS ORDERS" style={styles.sectionDivider} fontSize={16} />

              {loading && orders.length === 0 ? (
                <View style={[styles.orderCard, { backgroundColor: getColor('card') }]}>
                  <ThemeText
                    variant="body"
                    color={getColor('subText')}
                    style={styles.orderItemName}
                  >
                    Loading orders...
                  </ThemeText>
                </View>
              ) : displayedOrders.length === 0 ? (
                <View style={[styles.orderCard, { backgroundColor: getColor('card') }]}>
                  <ThemeText
                    variant="body"
                    color={getColor('subText')}
                    style={styles.orderItemName}
                  >
                    No orders found
                  </ThemeText>
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
                        <ThemeText
                          variant="subtitle"
                          color={getColor('text')}
                          style={styles.orderId}
                        >
                          Order: #{order.orderId}
                        </ThemeText>
                      </View>
                      <ThemeText
                        variant="body"
                        color={getColor('text')}
                        style={styles.orderItemName}
                      >
                        {order.items[0]?.name || 'Order Items'}
                      </ThemeText>
                      <View style={styles.orderDateContainer}>
                        <ThemeText
                          variant="caption"
                          color={getColor('subText')}
                          style={styles.orderDate}
                        >
                          {formatOrderDate(order.orderDate)}
                        </ThemeText>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(order.status) },
                          ]}
                        >
                          <ThemeText variant="small" color="white" style={styles.statusText}>
                            {getStatusText(order.status)}
                          </ThemeText>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {!showMoreOrders && orders.length > 3 && pagination.hasMore && (
                    <TouchableOpacity
                      style={[styles.showMoreButton, { borderColor: getColor('main') }]}
                      onPress={handleShowMore}
                      activeOpacity={0.7}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <ActivityIndicator size="small" color={getColor('main')} />
                      ) : (
                        <ThemeText
                          variant="body"
                          color={getColor('main')}
                          style={styles.showMoreText}
                        >
                          SHOW MORE
                        </ThemeText>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </>
          )}

          {/* FAQs Section */}
          <SectionDivider text="FAQs" style={styles.sectionDivider} fontSize={16} />

          {faqsLoading ? (
            <View style={[styles.orderCard, { backgroundColor: getColor('card') }]}>
              <ThemeText variant="body" color={getColor('subText')} style={styles.orderItemName}>
                Loading FAQs...
              </ThemeText>
            </View>
          ) : faqsError ? (
            <View style={[styles.orderCard, { backgroundColor: getColor('card') }]}>
              <ThemeText variant="body" color={getColor('subText')} style={styles.orderItemName}>
                Failed to load FAQs. Please try again.
              </ThemeText>
              <TouchableOpacity
                style={[styles.showMoreButton, { borderColor: getColor('main') }]}
                onPress={refetchFAQs}
                activeOpacity={0.7}
              >
                <ThemeText variant="body" color={getColor('main')} style={styles.showMoreText}>
                  RETRY
                </ThemeText>
              </TouchableOpacity>
            </View>
          ) : faqs.length === 0 ? (
            <View style={[styles.orderCard, { backgroundColor: getColor('card') }]}>
              <ThemeText variant="body" color={getColor('subText')} style={styles.orderItemName}>
                No FAQs available
              </ThemeText>
            </View>
          ) : (
            Object.entries(groupedFAQs).map(([title, faqList]) => (
              <View key={title}>
                <ThemeText
                  variant="subtitle"
                  color={getColor('text')}
                  style={[
                    styles.sectionTitle,
                    { fontSize: getTypography('subtitle'), marginTop: 16, marginBottom: 8 },
                  ]}
                >
                  {title}
                </ThemeText>
                {faqList.map(faq => {
                  const isExpanded = expandedFAQ === faq.id;

                  return (
                    <View
                      key={faq.id}
                      style={[styles.faqItem, { backgroundColor: getColor('card') }]}
                    >
                      <TouchableOpacity
                        style={styles.faqHeader}
                        onPress={() => toggleFAQ(faq.id)}
                        activeOpacity={0.7}
                      >
                        <ThemeText
                          variant="body"
                          color={getColor('text')}
                          style={styles.faqQuestion}
                        >
                          {faq.question}
                        </ThemeText>
                        <Icon
                          name={isExpanded ? 'minus' : 'chevron-down'}
                          size={20}
                          color={getColor('subText')}
                        />
                      </TouchableOpacity>
                      {isExpanded && (
                        <View style={styles.faqAnswer}>
                          <ThemeText
                            variant="caption"
                            color={getColor('subText')}
                            style={styles.faqAnswerText}
                          >
                            {faq.answer}
                          </ThemeText>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          )}
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
