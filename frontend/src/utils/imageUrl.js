/**
 * Helper to resolve image URLs correctly whether they are remote, uploaded, or local assets.
 * Uses relative paths so images route through the Vite proxy seamlessly on localhost, 127.0.0.1, and LAN/mobile IPs.
 */
export const getImageUrl = (path, fallback = '') => {
  if (!path || typeof path !== 'string' || !path.trim()) {
    return fallback;
  }

  const trimmed = path.trim();

  // Return full HTTP/HTTPS, blob, or base64 URLs directly
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // If VITE_API_URL is explicitly set (e.g. in custom production deployment), use it
  if (import.meta.env.VITE_API_URL) {
    const backendBase = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${backendBase}${cleanPath}`;
  }

  // Otherwise, use relative path (e.g. /uploads/images/...)
  // This seamlessly works across localhost, 127.0.0.1, and any LAN IP (e.g. 192.168.x.x:5173) via Vite proxy
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

export default getImageUrl;
