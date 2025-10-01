// src/hooks/useFetchUpdateData.js
import { AUTHORIZATION_KEY } from '@env';
import { useEffect, useState } from 'react';
import axiosInstance, { apiCall } from '../config/api/axios.config';

interface UpdateData {
  min_required_version: string;
  ios_url: string;
  android_url: string;
  latest_version: string;
}

interface ApiResponse {
  minVersion: string;
  appStoreURL: string;
  playStoreURL: string;
  latestVersion: string;
}

const useFetchUpdateData = () => {
  const [updateData, setUpdateData] = useState<UpdateData>({
    min_required_version: '',
    ios_url: '',
    android_url: '',
    latest_version: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0); // Track retry attempts

  const fetchUpdateData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiCall<ApiResponse>(
        axiosInstance.get('/v3/appConfig', {
          headers: {
            Authorization: AUTHORIZATION_KEY,
          },
        })
      );
      // const data = {
      //   minVersion: '1.0.0',
      //   appStoreURL: 'https://itunes.apple.com/app/id1542005830',
      //   playStoreURL: 'https://play.google.com/store/apps/details?id=com.example.app',
      //   latestVersion: '1.0.0',
      // };
      setUpdateData({
        min_required_version: data.minVersion,
        ios_url: data.appStoreURL,
        android_url: data.playStoreURL,
        latest_version: data.latestVersion,
      });
    } catch (err) {
      setError(err);
      console.error('Error fetching update data:', err);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    setRetryCount(prev => prev + 1); // Increment retry count
  };

  useEffect(() => {
    fetchUpdateData();
  }, [retryCount]); // Refetch data when retryCount changes

  return { updateData, loading, error, retry };
};

export default useFetchUpdateData;
