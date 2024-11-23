import * as d3 from 'd3';

export const fetchChartData = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/chart-data`, {
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
};

export const createBarChart = (containerId, data, labels, label) => {
    // Ensure data is numeric
    const numericData = data.map(d => Number(d));

    if (!Array.isArray(data) || !Array.isArray(labels)) {
        console.error('Data or labels are not iterable');
        return;
    }

    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add chart background
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#f8fafc')
        .attr('rx', 6);

    const x = d3.scaleBand()
        .domain(labels)
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(numericData) * 1.1]) // Add 10% padding to top
        .nice()
        .range([height, 0]);

    // Add bars with transitions
    svg.selectAll('.bar')
        .data(numericData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d, i) => x(labels[i]))
        .attr('width', x.bandwidth())
        .attr('y', height)
        .attr('height', 0)
        .attr('fill', '#3b82f6')
        .attr('rx', 4)
        .transition()
        .duration(750)
        .attr('y', d => y(d))
        .attr('height', d => height - y(d));

    // Add value labels on top of bars
    svg.selectAll('.value-label')
        .data(numericData)
        .enter()
        .append('text')
        .attr('class', 'value-label')
        .attr('x', (d, i) => x(labels[i]) + x.bandwidth() / 2)
        .attr('y', d => y(d) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .text(d => `$${Number(d).toFixed(2)}`);

    // Style axes
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .style('font-size', '12px')
        .style('fill', '#64748b');

    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickFormat(d => `$${d}`))
        .style('font-size', '12px')
        .style('color', '#64748b');

    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -margin.top / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', '#1e293b')
        .text(label);

    // Add grid lines
    svg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat(''));
};

export const initializeCharts = async () => {
    const data = await fetchChartData();
    if (!data) {
        console.error('No data available to create charts.');
        return;
    }

    // Ensure we're working with numbers
    const processDataset = (dataset) => {
        if (!Array.isArray(dataset)) {
            return [Number(dataset) || 0];
        }
        return dataset.map(d => Number(d) || 0);
    };

    // Add monthly earnings chart
    createBarChart('monthlyEarningsChart',
        processDataset(data.datasets.monthly_earnings),
        data.labels,
        'Monthly Earnings'
    );

    // Make sure we only show days with actual data
    const validIndices = data.datasets.total_money_spent
        .map((value, index) => value > 0 || data.datasets.daily_earnings[index] > 0 ? index : -1)
        .filter(index => index !== -1);

    const filterData = (dataset) => validIndices.map(i => dataset[i]);

    createBarChart('totalMoneySpentChart', 
        filterData(processDataset(data.datasets.total_money_spent)),
        filterData(data.labels),
        'Total Money Spent by Day'
    );

    createBarChart('dailyEarningsChart',
        filterData(processDataset(data.datasets.daily_earnings)),
        filterData(data.labels),
        'Daily Earnings'
    );

    createBarChart('monthlyExpensesRepeatingChart',
        filterData(processDataset(data.datasets.monthly_expenses_repeating)),
        filterData(data.labels),
        'Monthly Repeating Expenses'
    );

    createBarChart('monthlyExpensesNonRepeatingChart',
        filterData(processDataset(data.datasets.monthly_expenses_non_repeating)),
        filterData(data.labels),
        'Monthly Non-Repeating Expenses'
    );
};
