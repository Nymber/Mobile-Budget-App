export interface APIResponse<T> {
  data?: T;
  error?: string; // Ensure error is a string or undefined
}

import { API_URL } from './apiUtils';

// Log the API URL for debugging
console.log('API URL in api.ts (imported from apiUtils):', API_URL);

export async function fetchFromAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  try {
    // Get auth token from localStorage with improved token extraction
    let authToken = null;
    try {
      if (typeof window !== 'undefined') {
        // Try both potential token storage methods
        const authData = localStorage.getItem('authData');
        if (authData) {
          try {
            const parsedData = JSON.parse(authData);
            authToken = parsedData.token || parsedData.access_token;
          } catch (parseError) {
            console.warn('Failed to parse authData:', parseError);
          }
        }
        
        // Fallback to direct token storage
        if (!authToken) {
          authToken = localStorage.getItem('token');
        }
      }
    } catch (e) {
      console.error('Error accessing auth token:', e);
    }

    // Set up headers with authentication if token exists
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      ...(options?.headers || {}),
    };

    // Log the API request for debugging
    console.log(`Making ${options.method || 'GET'} request to ${API_URL}${endpoint}`);
    console.log('Using headers:', JSON.stringify(headers, null, 2));
    
    // Add timeout and abort controller to fetch to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for port-forwarded connections
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    // Clear the timeout since we got a response
    clearTimeout(timeoutId);

    // For DELETE requests that return no content
    if (response.status === 204) {
      return { data: {} as T, error: undefined };
    }

    // Handle 401 Unauthorized specifically
    if (response.status === 401) {
      console.error('Authentication error - token may be invalid or expired');
      // Redirect to login page if authentication fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authData');
        localStorage.removeItem('token');
        window.location.href = '/login?session=expired';
      }
      return { data: undefined, error: 'Authentication failed. Please log in again.' };
    }

    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      result = { message: text };
    }
    
    if (!response.ok) throw new Error(result.detail || 'API request failed');
    return { data: result, error: undefined };
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error);
    
    // More detailed error handling
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      errorMessage = `Unable to connect to the API server at ${API_URL}. Please check if the server is running and accessible.`;
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      errorMessage = 'Request timed out. The server took too long to respond.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return { data: undefined, error: errorMessage };
  }
}

// Financial dashboard data
export interface FinancialOverviewData {
  daily_score?: number;
  monthly_earnings: number;
  monthly_expenses: number;
  monthly_expenses_repeating: number;
  monthly_expenses_non_repeating: number;
  savings_goal: number;
  savings_forecast: number;
  savings_rate: number;
  daily_limit: number;
  daily_earnings: number;
  total_money_spent_today: number;
}

export async function getFinancialOverview(): Promise<APIResponse<FinancialOverviewData>> {
  return fetchFromAPI<FinancialOverviewData>('/dashboard');
}

// Chart data for expenses and income over time
export interface ChartPoint {
  date: string;
  value: number;
}

export interface ChartSeries {
  name: string;
  data: ChartPoint[];
}

export interface ChartData {
  expenses: ChartSeries[];
  income: ChartSeries[];
  timeRange: string;
  // Adding these properties to match the usage in the FinancialDashboard component
  dailyData?: Array<{
    date: string;
    income: number;
    expenses: number;
    projected?: number;
  }>;
  categories?: Array<{
    name: string;
    budget: number;
    spent: number;
  }>;
}

export async function getChartData(): Promise<APIResponse<ChartData>> {
  return fetchFromAPI<ChartData>('/chart-data');
}

// Expenses API
export interface Expense {
  id: number;
  name: string;
  price: number;
  repeating: boolean;
  timestamp: string;
}

export async function getExpenses(): Promise<APIResponse<Expense[]>> {
  return fetchFromAPI<Expense[]>('/expenses');
}

export async function createExpense(expense: Omit<Expense, 'id' | 'timestamp'>): Promise<APIResponse<Expense>> {
  return fetchFromAPI<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(expense)
  });
}

export async function deleteExpense(id: number): Promise<APIResponse<{message: string}>> {
  return fetchFromAPI<{message: string}>(`/expenses/${id}`, {
    method: 'DELETE'
  });
}

// Earnings API
export interface Earning {
  id: number;
  hourly_rate: number;
  hours: number;
  cash_tips: number;
  salary: number;
  timestamp: string;
}

export async function getEarnings(): Promise<APIResponse<Earning[]>> {
  return fetchFromAPI<Earning[]>('/earnings');
}

export async function createEarning(earning: Omit<Earning, 'id' | 'timestamp'>): Promise<APIResponse<Earning>> {
  return fetchFromAPI<Earning>('/earnings', {
    method: 'POST',
    body: JSON.stringify(earning)
  });
}

