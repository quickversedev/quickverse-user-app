import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface Location {
  latitude: number;
  longitude: number;
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

const OLA_MAPS_AUTOCOMPLETE_ENDPOINT = 'https://api.olamaps.io/places/v1/autocomplete';
const OLA_MAPS_REVERSE_GEOCODE_ENDPOINT = 'https://api.olamaps.io/places/v1/reverse-geocode';
const OLA_API_KEY = '4BCmnjxofvyjOnyJ0Sn6lHBBQ0yv6TALIrsRvE36';

/**
 * Get address from coordinates using Ola Maps reverse geocoding API
 */
export const getAddressFromCoordinates = async (coordinates: Location): Promise<string> => {
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
      return response.data.results[0].formatted_address;
    } else {
      throw new Error('No address found for this location');
    }
  } catch (error: unknown) {
    const err = error as { code?: string; response?: { status?: number }; message?: string };

    // Handle different types of errors
    if (err.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your internet connection.');
    } else if (err.response?.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    } else if (err.response?.status && err.response.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (err.response?.status && err.response.status >= 400) {
      throw new Error('Invalid request. Please try a different location.');
    } else {
      throw new Error('Unable to fetch address. Please try again.');
    }
  }
};

/**
 * Get autocomplete suggestions from Ola Maps API
 */
export const getAutocompleteSuggestions = async (
  query: string,
  location: Location
): Promise<SearchResult[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    const requestId = uuidv4();
    const response = await axios.get(OLA_MAPS_AUTOCOMPLETE_ENDPOINT, {
      params: {
        input: query,
        api_key: OLA_API_KEY,
        location: `${location.latitude},${location.longitude}`,
      },
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
