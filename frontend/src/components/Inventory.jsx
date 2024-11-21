import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import './static/styles/styles.css';

const InventoryForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        price: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    // Check authentication on component mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate input
        const quantity = parseFloat(formData.quantity);
        const price = parseFloat(formData.price);
        
        if (!formData.name.trim()) {
            setError('Item name is required');
            setLoading(false);
            return;
        }
        
        if (isNaN(quantity) || quantity < 0) {
            setError('Quantity must be a valid positive number');
            setLoading(false);
            return;
        }
        
        if (isNaN(price) || price < 0) {
            setError('Price must be a valid positive number');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL}/inventory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    quantity: quantity,
                    price: price
                })
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to add item');
            }

            setSuccess('Item added successfully!');
            setFormData({ name: '', quantity: '', price: '' });
            
            setTimeout(() => {
                setSuccess('');
                navigate('/view-inventory');
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            setError(error.message);
            if (error.message.includes('authentication')) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };
    const actions = (
        <>
          <li><Link to="/view-inventory" className="nav-link">Back to Inventory</Link></li>
        </>
      );

    return (
        <Layout title="Add Inventory Item" actions={actions}>

            <div className="max-w-3xl mx-auto">
                <div className="card">
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 border border-red-200 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-green-100 border border-green-200 text-green-700 rounded-md">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-6">
                            <div className="form-group">
                                <label htmlFor="name" className="block text-gray-700">Item Name:</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter item name"
                                    autoFocus
                                    className={`form-input mt-1 block w-full ${error && !formData.name.trim() ? 'border-red-500' : ''}`}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="quantity" className="block text-gray-700">Quantity:</label>
                                <input
                                    type="number"
                                    id="quantity"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="1"
                                    placeholder="Enter quantity"
                                    className={`form-input mt-1 block w-full ${error && !formData.quantity ? 'border-red-500' : ''}`}
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="price" className="block text-gray-700">Price:</label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter price"
                                    className={`form-input mt-1 block w-full ${error && !formData.price ? 'border-red-500' : ''}`}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full"
                            >
                                {loading ? 'Adding...' : 'Add Item'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default InventoryForm;