import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from '@/components/auth/AuthProvider';
import { apiPost, apiPut, apiDelete } from '@/services/apiUtils';
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface Task {
  id: number;
  title: string;
  is_complete: boolean;
  repeat_daily: boolean;
  timestamp: string;
}

const ViewTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    title: '',
    repeat_daily: false
  });
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${NEXT_PUBLIC_API_URL}/tasks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const tasksData = await response.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setEditForm({
      title: task.title,
      repeat_daily: task.repeat_daily
    });
    setIsEditing(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditForm({
      ...editForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedTask) return;

    try {
      const taskToUpdate = {
        title: editForm.title,
        repeat_daily: editForm.repeat_daily,
        is_complete: selectedTask.is_complete
      };

      const response = await apiPut(`/tasks/${selectedTask.id}`, taskToUpdate);

      if ((response as { error?: string }).error) {
        if (typeof response === 'object' && response !== null && 'error' in response) {
          throw new Error((response as { error: string }).error);
        }
      }

      setTasks(tasks.map(task =>
        task.id === selectedTask.id ? { ...task, ...taskToUpdate } : task
      ));

      setActionMessage({ type: 'success', text: 'Task updated successfully!' });
      setIsEditing(false);

      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Error updating task:', err);
      setActionMessage({ type: 'error', text: 'Failed to update task' });
    }
  };

  const handleToggleComplete = async (taskId: number) => {
    try {
      const response = await apiPost(`/complete_task/${taskId}`, {});

      if ((response as { error?: string }).error) {
        if (typeof response === 'object' && response !== null && 'error' in response) {
          throw new Error((response as { error: string }).error);
        }
      }

      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, is_complete: !task.is_complete } : task
      ));

      setActionMessage({ type: 'success', text: 'Task status updated!' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Error toggling task completion:', err);
      setActionMessage({ type: 'error', text: 'Failed to update task status' });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await apiDelete(`/tasks/${taskId}`);

      if (typeof response === 'object' && response !== null && 'error' in response && typeof response.error === 'string') {
        throw new Error(response.error);
      }

      setTasks(tasks.filter(task => task.id !== taskId));
      setSelectedTask(null);
      setIsEditing(false);

      setActionMessage({ type: 'success', text: 'Task deleted successfully!' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting task:', err);
      setActionMessage({ type: 'error', text: 'Failed to delete task' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div>
      {actionMessage && (
        <div className={`p-4 mb-4 rounded ${
          actionMessage.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {isEditing && selectedTask && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Edit Task</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={editForm.title}
                onChange={handleEditFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="repeat_daily"
                name="repeat_daily"
                checked={editForm.repeat_daily}
                onChange={handleEditFormChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="repeat_daily" className="ml-2 block text-sm text-gray-900">
                Repeat daily
              </label>
            </div>
            <div className="flex space-x-2 pt-2">
              <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No tasks found. Add your first task to get started!
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Repeat Daily</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => (
              <TableRow key={task.id}>
                <TableCell>{task.title}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.is_complete
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {task.is_complete ? 'Completed' : 'Pending'}
                  </span>
                </TableCell>
                <TableCell>{task.repeat_daily ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSelectTask(task)}
                    >
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleComplete(task.id)}
                    >
                      {task.is_complete ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ViewTasks;
