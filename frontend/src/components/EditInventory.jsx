import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import './static/styles/styles.css';

const EditInventory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const initialItem = location.state?.item;
    
    const [formData, setFormData] = useState({
        name: initialItem?.name || '',
        quantity: initialItem?.quantity.toString() || '',
        price: initialItem?.price.toString() || ''
    });
    const [loading, setLoading] = useState(!initialItem);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchItem = async () => {
            if (initialItem) return; // Skip fetching if we already have the data
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/inventory/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setFormData({
                        name: data.name,
                        quantity: data.quantity.toString(),
                        price: data.price.toString()
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                setError('Failed to fetch item details');
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [id, initialItem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/inventory/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    quantity: parseFloat(formData.quantity),
                    price: parseFloat(formData.price)
                })
            });

            if (response.ok) {
                navigate('/view-inventory');
            } else {
                const data = await response.json();
                setError(data.detail || 'Failed to update item');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('An error occurred while updating the item');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
        <div className="container mx-auto p-4">
            <header className="bg-white shadow p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Edit Inventory Item</h1>
                    <nav>
                        <ul className="flex space-x-4">
                            <li><Link to="/dashboard" className="text-gray-600 hover:text-gray-800">Dashboard</Link></li>
                            <li><Link to="/view-inventory" className="text-gray-600 hover:text-gray-800">Back to Inventory</Link></li>
                        </ul>
                    </nav>
                </div>
            </header>

            {error && <div className="mb-4 p-4 bg-red-100 border border-red-200 text-red-700 rounded-md">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-group">
                    <label htmlFor="name" className="block text-gray-700">Item Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder={`Current: ${formData.name}`}
                        className="form-input mt-1 block w-full"
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
                        placeholder={`Current: ${formData.quantity}`}
                        className="form-input mt-1 block w-full"
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
                        placeholder={`Current: $${parseFloat(formData.price).toFixed(2)}`}
                        className="form-input mt-1 block w-full"
                    />
                </div>

                <div className="button-group flex space-x-4">
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => navigate('/view-inventory')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditInventory;