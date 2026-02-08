import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/electricity/AdminDashboard';
import AdminOverview from './pages/electricity/AdminOverview';
import ManageApplications from './pages/electricity/ManageApplications';
import ManageComplaints from './pages/electricity/ManageComplaints';
import ManageUsers from './pages/electricity/ManageUsers';
import Reports from './pages/electricity/Reports';
import SystemSettings from './pages/electricity/SystemSettings';
import TariffManagement from './pages/electricity/TariffManagement';
import MeterReadingManagement from './pages/electricity/MeterReadingManagement';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      dark: '#115293',
    },
    secondary: {
      main: '#f57c00',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="applications" element={<ManageApplications />} />
        <Route path="complaints" element={<ManageComplaints />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="meter-readings" element={<MeterReadingManagement />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="tariff" element={<TariffManagement />} />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <AppRoutes />
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4caf50',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#f44336',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