export async function updateEarning(earningId: number, data: Partial<Earning>): Promise<APIResponse<Earning>> {
  return fetchFromAPI<Earning>(`/earnings/${earningId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEarning(earningId: number): Promise<APIResponse<null>> {
  return fetchFromAPI<null>(`/earnings/${earningId}`, { 
    method: 'DELETE' 
  });
}

// Tasks API
export interface Task {
  id: number;
  title: string;
  is_complete: boolean;
  repeat_daily: boolean;
  timestamp: string;
}

export async function getTasks(): Promise<APIResponse<Task[]>> {
  return fetchFromAPI<Task[]>('/tasks');
}

export async function createTask(task: Omit<Task, 'id' | 'timestamp'>): Promise<APIResponse<Task>> {
  return fetchFromAPI<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(task)
  });
}

export async function updateTask(id: number, task: Omit<Task, 'id' | 'timestamp'>): Promise<APIResponse<Task>> {
  return fetchFromAPI<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(task)
  });
}

export async function completeTask(id: number): Promise<APIResponse<Task>> {
  return fetchFromAPI<Task>(`/complete_task/${id}`, {
    method: 'POST'
  });
}

export async function deleteTask(id: number): Promise<APIResponse<{message: string}>> {
  return fetchFromAPI<{message: string}>(`/delete_task/${id}`, {
    method: 'DELETE'
  });
}

// Update savings goal
export async function updateSavingsGoal(amount: number): Promise<APIResponse<{monthly_savings_goal: number}>> {
  return fetchFromAPI<{monthly_savings_goal: number}>('/update-savings-goal', {
    method: 'POST',
    body: JSON.stringify({ amount })
  });
}

// Reports API
export interface Report {
  id: number;
  name: string;
  description: string;
}

export async function fetchReportsList(): Promise<APIResponse<Report[]>> {
  return fetchFromAPI<Report[]>('/reports');
}

// Inventory API
export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  timestamp?: string;
}

export async function getInventory(): Promise<APIResponse<InventoryItem[]>> {
  return fetchFromAPI<InventoryItem[]>('/inventory');
}

export async function createInventoryItem(item: Omit<InventoryItem, 'id' | 'timestamp'>): Promise<APIResponse<InventoryItem>> {
  return fetchFromAPI<InventoryItem>('/inventory', {
    method: 'POST',
    body: JSON.stringify(item)
  });
}

export async function updateInventoryItem(id: number, item: Omit<InventoryItem, 'id' | 'timestamp'>): Promise<APIResponse<InventoryItem>> {
  return fetchFromAPI<InventoryItem>(`/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item)
  });
}

export async function deleteInventoryItem(id: number): Promise<APIResponse<{message: string}>> {
  return fetchFromAPI<{message: string}>(`/inventory/${id}`, {
    method: 'DELETE'
  });
}

export async function updateExpense(id: number, expense: Partial<Expense>): Promise<APIResponse<Expense>> {
  return fetchFromAPI<Expense>(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(expense)
  });
}

// Download report implementation
export async function downloadReport(endpoint: string): Promise<Blob> {
  try {
    // Get auth token with improved extraction
    let authToken = null;
    try {
      if (typeof window !== 'undefined') {
        // Try both potential token storage methods
        const authData = localStorage.getItem('authData');
        if (authData) {
          try {
            const parsedData = JSON.parse(authData);
            authToken = parsedData.token || parsedData.access_token;
          } catch (parseError) {
            console.warn('Failed to parse authData:', parseError);
          }
        }
        
        // Fallback to direct token storage
        if (!authToken) {
          authToken = localStorage.getItem('token');
        }
      }
    } catch (e) {
      console.error('Error accessing auth token:', e);
    }

    if (!authToken) {
      throw new Error('Authentication required. Please log in again.');
    }

    // Use full URL
    const url = `${API_URL}${endpoint}`;
    console.log('Downloading report from:', url);
    
    // Add timeout to prevent hanging on port-forwarded connections
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for downloads
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        // Handle auth issues
        localStorage.removeItem('authData');
        localStorage.removeItem('token');
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(`Failed to download report: ${response.statusText}`);
    }

    // Get the response as a blob
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error;
  }
}

// Add a more robust getReports function
export interface ReportOption {
  id: string;
  name: string;
  description: string;
  endpoint: string;
}

export async function getReports(): Promise<APIResponse<ReportOption[]>> {
  // This would normally fetch from an API, but since we don't have a specific endpoint
  // for report metadata, we'll return hardcoded options that match our backend routes
  const reportOptions: ReportOption[] = [
    {
      id: 'earnings',
      name: 'Earnings Report',
      description: 'Download all your earnings data in Excel format',
      endpoint: '/download-excel'
    },
    {
      id: 'expenses',
      name: 'Expenses Report',
      description: 'Download all your expenses data in Excel format',
      endpoint: '/download-expenses-excel'
    },
    {
      id: 'inventory',
      name: 'Inventory Report',
      description: 'Download your complete inventory in Excel format',
      endpoint: '/download-inventory-excel'
    }
  ];
  
  return { data: reportOptions, error: undefined };
}
