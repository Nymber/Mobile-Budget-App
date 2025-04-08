import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper to get token expiration from local storage
const getTokenExpiration = () => {
  try {
    const expString = localStorage.getItem('token_expiration');
    if (!expString) return null;
    return new Date(expString);
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

// Check if the token is expired
const isTokenExpired = () => {
  const expiration = getTokenExpiration();
  if (!expiration) return true;
  // Return true if token is expired (with 5 min buffer)
  return expiration <= new Date(new Date().getTime() - 5 * 60 * 1000);
};

// Save authentication data to local storage
const saveAuthData = (token, expiration) => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('token_expiration', expiration);
};

// Clear authentication data from local storage
const clearAuthData = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token_expiration');
  localStorage.removeItem('username');
};

// Get the stored token
export const getToken = () => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    // If token is expired, clear auth data and return null
    if (isTokenExpired()) {
      clearAuthData();
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

// Configure axios instance with authentication header
export const authAxios = () => {
  const token = getToken();
  const instance = axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // Add response interceptor to handle 401 errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error);
      if (error.response && error.response.status === 401) {
        // Clear auth data and redirect to login page
        clearAuthData();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Login function
export const login = async (username, password) => {
  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axios.post(`${API_URL}/login`, formData);
    
    if (response.data.access_token) {
      // Save token and expiration
      saveAuthData(
        response.data.access_token,
        response.data.expiration || new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days default
      );
      
      // Get and store username
      const userResponse = await authAxios().get('/username');
      localStorage.setItem('username', userResponse.data.username);
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register function
export const register = async (username, email, password) => {
  try {
    await axios.post(`${API_URL}/register`, {
      username,
      email,
      password
    });
    return true;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Logout function
export const logout = () => {
  clearAuthData();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Validate token with the backend
export const validateToken = async () => {
  try {
    if (!getToken()) return false;
    const response = await authAxios().get('/validate-token');
    return response.data && response.data.valid === true;
  } catch (error) {
    console.error('Token validation error:', error);
    clearAuthData();
    return false;
  }
};
