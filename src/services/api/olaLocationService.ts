import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface AddressComponents {
  country: string;
  state: string;
  city: string;
  postalCode: string;
  formatted_address: string;
  road: string;
  locality: string;
}

export interface SearchResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface AddressComponent {
  types: string[];
  short_name: string;
  long_name: string;
}

interface ApiError {
  code?: string;
  response?: { status?: number };
  message?: string;
}

const OLA_MAPS_AUTOCOMPLETE_ENDPOINT = 'https://api.olamaps.io/places/v1/autocomplete';
const OLA_MAPS_REVERSE_GEOCODE_ENDPOINT = 'https://api.olamaps.io/places/v1/reverse-geocode';
const OLA_API_KEY = '4BCmnjxofvyjOnyJ0Sn6lHBBQ0yv6TALIrsRvE36';

/**
 * Extract address components from Ola Maps API response
 */
const extractAddressComponents = (
  addressComponents: AddressComponent[],
  formattedAddress: string
): AddressComponents => {
  const components: AddressComponents = {
    country: '',
    state: '',
    city: '',
    postalCode: '',
    formatted_address: formattedAddress || '',
    road: '',
    locality: '',
  };

  let locality = '';
  let sublocality = '';

  addressComponents.forEach(component => {
    const types = component.types || [];

    if (types.includes('country')) {
      components.country = component.long_name || '';
    } else if (types.includes('administrative_area_level_1')) {
      components.state = component.long_name || '';
    } else if (types.includes('administrative_area_level_2')) {
      components.city = component.long_name || '';
    } else if (types.includes('locality')) {
      locality = component.long_name || '';
    } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
      sublocality = component.long_name || '';
    } else if (types.includes('postal_code')) {
      components.postalCode = component.long_name || '';
    } else if (types.includes('route')) {
      components.road = component.long_name || '';
    }
  });

  components.locality = sublocality || locality || '';

  // Use locality or sublocality as city fallback
  if (!components.city) {
    components.city = locality || sublocality || '';
  }

  // Fallback: extract road from formatted_address leading segments
  if (!components.road && formattedAddress) {
    const parts = formattedAddress.split(',').map(p => p.trim());
    const knownValues = new Set(
      [
        components.city,
        components.state,
        components.country,
        components.postalCode,
        components.locality,
        locality,
        sublocality,
      ]
        .filter(Boolean)
        .map(v => v.toLowerCase())
    );
    const roadParts = parts.filter(
      p => p && !knownValues.has(p.toLowerCase()) && !/^\d{6}$/.test(p)
    );
    if (roadParts.length > 0) {
      components.road = roadParts[0];
    }
  }

  // Last resort: extract from formatted address (first meaningful segment)
  if (!components.city && formattedAddress) {
    const parts = formattedAddress.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      components.city = parts[parts.length - 3] || parts[0] || '';
    }
  }

  return components;
};

/**
 * Get address from coordinates using Ola Maps reverse geocoding API
 */
export const getAddressFromCoordinates = async (
  coordinates: Location
): Promise<AddressComponents> => {
  try {
    const requestId = uuidv4();
    const response = await axios.get(
      `${OLA_MAPS_REVERSE_GEOCODE_ENDPOINT}?latlng=${coordinates.latitude},${coordinates.longitude}&api_key=${OLA_API_KEY}`,
      {
        timeout: 10000, // 10 second timeout
        headers: {
          'X-Request-Id': requestId,
        },
      }
    );

    if (response.data && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      if (result.address_components) {
        return extractAddressComponents(result.address_components, result.formatted_address || '');
      } else {
        throw new Error('No address components found for this location');
      }
    } else {
      throw new Error('No address found for this location');
    }
  } catch (error: unknown) {
    const err = error as ApiError;
    if (err.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    } else if (err.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (err.response?.status && err.response.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (err.response?.status && err.response.status >= 400) {
      throw new Error('Invalid request. Please check your coordinates.');
    } else if (err.message) {
      throw new Error(err.message);
    } else {
      throw new Error('Failed to get address from coordinates');
    }
  }
};

/**
 * Get autocomplete suggestions from Ola Maps API
 */
export const getAutocompleteSuggestions = async (
  query: string,
  location?: Location
): Promise<SearchResult[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    const requestId = uuidv4();
    const params: Record<string, string> = {
      input: query,
      api_key: OLA_API_KEY,
    };
    if (location) {
      params.location = `${location.latitude},${location.longitude}`;
    }
    const response = await axios.get(OLA_MAPS_AUTOCOMPLETE_ENDPOINT, {
      params,
      headers: {
        Accept: 'application/json',
        'X-Request-Id': requestId,
      },
      timeout: 10000,
    });

    if (response.data && Array.isArray(response.data.predictions)) {
      return response.data.predictions;
    } else {
      console.warn('OlaPlaceAutocomplete: Unexpected response structure', response.data);
      return [];
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string };
    console.warn('Error during Ola Maps autocomplete:', err.response?.data || err.message || error);
    return [];
  }
};
