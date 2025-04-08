import ky from 'ky';

// Get and store the API URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://76.121.92.139:8000';
console.log('API URL configured as:', API_URL);

// Create ky instance with custom config
const api = ky.create({
  prefixUrl: API_URL,
  timeout: 30000, // 30 seconds timeout for longer operations
  credentials: 'include', // Important for cookies/auth
  headers: {
    'Content-Type': 'application/json',
  },
  hooks: {
    beforeRequest: [
      (request) => {
        let token: string | null = null;
        try {
          const authData = localStorage.getItem('authData');
          if (authData) {
            const parsedData = JSON.parse(authData);
            token = parsedData.token || parsedData.access_token;
          }
          if (!token) {
            token = localStorage.getItem('token');
          }
          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        } catch (e) {
          console.warn('Error accessing auth token:', e);
        }
      },
    ],
    afterResponse: [
      async (_, __, response) => {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('authData');

          if (typeof window !== 'undefined' &&
              !window.location.pathname.includes('/login') &&
              !window.location.pathname.includes('/register')) {
            window.location.href = '/login?session=expired';
          }
        }
      },
    ],
  },
});

export async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await api(url, {
      method: options.method || 'GET',
      json: options.body ? JSON.parse(options.body as string) : undefined,
      headers: options.headers,
      signal: options.signal,
    }).json<T>();

    return response;
  } catch (error: unknown) {
    console.error('API request error:', error);

    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }

    throw error;
  }
}

export async function apiPost<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<T> {
  return fetchWithAuth<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

export async function apiPut<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<T> {
  return fetchWithAuth<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
}

export async function apiDelete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return fetchWithAuth<T>(endpoint, {
    method: 'DELETE',
    ...options,
  });
}

export async function apiGet<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetchWithAuth<T>(endpoint, {
      method: 'GET',
      ...options,
    });
    return response;
  } catch (error: unknown) {
    console.error('Error in apiGet:', error);
    throw error;
  }
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  [key: string]: unknown;
}

export async function apiLogin(username: string, password: string): Promise<LoginResponse> {
  try {
    console.log('Attempting login with username:', username);

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    console.log('Login request details:', {
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const response = await api.post('login', {
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).json<LoginResponse>();

    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('authData', JSON.stringify({
        token: response.access_token,
        username: username,
      }));
    }

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);

    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }

    throw error;
  }
}
