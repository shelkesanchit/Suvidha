import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Role Selection
import RoleSelection from './pages/RoleSelection';

// Shared Login Page (department-aware)
import LoginPage from './pages/LoginPage';

// Electricity Pages
import AdminDashboard from './pages/electricity/AdminDashboard';
import AdminOverview from './pages/electricity/AdminOverview';
import ManageApplications from './pages/electricity/ManageApplications';
import ManageComplaints from './pages/electricity/ManageComplaints';
import ManageUsers from './pages/electricity/ManageUsers';
import Reports from './pages/electricity/Reports';
import SystemSettings from './pages/electricity/SystemSettings';
import TariffManagement from './pages/electricity/TariffManagement';
import MeterReadingManagement from './pages/electricity/MeterReadingManagement';

// Gas Pages
import GasDashboard from './pages/gas/GasDashboard';
import GasDashboardOverview from './pages/gas/DashboardOverview';
import GasManageApplications from './pages/gas/ManageApplications';
import GasManageComplaints from './pages/gas/ManageComplaints';
import GasManageConsumers from './pages/gas/ManageConsumers';
import CylinderBookings from './pages/gas/CylinderBookings';
import RegulatoryOperations from './pages/gas/RegulatoryOperations';
import GasReports from './pages/gas/Reports';
import GasTariffManagement from './pages/gas/TariffManagement';
import GasSettings from './pages/gas/Settings';

// Water Pages
import WaterDashboard from './pages/water/WaterDashboard';
import WaterDashboardOverview from './pages/water/DashboardOverview';
import WaterManageApplications from './pages/water/ManageApplications';
import WaterManageComplaints from './pages/water/ManageComplaints';
import WaterManageConsumers from './pages/water/ManageConsumers';
import WaterReports from './pages/water/Reports';
import WaterTariffManagement from './pages/water/TariffManagement';
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
const ProtectedRoute = ({ children, dept }) => {
  const { isAuthenticated, loading, department } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={dept ? `/${dept}/login` : '/login'} replace />;
  }

  // If a specific department is required, verify it matches
  if (dept && department !== dept) {
    return <Navigate to={`/${dept}/login`} replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children, dept }) => {
  const { isAuthenticated, loading, department } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated && department) {
    // Redirect to the department they're logged into
    if (department === 'electricity') {
      return <Navigate to="/electricity" replace />;
    }
    return <Navigate to={`/${department}`} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Role Selection - Landing Page */}
      <Route path="/" element={<RoleSelection />} />

      {/* Legacy /login redirects to role selection */}
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* ============ ELECTRICITY ROUTES ============ */}
      <Route
        path="/electricity/login"
        element={
          <PublicRoute dept="electricity">
            <LoginPage department="electricity" />
          </PublicRoute>
        }
      />
      <Route
        path="/electricity/*"
        element={
          <ProtectedRoute dept="electricity">
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

      {/* ============ GAS ROUTES ============ */}
      <Route
        path="/gas/login"
        element={
          <PublicRoute dept="gas">
            <LoginPage department="gas" />
          </PublicRoute>
        }
      />
      <Route
        path="/gas/*"
        element={
          <ProtectedRoute dept="gas">
            <GasDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<GasDashboardOverview />} />
        <Route path="applications" element={<GasManageApplications />} />
        <Route path="complaints" element={<GasManageComplaints />} />
        <Route path="consumers" element={<GasManageConsumers />} />
        <Route path="cylinders" element={<CylinderBookings />} />
        <Route path="regulatory" element={<RegulatoryOperations />} />
        <Route path="reports" element={<GasReports />} />
        <Route path="tariff" element={<GasTariffManagement />} />
        <Route path="settings" element={<GasSettings />} />
      </Route>

      {/* ============ WATER ROUTES ============ */}
      <Route
        path="/water/login"
        element={
          <PublicRoute dept="water">
            <LoginPage department="water" />
          </PublicRoute>
        }
      />
      <Route
        path="/water/*"
        element={
          <ProtectedRoute dept="water">
            <WaterDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<WaterDashboardOverview />} />
        <Route path="applications" element={<WaterManageApplications />} />
        <Route path="complaints" element={<WaterManageComplaints />} />
        <Route path="consumers" element={<WaterManageConsumers />} />
        <Route path="reports" element={<WaterReports />} />
        <Route path="tariff" element={<WaterTariffManagement />} />
        <Route path="settings" element={<WaterSettings />} />
      </Route>

      {/* Catch all - redirect to role selection */}
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
