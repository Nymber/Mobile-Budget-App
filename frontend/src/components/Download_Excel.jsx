import React from 'react';
import { Link } from 'react-router-dom';
import './static/styles/styles.css';

const DownloadExcel = () => {
    const handleDownload = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/download-excel`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'earnings_report.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error downloading excel:', error);
        }
    };

    return (
        <div className="container">
            <header>
                <h1>Download Excel Report</h1>
                <nav>
                    <ul>
                        <li><Link to="/dashboard">Dashboard</Link></li>
                        <li className="dropdown">
                            <button className="dropdown-btn">Menu</button>
                            <ul className="dropdown-content">
                                <li><Link to="/view-inventory">Inventory</Link></li>
                                <li><Link to="/tasks">Tasks</Link></li>
                                <li><Link to="/view-earnings">View Earnings</Link></li>
                            </ul>
                        </li>
                        <li><Link to="/logout">Logout</Link></li>
                    </ul>
                </nav>
            </header>

            <div className="download-section">
                <p>Click the button below to download your earnings report as an Excel file.</p>
                <button onClick={handleDownload} className="btn btn-primary">
                    Download Excel Report
                </button>
            </div>
        </div>
    );
};

export default DownloadExcel; 