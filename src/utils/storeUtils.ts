/**
 * Utility functions for store opening/closing time management
 */

export interface StoreTimeConfig {
  openingTime: string; // Format: "HH:MM AM/PM" (12-hour)
  closingTime: string; // Format: "HH:MM AM/PM" (12-hour)
  storeActive: boolean; // Manual override flag
}

export interface StoreStatus {
  isOpen: boolean;
  reason: string;
  nextOpeningTime?: string;
  timeUntilOpen?: string;
}

/**
 * Converts time string (HH:MM AM/PM or HH.MM.SS) to minutes since midnight
 */
const timeToMinutes = (timeStr: string): number => {
  // Handle AM/PM format: "HH:MM AM/PM"
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    const timeParts = timeStr.split(' ');
    const time = timeParts[0];
    const period = timeParts[1];

    const [hours, minutes] = time.split(':').map(Number);
    let adjustedHours = hours;

    if (period === 'PM' && hours !== 12) {
      adjustedHours = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      adjustedHours = 0;
    }

    return adjustedHours * 60 + minutes;
  }

  // Handle legacy formats: "HH.MM.SS" and "HH:MM"
  let timeParts: string[];
  if (timeStr.includes('.')) {
    timeParts = timeStr.split('.');
  } else {
    timeParts = timeStr.split(':');
  }

  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);

  return hours * 60 + minutes;
};

/**
 * Converts minutes since midnight to time string (HH:MM)
 */
const _minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Gets current time in minutes since midnight
 */
const getCurrentTimeInMinutes = (): number => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

/**
 * Calculates time difference between two times in minutes
 */
const _getTimeDifference = (time1: number, time2: number): number => {
  // Handle overnight hours (e.g., 23:00 to 06:00)
  if (time1 > time2) {
    return 24 * 60 - time1 + time2;
  }
  return time2 - time1;
};

/**
 * Formats time difference into human-readable string
 */
const formatTimeDifference = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
};

/**
 * Determines if a store is currently open based on:
 * 1. storeActive flag (manual override)
 * 2. Current time vs opening/closing times
 * 3. Handles overnight hours (e.g., 11:00 PM to 6:00 AM)
 *
 * @param config - Store time configuration
 * @returns StoreStatus object with open status and details
 */
