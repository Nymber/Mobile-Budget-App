import './components/static/styles/styles.css';
import React, { useContext } from 'react';
import { RouterProvider, Navigate } from "react-router-dom";
import router from './Router';
import { AuthProvider, AuthContext } from './components/auth/AuthProvider';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <React.StrictMode>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </React.StrictMode>
  );
}

export default App;
