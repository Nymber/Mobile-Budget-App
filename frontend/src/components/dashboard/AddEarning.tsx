import React, { useState } from 'react';
import { createEarning } from '@/services/api';
import { useAuth } from '@/components/auth/AuthProvider';

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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add New Earning</h1>
      <div className="bg-white shadow rounded-lg p-6">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">Earning added successfully!</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              id="date"
              value={earning.date}
              onChange={(e) => setEarning({...earning, date: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">Hourly Rate</label>
            <input
              type="number"
              id="hourlyRate"
              value={earning.hourlyRate}
              onChange={(e) => setEarning({...earning, hourlyRate: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="hours" className="block text-sm font-medium text-gray-700">Hours Worked</label>
            <input
              type="number"
              id="hours"
              value={earning.hours}
              onChange={(e) => setEarning({...earning, hours: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="cashTips" className="block text-sm font-medium text-gray-700">Cash Tips</label>
            <input
              type="number"
              id="cashTips"
              value={earning.cashTips}
              onChange={(e) => setEarning({...earning, cashTips: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-gray-700">Salary</label>
            <input
              type="number"
              id="salary"
              value={earning.salary}
              onChange={(e) => setEarning({...earning, salary: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              step="0.01"
            />
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
