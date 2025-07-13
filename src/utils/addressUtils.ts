import { Address } from '../types/address';

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
  else if (address.zipCode) locationParts.push(address.zipCode);

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
  else if (address.zipCode) locationParts.push(address.zipCode);

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
    (address.pincode?.trim() || address.zipCode?.trim())
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
