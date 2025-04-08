import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';
import styles from '@/components/dashboard/static/styles/FinancialDashboard.module.css'; // Ensure this path is correct
import { apiGet } from '@/services/apiUtils';
import { useAuth } from '@/components/auth/AuthProvider';
import { RefreshCw } from 'lucide-react';

// Define types for our financial data
interface FinancialDatum {
  date: string;
  income: number;
  expenses: number;
  balance: number;
  projected: number;
}

interface BudgetCategory {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    total_money_spent: number[];
    daily_earnings: number[];
    monthly_expenses_repeating: number[];
    monthly_expenses_non_repeating: number[];
    monthly_earnings: number[];
  };
}

interface DashboardData {
  dailyScore?: number;
  financialData?: FinancialDatum[];
  budgetCategories?: BudgetCategory[];
}

const FinancialDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      fetchChartData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await apiGet<DashboardData>('financial-dashboard');
      
      if ('error' in response && response.error) {
        throw new Error(typeof response.error === 'string' ? response.error : 'An unknown error occurred');
      }
      
      setDashboardData(response as DashboardData);
    } catch (err: unknown) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await apiGet<ChartData>('chart-data');
      
      if ('error' in response && response.error) {
        throw new Error(typeof response.error === 'string' ? response.error : 'An unknown error occurred');
      }
      
      setChartData(response as ChartData);
    } catch (err: unknown) {
      console.error('Error fetching chart data:', err);
      // We don't set the main error here to avoid blocking the whole dashboard
    }
  };

  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Prepare chart data using real data
  const prepareChartData = (): FinancialDatum[] => {
    if (!chartData || !chartData.datasets || !chartData.labels) return [];

    return chartData.labels.map((date, index) => ({
      date,
      income: chartData.datasets.daily_earnings?.[index] || 0,
      expenses: chartData.datasets.total_money_spent?.[index] || 0,
      balance: (chartData.datasets.daily_earnings?.[index] || 0) - (chartData.datasets.total_money_spent?.[index] || 0),
      projected: 0 // We'll keep this zero since we're using real data
    }));
  };

  const prepareExpensesData = (): {category: string, spent: number, budgeted: number}[] => {
    if (!chartData || !chartData.datasets) return [];
    
    // Create expense categories based on monthly recurring and non-recurring expenses
    return [
      {
        category: 'Recurring',
        spent: chartData.datasets.monthly_expenses_repeating?.[0] || 0,
        budgeted: (chartData.datasets.monthly_expenses_repeating?.[0] || 0) * 1.1 // Budgeted slightly higher
      },
      {
        category: 'Non-Recurring',
        spent: chartData.datasets.monthly_expenses_non_repeating?.[0] || 0,
        budgeted: (chartData.datasets.monthly_expenses_non_repeating?.[0] || 0) * 1.2 // Budgeted slightly higher
      }
    ];
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingIndicator}></div>
        <p>Loading financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button className={styles.retryButton} onClick={fetchDashboardData}>
          <RefreshCw size={16} className={styles.refreshIcon} />
          Retry
        </button>
      </div>
    );
  }

  // If we have chart data but not dashboard data, we can still show something useful
  const financialData = dashboardData?.financialData || prepareChartData();
  const budgetCategories = dashboardData?.budgetCategories || prepareExpensesData().map(item => ({
    category: item.category,
    budgeted: item.budgeted,
    spent: item.spent,
    remaining: item.budgeted - item.spent,
    percentage: (item.spent / item.budgeted) * 100
  }));

  // Use the real daily score from dashboard data, or calculate from chart data if available
  // Fix the error by ensuring chartData and datasets exist before accessing properties
  const dailyScore = dashboardData?.dailyScore || 
    (chartData && chartData.datasets && 
     chartData.datasets.daily_earnings && 
     chartData.datasets.total_money_spent ? 
     chartData.datasets.daily_earnings[0] - chartData.datasets.total_money_spent[0] : 0);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h1>Financial Dashboard</h1>
        <div className={`${styles.scoreCard} ${styles.scoreCardBorder}`}>
          <div className={styles.scoreHeader}>Today&apos;s Balance</div>
          <div className={styles.scoreValue}>
            {formatCurrency(dailyScore)}
          </div>
        </div>
        <button className={styles.refreshButton} onClick={() => {
          fetchDashboardData();
          fetchChartData();
        }} disabled={refreshing}>
          <RefreshCw size={16} className={styles.refreshIcon} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className={styles.chartsGrid}>
        {/* Financial Forecast Chart */}
        <div className={styles.chartCard}>
          <h2>Financial Forecast</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" className={styles.cartesianGrid} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickLine={{ stroke: "var(--border)" }}
                />
                <YAxis 
                  tickFormatter={(value: number) => formatCurrency(value)} 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: "var(--border)" }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), ""]}
                  labelFormatter={(label: string) => `Date: ${label}`}
                />
                <Legend verticalAlign="top" height={36} />
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  name="Actual Balance"
                  stroke="var(--chart-1)" 
                  fillOpacity={1} 
                  fill="url(#balanceGradient)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="projected" 
                  name="Projected Balance"
                  stroke="var(--chart-3)" 
                  fillOpacity={1} 
                  fill="url(#projectedGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expenses Chart */}
        <div className={styles.chartCard}>
          <h2>Income vs. Expenses</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" className={styles.cartesianGrid} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickLine={{ stroke: "var(--border)" }}
                />
                <YAxis 
                  tickFormatter={(value: number) => formatCurrency(value)} 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: "var(--border)" }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), ""]}
                  labelFormatter={(label: string) => `Date: ${label}`}
                />
                <Legend verticalAlign="top" height={36} />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  name="Income"
                  stroke="var(--success)" 
                  strokeWidth={2} 
                  dot={{ r: 3 }} 
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  name="Expenses"
                  stroke="var(--destructive)" 
                  strokeWidth={2} 
                  dot={{ r: 3 }} 
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Categories */}
        <div className={styles.chartCard}>
          <h2>Budget Categories</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={budgetCategories}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className={styles.cartesianGrid} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12 }} 
                  tickLine={{ stroke: "var(--border)" }}
                />
                <YAxis 
                  tickFormatter={(value: number) => formatCurrency(value)} 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: "var(--border)" }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), ""]}
                  labelFormatter={(label: string) => `Category: ${label}`}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar 
                  dataKey="budgeted" 
                  name="Budgeted"
                  fill="var(--chart-4)" 
                  fillOpacity={0.6} 
                />
                <Bar 
                  dataKey="spent" 
                  name="Spent"
                  fill="var(--chart-5)" 
                  fillOpacity={0.6} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Budget Progress Section */}
      <div className={styles.budgetSection}>
        <h2>Budget Progress</h2>
        <div className={styles.progressContainer}>
          {budgetCategories.map((category: BudgetCategory, index: number) => (
            <div key={index} className={styles.progressItem}>
              <div className={styles.progressHeader}>
                <span className={styles.categoryName}>{category.category}</span>
                <span className={styles.categoryValues}>
                  {formatCurrency(category.spent)} of {formatCurrency(category.budgeted)}
                </span>
              </div>
              <div className={styles.progressBarContainer}>
                <div 
                  className={`${styles.progressBar} ${category.percentage > 100 
                    ? styles.progressBarDestructive 
                    : category.percentage > 80 
                      ? styles.progressBarWarning 
                      : styles.progressBarSuccess}`}
                  style={{ width: `${Math.min(100, category.percentage)}%` }}
                />
              </div>
              <div className={styles.progressFooter}>
                <span className={styles.remaining}>
                  {formatCurrency(category.remaining)} remaining
                </span>
                <span className={styles.percentage}>
                  {Math.round(category.percentage)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
