import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface RechartsComponentsProps {
  items: {
    id: string;
    name: string;
    quantity: number;
    minQuantity: number;
    value: number;
  }[];
}

const RechartsComponents: React.FC<RechartsComponentsProps> = ({ items }) => {
  return (
    <LineChart
      width={500}
      height={300}
      data={items}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="quantity" stroke="#8884d8" />
      <Line type="monotone" dataKey="value" stroke="#82ca9d" />
    </LineChart>
  );
};

export default RechartsComponents;
