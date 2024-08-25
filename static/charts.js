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
                    type: 'time',  // Use time scale for x-axis to handle dates
                    time: {
                        unit: 'day'  // Group data by day
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
function fetchAndCreateChart(url, ctxId, type, label, backgroundColor, borderColor) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Fetched Data:', data);  // Debug log to check data format
            const canvasElement = document.getElementById(ctxId);
            if (canvasElement) {
                const ctx = canvasElement.getContext('2d');
                createChart(ctx, type, data.labels, label, data[label.toLowerCase().replace(/\s/g, '_')], backgroundColor, borderColor);
            } else {
                console.error(`Canvas element with ID ${ctxId} not found.`);
            }
        })
        .catch(error => console.error('Error fetching financial overview data:', error));
}

// Initialize charts when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    fetchAndCreateChart('/api/financial_overview', 'totalMoneySpentChart', 'bar', 'Total Money Spent Today', 'rgba(153, 102, 255, 0.2)', 'rgba(153, 102, 255, 1)');
    fetchAndCreateChart('/api/financial_overview', 'dailyEarningsChart', 'line', 'Daily Earnings', 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
    fetchAndCreateChart('/api/financial_overview', 'weeklyEarningsChart', 'line', 'Weekly Earnings', 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)');
    fetchAndCreateChart('/api/financial_overview', 'monthlyEarningsChart', 'line', 'Monthly Earnings', 'rgba(255, 206, 86, 0.2)', 'rgba(255, 206, 86, 1)');
    fetchAndCreateChart('/api/financial_overview', 'monthlyExpensesNonRepeatingChart', 'bar', 'Monthly Expenses Non-Repeating', 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)');
    fetchAndCreateChart('/api/financial_overview', 'monthlyExpensesRepeatingChart', 'bar', 'Monthly Expenses Repeating', 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)');
    fetchAndCreateChart('/api/financial_overview', 'monthlyExpensesTotalChart', 'bar', 'Monthly Expenses Total', 'rgba(255, 206, 86, 0.2)', 'rgba(255, 206, 86, 1)');
    fetchAndCreateChart('/api/financial_overview', 'dailyExpensesChart', 'bar', 'Daily Expenses Total', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 159, 64, 1)');
    fetchAndCreateChart('/api/financial_overview', 'savingsRateChart', 'line', 'Savings Rate', 'rgba(199, 199, 199, 0.2)', 'rgba(199, 199, 199, 1)');
});
