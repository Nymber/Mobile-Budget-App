import ky from 'ky';
import { useAuth } from '@/components/auth/AuthProvider';

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

    return await ky.get(endpoint, { headers: { Authorization: `Bearer ${token}` } }).json<ApiResponse<T>>();
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

    return await ky.post(endpoint, { json: body, headers: { Authorization: `Bearer ${token}` } }).json<ApiResponse<T>>();
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

    return await ky.put(endpoint, { json: body, headers: { Authorization: `Bearer ${token}` } }).json<ApiResponse<T>>();
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

    return await ky.delete(endpoint, { headers: { Authorization: `Bearer ${token}` } }).json<ApiResponse<T>>();
  };

  return {
    get,
    post,
    put,
    del
  };
};