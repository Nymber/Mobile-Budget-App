// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { initializeCharts } from './static/charts';
import Layout from './Layout';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/dashboard`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
          // Initialize charts after dashboard data is set
          setTimeout(() => {
            initializeCharts();
          }, 100);
        } else if (response.status === 401) {
          navigate('/login');
        }
      } catch (error) {
        console.error('Dashboard error:', error);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const updateSavingsGoal = async (newGoal) => {
    try {
      // Validate input
      const goalAmount = parseFloat(newGoal);
      if (isNaN(goalAmount) || goalAmount < 0) {
        alert('Please enter a valid positive number');
        return;
      }

      const token = localStorage.getItem('token');
      // Fetch fresh dashboard data after updating savings goal
      const response = await fetch(`${process.env.REACT_APP_API_URL}/update-savings-goal`, {
        method: 'POST',
        credentials: 'include',  // Add this line
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ monthly_savings_goal: goalAmount })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update savings goal');
      }

      // After successful update, fetch fresh dashboard data
      const dashboardResponse = await fetch(`${process.env.REACT_APP_API_URL}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (dashboardResponse.ok) {
        const freshData = await dashboardResponse.json();
        setDashboardData(freshData);
        initializeCharts(freshData); // Re-initialize charts with new data
      }
    } catch (error) {
      console.error('Failed to update savings goal:', error.message);
      alert('Failed to update savings goal: ' + error.message);
    }
  };

  const getTips = () => {
    if (!dashboardData) return [];

    const tips = [];
    
    // Daily spending tips
    const remainingDailyLimit = Math.max(0, dashboardData.daily_limit - dashboardData.total_money_spent_today);
    if (remainingDailyLimit === 0) {
        const overspent = (dashboardData.total_money_spent_today - dashboardData.daily_limit).toFixed(2);
        tips.push(`⚠️ Daily spending alert: You've exceeded your daily limit by $${overspent}. Consider postponing non-essential purchases.`);
    }

    // Savings rate tips
    if (dashboardData.savings_rate < 20) {
        tips.push("💡 Your savings rate is " + dashboardData.savings_rate.toFixed(1) + 
                 "%. Try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.");
    } else if (dashboardData.savings_rate > 30) {
        tips.push("🌟 Excellent savings rate of " + dashboardData.savings_rate.toFixed(1) + 
                 "%! Consider investing your extra savings for long-term growth.");
    }

    // Monthly expense management
    if (dashboardData.monthly_expenses > dashboardData.monthly_earnings * 0.7) {
        tips.push("📦 Your expenses are " + 
                 ((dashboardData.monthly_expenses / dashboardData.monthly_earnings) * 100).toFixed(1) + 
                 "% of your income. Try tracking expenses by category to identify areas for reduction.");
    }

    // Savings goal progress
    const monthlyGoalProgress = (dashboardData.savings_forecast / dashboardData.monthly_savings_goal) * 100;
    if (monthlyGoalProgress < 50) {
        tips.push("🎯 You're " + monthlyGoalProgress.toFixed(1) + 
                 "% towards your monthly savings goal. Consider automating your savings transfers.");
    }

    // Daily earnings vs expenses
    if (dashboardData.daily_earnings < dashboardData.total_money_spent_today) {
        tips.push("💰 Today's spending exceeds earnings. Look for additional income opportunities or reduce discretionary spending.");
    }

    // Positive reinforcement for good habits
    if (dashboardData.total_money_spent_today < dashboardData.daily_limit * 0.5) {
        tips.push("🏆 Great job staying well under your daily limit! Consider moving the extra savings to an emergency fund.");
    }

    // Emergency fund tip
    const monthlyExpenses = dashboardData.monthly_expenses;
    if (monthlyExpenses > 0) {
        tips.push("🏦 Financial tip: Aim to build an emergency fund covering 3-6 months of expenses ($" + 
                 (monthlyExpenses * 3).toFixed(2) + " - $" + (monthlyExpenses * 6).toFixed(2) + ")");
    }

    // Debt management tip (if expenses are high)
    if (dashboardData.monthly_expenses > dashboardData.monthly_earnings * 0.5) {
        tips.push("💳 High expense ratio detected. Consider using the debt avalanche method: Pay off high-interest debts first.");
    }

    // Income diversification tip
    if (dashboardData.monthly_earnings > 0) {
        tips.push("📈 Financial wisdom: Aim to develop multiple income streams. Consider freelancing, investments, or passive income opportunities.");
    }

    // Seasonal spending tip
    const currentMonth = new Date().getMonth();
    if ([10, 11].includes(currentMonth)) { // November, December
        tips.push("🎁 Holiday season approaching! Set aside a specific budget for gifts and celebrations to avoid overspending.");
    }

    return tips.slice(0, 5); // Limit to 5 most relevant tips
  };

  const actions = (
    <>
      <li><Link to="/Tasks" className="nav-link">To-Do</Link></li>
      <li><Link to="/view-inventory" className="nav-link">Inventory</Link></li>
    </>
  );

  return (
    <Layout 
      title="Financial Dashboard"
      actions={actions}
    >
      {dashboardData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-800">Daily Summary</h3>
              <p>Daily Spend Limit: ${(() => {
                // Calculate non-repeating expenses for today
                const remainingLimit = Math.max(0, dashboardData.daily_limit - dashboardData.total_money_spent_today);
                return remainingLimit.toFixed(2);
              })()} (Original: ${dashboardData.daily_limit})</p>
              <p>Daily Earnings: ${dashboardData.daily_earnings}</p>
              <p>Money Spent Today (Includes Repeating Expenses): ${dashboardData.total_money_spent_today}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-800">Monthly Overview</h3>
              <p>Monthly Earnings: ${dashboardData.monthly_earnings}</p>
              <p>Monthly Expenses: ${dashboardData.monthly_expenses}</p>
              <p>Savings Rate: {dashboardData.savings_rate}%</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-800">Goals</h3>
              <p>Monthly Savings Goal: ${dashboardData.monthly_savings_goal?.toFixed(2) || '0.00'}</p>
              <p>Savings Forecast: ${dashboardData.savings_forecast?.toFixed(2)}</p>
              <button 
                onClick={async () => {
                  const newGoal = prompt('Enter your monthly savings goal:', dashboardData.monthly_savings_goal);
                  if (newGoal !== null && !isNaN(newGoal)) {
                    await updateSavingsGoal(Number(newGoal));
                    // Refresh dashboard data immediately after setting new goal
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/dashboard`, {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      }
                    });
                    if (response.ok) {
                      const data = await response.json();
                      setDashboardData(data);
                      initializeCharts();
                    }
                  }
                }}
                className="btn btn-primary mt-3"
              >
                Update Savings Goal
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-800">Financial Tips</h3>
              <div className="space-y-2">
                {getTips().map((tip, index) => (
                  <p key={index} className="bg-gray-100 p-2 rounded">{tip}</p>
                ))}
                {getTips().length === 0 && (
                  <p>You're doing great! Keep maintaining your financial habits.</p>
                )}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-800 ">Expenses</h3>
                <div className="space-y-4">
                  <button><Link to="/view-expenses" className="btn btn-primary">View Expenses</Link></button>
                  <button><Link to="/add-expense" className="btn btn-primary">Add Expense</Link></button>
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-800">Earnings</h3>
              <div className="space-y-4">
                <button><Link to="/view-earnings" className="btn btn-primary">View Earnings</Link></button>
                <button><Link to="/add-earnings" className="btn btn-primary">Add Earnings</Link></button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="chart-container">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Earnings</h3>
              <div id="monthlyEarningsChart" className="w-full h-[300px]"></div>
            </div>
            <div className="chart-container">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Expenses (Repeating)</h3>
              <div id="monthlyExpensesRepeatingChart" className="w-full h-[300px]"></div>
            </div>
            <div className="chart-container">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Expenses (Non-Repeating)</h3>
              <div id="monthlyExpensesNonRepeatingChart" className="w-full h-[300px]"></div>
            </div>
            <div className="chart-container">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Earnings</h3>
              <div id="dailyEarningsChart" className="w-full h-[300px]"></div>
            </div>
            <div className="chart-container col-span-full">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Total Money Spent by Day</h3>
              <div id="totalMoneySpentChart" className="w-full h-[300px]"></div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;