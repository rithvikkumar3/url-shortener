/**
 * Validates if a string is a valid URL
 */
export const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};

/**
 * Ensures URL has a protocol
 */
export const ensureProtocol = (url: string): string => {
  if (!url.match(/^https?:\/\//)) {
    return `https://${url}`;
  }
  return url;
};

/**
 * Normalizes URL for comparison
 */
export const normalizeUrl = (url: string): string => {
  const withProtocol = ensureProtocol(url);
  try {
    const urlObj = new URL(withProtocol);
    return urlObj.toString();
  } catch {
    return withProtocol;
  }
};
