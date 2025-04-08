import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Edit, CheckSquare, Square } from "lucide-react";
import { format } from 'date-fns';
import { deleteExpense, getExpenses, updateExpense, Expense } from '@/services/api';

const ViewExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  
  // Add states for editing functionality
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    name: '',
    price: 0,
    repeating: false
  });
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getExpenses();
      setExpenses(response.data ?? []);
    } catch (err) {
      setError('Failed to fetch expenses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      setDeleting(id);
      await deleteExpense(id);
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      
      // If the deleted expense was selected, clear selection
      if (selectedExpense && selectedExpense.id === id) {
        setSelectedExpense(null);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
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
    const expense = expenses.find(exp => exp.id === id);
    if (!expense) return;
    
    setSelectedExpense(expense);
    setEditForm({
      name: expense.name,
      price: expense.price,
      repeating: expense.repeating
    });
    setIsEditing(true);
    setEditing(id); // Set the editing state to show the spinner
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditing(null);
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditForm({
      ...editForm,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    });
  };
  
  const handleSaveEdit = async () => {
    if (!selectedExpense) return;
    
    try {
      // Update the expense
      const response = await updateExpense(selectedExpense.id, editForm);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Update the expense in the local state
      setExpenses(expenses.map(expense => 
        expense.id === selectedExpense.id ? { ...expense, ...editForm } : expense
      ));
      
      setActionMessage({ type: 'success', text: 'Expense updated successfully!' });
      setIsEditing(false);
      setEditing(null);
      
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Error updating expense:', err);
      setActionMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to update expense' 
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
  
  const toggleSelect = (id: number) => {
    setSelectedExpenses(prev => 
      prev.includes(id) 
        ? prev.filter(expenseId => expenseId !== id)
        : [...prev, id]
    );
  };

  return (
    <div>
      {/* Show action messages */}
      {actionMessage && (
        <div className={`p-4 mb-4 rounded ${
          actionMessage.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {actionMessage.text}
        </div>
      )}
      
      {/* Edit form */}
      {isEditing && selectedExpense && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Edit Expense</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={editForm.name}
                onChange={handleEditFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                id="price"
                name="price"
                value={editForm.price}
                onChange={handleEditFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="repeating"
                name="repeating"
                checked={editForm.repeating}
                onChange={handleEditFormChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="repeating" className="ml-2 block text-sm text-gray-900">
                This is a recurring expense
              </label>
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
      
      {expenses.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No expenses found. Add your first expense to get started!
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Select</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(expenses) ? expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => toggleSelect(expense.id)}
                  >
                    {selectedExpenses.includes(expense.id) 
                      ? <CheckSquare className="h-4 w-4" /> 
                      : <Square className="h-4 w-4" />}
                  </Button>
                </TableCell>
                <TableCell>{formatDate(expense.timestamp)}</TableCell>
                <TableCell>{expense.name}</TableCell>
                <TableCell className="text-right">${expense.price.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    expense.repeating 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {expense.repeating ? 'Recurring' : 'One-time'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(expense.id)}
                      disabled={editing === expense.id}
                    >
                      {editing === expense.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Edit className="h-4 w-4 text-blue-500" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(expense.id)}
                      disabled={deleting === expense.id}
                    >
                      {deleting === expense.id ? (
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
                <TableCell colSpan={6} className="text-center py-4">
                  Error loading expenses. Please refresh the page.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ViewExpenses;
