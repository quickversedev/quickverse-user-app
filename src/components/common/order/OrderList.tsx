import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Images } from '../../../assets';
import { useOrders } from '../../../hooks/useOrders';
import { useTheme } from '../../../theme/ThemeContext';
import { AppNavigationProp } from '../../../types/navigation';
import { Order } from '../../../types/order';

interface OrderListProps {
  onOrderPress?: (order: Order) => void;
  showStatusFilter?: boolean;
  navigation?: AppNavigationProp;
}

const OrderList: React.FC<OrderListProps> = ({
  onOrderPress,
  showStatusFilter = true,
  navigation,
}) => {
  const { getColor } = useTheme();
  const { orders, loading, error, loadMoreOrders, refreshOrders, hasMoreOrders, isLoading } =
    useOrders();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('7 Days');

  const timeFilterOptions = useMemo(() => ['7 Days', '2 Weeks', '1 Month', '2 Month'], []);

  const filteredOrders = useMemo(() => orders, [orders]); // For now, show all orders

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  }, [refreshOrders]);

  const handleLoadMore = useCallback(() => {
    if (hasMoreOrders && !isLoading) {
      loadMoreOrders();
    }
  }, [hasMoreOrders, isLoading, loadMoreOrders]);

  const handleTimeFilter = useCallback((filter: string) => {
    setSelectedTimeFilter(filter);
    // TODO: Implement time-based filtering logic
  }, []);

  const handleOrderSomething = useCallback(() => {
    // Navigate to main app (home screen)
    if (navigation) {
      // Navigate to MainApp which contains the home screen
      navigation.navigate('MainApp');
    }
  }, [navigation]);

  const handleOrderPress = useCallback(
    (order: Order) => {
      if (onOrderPress) {
        onOrderPress(order);
      } else if (navigation) {
        navigation.navigate('OrderDetails', { orderId: order.orderId });
      }
    },
    [onOrderPress, navigation]
  );

  const getStatusColor = useCallback((status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return { background: '#4CAF50', text: '#FFFFFF' };
      case 'cancelled':
        return { background: '#F44336', text: '#FFFFFF' };
      case 'pending':
        return { background: '#FF9800', text: '#FFFFFF' };
      case 'confirmed':
        return { background: '#2196F3', text: '#FFFFFF' };
      case 'preparing':
        return { background: '#9C27B0', text: '#FFFFFF' };
      case 'ready':
        return { background: '#00BCD4', text: '#FFFFFF' };
      default:
        return { background: '#666666', text: '#FFFFFF' };
    }
  }, []);

  const renderOrderItem = useCallback(
    ({ item }: { item: Order }) => {
      const statusColors = getStatusColor(item.status);
      const statusText = item.status === 'delivered' ? 'SUCCESSFUL' : item.status.toUpperCase();

      return (
        <TouchableOpacity
          style={[styles.orderItem, { backgroundColor: getColor('card') }]}
          onPress={() => handleOrderPress(item)}
          activeOpacity={0.7}
        >
          {/* Left Side - Items Grid */}
          <View style={styles.itemsGrid}>
            {(() => {
              const items = item.items || [];
              const maxItems = 4;
              const displayItems = items.slice(0, maxItems);
              const remainingCount = items.length - maxItems;

              // Determine grid layout based on item count
              let gridLayout;
              if (displayItems.length === 1) {
                // 1 item: takes full 2x2 space
                gridLayout = {
                  rows: 1,
                  cols: 1,
                  itemStyle: { flex: 1, height: '100%' as any },
                };
              } else if (displayItems.length === 2) {
                // 2 items: each takes 1x2 space (side by side)
                gridLayout = {
                  rows: 1,
                  cols: 2,
                  itemStyle: { flex: 1, height: '100%' as any },
                };
              } else if (displayItems.length === 3) {
                // 3 items: first takes 1x2, other two take 1x1 each
                gridLayout = {
                  rows: 2,
                  cols: 2,
                  itemStyle: { flex: 1, height: '50%' as any },
                };
              } else {
                // 4+ items: standard 2x2 grid
                gridLayout = {
                  rows: 2,
                  cols: 2,
                  itemStyle: { flex: 1, height: '50%' as any },
                };
              }

              // Create grid items
              const gridItems = [];
              for (let i = 0; i < displayItems.length; i++) {
                const orderItem = displayItems[i];
                const isLargeItem = displayItems.length <= 2 && i === 0;

                gridItems.push(
                  <View
                    key={i}
                    style={[
                      styles.gridItem,
                      gridLayout.itemStyle,
                      isLargeItem &&
                        displayItems.length === 1 && {
                          width: '100%',
                          height: '100%',
                          marginRight: 0,
                          marginBottom: 0,
                        },
                      isLargeItem &&
                        displayItems.length === 2 && {
                          width: '50%',
                          height: '100%',
                          marginRight: 2,
                          marginBottom: 0,
                        },
                    ]}
                  >
                    {orderItem.image ? (
                      <Image source={{ uri: orderItem.image }} style={styles.gridItemImage} />
                    ) : (
                      <View
                        style={[
                          styles.gridItemPlaceholder,
                          { backgroundColor: getColor('border') },
                        ]}
                      />
                    )}
                  </View>
                );
              }

              // Add +X indicator only if there are more than 4 items
              if (remainingCount > 0) {
                gridItems.push(
                  <View
                    key="more"
                    style={[
                      styles.gridItem,
                      gridLayout.itemStyle,
                      { backgroundColor: getColor('border') },
                    ]}
                  >
                    <Text style={[styles.plusText, { color: getColor('text') }]}>
                      +{remainingCount}
                    </Text>
                  </View>
                );
              }

              // Render based on layout
              if (displayItems.length === 1) {
                return <View style={styles.singleItemContainer}>{gridItems}</View>;
              } else if (displayItems.length === 2) {
                return <View style={styles.twoItemsContainer}>{gridItems}</View>;
              } else {
                return (
                  <>
                    <View style={styles.gridRow}>{gridItems.slice(0, 2)}</View>
                    <View style={styles.gridRow}>{gridItems.slice(2, 4)}</View>
                  </>
                );
              }
            })()}
          </View>

          {/* Middle Section */}
          <View style={styles.orderInfo}>
            <Text style={[styles.orderId, { color: getColor('text') }]}>
              Order: #{item.orderId}
            </Text>
            <Text style={[styles.orderDate, { color: getColor('subText') }]}>
              {new Date(item.orderDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
              {' • '}
              {new Date(item.orderDate).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>
            <View style={[styles.statusTag, { backgroundColor: statusColors.background }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>{statusText}</Text>
            </View>
          </View>

          {/* Right Side */}
          <View style={styles.orderAmount}>
            <Text style={[styles.amountText, { color: getColor('text') }]}>
              INR. {item.totalAmount.toFixed(0)}
            </Text>
            <Text style={[styles.chevron, { color: getColor('subText') }]}>{'>'}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [getColor, getStatusColor, handleOrderPress]
  );

  const renderTimeFilter = useCallback(
    () => (
      <View style={styles.filterContainer}>
        <Text style={[styles.filterLabel, { color: getColor('text') }]}>From Last:</Text>
        <View style={styles.filterButtons}>
          {timeFilterOptions.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedTimeFilter === filter ? '#FFD700' : getColor('border'),
                },
              ]}
              onPress={() => handleTimeFilter(filter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: selectedTimeFilter === filter ? getColor('black') : getColor('text'),
                  },
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ),
    [getColor, timeFilterOptions, selectedTimeFilter, handleTimeFilter]
  );

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: getColor('background') }]}>
        <Text style={[styles.errorText, { color: getColor('error') }]}>Error: {error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: getColor('primary') }]}
          onPress={() => refreshOrders()}
        >
          <Text style={[styles.retryButtonText, { color: getColor('white') }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: getColor('background') }]}>
      {showStatusFilter && renderTimeFilter()}

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={useCallback((item: Order) => item.orderId, [])}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={getColor('text')}
            colors={[getColor('primary')]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
        ListFooterComponent={
          isLoading && hasMoreOrders ? (
            <ActivityIndicator size="large" color={getColor('primary')} style={styles.loader} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Image source={Images.orderZero} style={styles.emptyImage} resizeMode="contain" />
              <Text style={[styles.emptyTitle, { color: getColor('text') }]}>No orders yet?</Text>
              <Text style={[styles.emptySubtitle, { color: getColor('subText') }]}>
                Your belly&apos;s waiting. So is our delivery guy.
              </Text>
              <TouchableOpacity
                style={[styles.orderButton, { borderColor: getColor('primary') }]}
                activeOpacity={0.7}
                onPress={handleOrderSomething}
              >
                <Text style={[styles.orderButtonText, { color: getColor('text') }]}>
                  Order something nice
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  orderItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemsGrid: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  singleItemContainer: {
    width: '100%',
    height: '100%',
  },
  twoItemsContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    gap: 2,
  },
  gridRow: {
    flexDirection: 'row',
    flex: 1,
    gap: 2,
  },
  gridItem: {
    flex: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  gridItemPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  plusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderAmount: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loader: {
    marginVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'BricolageGrotesque-Regular',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    fontFamily: 'BricolageGrotesque-Regular',
  },
  orderButton: {
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'BricolageGrotesque-Regular',
  },
});

export default OrderList;
