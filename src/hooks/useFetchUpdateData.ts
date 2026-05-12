import { useEffect, useState } from 'react';
import DeviceInfo from 'react-native-device-info';
import axiosInstance, { apiCall, getAuthHeader } from '../config/api/axios.config';

interface UpdateData {
  min_required_version: string;
  ios_url: string;
  android_url: string;
  latest_version: string;
  is_latest: boolean;
  update_required: boolean;
  os: 'ANDROID' | 'IOS';
  current_version: string;
  app_type: 'CUSTOMER' | 'TRANSPORTER' | 'CAPTAIN';
}

interface VersionResult {
  id: string;
  appType: string;
  os: 'ANDROID' | 'IOS';
  version: string;
  isActive: boolean;
  isLatest: boolean;
  createdAt: string;
}

interface MdxResponse {
  result?: VersionResult;
  error?: {
    errorCode?: string;
    errorMessage?: string;
  };
}

const useFetchUpdateData = () => {
  const APP_TYPE = 'CUSTOMER';

  const IOS_URL = 'https://apps.apple.com/in/app/quickverse/id6584528967';
  const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.quickverse';

  const [updateData, setUpdateData] = useState<UpdateData>({
    min_required_version: '',
    ios_url: IOS_URL,
    android_url: ANDROID_URL,
    latest_version: '',
    is_latest: true,
    update_required: false,
    os: 'ANDROID',
    current_version: '',
    app_type: APP_TYPE,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [retryCount, setRetryCount] = useState(0);

  const getOsFromDeviceInfo = (): 'ANDROID' | 'IOS' => {
    const systemName = (DeviceInfo.getSystemName() || '').toLowerCase();
    return systemName.includes('ios') ? 'IOS' : 'ANDROID';
  };

  const fetchUpdateData = async () => {
    setLoading(true);
    setError(null);

    try {
      const os = getOsFromDeviceInfo();
      const currentVersion = DeviceInfo.getVersion();

      const data = await apiCall<MdxResponse>(
        axiosInstance.get('/v1/getLatestVersion', {
          params: {
            appType: APP_TYPE,
            os,
            currentVersion,
          },
          headers: {
            Authorization: getAuthHeader(),
          },
        })
      );

      const result = data?.result;

      if (!result) {
        throw new Error('Invalid response: result is missing');
      }

      const latestVersion = result.version ?? '';
      const isLatest = Boolean(result.isLatest);

      setUpdateData({
        min_required_version: latestVersion,
        latest_version: latestVersion,
        ios_url: IOS_URL,
        android_url: ANDROID_URL,
        is_latest: isLatest,
        update_required: !isLatest,
        os,
        current_version: currentVersion,
        app_type: APP_TYPE,
      });
    } catch (err) {
      setError(err);
      console.error('Error fetching update data:', err);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => setRetryCount(prev => prev + 1);

  useEffect(() => {
    fetchUpdateData();
  }, [retryCount]);

  return { updateData, loading, error, retry };
};

export default useFetchUpdateData;
