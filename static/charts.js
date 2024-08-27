let chartInstances = {};

// Function to create a chart dynamically
function createChart(ctx, type, labels, label, data, backgroundColor, borderColor) {
    if (!ctx) {
        console.error('Canvas context is not available for chart:', label);
        return;
    }

    // Destroy previous chart instance if it exists
    if (chartInstances[ctx.canvas.id]) {
        chartInstances[ctx.canvas.id].destroy();
    }

    chartInstances[ctx.canvas.id] = new Chart(ctx, {
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
            maintainAspectRatio: true,
            scales: type === 'pie' ? {} : {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    return chartInstances[ctx.canvas.id];
}

// Function to fetch data from API
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data from API: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched Data:', data); // Debug log to check data format
        return data;
    } catch (error) {
        console.error('Error fetching financial overview data:', error);
        return null; // Return null if fetching fails
    }
}

// Function to initialize all charts
function initializeCharts(data) {
    if (!data) {
        console.error('No data available to create charts.');
        return;
    }

    const chartConfigurations = [
        { ctxId: 'totalMoneySpentChart', type: 'bar', dataKey: 'total_money_spent_today', label: 'Total Money Spent Today', backgroundColor: 'rgba(153, 102, 255, 0.2)', borderColor: 'rgba(153, 102, 255, 1)' },
        { ctxId: 'dailyEarningsChart', type: 'bar', dataKey: 'daily_earnings', label: 'Daily Earnings', backgroundColor: 'rgba(75, 192, 192, 0.2)', borderColor: 'rgba(75, 192, 192, 1)' },
        { ctxId: 'weeklyEarningsChart', type: 'bar', dataKey: 'weekly_earnings', label: 'Weekly Earnings', backgroundColor: 'rgba(54, 162, 235, 0.2)', borderColor: 'rgba(54, 162, 235, 1)' },
        { ctxId: 'monthlyEarningsChart', type: 'bar', dataKey: 'monthly_earnings', label: 'Monthly Earnings', backgroundColor: 'rgba(255, 206, 86, 0.2)', borderColor: 'rgba(255, 206, 86, 1)' },
        { ctxId: 'monthlyExpensesNonRepeatingChart', type: 'bar', dataKey: 'monthly_expenses_non_repeating', label: 'Monthly Expenses Non-Repeating', backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: 'rgba(255, 99, 132, 1)' },
        { ctxId: 'monthlyExpensesRepeatingChart', type: 'bar', dataKey: 'monthly_expenses_repeating', label: 'Monthly Expenses Repeating', backgroundColor: 'rgba(54, 162, 235, 0.2)', borderColor: 'rgba(54, 162, 235, 1)' },
        { ctxId: 'monthlyExpensesTotalChart', type: 'bar', dataKey: 'total_expenses', label: 'Monthly Expenses Total', backgroundColor: 'rgba(255, 206, 86, 0.2)', borderColor: 'rgba(255, 206, 86, 1)' },
        { ctxId: 'dailyExpensesChart', type: 'bar', dataKey: 'daily_expenses_total', label: 'Daily Expenses Total', backgroundColor: 'rgba(255, 159, 64, 0.2)', borderColor: 'rgba(255, 159, 64, 1)' },
        { ctxId: 'savingsRateChart', type: 'bar', dataKey: 'savings_rate', label: 'Savings Rate', backgroundColor: 'rgba(199, 199, 199, 0.2)', borderColor: 'rgba(199, 199, 199, 1)' },
    ];

    chartConfigurations.forEach(config => {
        const canvasElement = document.getElementById(config.ctxId);
        if (canvasElement) {
            const ctx = canvasElement.getContext('2d');
            const chartData = data[config.dataKey]; // Use dataKey to access the correct dataset
            if (chartData && data.labels) {
                createChart(ctx, config.type, data.labels, config.label, chartData, config.backgroundColor, config.borderColor);
            } else {
                console.error(`Data for chart ${config.label} is missing or malformed. Data received:`, chartData);
            }
        } else {
            console.error(`Canvas element with ID ${config.ctxId} not found.`);
        }
    });
}

// Initialize charts when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async function () {
    const apiUrl = '/api/financial_overview';
    const data = await fetchData(apiUrl); // Fetch data once
    initializeCharts(data); // Use the fetched data to initialize all charts
});

