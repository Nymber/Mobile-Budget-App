import { apiGet, apiPost, apiPut, apiDelete } from '@/services/apiUtils';
import { useAuth } from './AuthContext';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export const useApi = () => {
  const auth = useAuth();

  const get = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    const isAuthenticated = await auth.checkAuth();
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const token = auth.token;
    if (!token) {
      throw new Error('No token available');
    }

    return await apiGet<T>(endpoint, { headers: { Authorization: `Bearer ${token}` } });
  };

  const post = async <T>(endpoint: string, body: Record<string, unknown>): Promise<ApiResponse<T>> => {
    const isAuthenticated = await auth.checkAuth();
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const token = auth.token;
    if (!token) {
      throw new Error('No token available');
    }

    return await apiPost<T>(endpoint, body, { headers: { Authorization: `Bearer ${token}` } });
  };

  const put = async <T>(endpoint: string, body: Record<string, unknown>): Promise<ApiResponse<T>> => {
    const isAuthenticated = await auth.checkAuth();
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const token = auth.token;
    if (!token) {
      throw new Error('No token available');
    }

    return await apiPut<T>(endpoint, body, { headers: { Authorization: `Bearer ${token}` } });
  };

  const del = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    const isAuthenticated = await auth.checkAuth();
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const token = auth.token;
    if (!token) {
      throw new Error('No token available');
    }

    return await apiDelete<T>(endpoint, { headers: { Authorization: `Bearer ${token}` } });
  };

  return {
    get,
    post,
    put,
    del
  };
};