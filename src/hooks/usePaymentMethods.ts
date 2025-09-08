import { useCallback, useEffect, useState } from 'react';
import {
  fetchEligiblePaymentMethods,
  getAvailablePaymentOptions,
  PaymentMethod,
} from '../services/paymentService';

interface UsePaymentMethodsProps {
  cartId?: string;
  shopId?: string;
  sessionKey?: string;
  phone?: string;
}

interface UsePaymentMethodsReturn {
  paymentMethods: PaymentMethod[];
  availableOptions: Array<{
    key: string;
    title: string;
    subtitle?: string;
    available: boolean;
  }>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePaymentMethods = ({
  cartId,
  shopId,
  sessionKey,
  phone,
}: UsePaymentMethodsProps): UsePaymentMethodsReturn => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    if (!cartId || !shopId || !sessionKey || !phone) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const methods = await fetchEligiblePaymentMethods(cartId, shopId, sessionKey, phone);
      setPaymentMethods(methods);
    } catch (err) {
      setError('Failed to fetch payment methods');
      console.error('Error in usePaymentMethods:', err);
    } finally {
      setLoading(false);
    }
  }, [cartId, shopId, sessionKey, phone]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const availableOptions = getAvailablePaymentOptions(paymentMethods);

  return {
    paymentMethods,
    availableOptions,
    loading,
    error,
    refetch: fetchPaymentMethods,
  };
};
