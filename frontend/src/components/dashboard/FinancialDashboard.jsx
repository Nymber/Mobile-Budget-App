import React, { useState, useEffect } from 'react';
import { authAxios, isAuthenticated, validateToken } from '../../../services/authService';
import { useRouter } from 'next/router';
import styles from './styles/FinancialDashboard.module.css';

const FinancialDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      if (!isAuthenticated()) {
        console.error("Authentication token not found");
        router.push('/login');
        return;
      }

      // First make sure token is valid
      const isValid = await validateToken();
      if (!isValid) {
        console.error("Invalid or expired token");
        router.push('/login');
        return;
      }

      // Attempt to fetch dashboard data
      console.log("Fetching dashboard data...");
      const response = await authAxios().get('/financial-dashboard');
      console.log("Dashboard data received:", response.data);
      
      setDashboardData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      
      setError(error.message || "Failed to load dashboard data");
      setLoading(false);
      
      // If unauthorized, redirect to login
      if (error.response && error.response.status === 401) {
        router.push('/login');
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Add a refresh interval if needed
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return (
      <div>
        <div>Error: {error}</div>
        <button onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>No dashboard data available</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Financial Dashboard</h1>
      
      {/* Daily Score Section */}
      <div className={styles.overview}>
        <h3>Daily Score</h3>
        <div className={styles.dataCard}>
          <h2 className={styles.dataTitle}>Daily Score</h2>
          <p className={styles.dataValue}>${dashboardData.dailyScore.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Financial Data Section */}
      <div className={styles.overview}>
        <h3>Financial Timeline</h3>
        {dashboardData.financialData.map((data, index) => (
          <div key={index} className={styles.dataCard}>
            <h2 className={styles.dataTitle}>{data.date}</h2>
            <p className={styles.dataValue}>
              <span className={data.balance >= 0 ? styles.positive : styles.negative}>
                ${data.balance.toFixed(2)}
              </span>
            </p>
          </div>
        ))}
      </div>
      
      {/* Budget Categories Section */}
      <div className={styles.overview}>
        <h3>Budget Categories</h3>
        {dashboardData.budgetCategories.map((category, index) => (
          <div key={index} className={styles.dataCard}>
            <h2 className={styles.dataTitle}>{category.category}</h2>
            <p className={styles.dataValue}>
              <span>{category.percentage.toFixed(0)}%</span>
              <span>${category.spent.toFixed(2)} spent</span>
              <span>${category.remaining.toFixed(2)} remaining</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialDashboard;
