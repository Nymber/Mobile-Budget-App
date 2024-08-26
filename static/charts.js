// Function to create a chart dynamically
function createChart(ctx, type, labels, label, data, backgroundColor, borderColor) {
    if (!ctx) {
        console.error('Canvas context is not available for chart:', label);
        return;
    }

    return new Chart(ctx, {
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
            maintainAspectRatio: false,
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
}

// Function to fetch data from API and create a chart
async function fetchAndCreateChart(url, ctxId, type, label, backgroundColor, borderColor) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data from API: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched Data:', data); // Debug log to check data format

        const canvasElement = document.getElementById(ctxId);
        if (canvasElement) {
            const ctx = canvasElement.getContext('2d');
            const chartData = data[label.toLowerCase().replace(/\s/g, '_')];
            createChart(ctx, type, data.labels, label, chartData, backgroundColor, borderColor);
        } else {
            console.error(`Canvas element with ID ${ctxId} not found.`);
        }
    } catch (error) {
        console.error('Error fetching financial overview data:', error);
    }
}

// Initialize charts when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async function () {
    const apiUrl = '/api/financial_overview';
    fetchAndCreateChart(apiUrl, 'totalMoneySpentChart', 'bar', 'Total Money Spent Today', 'rgba(153, 102, 255, 0.2)', 'rgba(153, 102, 255, 1)');
    fetchAndCreateChart(apiUrl, 'dailyEarningsChart', 'line', 'Daily Earnings', 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
    fetchAndCreateChart(apiUrl, 'weeklyEarningsChart', 'line', 'Weekly Earnings', 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)');
    fetchAndCreateChart(apiUrl, 'monthlyEarningsChart', 'line', 'Monthly Earnings', 'rgba(255, 206, 86, 0.2)', 'rgba(255, 206, 86, 1)');
    fetchAndCreateChart(apiUrl, 'monthlyExpensesNonRepeatingChart', 'bar', 'Monthly Expenses Non-Repeating', 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)');
    fetchAndCreateChart(apiUrl, 'monthlyExpensesRepeatingChart', 'bar', 'Monthly Expenses Repeating', 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)');
    fetchAndCreateChart(apiUrl, 'monthlyExpensesTotalChart', 'bar', 'Monthly Expenses Total', 'rgba(255, 206, 86, 0.2)', 'rgba(255, 206, 86, 1)');
    fetchAndCreateChart(apiUrl, 'dailyExpensesChart', 'bar', 'Daily Expenses Total', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 159, 64, 1)');
    fetchAndCreateChart(apiUrl, 'savingsRateChart', 'line', 'Savings Rate', 'rgba(199, 199, 199, 0.2)', 'rgba(199, 199, 199, 1)');
});