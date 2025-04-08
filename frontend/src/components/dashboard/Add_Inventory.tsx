import React, { useState } from 'react';
import { createInventoryItem } from '@/services/api';
import { AlertCircle, CheckCircle } from 'lucide-react';
import styles from './styles/AddInventory.module.css';

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
    <div className={styles.container}>
      <h1 className={styles.title}>Manage Inventory</h1>
      <div className={styles.formContainer}>
        {status.type && (
          <div className={`${styles.status} ${status.type === 'success' ? styles.success : styles.error}`}>
            <div className={styles.statusIcon}>
              {status.type === 'success' ? (
                <CheckCircle className={styles.successIcon} />
              ) : (
                <AlertCircle className={styles.errorIcon} />
              )}
            </div>
            <div className={styles.statusMessage}>{status.message}</div>
          </div>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>Item Name</label>
            <input
              type="text"
              id="name"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              className={styles.input}
              required
              disabled={submitting}
            />
          </div>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label htmlFor="quantity" className={styles.label}>Quantity</label>
              <input
                type="number"
                id="quantity"
                value={newItem.quantity}
                onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                className={styles.input}
                min="0"
                required
                disabled={submitting}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="minQuantity" className={styles.label}>Min Quantity</label>
              <input
                type="number"
                id="minQuantity"
                value={newItem.minQuantity}
                onChange={(e) => setNewItem({...newItem, minQuantity: parseInt(e.target.value) || 0})}
                className={styles.input}
                min="0"
                required
                disabled={submitting}
              />
              <p className={styles.helperText}>Note: Min quantity is used for low stock alerts only</p>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="price" className={styles.label}>Price</label>
              <input
                type="number"
                id="price"
                value={newItem.price}
                onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                className={styles.input}
                min="0"
                step="0.01"
                required
                disabled={submitting}
              />
            </div>
          </div>
          <button
            type="submit"
            className={styles.submitButton}
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
