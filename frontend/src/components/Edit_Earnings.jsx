import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import './static/styles/styles.css';

const EditEarnings = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const initialEarning = location.state?.earning;

    const [formData, setFormData] = useState({
        hourly_rate: initialEarning?.hourly_rate || 0,
        hours: initialEarning?.hours || 0,
        cash_tips: initialEarning?.cash_tips || 0,
        salary: initialEarning?.salary || 0
    });
    const [loading, setLoading] = useState(!initialEarning);
    const [currentData, setCurrentData] = useState(initialEarning || null);

    useEffect(() => {
        const fetchEarning = async () => {
            if (initialEarning) return; // Skip if we already have the data
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/earnings/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setFormData({
                        hourly_rate: data.hourly_rate || 0,
                        hours: data.hours || 0,
                        cash_tips: data.cash_tips || 0,
                        salary: data.salary || 0
                    });
                    setCurrentData(data);
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEarning();
    }, [id, initialEarning]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/earnings/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    hourly_rate: parseFloat(formData.hourly_rate),
                    hours: parseFloat(formData.hours),
                    cash_tips: parseFloat(formData.cash_tips),
                    salary: parseFloat(formData.salary)
                })
            });
            if (response.ok) {
                navigate('/view-earnings');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="container">
            <header>
                <h1>Edit Earning</h1>
                <nav>
                    <ul>
                        <li><Link to="/dashboard">Dashboard</Link></li>
                        <li><Link to="/view-earnings">Back to Earnings</Link></li>
                    </ul>
                </nav>
            </header>

            {currentData && (
                <div className="current-values">
                    <h3>Current Values:</h3>
                    <p>Hourly Rate: ${currentData.hourly_rate.toFixed(2)}</p>
                    <p>Hours Worked: {currentData.hours.toFixed(1)}</p>
                    <p>Cash Tips: ${currentData.cash_tips.toFixed(2)}</p>
                    <p>Salary: ${currentData.salary.toFixed(2)}</p>
                    <p>Date: {new Date(currentData.timestamp).toLocaleDateString()}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="form-container">
                <div className="form-group">
                    <label>Hourly Rate:</label>
                    <input
                        type="number"
                        name="hourly_rate"
                        value={formData.hourly_rate}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder={`Current: $${currentData?.hourly_rate.toFixed(2) || '0.00'}`}
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label>Hours Worked:</label>
                    <input
                        type="number"
                        name="hours"
                        value={formData.hours}
                        onChange={handleInputChange}
                        step="0.5"
                        min="0"
                        placeholder={`Current: ${currentData?.hours.toFixed(1) || '0.0'}`}
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label>Cash Tips:</label>
                    <input
                        type="number"
                        name="cash_tips"
                        value={formData.cash_tips}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder={`Current: $${currentData?.cash_tips.toFixed(2) || '0.00'}`}
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label>Salary:</label>
                    <input
                        type="number"
                        name="salary"
                        value={formData.salary}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder={`Current: $${currentData?.salary.toFixed(2) || '0.00'}`}
                        className="form-input"
                    />
                </div>
                <div className="button-group">
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => navigate('/view-earnings')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditEarnings;