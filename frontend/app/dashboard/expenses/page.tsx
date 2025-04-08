"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddExpense from '@/components/dashboard/AddExpense';
import ViewExpenses from '@/components/dashboard/View_Expenses';

export default function ExpensesPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-8">Expenses</h1>
      
      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="view">View Expenses</TabsTrigger>
          <TabsTrigger value="add">Add New</TabsTrigger>
        </TabsList>
        <TabsContent value="view" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Expenses</CardTitle>
              <CardDescription>View and manage your expense history</CardDescription>
            </CardHeader>
            <CardContent>
              <ViewExpenses />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="add" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
              <CardDescription>Create a new expense record</CardDescription>
            </CardHeader>
            <CardContent>
              <AddExpense />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
