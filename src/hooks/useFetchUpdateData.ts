// src/hooks/useFetchUpdateData.js
import { useEffect, useState } from 'react';
import axiosInstance, { apiCall, getAuthHeader } from '../config/api/axios.config';

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
    // API endpoint /v3/appConfig does not exist yet (returns 404)
    // Uncomment when the backend implements this endpoint
    // setLoading(true);
    // setError(null);
    // try {
    //   const data = await apiCall<ApiResponse>(
    //     axiosInstance.get('/v3/appConfig', {
    //       headers: {
    //         Authorization: getAuthHeader(),
    //       },
    //     })
    //   );
    //   setUpdateData({
    //     min_required_version: data.minVersion,
    //     ios_url: data.appStoreURL,
    //     android_url: data.playStoreURL,
    //     latest_version: data.latestVersion,
    //   });
    // } catch (err) {
    //   setError(err);
    //   console.error('Error fetching update data:', err);
    // } finally {
    //   setLoading(false);
    // }
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
