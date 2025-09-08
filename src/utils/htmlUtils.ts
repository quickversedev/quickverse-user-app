/**
 * HTML Text Processing Utilities
 * Functions to clean and process HTML content
 */

/**
 * Removes HTML tags from a text string
 * @param htmlString - The string containing HTML tags
 * @returns Clean text without HTML tags
 *
 * @example
 * removeHtmlTags('<p>Hello <strong>World</strong></p>') // Returns: "Hello World"
 */
export const removeHtmlTags = (htmlString: string): string => {
  if (!htmlString) return '';

  // Remove HTML tags using regex
  return htmlString.replace(/<[^>]*>/g, '');
};

/**
 * Decodes common HTML entities in a text string
 * @param text - The string containing HTML entities
 * @returns Text with decoded HTML entities
 *
 * @example
 * decodeHtmlEntities('Hello &amp; World &nbsp; Test') // Returns: "Hello & World Test"
 */
export const decodeHtmlEntities = (text: string): string => {
  if (!text) return '';

  // Common HTML entities mapping
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&hellip;': '…',
    '&mdash;': '—',
    '&ndash;': '–',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
  };

  // Replace HTML entities
  let decodedText = text;
  Object.entries(htmlEntities).forEach(([entity, replacement]) => {
    decodedText = decodedText.replace(new RegExp(entity, 'g'), replacement);
  });

  return decodedText;
};

/**
 * Removes HTML tags and decodes HTML entities from a text string
 * @param htmlString - The string containing HTML tags and entities
 * @returns Clean text without HTML tags and with decoded entities
 *
 * @example
 * cleanHtmlText('<p>Hello &amp; <strong>World</strong> &nbsp; Test</p>') // Returns: "Hello & World Test"
 */
export const cleanHtmlText = (htmlString: string): string => {
  if (!htmlString) return '';

  // First remove HTML tags
  let cleanText = htmlString.replace(/<[^>]*>/g, '');

  // Then decode HTML entities
  cleanText = decodeHtmlEntities(cleanText);

  // Trim whitespace and normalize spaces
  return cleanText.replace(/\s+/g, ' ').trim();
};

/**
 * Extracts text content from HTML while preserving line breaks
 * @param htmlString - The string containing HTML
 * @returns Clean text with preserved line breaks
 *
 * @example
 * extractTextWithLineBreaks('<p>Hello</p><br><p>World</p>') // Returns: "Hello\nWorld"
 */
export const extractTextWithLineBreaks = (htmlString: string): string => {
  if (!htmlString) return '';

  // Replace <br>, <br/>, <br /> with line breaks
  let text = htmlString.replace(/<br\s*\/?>/gi, '\n');

  // Replace </p> with line breaks
  text = text.replace(/<\/p>/gi, '\n');

  // Remove all other HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Normalize line breaks and trim
  return text.replace(/\n\s*\n/g, '\n').trim();
};

/**
 * Safely truncates HTML text to a specified length
 * @param htmlString - The string containing HTML
 * @param maxLength - Maximum length of the result
 * @param suffix - Suffix to add if truncated (default: '...')
 * @returns Truncated clean text
 *
 * @example
 * truncateHtmlText('<p>This is a very long text</p>', 10) // Returns: "This is a..."
 */
export const truncateHtmlText = (
  htmlString: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (!htmlString) return '';

  const cleanText = cleanHtmlText(htmlString);

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  return cleanText.substring(0, maxLength - suffix.length) + suffix;
};
