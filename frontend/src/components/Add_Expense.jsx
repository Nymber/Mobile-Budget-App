import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from './Layout';

function AddExpense({ username }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        repeating: false
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/add-expense`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ ...formData, username })
            });
            if (response.ok) {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <Layout 
            title="Add Expense"
            actions={
                <li><Link to="/view-expenses" className="nav-link">View Expenses</Link></li>
            }
        >
            <div className="max-w-3xl mx-auto">
                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="form-group">
                            <label className="form-label" htmlFor="name">Expense Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="price">Price</label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group flex items-center">
                            <label className="form-label inline-flex items-center">
                                <input
                                    type="checkbox"
                                    name="repeating"
                                    checked={formData.repeating}
                                    onChange={handleChange}
                                    className="form-checkbox h-5 w-5 text-primary"
                                />
                                <span className="ml-2">Repeating Monthly?</span>
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary w-full">
                            Add Expense
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

export default AddExpense;
