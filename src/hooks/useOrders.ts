import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/login/AuthProvider';
import useOrderStore from '../store/cart/orderStore';
import { Order, OrderCursor, OrderFilters } from '../types/order';

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
  const { authData } = useAuth();
  const hasFetchedRef = useRef(false);

  // Load orders on mount (requires auth) - only once per session
  useEffect(() => {
    if (authData?.jwt && authData?.phone && !hasFetchedRef.current && !loading) {
      hasFetchedRef.current = true;
      fetchOrders(authData.jwt, authData.phone, null, 10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authData?.jwt, authData?.phone]);

  // Memoized functions for better performance
  const loadOrders = useCallback(
    async (cursor?: OrderCursor | null, pageSize?: number) => {
      if (!authData?.jwt || !authData?.phone) return;
      await fetchOrders(authData.jwt, authData.phone, cursor ?? null, pageSize);
    },
    [fetchOrders, authData?.jwt, authData?.phone]
  );

  const loadMoreOrders = useCallback(
    async (pageSize?: number) => {
      if (!authData?.jwt || !authData?.phone) return;
      const currentCursor = pagination.cursor;
      if (currentCursor && pagination.hasMore) {
        await fetchOrders(authData.jwt, authData.phone, currentCursor, pageSize);
      }
    },
    [fetchOrders, pagination.cursor, pagination.hasMore, authData?.jwt, authData?.phone]
  );

  const refreshOrders = useCallback(
    async (pageSize?: number) => {
      if (!authData?.jwt || !authData?.phone) return;
      await fetchOrders(authData.jwt, authData.phone, null, pageSize);
    },
    [fetchOrders, authData?.jwt, authData?.phone]
  );

  const loadOrderById = useCallback(
    async (orderId: string, shopId?: string) => {
      if (!authData?.jwt || !authData?.phone) return;
      await fetchOrderById(orderId, authData.jwt, authData.phone, shopId);
    },
    [fetchOrderById, authData?.jwt, authData?.phone]
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
