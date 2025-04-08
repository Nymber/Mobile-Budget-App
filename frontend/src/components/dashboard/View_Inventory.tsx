import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Edit} from "lucide-react";
import { updateInventoryItem, deleteInventoryItem, InventoryItem as InventoryItemType } from '@/services/api';
import { fetchWithAuth } from '@/services/apiUtils';

interface InventoryItemWithMin extends InventoryItemType {
  minQuantity?: number;
  value?: number;
}

const ViewInventory: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItemWithMin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  
  // Add states for editing functionality
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithMin | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    name: '',
    quantity: 0,
    price: 0,
    minQuantity: 0
  });
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Default min quantities for different item types
  const defaultMinQuantities: Record<string, number> = {
    'Office Supplies': 20,
    'Electronics': 5,
    'Furniture': 2,
    'default': 10
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Direct API response from fetchWithAuth (no data/error wrapper)
      const inventoryData = await fetchWithAuth<InventoryItemWithMin[]>('inventory');
      
      // Set inventory items directly from the response
      setInventoryItems(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (err) {
      setError('Failed to fetch inventory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      setDeleting(id);
      await deleteInventoryItem(id);
      setInventoryItems(prev => prev.filter(item => item.id !== id));
      
      // If the deleted item was selected, clear selection
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(null);
        setIsEditing(false);
      }
      
      setActionMessage({ type: 'success', text: 'Item deleted successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete item:', err);
      setActionMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to delete item' 
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (id: number) => {
    const item = inventoryItems.find(item => item.id === id);
    if (!item) return;
    
    setSelectedItem(item);
    setEditForm({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      minQuantity: item.minQuantity || defaultMinQuantities.default
    });
    setIsEditing(true);
    setEditing(id);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditing(null);
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setEditForm({
      ...editForm,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };
  
  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    
    try {
      setEditing(selectedItem.id);
      
      // Backend only accepts name, quantity, and price
      const itemToUpdate = {
        name: editForm.name,
        quantity: editForm.quantity,
        price: editForm.price
      };
      
      const response = await updateInventoryItem(selectedItem.id, itemToUpdate);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Update the item in the local state
      setInventoryItems(items => items.map(item => 
        item.id === selectedItem.id ? { 
          ...item, 
          ...itemToUpdate, 
          minQuantity: editForm.minQuantity,
          value: editForm.price * editForm.quantity 
        } : item
      ));
      
      setActionMessage({ type: 'success', text: 'Item updated successfully!' });
      setIsEditing(false);
      
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Error updating item:', err);
      setActionMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to update item' 
      });
    } finally {
      setEditing(null);
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
      {isEditing && selectedItem && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Edit Item</h2>
          
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
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={editForm.quantity}
                onChange={handleEditFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                step="1"
                required
              />
            </div>
            
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
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
            
            <div>
              <label htmlFor="minQuantity" className="block text-sm font-medium text-gray-700">Min Quantity</label>
              <input
                type="number"
                id="minQuantity"
                name="minQuantity"
                value={editForm.minQuantity}
                onChange={handleEditFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                step="1"
              />
              <p className="mt-1 text-xs text-gray-500">For low stock alerts</p>
            </div>
            
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={handleSaveEdit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {inventoryItems.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No inventory items found. Add your first item to get started!
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(inventoryItems) ? inventoryItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.quantity < (item.minQuantity || 0) 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.quantity < (item.minQuantity || 0) ? 'Low Stock' : 'In Stock'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(item.id)}
                      disabled={editing === item.id}
                    >
                      {editing === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Edit className="h-4 w-4 text-blue-500" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                    >
                      {deleting === item.id ? (
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
                <TableCell colSpan={5} className="text-center py-4">
                  Error loading inventory. Please refresh the page.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ViewInventory;
