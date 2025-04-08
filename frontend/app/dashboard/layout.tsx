"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  DollarSign, 
  TrendingUp, 
  Package, 
  CheckSquare, 
  FileText,
  Camera,
  MessageSquare,
  LogOut
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, isAuthenticated, checkAuth } = useAuth();
  const pathname = usePathname();

  // Set up global auth sync across browser tabs
  useEffect(() => {
    // Function to handle storage events (when localStorage changes in another tab)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'authData') {
        if (!event.newValue) {
          // Auth data was cleared in another tab
          console.log('Auth data cleared in another tab, logging out');
          logout();
          return;
        }

        if (event.newValue !== event.oldValue) {
          console.log('Auth data changed in another tab, re-validating');
          // Re-validate auth state
          checkAuth();
        }
      }
    };

    // Listen for the custom token refresh event
    const handleTokenRefreshed = () => {
      console.log('Token refreshed event received, re-validating auth');
      checkAuth();
    };

    // Set up event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('token_refreshed', handleTokenRefreshed);

    // Periodically check auth status to keep it fresh
    const authCheckInterval = setInterval(() => {
      if (isAuthenticated) {
        checkAuth().catch(console.error);
      }
    }, 60000); // Check every minute

    return () => {
      // Clean up event listeners and interval
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('token_refreshed', handleTokenRefreshed);
      clearInterval(authCheckInterval);
    };
  }, [logout, checkAuth, isAuthenticated]);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/dashboard/expenses', label: 'Expenses', icon: <DollarSign size={20} /> },
    { href: '/dashboard/earnings', label: 'Earnings', icon: <TrendingUp size={20} /> },
    { href: '/dashboard/inventory', label: 'Inventory', icon: <Package size={20} /> },
    { href: '/dashboard/tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
    { href: '/dashboard/reports', label: 'Reports', icon: <FileText size={20} /> },
    { href: '/dashboard/receipts', label: 'Scan Receipt', icon: <Camera size={20} /> },
    { href: '/dashboard/feedback', label: 'Feedback', icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:bg-white md:border-r">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-semibold">Budget App</h1>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md 
                    ${pathname === item.href 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <div className="mr-3 text-gray-500">{item.icon}</div>
                  {item.label}
                </Link>
              ))}
                <div className="pt-4 mt-4 border-t border-gray-200">
                <button
                  onClick={logout}
                  className="group flex items-center px-2 py-3 text-base font-medium rounded-md text-red-600 hover:bg-red-50 w-full text-left"
                  aria-label="Logout from application"
                >
                  <LogOut size={20} className="mr-3 text-red-500" />
                  Logout
                </button>
                </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-white w-full h-14 border-b flex items-center px-4">
        <h1 className="text-xl font-semibold">Budget App</h1>
      </div>

      {/* Content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
