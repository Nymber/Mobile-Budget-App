// Note: This file is used for compatibility with react-router-dom.
// For Next.js app router navigation, refer to app-routes.ts

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  exp: number;
  iat?: number;
  [key: string]: string | number | undefined;
}

// Import components directly instead of using lazy loading for simplicity
// This resolves TypeScript errors while we transition to Next.js App Router
import Dashboard from '../components/dashboard/dashboard';
import Register from '../components/auth/Register';
import ViewEarnings from '../components/dashboard/View_Earnings';
import ViewExpenses from '../components/dashboard/View_Expenses';
import ViewInventory from '../components/dashboard/View_Inventory';
import DownloadExcel from '../components/dashboard/Download_Excel';
import Inventory from '../components/dashboard/Add_Inventory';
import AddExpense from '../components/dashboard/AddExpense';
import AddEarning from '../components/dashboard/AddEarning';
import ReceiptScanner from '../components/dashboard/ReceiptScanner';
import FinancialDashboard from '../components/dashboard/FinancialDashboard';
import AddTasks from '../components/dashboard/AddTasks';
import ViewTasks from '../components/dashboard/View_Tasks';

// Enhanced implementation of ProtectedRoute with token validation
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, token, refreshToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication status on mount and route change
    const checkAuth = async () => {
      if (!isLoading && !isAuthenticated) {
        // Store the current path to redirect back after login
        localStorage.setItem('redirectPath', window.location.pathname);
        router.push('/login');
        return;
      }

      if (token) {
        try {
          // Validate token expiration
          const decodedToken = jwt.decode(token) as JwtPayload;
          if (decodedToken && decodedToken.exp) {
            const tokenExpiration = new Date(decodedToken.exp * 1000);
            const isTokenExpired = tokenExpiration < new Date();

            if (isTokenExpired) {
              // Try to refresh token
              const newToken = await refreshToken();
              if (!newToken) {
                // Token refresh failed, log out
                setError('Session expired. Please log in again.');
                router.push('/login');
              }
            }
          }
        } catch (error) {
          console.error('Token validation error:', error);
          setError('Authentication error. Please log in again.');
          router.push('/login');
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, isLoading, token, refreshToken, router]);

  // If not authenticated or loading, show loading state
  if (isLoading || !isAuthenticated || !token) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3">Verifying authentication...</p>
      </div>
    );
  }

  // If there's an error, show error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-4">
        <div className="text-red-500">{error}</div>
        <button
          onClick={() => {
            setError(null);
            router.push('/login');
          }}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

// Create router with Suspense for lazy-loaded components
const router = [
  {
    path: "/",
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>
  },
  {
    path: "/view-earnings",
    element: <ProtectedRoute><ViewEarnings /></ProtectedRoute>
  },
  {
    path: "/view-expenses",
    element: <ProtectedRoute><ViewExpenses /></ProtectedRoute>
  },
  {
    path: "/view-inventory",
    element: <ProtectedRoute><ViewInventory /></ProtectedRoute>
  },
  {
    path: "/tasks",
    element: <ProtectedRoute><ViewTasks /></ProtectedRoute>
  },
  {
    path: "/add-task",
    element: <ProtectedRoute><AddTasks /></ProtectedRoute>
  },
  {
    path: "/download-excel",
    element: <ProtectedRoute><DownloadExcel /></ProtectedRoute>
  },
  {
    path: "/inventory",
    element: <ProtectedRoute><Inventory /></ProtectedRoute>
  },
  {
    path: "/add-expense",
    element: <ProtectedRoute><AddExpense /></ProtectedRoute>
  },
  {
    path: "/add-earning",
    element: <ProtectedRoute><AddEarning /></ProtectedRoute>
  },
  {
    path: "/receipt-scanner",
    element: <ProtectedRoute><ReceiptScanner /></ProtectedRoute>
  },
  {
    path: "/financial-dashboard",
    element: <ProtectedRoute><FinancialDashboard /></ProtectedRoute>
  }
];

export default router;