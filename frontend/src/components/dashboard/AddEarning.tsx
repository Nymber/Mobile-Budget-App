import React, { useState } from 'react';
import { createEarning } from '@/services/api';
import { useAuth } from '@/components/auth/AuthProvider';
import styles from './styles/AddEarning.module.css';

const AddEarning: React.FC = () => {
  const auth = useAuth();
  const [earning, setEarning] = useState({
    hourlyRate: '',
    hours: '',
    cashTips: '',
    salary: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Check if user is authenticated
      const isAuthenticated = await auth.checkAuth();
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }

      const response = await createEarning({
        hourly_rate: parseFloat(earning.hourlyRate) || 0,
        hours: parseFloat(earning.hours) || 0,
        cash_tips: parseFloat(earning.cashTips) || 0,
        salary: parseFloat(earning.salary) || 0,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setEarning({
        hourlyRate: '',
        hours: '',
        cashTips: '',
        salary: '',
        date: new Date().toISOString().split('T')[0],
      });
      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error adding earning:', err);
      setError(err instanceof Error ? err.message : 'Failed to add earning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Add New Earning</h1>
      <div className={styles.formContainer}>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>Earning added successfully!</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="date" className={styles.label}>Date</label>
            <input
              type="date"
              id="date"
              value={earning.date}
              onChange={(e) => setEarning({...earning, date: e.target.value})}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="hourlyRate" className={styles.label}>Hourly Rate</label>
            <input
              type="number"
              id="hourlyRate"
              value={earning.hourlyRate}
              onChange={(e) => setEarning({...earning, hourlyRate: e.target.value})}
              className={styles.input}
              step="0.01"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="hours" className={styles.label}>Hours Worked</label>
            <input
              type="number"
              id="hours"
              value={earning.hours}
              onChange={(e) => setEarning({...earning, hours: e.target.value})}
              className={styles.input}
              step="0.01"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="cashTips" className={styles.label}>Cash Tips</label>
            <input
              type="number"
              id="cashTips"
              value={earning.cashTips}
              onChange={(e) => setEarning({...earning, cashTips: e.target.value})}
              className={styles.input}
              step="0.01"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="salary" className={styles.label}>Salary</label>
            <input
              type="number"
              id="salary"
              value={earning.salary}
              onChange={(e) => setEarning({...earning, salary: e.target.value})}
              className={styles.input}
              step="0.01"
            />
          </div>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Earning'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddEarning;
