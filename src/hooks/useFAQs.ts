import { useCallback, useEffect, useState } from 'react';
import faqService, { FAQ } from '../services/faqService';

export const useFAQs = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFAQs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await faqService.getFAQs();
      setFaqs(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  return {
    faqs,
    loading,
    error,
    refetch: fetchFAQs,
  };
};
