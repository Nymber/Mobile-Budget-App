import { createBrowserRouter } from 'react-router-dom';
import HomePage from './components/index.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Dashboard from './components/Dashboard.jsx';
import Tasks from './components/Task.jsx';
import AddExpense from './components/Add_Expense.jsx';
import AddTask from './components/Add_Task.jsx';
import Inventory from './components/Inventory.jsx';
import AddEarnings from './components/AddEarnings.jsx';
import DeleteExpense from './components/Delete_Expense.jsx';
import ViewExpenses from './components/View_Expenses.jsx';
import ViewEarnings from './components/View_Earnings.jsx';
import ViewInventory from './components/View_Inventory.jsx';
import ErrorPage from './components/Error.jsx';
import { ProtectedRoute } from './components/auth/AuthProvider';
import EditEarnings from './components/Edit_Earnings';
import DownloadExcel from './components/Download_Excel';
import EditInventory from './components/EditInventory';
import EditExpense from './components/EditExpense';

const router = createBrowserRouter([
  {
    path: '/download-excel',
    element: <DownloadExcel />,
  },
  {
    path: '/add-inventory',
    element: <Inventory />,
  },
  {
    path: '/edit-earnings/:id',
    element: <EditEarnings />,
  },
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tasks',
    element: (
      <ProtectedRoute>
        <Tasks />
      </ProtectedRoute>
    ),
  },
  {
    path: '/add-expense',
    element: (
      <ProtectedRoute>
        <AddExpense />
      </ProtectedRoute>
    ),
  },
  {
    path: '/add-task',
    element: (
      <ProtectedRoute>
        <AddTask />
      </ProtectedRoute>
    ),
  },
  {
    path: '/add-earnings',
    element: (
      <ProtectedRoute>
        <AddEarnings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/delete-expense/:expenseId',
    element: (
      <ProtectedRoute>
        <DeleteExpense />
      </ProtectedRoute>
    ),
  },
  {
    path: '/view-expenses',
    element: (
      <ProtectedRoute>
        <ViewExpenses />
      </ProtectedRoute>
    ),
  },
  {
    path: '/view-earnings',
    element: (
      <ProtectedRoute>
        <ViewEarnings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/view-inventory',
    element: (
      <ProtectedRoute>
        <ViewInventory />
      </ProtectedRoute>
    ),
  },
  {
    path: '/edit-inventory/:id',
    element: (
      <ProtectedRoute>
        <EditInventory />
      </ProtectedRoute>
    ),
  },
  {
    path: '/edit-expense/:id',
    element: (
      <ProtectedRoute>
        <EditExpense />
      </ProtectedRoute>
    ),
  },
  {
    path: '/error',
    element: <ErrorPage />,
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
]);

export default router;