export const isStoreOpen = (config: StoreTimeConfig): StoreStatus => {
  const { openingTime, closingTime, storeActive } = config;

  // First check if store is manually disabled
  if (!storeActive) {
    return {
      isOpen: false,
      reason: 'Store is manually closed',
    };
  }

  try {
    // Validate time format (supports HH:MM AM/PM, HH:MM, and HH.MM.SS)
    const timeRegex = /^([0-1]?[0-9]|2[0-3])[.:][0-5][0-9]([.:][0-5][0-9])?$|^([0-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
    if (!timeRegex.test(openingTime) || !timeRegex.test(closingTime)) {
      return {
        isOpen: false,
        reason: 'Invalid time format. Use "HH:MM AM/PM" format (e.g., "9:30 AM", "2:45 PM")',
      };
    }

    const currentMinutes = getCurrentTimeInMinutes();
    const openingMinutes = timeToMinutes(openingTime);
    const closingMinutes = timeToMinutes(closingTime);

    let isOpen = false;
    let reason = '';
    let nextOpeningTime: string | undefined;
    let timeUntilOpen: string | undefined;

    // Handle overnight hours (e.g., 23:00 to 06:00)
    if (openingMinutes > closingMinutes) {
      // Store is open overnight
      isOpen = currentMinutes >= openingMinutes || currentMinutes < closingMinutes;

      if (isOpen) {
        reason = 'Store is open (overnight hours)';
      } else {
        reason = 'Store is closed';
        nextOpeningTime = openingTime;

        // Calculate time until opening
        if (currentMinutes < openingMinutes) {
          // Opening is later today
          const timeDiff = openingMinutes - currentMinutes;
          timeUntilOpen = formatTimeDifference(timeDiff);
        } else {
          // Opening is tomorrow
          const timeDiff = 24 * 60 - currentMinutes + openingMinutes;
          timeUntilOpen = formatTimeDifference(timeDiff);
        }
      }
    } else {
      // Regular hours (e.g., 09:00 to 18:00)
      isOpen = currentMinutes >= openingMinutes && currentMinutes < closingMinutes;

      if (isOpen) {
        reason = 'Store is open';
      } else {
        reason = 'Store is closed';

        if (currentMinutes < openingMinutes) {
          // Store opens later today
          nextOpeningTime = openingTime;
          const timeDiff = openingMinutes - currentMinutes;
          timeUntilOpen = formatTimeDifference(timeDiff);
        } else {
          // Store opens tomorrow
          nextOpeningTime = openingTime;
          const timeDiff = 24 * 60 - currentMinutes + openingMinutes;
          timeUntilOpen = formatTimeDifference(timeDiff);
        }
      }
    }

    return {
      isOpen,
      reason,
      nextOpeningTime,
      timeUntilOpen,
    };
  } catch (error) {
    return {
      isOpen: false,
      reason: 'Error calculating store hours',
    };
  }
};

/**
 * Gets store status with additional context
 */
export const getStoreStatus = (vendor: {
  storeActive: boolean;
  openingTime: string;
  closingTime: string;
}): StoreStatus => {
  return isStoreOpen({
    openingTime: vendor.openingTime,
    closingTime: vendor.closingTime,
    storeActive: vendor.storeActive,
  });
};

/**
 * Checks if store will be open at a specific time
 */
export const willStoreBeOpenAt = (config: StoreTimeConfig, targetTime: Date): boolean => {
  const { openingTime, closingTime, storeActive } = config;

  if (!storeActive) return false;

  try {
    const targetMinutes = targetTime.getHours() * 60 + targetTime.getMinutes();
    const openingMinutes = timeToMinutes(openingTime);
    const closingMinutes = timeToMinutes(closingTime);

    // Handle overnight hours
    if (openingMinutes > closingMinutes) {
      return targetMinutes >= openingMinutes || targetMinutes < closingMinutes;
    } else {
      return targetMinutes >= openingMinutes && targetMinutes < closingMinutes;
    }
  } catch (error) {
    return false;
  }
};

/**
 * Converts 24-hour time format to 12-hour AM/PM format
 * Supports both "HH.MM.SS" and "HH:MM" formats
 *
 * Examples:
 * - "09.30.00" → "9:30 AM"
 * - "14.45.30" → "2:45 PM"
 * - "23.00.00" → "11:00 PM"
 * - "00.15.00" → "12:15 AM"
 * - "12.00.00" → "12:00 PM"
 */
export const formatTimeToAMPM = (timeStr: string): string => {
  try {
    // Handle both formats: "HH.MM.SS" and "HH:MM"
    let timeParts: string[];
    if (timeStr.includes('.')) {
      timeParts = timeStr.split('.');
    } else {
      timeParts = timeStr.split(':');
    }

    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    // Validate hours and minutes
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return timeStr; // Return original if invalid
    }

    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${displayHours}:${displayMinutes} ${period}`;
  } catch (error) {
    return timeStr; // Return original if parsing fails
  }
};

/**
 * Converts 12-hour AM/PM time format to 24-hour format
 * Primary format: "HH:MM AM/PM"
 * Legacy support: "HH.MM.SS" and "HH:MM"
 *
 * Examples:
 * - "9:30 AM" → "09:30"
 * - "2:45 PM" → "14:45"
 * - "11:00 PM" → "23:00"
 * - "12:15 AM" → "00:15"
 * - "12:00 PM" → "12:00"
 */
export const formatTimeTo24Hour = (timeStr: string): string => {
  try {
    // Handle AM/PM format: "HH:MM AM/PM"
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const timeParts = timeStr.split(' ');
      const time = timeParts[0];
      const period = timeParts[1];

      const [hours, minutes] = time.split(':').map(Number);
      let adjustedHours = hours;

      if (period === 'PM' && hours !== 12) {
        adjustedHours = hours + 12;
      } else if (period === 'AM' && hours === 12) {
        adjustedHours = 0;
      }

      return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Handle legacy formats
    let timeParts: string[];
    if (timeStr.includes('.')) {
      timeParts = timeStr.split('.');
    } else {
      timeParts = timeStr.split(':');
    }

    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    // Validate hours and minutes
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return timeStr; // Return original if invalid
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  } catch (error) {
    return timeStr; // Return original if parsing fails
  }
};

/**
 * Gets the next opening time for a store
 */
export const getNextOpeningTime = (config: StoreTimeConfig): string => {
  const { openingTime, closingTime, storeActive } = config;

  if (!storeActive) return 'Store is manually closed';

  try {
    const currentMinutes = getCurrentTimeInMinutes();
    const openingMinutes = timeToMinutes(openingTime);
    const closingMinutes = timeToMinutes(closingTime);

    if (openingMinutes > closingMinutes) {
      // Overnight store
      if (currentMinutes >= openingMinutes || currentMinutes < closingMinutes) {
        return 'Store is currently open';
      } else {
        return `Opening time is ${formatTimeToAMPM(openingTime)}`;
      }
    } else {
      // Regular store
      if (currentMinutes >= openingMinutes && currentMinutes < closingMinutes) {
        return 'Store is currently open';
      } else if (currentMinutes < openingMinutes) {
        return `Opening time is ${formatTimeToAMPM(openingTime)}`;
      } else {
        return `Opening time is ${formatTimeToAMPM(openingTime)}`;
      }
    }
  } catch (error) {
    return 'Unable to determine opening time';
  }
};

/**
 * Calculates the approximate distance between two geographical coordinates using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export const getApproxDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculates the approximate distance between two geographical coordinates in meters
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
 */
export const getApproxDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  return getApproxDistanceKm(lat1, lon1, lat2, lon2) * 1000;
};
