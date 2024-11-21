import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import './static/styles/styles.css';

const EditExpense = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const initialExpense = location.state?.expense;

    const [formData, setFormData] = useState({
        name: initialExpense?.name || '',
        price: initialExpense?.price || '',
        repeating: initialExpense?.repeating || false
    });
    const [loading, setLoading] = useState(!initialExpense);
    const [error, setError] = useState('');
    const [currentData, setCurrentData] = useState(initialExpense || null);

    useEffect(() => {
        const fetchExpense = async () => {
            if (initialExpense) {
                setCurrentData(initialExpense);
                return;
            }
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:8000/expenses/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setFormData({
                        name: data.name,
                        price: data.price.toString(),
                        repeating: data.repeating
                    });
                    setCurrentData(data);
                }
            } catch (error) {
                console.error('Error:', error);
                setError('Failed to fetch expense details');
            } finally {
                setLoading(false);
            }
        };

        fetchExpense();
    }, [id, initialExpense]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/expenses/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    price: parseFloat(formData.price),
                    repeating: formData.repeating
                })
            });

            if (response.ok) {
                navigate('/view-expenses');
            } else {
                const data = await response.json();
                setError(data.detail || 'Failed to update expense');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('An error occurred while updating the expense');
        }
    };

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container">
            <header>
                <h1>Edit Expense</h1>
                <nav>
                    <ul>
                        <li><Link to="/dashboard">Dashboard</Link></li>
                        <li><Link to="/view-expenses">Back to Expenses</Link></li>
                    </ul>
                </nav>
            </header>

            {error && <div className="error-message">{error}</div>}

            {currentData && (
                <div className="current-values">
                    <h3>Current Values:</h3>
                    <p>Name: {currentData.name}</p>
                    <p>Price: ${parseFloat(currentData.price).toFixed(2)}</p>
                    <p>Repeating: {currentData.repeating ? 'Yes' : 'No'}</p>
                    <p>Last Updated: {new Date(currentData.timestamp).toLocaleDateString()}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="form-container">
                <div className="form-group">
                    <label htmlFor="name">Expense Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder={`Current: ${currentData?.name || ''}`}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="price">Price:</label>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder={`Current: $${parseFloat(currentData?.price || 0).toFixed(2)}`}
                        className="form-input"
                    />
                </div>

                <div className="form-group checkbox-group">
                    <label htmlFor="repeating">
                        Repeating Monthly:
                        <span className="current-value">
                            (Current: {currentData?.repeating ? 'Yes' : 'No'})
                        </span>
                    </label>
                    <input
                        type="checkbox"
                        id="repeating"
                        name="repeating"
                        checked={formData.repeating}
                        onChange={handleChange}
                        className="form-checkbox"
                    />
                </div>

                <div className="button-group">
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => navigate('/view-expenses')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditExpense;