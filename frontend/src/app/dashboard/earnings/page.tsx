'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddEarning from '@/components/dashboard/AddEarning';
import ViewEarnings from '@/components/dashboard/View_Earnings';

export default function EarningsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-8">Earnings</h1>
      
      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="view">View Earnings</TabsTrigger>
          <TabsTrigger value="add">Add New</TabsTrigger>
        </TabsList>
        <TabsContent value="view" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Earnings</CardTitle>
              <CardDescription>View and manage your earnings history</CardDescription>
            </CardHeader>
            <CardContent>
              <ViewEarnings />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="add" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Earning</CardTitle>
              <CardDescription>Record a new earning</CardDescription>
            </CardHeader>
            <CardContent>
              <AddEarning />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
