import React, { useState } from 'react';
import { createInventoryItem } from '@/services/api';
import { AlertCircle, CheckCircle } from 'lucide-react';

const Inventory: React.FC = () => {
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 0,
    minQuantity: 0,
    price: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: null, message: '' });
    
    try {
      // The backend doesn't store minQuantity, so we need to exclude it
      const response = await createInventoryItem({
        name: newItem.name,
        quantity: newItem.quantity,
        price: newItem.price
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Success
      setStatus({
        type: 'success',
        message: `Successfully added ${newItem.name} to inventory.`
      });
      
      // Reset form
      setNewItem({ name: '', quantity: 0, minQuantity: 0, price: 0 });
    } catch (err) {
      console.error('Error adding inventory item:', err);
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to add inventory item'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Inventory</h1>
      <div className="bg-white shadow rounded-lg p-6">
        {status.type && (
          <div className={`mb-4 p-4 rounded-md ${status.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {status.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {status.message}
                </p>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Item Name</label>
            <input
              type="text"
              id="name"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              disabled={submitting}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                id="quantity"
                value={newItem.quantity}
                onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="minQuantity" className="block text-sm font-medium text-gray-700">Min Quantity</label>
              <input
                type="number"
                id="minQuantity"
                value={newItem.minQuantity}
                onChange={(e) => setNewItem({...newItem, minQuantity: parseInt(e.target.value) || 0})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                required
                disabled={submitting}
              />
              <p className="mt-1 text-xs text-gray-500">Note: Min quantity is used for low stock alerts only</p>
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
              <input
                type="number"
                id="price"
                value={newItem.price}
                onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
                disabled={submitting}
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add Item'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Inventory;
