import Chart from 'chart.js/auto';

export let chartInstances = {};

// Export all functions
export async function fetchChartData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/chart-data', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch chart data: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching chart data:', error);
        return null;
    }
}

export function createChart(ctx, type, labels, label, data, backgroundColor, borderColor) {
    // Destroy existing chart if it exists
    if (chartInstances[ctx.canvas.id]) {
        chartInstances[ctx.canvas.id].destroy();
    }

    const newChart = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Store the chart instance
    chartInstances[ctx.canvas.id] = newChart;
    return newChart;
}

export async function initializeCharts() {
    const data = await fetchChartData();
    if (!data) {
        console.error('No data available to create charts.');
        return;
    }

    const chartConfigs = [
        {
            id: 'totalMoneySpentChart',
            label: 'Total Money Spent Today',
            dataKey: 'total_money_spent_today',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)'
        },
        {
            id: 'dailyEarningsChart',
            label: 'Daily Earnings',
            dataKey: 'daily_earnings',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)'
        },
        {
            id: 'monthlyEarningsChart',
            label: 'Monthly Earnings',
            dataKey: 'monthly_earnings',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)'
        },
        {
            id: 'monthlyExpensesRepeatingChart',
            label: 'Monthly Repeating Expenses',
            dataKey: 'monthly_expenses_repeating',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)'
        },
        {
            id: 'monthlyExpensesNonRepeatingChart',
            label: 'Monthly Non-Repeating Expenses',
            dataKey: 'monthly_expenses_non_repeating',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgba(255, 159, 64, 1)'
        }
    ];

    chartConfigs.forEach(config => {
        const canvas = document.getElementById(config.id);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            createChart(
                ctx,
                'line',
                data.labels,
                config.label,
                data.datasets[config.dataKey],
                config.backgroundColor,
                config.borderColor
            );
        }
    });
}

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCharts);

