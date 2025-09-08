import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import axiosInstance, { apiCall } from '../config/api/axios.config';
import { getNotificationPermissionStatus } from '../utils/notificationUtils';

export interface DeviceInfoRequest {
  deviceId: string;
  deviceType: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  fcmToken: string;
  tokenType: string;
  lastActiveTimestamp: string;
  notificationEnabled: string;
  longitude?: number;
  latitude?: number;
  loginTimestamp: string;
}

export interface DeviceInfoResponse {
  success: boolean;
  message?: string;
}

class DeviceInfoService {
  /**
   * Get device information using react-native-device-info
   */
  private async getDeviceInfo(): Promise<Partial<DeviceInfoRequest>> {
    try {
      const [deviceId, uniqueId, brand, model, systemVersion, version] = await Promise.all([
        DeviceInfo.getDeviceId(),
        Platform.OS,
        DeviceInfo.getModel(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getVersion(),
        DeviceInfo.getUniqueId(),
        DeviceInfo.getBrand(),
        DeviceInfo.getModel(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getVersion(),
        DeviceInfo.getBuildNumber(),
        DeviceInfo.isTablet(),
      ]);

      return {
        deviceId: uniqueId || deviceId,
        deviceType: Platform.OS.toUpperCase(),
        deviceModel: `${brand} ${model}`.trim(),
        osVersion: systemVersion,
        appVersion: `${version}`,
        tokenType: 'FCM',
        lastActiveTimestamp: new Date().toISOString(),
        notificationEnabled: await getNotificationPermissionStatus(),
        loginTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return {};
    }
  }

  /**
   * Update device information to backend
   */
  async updateDeviceInfo(
    sessionKey: string,
    fcmToken: string,
    phone: string,
    longitude?: number,
    latitude?: number
  ): Promise<DeviceInfoResponse> {
    try {
      const deviceInfo = await this.getDeviceInfo();

      const requestData: DeviceInfoRequest = {
        deviceId: deviceInfo.deviceId || '',
        deviceType: Platform.OS.toUpperCase(),
        deviceModel: deviceInfo.deviceModel || '',
        osVersion: deviceInfo.osVersion || '',
        appVersion: deviceInfo.appVersion || '',
        fcmToken: fcmToken,
        tokenType: deviceInfo.tokenType || Platform.OS.toUpperCase(),
        lastActiveTimestamp: deviceInfo.lastActiveTimestamp || new Date().toISOString(),
        notificationEnabled: deviceInfo.notificationEnabled || 'true',
        longitude: longitude || undefined,
        latitude: latitude || undefined,
        loginTimestamp: deviceInfo.loginTimestamp || new Date().toISOString(),
      };

      const response = await apiCall(
        axiosInstance.post<DeviceInfoResponse>('/v1/updateDevice', requestData, {
          headers: {
            SessionKey: sessionKey,
            phone: phone,
          },
        })
      );

      return response;
    } catch (error) {
      console.error('Error updating device info:', error);
      throw error;
    }
  }

  /**
   * Get device info for debugging/logging purposes
   */
  async getDeviceInfoForLogging(): Promise<Record<string, any>> {
    try {
      const [
        uniqueId,
        brand,
        model,
        systemName,
        systemVersion,
        version,
        buildNumber,
        bundleId,
        isTablet,
        isEmulator,
        deviceName,
        manufacturer,
        apiLevel,
        totalMemory,
        batteryLevel,
        carrier,
      ] = await Promise.all([
        DeviceInfo.getUniqueId(),
        DeviceInfo.getBrand(),
        DeviceInfo.getModel(),
        DeviceInfo.getSystemName(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getVersion(),
        DeviceInfo.getBuildNumber(),
        DeviceInfo.getBundleId(),
        DeviceInfo.isTablet(),
        DeviceInfo.isEmulator(),
        DeviceInfo.getDeviceName(),
        DeviceInfo.getManufacturer(),
        DeviceInfo.getApiLevel(),
        DeviceInfo.getTotalMemory(),
        DeviceInfo.getBatteryLevel(),
        DeviceInfo.getCarrier(),
      ]);

      return {
        uniqueId,
        brand,
        model,
        systemName,
        systemVersion,
        version,
        buildNumber,
        bundleId,
        isTablet,
        isEmulator,
        deviceName,
        manufacturer,
        apiLevel,
        totalMemory,
        batteryLevel,
        carrier,
        platform: Platform.OS,
      };
    } catch (error) {
      console.error('Error getting device info for logging:', error);
      return {};
    }
  }
}

export default new DeviceInfoService();
