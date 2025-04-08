/**
 * This file provides centralized route definitions for the application
 * Since we're using Next.js App Router, we don't need react-router-dom anymore
 */

export const AppRoutes = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  viewEarnings: "/earnings",
  viewExpenses: "/expenses",
  viewInventory: "/inventory",
  tasks: "/tasks",
  addTask: "/tasks/add",
  downloadExcel: "/download-excel",
  inventory: "/inventory",
  addExpense: "/expenses/add",
  addEarning: "/earnings/add",
  receiptScanner: "/receipt-scanner",
  financialDashboard: "/financial-dashboard",
  feedback: "/feedback",
};

/**
 * Get a route with parameters replaced
 * @example getRoute(AppRoutes.userProfile, { id: '123' }) => '/users/123'
 */
export function getRoute(route: string, params?: Record<string, string>) {
  if (!params) return route;
  
  let result = route;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, value);
  });
  
  return result;
}
