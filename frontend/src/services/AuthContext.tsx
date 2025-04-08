"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import jwt from 'jsonwebtoken';
import { API_URL } from './apiUtils';

interface User {
  id?: string | number;
  name?: string;
  email?: string;
  // Add other user properties as needed
  [key: string]: unknown; // For any additional properties
}

interface JwtPayload {
  sub: string;
  exp: number;
  iat?: number;
  [key: string]: string | number | undefined;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  login: (userData: LoginPayload) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string | null>;
  checkAuth: () => Promise<boolean>;
}

interface LoginPayload {
  user: User;
  token: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Using the API_URL from apiUtils.ts for consistency
console.log('Using API_URL in AuthContext:', API_URL);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedAuth = localStorage.getItem('authData');
        
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          
          if (authData.token) {
            // Validate token expiration
            const decodedToken = jwt.decode(authData.token) as JwtPayload;
            if (decodedToken && decodedToken.exp) {
              const tokenExpiration = new Date(decodedToken.exp * 1000);
              const isTokenExpired = tokenExpiration < new Date();
              
              if (!isTokenExpired) {
                setIsAuthenticated(true);
                setUser(authData.user || {});
                setToken(authData.token);
              } else {
                // Token expired, clear auth data
                localStorage.removeItem('authData');
                setIsAuthenticated(false);
                setUser(null);
                setToken(null);
              }
            }
          } else {
            // Clear invalid auth data
            localStorage.removeItem('authData');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('authData');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (userData: LoginPayload) => {
    const { user, token } = userData;
    
    try {
      // Validate token expiration
      const decodedToken = jwt.decode(token) as JwtPayload;
      if (decodedToken && decodedToken.exp) {
        const tokenExpiration = new Date(decodedToken.exp * 1000);
        const isTokenExpired = tokenExpiration < new Date();
        
        if (!isTokenExpired) {
          // Store auth data in localStorage
          localStorage.setItem('authData', JSON.stringify({ user, token }));
          setUser(user);
          setToken(token);
          setIsAuthenticated(true);
        } else {
          throw new Error('Token expired');
        }
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authData');
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  };

  // Token refresh functionality
  const refreshToken = async (): Promise<string | null> => {
    try {
      // Get current token
      const currentToken = token;
      if (!currentToken) {
        return null;
      }

      // Make request to refresh token
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  };

  // Check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      if (!token) {
        return false;
      }

      // Decode token to check expiration
      const decodedToken = jwt.decode(token) as JwtPayload;
      if (!decodedToken || !decodedToken.exp) {
        return false;
      }

      const tokenExpiration = new Date(decodedToken.exp * 1000);
      const isTokenExpired = tokenExpiration < new Date();

      if (isTokenExpired) {
        // Try to refresh token
        const newToken = await refreshToken();
        if (newToken) {
          setToken(newToken);
          return true;
        }
        return false;
      }

      // Validate token with backend
      const response = await fetch(`${API_URL}/validate-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        token,
        login,
        logout,
        refreshToken,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
