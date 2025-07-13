import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const OLA_MAPS_AUTOCOMPLETE_ENDPOINT = 'https://api.olamaps.io/places/v1/autocomplete';
const OLA_API_KEY = '4BCmnjxofvyjOnyJ0Sn6lHBBQ0yv6TALIrsRvE36';

export interface OlaPrediction {
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

export async function fetchOlaAutocomplete(
  query: string,
  latitude: number,
  longitude: number
): Promise<OlaPrediction[]> {
  if (!query.trim()) return [];
  const requestId = uuidv4();
  try {
    const response = await axios.get(OLA_MAPS_AUTOCOMPLETE_ENDPOINT, {
      params: {
        input: query,
        api_key: OLA_API_KEY,
        location: `${latitude},${longitude}`,
      },
      headers: {
        Accept: 'application/json',
        'X-Request-Id': requestId,
      },
    });
    if (response.data && Array.isArray(response.data.predictions)) {
      return response.data.predictions;
    }
    return [];
  } catch (err) {
    // Optionally log error
    return [];
  }
}
