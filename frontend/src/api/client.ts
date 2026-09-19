const envUrl = import.meta.env.VITE_API_BASE_URL;
// In browser dev mode, route requests via Vite proxy to eliminate CORS blocks
const isDev = typeof window !== 'undefined' && import.meta.env.DEV;
const BASE_URL = (isDev && !import.meta.env.VITE_USE_DIRECT_URL)
  ? ''
  : (envUrl || 'http://localhost:5000');

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 6000); // Snappy UI timeout
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(id);

    if (!response.ok) {
      let errJson: any = null;
      try {
        errJson = await response.json();
      } catch {
        // non-json response
      }
      const message = errJson?.error?.message || `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, errJson?.error?.details);
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || "Failed to connect to backend", 0, { isNetworkError: true });
  }
}

export { BASE_URL };
