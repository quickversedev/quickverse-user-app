// Utility functions for map/location logic in Address feature

export function isCurrentLocationSelected(
  selected: { latitude: number; longitude: number } | null,
  current: { latitude: number; longitude: number }
): boolean {
  if (!selected || !current.latitude || !current.longitude) return false;
  const latDiff = Math.abs(selected.latitude - current.latitude);
  const lngDiff = Math.abs(selected.longitude - current.longitude);
  return latDiff < 0.0001 && lngDiff < 0.0001;
}

export function getRegionFromLocation(
  location: { latitude: number; longitude: number },
  delta = 0.01
) {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}
