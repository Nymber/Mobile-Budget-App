import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import styles from '@/components/dashboard/static/styles/DailyFinancialOverview.module.css';
import { apiGet } from '@/services/apiUtils';
import { useAuth } from '@/components/auth/AuthProvider';
import { RefreshCw } from 'lucide-react';

interface FinancialOverviewData {
  dailyScore?: number;
  daily_score?: number;
  daily_earnings?: number;
  total_money_spent_today?: number;
  monthly_earnings?: number;
  monthly_expenses?: number;
  monthly_expenses_repeating?: number;
  monthly_expenses_non_repeating?: number;
  daily_limit?: number;
  savings_forecast?: number;
  savings_rate?: number;
  monthly_savings_goal?: number;
  // Add fields from old component for compatibility
  financialData?: Array<{
    date: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
  budgetCategories?: Array<{
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentage: number;
  }>;
}

const DailyFinancialOverview: React.FC = () => {
  const [financialData, setFinancialData] = useState<FinancialOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();
  const today = new Date();

  useEffect(() => {
    if (isAuthenticated) {
      fetchFinancialData();
    }
  }, [isAuthenticated]);

  const fetchFinancialData = async () => {
    try {
      setRefreshing(true);
      // Try the newer /dashboard endpoint first
      let response = await apiGet<{ data: FinancialOverviewData; error?: string }>('dashboard');
      
      if (response.error) {
        // If that fails, try the older /financial-dashboard endpoint
        response = await apiGet<{ data: FinancialOverviewData; error?: string }>('financial-dashboard');
        
        if (response.error) {
          throw new Error(response.error);
        }
      }
      
      console.log('Received financial data:', response.data);
      setFinancialData(response.data as FinancialOverviewData);
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching financial data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Format currency values
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Safely format percentage values
  const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0.0';
    return value.toFixed(1);
  };

  // Determine color class for score - using CSS variables for semantic colors
  const getScoreColorClass = (score: number): string => {
      return styles.scoreValue; // We'll keep the class but override color with inline style
    };
  
  // Get semantic color value based on score
  const getScoreColor = (score: number): string => {
    if (score > 20) return 'var(--success)';
    if (score > 0) return 'var(--success)';
    if (score === 0) return 'var(--muted-foreground)';
    if (score > -20) return 'var(--warning)';
    return 'var(--destructive)';
  };

  // Calculate the percentage for the progress bars (capped at 100%)
  const calculatePercentage = (value: number | undefined, total: number): number => {
    if (total === 0 || value === undefined) return 0;
    return Math.min(100, (value / total) * 100);
  };

  if (loading) {
    return (
      <div className={styles.overviewContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Today&apos;s Financial Overview</h2>
          <div className={styles.date}>{format(today, 'MMMM d, yyyy')}</div>
        </div>
        <div className={styles.scoreSection}>
          <div>Loading financial data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.overviewContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Today&apos;s Financial Overview</h2>
          <div className={styles.date}>{format(today, 'MMMM d, yyyy')}</div>
        </div>
        <div className={styles.scoreSection}>
          <div>Error: {error}</div>
          <button 
            className={styles.refreshButton}
            onClick={fetchFinancialData}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={styles.refreshIcon} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className={styles.overviewContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Today&apos;s Financial Overview</h2>
          <div className={styles.date}>{format(today, 'MMMM d, yyyy')}</div>
        </div>
        <div className={styles.scoreSection}>
          <div>No financial data available</div>
        </div>
      </div>
    );
  }

  // Handle different API response formats
  // Get the daily score from either daily_score or dailyScore field
  const dailyScore = financialData.daily_score !== undefined 
    ? financialData.daily_score 
    : (financialData.dailyScore !== undefined ? financialData.dailyScore : 0);

  // Get the daily earnings - could be 0 if not available
  const dailyEarnings = financialData.daily_earnings || 0;
  const totalMoneySpentToday = financialData.total_money_spent_today || 0;
  const monthlyEarnings = financialData.monthly_earnings || 0;
  const dailyLimit = financialData.daily_limit || 0;
  const savingsForecast = financialData.savings_forecast || 0;
  const savingsRate = financialData.savings_rate || 0;
  const monthlySavingsGoal = financialData.monthly_savings_goal || 0;

  // Calculate max value for progress bars (for visual comparison)
  const maxValue = Math.max(dailyEarnings, totalMoneySpentToday, 1);

  return (
    <div className={styles.overviewContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Today&apos;s Financial Overview</h2>
        <div className={styles.date}>{format(today, 'MMMM d, yyyy')}</div>
      </div>
      
      <div className={styles.scoreSection}>
        <div className={getScoreColorClass(dailyScore)} style={{ color: getScoreColor(dailyScore) }}>
          {formatCurrency(dailyScore)}
        </div>
        <div>
          {dailyScore >= 0 
            ? "You're within budget today! 🎉" 
            : "You've spent more than earned today"}
        </div>
        
        <button 
          className={styles.refreshButton}
          onClick={fetchFinancialData}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={styles.refreshIcon} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      
      <div className={styles.breakdown}>
        <div className={styles.category}>
          <div className={styles.categoryLabel}>Today&apos;s Earnings</div>
          <div className={styles.categoryValue} style={{ color: 'var(--success)' }}>
            {formatCurrency(dailyEarnings)}
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progress} 
              style={{ 
                width: `${calculatePercentage(dailyEarnings, maxValue)}%`,
                backgroundColor: 'var(--success)' 
              }}
            />
          </div>
          <div className={styles.categoryLabel} style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
            From monthly earnings of {formatCurrency(monthlyEarnings)}
          </div>
        </div>
        
        <div className={styles.category}>
          <div className={styles.categoryLabel}>Today&apos;s Expenses</div>
          <div className={styles.categoryValue} style={{ color: 'var(--destructive)' }}>
            {formatCurrency(totalMoneySpentToday)}
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progress}
              style={{ 
                width: `${calculatePercentage(totalMoneySpentToday, maxValue)}%`,
                backgroundColor: 'var(--destructive)' 
              }}
            />
          </div>
          <div className={styles.categoryLabel} style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
            Daily limit: {formatCurrency(dailyLimit)}
          </div>
        </div>
      </div>
      
      {/* Additional financial metrics */}
      <div className={styles.breakdown} style={{ marginTop: '1rem' }}>
        <div className={styles.category}>
          <div className={styles.categoryLabel}>Monthly Savings Goal</div>
          <div className={styles.categoryValue} style={{ color: 'var(--primary)' }}>
            {formatCurrency(monthlySavingsGoal)}
          </div>
        </div>
        
        <div className={styles.category}>
          <div className={styles.categoryLabel}>Savings Forecast</div>
          <div className={styles.categoryValue} style={{ 
            color: savingsForecast >= 0 ? 'var(--success)' : 'var(--destructive)'
          }}>
            {formatCurrency(savingsForecast)}
          </div>
          <div className={styles.categoryLabel} style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
            Savings rate: {formatPercentage(savingsRate)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyFinancialOverview;