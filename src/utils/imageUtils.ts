/**
 * Cleans and validates image URLs
 * @param input The input URL string that might contain @ or quotes
 * @returns A cleaned URL string or undefined if invalid
 */
export const getCleanImageUri = (input?: string): string | undefined => {
  if (!input || typeof input !== 'string') return undefined;

  // Remove any leading/trailing whitespace and quotes
  let cleaned = input.trim().replace(/^['"]|['"]$/g, '');

  // Remove @ if present at the start
  cleaned = cleaned.replace(/^@/, '');

  // Check if it's a valid URL
  try {
    new URL(cleaned);

    // For Unsplash URLs, ensure we have the necessary parameters
    if (cleaned.includes('unsplash.com') && !cleaned.includes('auto=format')) {
      cleaned = `${cleaned}${cleaned.includes('?') ? '&' : '?'}auto=format&fit=crop&w=800&q=80`;
    }

    return cleaned;
  } catch (e) {
    // If URL is invalid, return undefined
    return undefined;
  }
};
