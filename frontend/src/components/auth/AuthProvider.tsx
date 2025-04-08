"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import jwt from 'jsonwebtoken';

// Define API URL for authentication - use environment variable with consistent fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface User {
  id?: string | number;
  username?: string;
  email?: string;
  [key: string]: unknown;
}

interface UserData {
  username: string;
  password: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  login: (userData: UserData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<string | null>;
  checkAuth: () => Promise<boolean>;
}

interface JwtPayload {
  sub: string;
  exp: number;
  iat?: number;
  [key: string]: string | number | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// We need to focus on the authentication initialization and login functions
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is authenticated
    const initAuth = async () => {
      try {
        console.log("Initializing auth state");
        // Only access localStorage in the browser
        if (typeof window === 'undefined') {
          console.log("Server-side rendering, skipping localStorage check");
          setIsLoading(false);
          return;
        }

        const authData = localStorage.getItem('authData');
        
        if (authData) {
          console.log("Found authData in localStorage");
          try {
            const parsedAuthData = JSON.parse(authData);
            
            if (parsedAuthData.token) {
              console.log("Token found in authData");
              // Validate token expiration
              try {
                const decoded = jwt.decode(parsedAuthData.token) as JwtPayload;
                if (decoded && decoded.exp) {
                  const expiration = new Date(decoded.exp * 1000);
                  const now = new Date();
                  
                  console.log("Token expiration check:", {
                    expiration: expiration.toISOString(),
                    now: now.toISOString(),
                    isExpired: expiration < now,
                    tokenData: decoded
                  });
                  
                  if (expiration > now) {
                    // Token is valid
                    console.log("Token is valid, setting authenticated state");
                    setIsAuthenticated(true);
                    setUser(parsedAuthData.user || {});
                    setToken(parsedAuthData.token);
                  } else {
                    // Token expired, try to refresh
                    console.log("Token expired, attempting refresh");
                    const newToken = await refreshTokenInternal(parsedAuthData.token);
                    if (newToken) {
                      console.log("Token refresh successful");
                      const newAuthData = { ...parsedAuthData, token: newToken };
                      localStorage.setItem('authData', JSON.stringify(newAuthData));
                      setIsAuthenticated(true);
                      setUser(parsedAuthData.user || {});
                      setToken(newToken);
                    } else {
                      console.log("Token refresh failed");
                      throw new Error('Token refresh failed');
                    }
                  }
                } else {
                  console.log("Invalid token format (missing exp)");
                  throw new Error('Invalid token format');
                }
              } catch (error) {
                console.error('Token validation error:', error);
                localStorage.removeItem('authData');
              }
            } else {
              console.log("No token in authData");
              localStorage.removeItem('authData');
            }
          } catch (error) {
            console.error('Error parsing authData:', error);
            localStorage.removeItem('authData');
          }
        } else {
          console.log("No authData found in localStorage");
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authData');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []); // Only run once on component mount

  // Create a separate effect for route protection with proper dependencies
  useEffect(() => {
    // Only run route protection after authentication state is determined
    if (!isLoading) {
      // Protect routes based on authentication
      const isProtectedRoute = pathname?.startsWith('/dashboard');
      if (isProtectedRoute && !isAuthenticated) {
        console.log("Route protection: redirecting to login from", pathname);
        router.push('/');
      }
    }
  }, [pathname, router, isAuthenticated, isLoading]);

  // Internal token refresh function
  const refreshTokenInternal = async (currentToken: string): Promise<string | null> => {
    try {
      console.log("Attempting to refresh token");
      
      // Use the same API_URL variable for consistency
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (!response.ok) {
        console.log("Token refresh API response not OK:", response.status);
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      console.log("Token refresh successful");
      return data.access_token || data.token || null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  };

  const login = async (credentials: UserData): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        // Process user data
        // Destructure the credentials parameter
        const { username, password } = credentials || {};

      // Create FormData instance
      const formData = new FormData();
      if (username) {
        formData.append('username', username);
      } else {
        throw new Error('Username is required');
      }
      if (password) {
        formData.append('password', String(password));
      } else {
        throw new Error('Password is required');
      }
    

      console.log('Attempting login to:', `${API_URL}/login`);
      
      // Add timeout to prevent long-running requests in port-forwarded environments
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login failed:', errorText);
        
        // Try to parse the error message if possible
        let errorMessage = 'Authentication failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If parsing fails, use the error text directly if it exists
          if (errorText) errorMessage = errorText;
        }
        
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      
      // Extract token from response - handle both response formats from backend
      const accessToken = data.access_token || data.token;
      
      // Log successful token reception
      console.log('Login successful, received token');
      
      // Store both ways for compatibility
      localStorage.setItem('token', accessToken);
      const userData: User = { username };
      localStorage.setItem('authData', JSON.stringify({
        token: accessToken,
        user: userData
      }));
      
      setToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      // Enhanced error handling for network issues
      let errorMessage = 'Failed to connect to the server';
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'Login request timed out. Please check your connection and try again.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log("Logout function called");
    localStorage.removeItem('authData');
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    router.push('/');
  };

  const refreshToken = async (): Promise<string | null> => {
    if (!token) {
      console.log("Cannot refresh token: no token available");
      return null;
    }
    
    console.log("Refreshing token...");
    const newToken = await refreshTokenInternal(token);
    if (newToken) {
      const authData = localStorage.getItem('authData');
      if (authData) {
        const parsedAuthData = JSON.parse(authData);
        const newAuthData = { ...parsedAuthData, token: newToken };
        localStorage.setItem('authData', JSON.stringify(newAuthData));
      }
      setToken(newToken);
      return newToken;
    }
    
    console.log("Token refresh failed");
    return null;
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      const storedToken = localStorage.getItem('token') || 
                         (localStorage.getItem('authData') ? 
                          JSON.parse(localStorage.getItem('authData') || '{}').token : null);
      
      if (!storedToken) {
        setIsAuthenticated(false);
        return false;
      }

      // Add a timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${API_URL}/validate-token`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setToken(storedToken);
        setUser({ username: data.username });
        setIsAuthenticated(true);
        return true;
      } else {
        // If validation fails, clear stored tokens
        localStorage.removeItem('token');
        localStorage.removeItem('authData');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Error validating token:', error);
      
      // Don't immediately log out on network errors with port forwarding
      // instead, assume token is valid for this session
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.warn('Token validation timed out, assuming session is valid');
        const storedToken = localStorage.getItem('token') || 
                           (localStorage.getItem('authData') ? 
                            JSON.parse(localStorage.getItem('authData') || '{}').token : null);
        if (storedToken) {
          setToken(storedToken);
          setIsAuthenticated(true);
          return true;
        }
      }
      
      setIsAuthenticated(false);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
        checkAuth 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Export standalone refreshToken for direct use in API utilities
export const refreshToken = async (): Promise<string | null> => {
  try {
    // This function can be called outside React components, so we need a direct approach
    if (typeof window === 'undefined') {
      return null;
    }
    
    // Get the current token from localStorage
    const authData = localStorage.getItem('authData');
    if (!authData) {
      console.log("No auth data found in localStorage");
      return null;
    }
    
    let parsedAuthData;
    try {
      parsedAuthData = JSON.parse(authData);
    } catch (error) {
      console.error("Failed to parse auth data:", error);
      localStorage.removeItem('authData');
      return null;
    }
    
    const { token } = parsedAuthData;
    if (!token) {
      console.log("No token available in auth data");
      return null;
    }
    
    console.log("Attempting to refresh token with backend");
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error("Token refresh failed with status:", response.status);
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    if (data.token) {
      console.log("Token refresh successful");
      // Update token in localStorage
      const updatedAuthData = {
        ...parsedAuthData,
        token: data.token
      };
      localStorage.setItem('authData', JSON.stringify(updatedAuthData));
      
      // We also need to dispatch a custom event to notify other parts of the app
      // that the token has been refreshed
      if (typeof window !== 'undefined') {
        const tokenRefreshedEvent = new CustomEvent('token_refreshed', { 
          detail: { token: data.token } 
        });
        window.dispatchEvent(tokenRefreshedEvent);
      }
      
      return data.token;
    }
    
    console.log("No token received from refresh endpoint");
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // On failure, clear auth data to force re-login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authData');
    }
    return null;
  }
};
