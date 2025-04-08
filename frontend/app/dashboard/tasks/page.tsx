"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddTasks from '@/components/dashboard/AddTasks';
import ViewTasks from '@/components/dashboard/View_Tasks';

export default function TasksPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-8">Tasks</h1>
      
      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="view">View Tasks</TabsTrigger>
          <TabsTrigger value="add">Add New</TabsTrigger>
        </TabsList>
        <TabsContent value="view" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Tasks</CardTitle>
              <CardDescription>View and manage your task list</CardDescription>
            </CardHeader>
            <CardContent>
              <ViewTasks />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="add" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Task</CardTitle>
              <CardDescription>Create a new task</CardDescription>
            </CardHeader>
            <CardContent>
              <AddTasks />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
