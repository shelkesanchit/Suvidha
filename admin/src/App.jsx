import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Common Pages
import RoleSelection from './pages/RoleSelection';
import LoginPage from './pages/LoginPage';

// Electricity Pages
import ElectricityDashboard from './pages/electricity/AdminDashboard';
import ElectricityOverview from './pages/electricity/AdminOverview';
import ElectricityApplications from './pages/electricity/ManageApplications';
import ElectricityComplaints from './pages/electricity/ManageComplaints';
import ElectricityUsers from './pages/electricity/ManageUsers';
import ElectricityReports from './pages/electricity/Reports';
import ElectricitySettings from './pages/electricity/SystemSettings';
import ElectricityTariff from './pages/electricity/TariffManagement';

// Gas Pages
import GasDashboard from './pages/gas/GasDashboard';
import GasOverview from './pages/gas/DashboardOverview';
import GasApplications from './pages/gas/ManageApplications';
import GasComplaints from './pages/gas/ManageComplaints';
import GasConsumers from './pages/gas/ManageConsumers';
import GasCylinders from './pages/gas/CylinderBookings';
import GasReports from './pages/gas/Reports';
import GasTariff from './pages/gas/TariffManagement';
import GasSettings from './pages/gas/Settings';
import GasRegulatory from './pages/gas/RegulatoryOperations';

// Water Pages
import WaterDashboard from './pages/water/WaterDashboard';
import WaterOverview from './pages/water/DashboardOverview';
import WaterApplications from './pages/water/ManageApplications';
import WaterComplaints from './pages/water/ManageComplaints';
import WaterConsumers from './pages/water/ManageConsumers';
import WaterReports from './pages/water/Reports';
import WaterTariff from './pages/water/TariffManagement';
import WaterSettings from './pages/water/Settings';

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
const ProtectedRoute = ({ children, requiredDept }) => {
  const { isAuthenticated, loading, department } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredDept && department !== requiredDept) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, department } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on department
    if (department === 'electricity') return <Navigate to="/electricity" replace />;
    if (department === 'gas') return <Navigate to="/gas" replace />;
    if (department === 'water') return <Navigate to="/water" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <RoleSelection />
          </PublicRoute>
        }
      />
      <Route
        path="/electricity/login"
        element={
          <PublicRoute>
            <LoginPage department="electricity" />
          </PublicRoute>
        }
      />
      <Route
        path="/gas/login"
        element={
          <PublicRoute>
            <LoginPage department="gas" />
          </PublicRoute>
        }
      />
      <Route
        path="/water/login"
        element={
          <PublicRoute>
            <LoginPage department="water" />
          </PublicRoute>
        }
      />

      {/* Electricity Admin Routes */}
      <Route
        path="/electricity/*"
        element={
          <ProtectedRoute requiredDept="electricity">
            <ElectricityDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<ElectricityOverview />} />
        <Route path="applications" element={<ElectricityApplications />} />
        <Route path="complaints" element={<ElectricityComplaints />} />
        <Route path="users" element={<ElectricityUsers />} />
        <Route path="reports" element={<ElectricityReports />} />
        <Route path="settings" element={<ElectricitySettings />} />
        <Route path="tariff" element={<ElectricityTariff />} />
      </Route>

      {/* Gas Admin Routes */}
      <Route
        path="/gas/*"
        element={
          <ProtectedRoute requiredDept="gas">
            <GasDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<GasOverview />} />
        <Route path="applications" element={<GasApplications />} />
        <Route path="complaints" element={<GasComplaints />} />
        <Route path="consumers" element={<GasConsumers />} />
        <Route path="cylinders" element={<GasCylinders />} />
        <Route path="reports" element={<GasReports />} />
        <Route path="tariff" element={<GasTariff />} />
        <Route path="regulatory" element={<GasRegulatory />} />
        <Route path="settings" element={<GasSettings />} />
      </Route>

      {/* Water Admin Routes */}
      <Route
        path="/water/*"
        element={
          <ProtectedRoute requiredDept="water">
            <WaterDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<WaterOverview />} />
        <Route path="applications" element={<WaterApplications />} />
        <Route path="complaints" element={<WaterComplaints />} />
        <Route path="consumers" element={<WaterConsumers />} />
        <Route path="reports" element={<WaterReports />} />
        <Route path="tariff" element={<WaterTariff />} />
        <Route path="settings" element={<WaterSettings />} />
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
