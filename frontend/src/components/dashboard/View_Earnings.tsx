// filepath: c:\Users\badaw\OneDrive\Documents\GitHub\Mobile-Budget-App\frontend\src\components\dashboard\View_Earnings.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Edit } from "lucide-react";
import { format } from 'date-fns';
import { updateEarning, deleteEarning, getEarnings, Earning } from '@/services/api';
import styles from './View_Earnings.module.css';

const ViewEarnings: React.FC = () => {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  
  // Add states for editing functionality
  const [selectedEarning, setSelectedEarning] = useState<Earning | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    cash_tips: 0,
    salary: 0,
    hours: 0,
    hourly_rate: 0,
  });
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getEarnings();
      setEarnings(response.data ?? []);
    } catch (err) {
      setError('Failed to fetch earnings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const handleDelete = async (id: number) => {
    try {
      setDeleting(id);
      await deleteEarning(id);
      setEarnings(prev => prev.filter(earning => earning.id !== id));
      
      // If the deleted earning was selected, clear selection
      if (selectedEarning && selectedEarning.id === id) {
        setSelectedEarning(null);
        setIsEditing(false);
      }
      
      setActionMessage({ type: 'success', text: 'Earning deleted successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete earning:', err);
      setActionMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to delete earning' 
      });
    } finally {
      setDeleting(null);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Edit functionality
  const handleEdit = (id: number) => {
    const earning = earnings.find(earn => earn.id === id);
    if (!earning) return;
    
    setSelectedEarning(earning);
    setEditForm({
      cash_tips: earning.cash_tips,
      salary: earning.salary,
      hours: earning.hours,
      hourly_rate: earning.hourly_rate,
    });
    setIsEditing(true);
    setEditing(id); // Set the editing state to show the spinner
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditing(null);
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setEditForm({
      ...editForm,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    });
  };
  
  const handleSaveEdit = async () => {
    if (!selectedEarning) return;
    
    try {
      // Update the earning
      const response = await updateEarning(selectedEarning.id, editForm);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Update the earning in the local state
      setEarnings(earnings.map(earning => 
        earning.id === selectedEarning.id ? { ...earning, ...editForm } : earning
      ));
      
      setActionMessage({ type: 'success', text: 'Earning updated successfully!' });
      setIsEditing(false);
      setEditing(null);
      
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Error updating earning:', err);
      setActionMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to update earning' 
      });
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Show action messages */}
      {actionMessage && (
        <div
          className={`${styles.actionMessage} ${
            actionMessage.type === 'success'
              ? styles.actionMessageSuccess
              : styles.actionMessageError
          }`}
        >
          {actionMessage.text}
        </div>
      )}
      
      {/* Edit form */}
      {isEditing && selectedEarning && (
        <div className={styles.editFormContainer}>
          <h2 className={styles.editFormTitle}>Edit Earning</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="cash_tips" className="block text-sm font-medium text-gray-700">Cash Tips</label>
              <input
                type="number"
                id="cash_tips"
                name="cash_tips"
                value={editForm.cash_tips}
                onChange={handleEditFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700">Salary</label>
              <input
                type="number"
                id="salary"
                name="salary"
                value={editForm.salary}
                onChange={handleEditFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div>
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700">Hours</label>
              <input
                type="number"
                id="hours"
                name="hours"
                value={editForm.hours}
                onChange={handleEditFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div>
              <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700">Hourly Rate</label>
              <input
                type="number"
                id="hourly_rate"
                name="hourly_rate"
                value={editForm.hourly_rate}
                onChange={handleEditFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleSaveEdit}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {earnings.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No earnings found. Add your first earning to get started!
        </div>
      ) : (
        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHead className={styles.tableHeader}>Date</TableHead>
              <TableHead className={styles.tableHeader}>Source</TableHead>
              <TableHead className={`${styles.tableHeader} text-right`}>Salary</TableHead>
              <TableHead className={`${styles.tableHeader} text-right`}>Cash Tips</TableHead>
              <TableHead className={`${styles.tableHeader} text-right`}>Hours</TableHead>
              <TableHead className={`${styles.tableHeader} text-right`}>Hourly Rate</TableHead>
              <TableHead className={styles.tableHeader}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(earnings) ? earnings.map((earning) => (
              <TableRow key={earning.id} className={styles.tableRow}>
                <TableCell className={styles.tableCell}>{formatDate(earning.timestamp)}</TableCell>
                <TableCell className={styles.tableCell}>
                  <span className={`${styles.statusBadge} ${
                    earning.hourly_rate > 0 
                      ? styles.statusBadgeHourly 
                      : styles.statusBadgeOther
                  }`}>
                    {earning.hourly_rate > 0 ? 'Hourly Work' : 'Other'}
                  </span>
                </TableCell>
                <TableCell className={`${styles.tableCell} text-right`}>${earning.salary.toFixed(2)}</TableCell>
                <TableCell className={`${styles.tableCell} text-right`}>${earning.cash_tips.toFixed(2)}</TableCell>
                <TableCell className={`${styles.tableCell} text-right`}>{earning.hours}</TableCell>
                <TableCell className={`${styles.tableCell} text-right`}>${earning.hourly_rate.toFixed(2)}</TableCell>
                <TableCell className={styles.tableCell}>
                  <div className={styles.buttonGroup}>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(earning.id)}
                      disabled={editing === earning.id}
                    >
                      {editing === earning.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Edit className="h-4 w-4 text-blue-500" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(earning.id)}
                      disabled={deleting === earning.id}
                    >
                      {deleting === earning.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Error loading earnings. Please refresh the page.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ViewEarnings;
