"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Inventory from '@/components/dashboard/Add_Inventory';
import ViewInventory from '@/components/dashboard/View_Inventory';

export default function InventoryPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-8">Inventory Management</h1>
      
      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="view">View Inventory</TabsTrigger>
          <TabsTrigger value="add">Add Item</TabsTrigger>
        </TabsList>
        <TabsContent value="view" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Inventory</CardTitle>
              <CardDescription>View and manage your inventory items</CardDescription>
            </CardHeader>
            <CardContent>
              <ViewInventory />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="add" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Item</CardTitle>
              <CardDescription>Add a new inventory item</CardDescription>
            </CardHeader>
            <CardContent>
              <Inventory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
