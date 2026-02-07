import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import GasDashboard from './pages/GasDashboard';
import DashboardOverview from './pages/DashboardOverview';
import ManageApplications from './pages/ManageApplications';
import ManageComplaints from './pages/ManageComplaints';
import ManageConsumers from './pages/ManageConsumers';
import CylinderBookings from './pages/CylinderBookings';
import Reports from './pages/Reports';
import TariffManagement from './pages/TariffManagement';
import Settings from './pages/Settings';
import RegulatoryOperations from './pages/RegulatoryOperations';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: '#fff8f5',
          p: 3
        }}>
          <Typography variant="h4" color="error" gutterBottom>Something went wrong</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </Box>
      );
    }
    return this.props.children;
  }
}

// Create Gas theme (Orange/Fire color scheme)
const theme = createTheme({
  palette: {
    primary: {
      main: '#ff6b35',
      light: '#ff9a6c',
      dark: '#e55a25',
    },
    secondary: {
      main: '#f7931e',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    background: {
      default: '#fff8f5',
      paper: '#ffffff',
    },
    info: {
      main: '#0288d1',
    },
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#d32f2f',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// Loading Component
const LoadingScreen = () => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
  }}>
    <CircularProgress size={50} sx={{ color: 'white', mb: 2 }} />
    <Typography sx={{ color: 'white', fontSize: '1.2rem' }}>Loading...</Typography>
  </Box>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
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
            <GasDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOverview />} />
        <Route path="applications" element={<ManageApplications />} />
        <Route path="complaints" element={<ManageComplaints />} />
        <Route path="consumers" element={<ManageConsumers />} />
        <Route path="cylinder-bookings" element={<CylinderBookings />} />
        <Route path="regulatory" element={<RegulatoryOperations />} />
        <Route path="reports" element={<Reports />} />
        <Route path="tariff" element={<TariffManagement />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
                success: {
                  iconTheme: {
                    primary: '#4caf50',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#f44336',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
