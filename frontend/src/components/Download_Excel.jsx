import React from 'react';
import { Link } from 'react-router-dom';
import './static/styles/styles.css';

const DownloadExcel = () => {
    const handleDownload = async (type) => {
        try {
            const token = localStorage.getItem('token');
            let endpoint = '';

            switch (type) {
                case 'earnings':
                    endpoint = `${process.env.REACT_APP_API_URL}/download-excel`;
                    break;
                case 'inventory':
                    endpoint = `${process.env.REACT_APP_API_URL}/download-inventory-excel`;
                    break;
                case 'expenses':
                    endpoint = `${process.env.REACT_APP_API_URL}/download-expenses-excel`;
                    break;
                default:
                    throw new Error('Invalid download type');
            }

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_report.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error(`Error downloading ${type} excel:`, error);
        }
    };

    return (
        <div className="container">
            <header>
                <h1>Download Excel Reports</h1>
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
                <p>Click the buttons below to download your reports as Excel files.</p>
                <button onClick={() => handleDownload('earnings')} className="btn btn-primary">
                    Download Earnings Report
                </button>
                <button onClick={() => handleDownload('inventory')} className="btn btn-primary mt-4">
                    Download Inventory Report
                </button>
                <button onClick={() => handleDownload('expenses')} className="btn btn-primary mt-4">
                    Download Expenses Report
                </button>
            </div>
        </div>
    );
};

export default DownloadExcel;