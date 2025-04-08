import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  value: number;
}

const Dashboard = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  
  useEffect(() => {
    // Sample data to demonstrate the chart
    setItems([
      { id: '1', name: 'Item 1', quantity: 15, minQuantity: 10, value: 100 },
      { id: '2', name: 'Item 2', quantity: 8, minQuantity: 10, value: 200 },
      { id: '3', name: 'Item 3', quantity: 20, minQuantity: 15, value: 150 },
      { id: '4', name: 'Item 4', quantity: 5, minQuantity: 8, value: 120 },
    ]);
  }, []);
  
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Inventory Overview</h2>
          <div className="h-96">
            <LineChart width={500} height={300} data={items}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="quantity" stroke="#8884d8" />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" />
            </LineChart>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Low Stock Alerts</h2>
          <div className="space-y-4">
            {items.filter(item => item.quantity < item.minQuantity).map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-red-50 rounded">
                <span className="font-medium">{item.name}</span>
                <span className="text-red-600">Quantity: {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;