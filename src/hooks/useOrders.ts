import { useCallback, useEffect } from 'react';
import useOrderStore from '../store/orderStore';
import { Order, OrderFilters } from '../types/order';

export const useOrders = () => {
  const {
    orders,
    selectedOrder,
    loading,
    error,
    filters,
    pagination,
    fetchOrders,
    fetchOrderById,
    setOrders,
    setSelectedOrder,
    setLoading,
    setError,
    setFilters,
    clearFilters,
    clearOrders,
    getOrdersByStatus,
    getFilteredOrders,
    getOrderById,
    getRecentOrders,
  } = useOrderStore();

  // Load orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Memoized functions for better performance
  const loadOrders = useCallback(
    async (cursor?: string | null, pageSize?: number) => {
      await fetchOrders(cursor, pageSize);
    },
    [fetchOrders]
  );

  const loadMoreOrders = useCallback(
    async (pageSize?: number) => {
      // Use the current cursor from pagination state for next page
      const currentCursor = pagination.cursor;
      if (currentCursor && pagination.hasMore) {
        await fetchOrders(currentCursor, pageSize);
      }
    },
    [fetchOrders, pagination.cursor, pagination.hasMore]
  );

  const refreshOrders = useCallback(
    async (pageSize?: number) => {
      // Reset to first page by passing null cursor
      await fetchOrders(null, pageSize);
    },
    [fetchOrders]
  );

  const loadOrderById = useCallback(
    async (orderId: string) => {
      await fetchOrderById(orderId);
    },
    [fetchOrderById]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<OrderFilters>) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  const resetFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  const resetOrders = useCallback(() => {
    clearOrders();
  }, [clearOrders]);

  const getOrdersByStatusFiltered = useCallback(
    (status: Order['status']) => {
      return getOrdersByStatus(status);
    },
    [getOrdersByStatus]
  );

  const getFilteredOrdersList = useCallback(() => {
    return getFilteredOrders();
  }, [getFilteredOrders]);

  const findOrderById = useCallback(
    (orderId: string) => {
      return getOrderById(orderId);
    },
    [getOrderById]
  );

  const getRecentOrdersList = useCallback(
    (limit?: number) => {
      return getRecentOrders(limit);
    },
    [getRecentOrders]
  );

  return {
    // State
    orders,
    selectedOrder,
    loading,
    error,
    filters,
    pagination,

    // Actions
    loadOrders,
    loadMoreOrders,
    refreshOrders,
    loadOrderById,
    setOrders,
    setSelectedOrder,
    setLoading,
    setError,
    updateFilters,
    resetFilters,
    resetOrders,

    // Computed values
    getOrdersByStatus: getOrdersByStatusFiltered,
    getFilteredOrders: getFilteredOrdersList,
    getOrderById: findOrderById,
    getRecentOrders: getRecentOrdersList,

    // Helper functions
    hasMoreOrders: pagination.hasMore,
    isLoading: loading,
    hasError: !!error,
    currentCursor: pagination.cursor,
  };
};
