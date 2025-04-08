"use client";

import FinancialDashboard from '@/components/dashboard/FinancialDashboard';
import DailyFinancialOverview from '@/components/dashboard/DailyFinancialOverview';
import { useAuth } from '@/components/auth/AuthProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // Only check authentication status after the auth system has initialized
    if (!isLoading) {
      setInitialized(true);
      
      // Only redirect if we're not authenticated AND we've completed the initial loading
      if (!isAuthenticated) {
        console.log("Dashboard: Not authenticated, redirecting to login page");
        router.push('/');
      } else {
        console.log("Dashboard: User is authenticated");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show a loading state if we're still initializing
  if (isLoading || !initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3">Loading...</p>
      </div>
    );
  }

  // If we get here, the user should be authenticated
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Financial Dashboard</h1>
      
      {/* Insert our new Daily Financial Overview component */}
      <DailyFinancialOverview />
      
      {/* Keep the existing dashboard with charts for historical data */}
      <FinancialDashboard />
    </div>
  );
}
