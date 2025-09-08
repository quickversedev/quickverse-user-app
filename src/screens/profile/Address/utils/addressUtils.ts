import { Address } from '../../../../types/address';

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Find the closest address within a specified radius from the user's current location
 * @param currentLocation - User's current location {latitude, longitude}
 * @param addresses - Array of addresses to compare against
 * @param radiusInMeters - Maximum radius to search within (default: 200m)
 * @returns The closest address within radius, or null if none found
 */
export const findClosestAddressWithinRadius = (
  currentLocation: { latitude: number; longitude: number },
  addresses: Array<{ [key: string]: unknown }>,
  radiusInMeters: number = 200
): { address: { [key: string]: unknown }; distance: number } | null => {
  if (!currentLocation || !addresses || addresses.length === 0) {
    return null;
  }

  let closestAddress: { [key: string]: unknown } | null = null;
  let minDistance = Infinity;

  for (const address of addresses) {
    // Check for latitude and longitude in various possible formats
    const lat = address.latitude || address.lat;
    const lng = address.longitude || address.lng || address.lon;

    if (!lat || !lng) {
      continue; // Skip addresses without coordinates
    }

    // Convert string coordinates to numbers if needed
    const latitude = typeof lat === 'string' ? parseFloat(lat) : Number(lat);
    const longitude = typeof lng === 'string' ? parseFloat(lng) : Number(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      continue; // Skip invalid coordinates
    }

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      latitude,
      longitude
    );

    if (distance <= radiusInMeters && distance < minDistance) {
      minDistance = distance;
      closestAddress = address;
    }
  }

  return closestAddress ? { address: closestAddress, distance: minDistance } : null;
};

/**
 * Concatenates address fields into a single, readable string
 * @param address - The address object containing various address fields
 * @returns A concatenated address string
 */
export const getConcatenatedAddress = (address: Address): string => {
  const addressParts = [];

  // Add address line 1 or main address
  if (address.addressLine1) {
    addressParts.push(address.addressLine1);
  } else if (address.address) {
    addressParts.push(address.address);
  }

  // Add address line 2 if exists
  if (address.addressLine2) {
    addressParts.push(address.addressLine2);
  }

  // Add landmark if exists
  if (address.landmark) {
    addressParts.push(address.landmark);
  }

  // Add city, state, and pincode
  const locationParts = [];
  if (address.city) locationParts.push(address.city);
  if (address.state) locationParts.push(address.state);
  if (address.pincode) locationParts.push(address.pincode);

  if (locationParts.length > 0) {
    addressParts.push(locationParts.join(', '));
  }

  return addressParts.join(', ');
};

/**
 * Formats address for display with line breaks
 * @param address - The address object
 * @returns Formatted address with line breaks
 */
export const getFormattedAddress = (address: Address): string[] => {
  const lines = [];

  // Add address line 1 or main address
  if (address.addressLine1) {
    lines.push(address.addressLine1);
  } else if (address.address) {
    lines.push(address.address);
  }

  // Add address line 2 if exists
  if (address.addressLine2) {
    lines.push(address.addressLine2);
  }

  // Add landmark if exists
  if (address.landmark) {
    lines.push(address.landmark);
  }

  // Add city, state, and pincode as one line
  const locationParts = [];
  if (address.city) locationParts.push(address.city);
  if (address.state) locationParts.push(address.state);
  if (address.pincode) locationParts.push(address.pincode);

  if (locationParts.length > 0) {
    lines.push(locationParts.join(', '));
  }

  return lines;
};

/**
 * Validates if an address object has required fields
 * @param address - The address object to validate
 * @returns Boolean indicating if address is valid
 */
export const isValidAddress = (address: Partial<Address>): boolean => {
  return !!(
    address.name?.trim() &&
    (address.addressLine1?.trim() || address.address?.trim()) &&
    address.city?.trim() &&
    address.state?.trim() &&
    address.pincode?.trim()
  );
};

/**
 * Gets the display name for an address
 * @param address - The address object
 * @returns The display name or fallback text
 */
export const getAddressDisplayName = (address: Address): string => {
  return address.name || 'Unnamed Address';
};

/**
 * Gets the address tag with fallback
 * @param address - The address object
 * @returns The address tag or default value
 */
export const getAddressTag = (address: Address): string => {
  return address.tag || 'Address';
};
