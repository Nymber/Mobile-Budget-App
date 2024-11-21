import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from './Layout';

const AddEarnings = () => {
    const [earningsType, setEarningsType] = useState('hourly');
    const [formData, setFormData] = useState({
        hourly_rate: 0,
        hours: 0,
        cash_tips: 0,
        salary: 0
    });
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/earnings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                navigate('/view-earnings');
            } else {
                console.error('Failed to add earnings');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <Layout 
            title="Add Earnings"
            actions={
                <li><Link to="/view-earnings" className="nav-link">View Earnings</Link></li>
            }
        >
            <div className="max-w-3xl mx-auto">
                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex gap-4 mb-6">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio"
                                    name="earnings_type"
                                    value="hourly"
                                    checked={earningsType === 'hourly'}
                                    onChange={(e) => setEarningsType(e.target.value)}
                                />
                                <span className="ml-2">Hourly</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio"
                                    name="earnings_type"
                                    value="salary"
                                    checked={earningsType === 'salary'}
                                    onChange={(e) => setEarningsType(e.target.value)}
                                />
                                <span className="ml-2">Salary</span>
                            </label>
                        </div>

                        {earningsType === 'hourly' ? (
                            <div id="hourly_fields" className="section">
                                <label htmlFor="hourly_rate">Hourly Rate:</label>
                                <input
                                    type="number"
                                    id="hourly_rate"
                                    name="hourly_rate"
                                    step="0.01"
                                    min="0"
                                    value={formData.hourly_rate}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                                <label htmlFor="hours">Hours Worked:</label>
                                <input
                                    type="number"
                                    id="hours"
                                    name="hours"
                                    step="0.01"
                                    min="0"
                                    value={formData.hours}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                                <label htmlFor="cash_tips">Cash Tips:</label>
                                <input
                                    type="number"
                                    id="cash_tips"
                                    name="cash_tips"
                                    step="0.01"
                                    min="0"
                                    value={formData.cash_tips}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            </div>
                        ) : (
                            <div id="salary_fields" className="section">
                                <label htmlFor="salary">Salary:</label>
                                <input
                                    type="number"
                                    id="salary"
                                    name="salary"
                                    step="0.01"
                                    min="0"
                                    value={formData.salary}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-full">
                            Add Earnings
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default AddEarnings;