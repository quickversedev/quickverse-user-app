export const toRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

const normalizeCoordinate = (value: number, type: 'lat' | 'lon'): number | null => {
  if (!Number.isFinite(value)) return null;
  const abs = Math.abs(value);
  // Accept degrees range
  if (type === 'lat' && abs <= 90) return value;
  if (type === 'lon' && abs <= 180) return value;
  // Fallback: some sources store microdegrees (e.g., 12971600 => 12.9716)
  const scaled = value / 1_000_000;
  const absScaled = Math.abs(scaled);
  if (type === 'lat' && absScaled <= 90) return scaled;
  if (type === 'lon' && absScaled <= 180) return scaled;
  return null;
};

export const getDistanceInKm = (
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
): number => {
  // Validate and normalize coordinates
  const lat1 = normalizeCoordinate(latitude1, 'lat');
  const lon1 = normalizeCoordinate(longitude1, 'lon');
  const lat2 = normalizeCoordinate(latitude2, 'lat');
  const lon2 = normalizeCoordinate(longitude2, 'lon');
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return NaN;

  const earthRadiusKm = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  // Clamp to protect against floating point drift
  a = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export const formatDistanceKm = (kilometers: number): string => {
  if (!Number.isFinite(kilometers)) return '';
  const rounded = kilometers < 10 ? Math.round(kilometers * 10) / 10 : Math.round(kilometers);
  return `${rounded} km`;
};
