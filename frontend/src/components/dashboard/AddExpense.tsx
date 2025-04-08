import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/services/use-toast';
import styles from './styles/AddExpense.module.css';

// Debug function to show token information
const debugToken = () => {
  console.log("Auth debugging:");
  try {
    // Check all possible token locations
    const authData = localStorage.getItem('authData');
    const authToken = localStorage.getItem('auth_token');
    const token = localStorage.getItem('token');
    
    console.log("authData:", authData ? "exists" : "not found");
    console.log("auth_token:", authToken ? "exists" : "not found");
    console.log("token:", token ? "exists" : "not found");
    
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        console.log("authData parsed token:", parsed.token ? "exists" : "not found");
      } catch (e) {
        console.log("Error parsing authData:", e);
      }
    }
  } catch (e) {
    console.log("Error in debug function:", e);
  }
};

const AddExpense = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [repeating, setRepeating] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // Debug tokens when component mounts
  useEffect(() => {
    debugToken();
  }, []);

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    if (!name || !price) {
      toast({
        variant: "destructive",
        description: 'Please fill all required fields'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Debug token again before making request
      debugToken();
      
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice)) {
        toast({
          variant: "destructive",
          description: 'Price must be a valid number'
        });
        setLoading(false);
        return;
      }
      
      const authData = localStorage.getItem('authData');
      if (!authData) {
        console.error("No auth data found in localStorage");
        toast({
          variant: "destructive",
          description: 'Authentication error. Please log in again.'
        });
        setLoading(false);
        return;
      }
      
      const { token } = JSON.parse(authData);
      
      const response = await fetch('http://localhost:8000/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          price: parsedPrice,
          repeating
        })
      });
      
      if (response.ok) {
        toast({
          description: 'Expense added successfully!'
        });
        setName('');
        setPrice('');
        setRepeating(false);
      } else {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          description: errorData.detail || 'Failed to add expense'
        });
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        variant: "destructive",
        description: 'An error occurred while adding the expense'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div>Please log in to add expenses</div>;
  }

  return (
    <Card className={styles.card}>
      <CardHeader className={styles.cardHeader}>
        <CardTitle className={styles.cardTitle}>Add New Expense</CardTitle>
        <CardDescription className={styles.cardDescription}>Record a new expense in your budget</CardDescription>
      </CardHeader>
      <CardContent className={styles.cardContent}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <Label htmlFor="name" className={styles.label}>Expense Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g., Groceries"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <Label htmlFor="price" className={styles.label}>Amount ($)</Label>
            <Input 
              id="price" 
              type="number" 
              step="0.01" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              placeholder="0.00"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="repeating"
              title="This is a recurring expense"
              checked={repeating}
              onChange={(e) => setRepeating(e.target.checked)}
              className={styles.checkbox}
            />
            <Label htmlFor="repeating" className={styles.checkboxLabel}>This is a recurring expense</Label>
          </div>
          <Button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Adding...' : 'Add Expense'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddExpense;
