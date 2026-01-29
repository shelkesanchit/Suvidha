import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  CircularProgress,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as ApplicationIcon,
  Report as ComplaintIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingIcon,
  CheckCircle as SuccessIcon,
  Refresh as RefreshIcon,
  ShowChart as ChartIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds for real-time monitoring
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async (showToast = false) => {
    try {
      setRefreshing(true);
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data);
      if (showToast) {
        toast.success('Dashboard refreshed');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchStats(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 400, gap: 2 }}>
        <CircularProgress size={50} />
        <Typography variant="h6" color="text.secondary">Loading dashboard...</Typography>
      </Box>
    );
  }

  // Mock data for charts - in production, this would come from API
  const applicationsTrend = [
    { month: 'Jan', applications: 45, approved: 38, rejected: 7 },
    { month: 'Feb', applications: 52, approved: 44, rejected: 8 },
    { month: 'Mar', applications: 61, approved: 53, rejected: 8 },
    { month: 'Apr', applications: 58, approved: 50, rejected: 8 },
    { month: 'May', applications: 70, approved: 62, rejected: 8 },
    { month: 'Jun', applications: 85, approved: 75, rejected: 10 },
  ];

  const revenueTrend = [
    { month: 'Jan', revenue: 125000 },
    { month: 'Feb', revenue: 142000 },
    { month: 'Mar', revenue: 168000 },
    { month: 'Apr', revenue: 155000 },
    { month: 'May', revenue: 195000 },
    { month: 'Jun', revenue: 225000 },
  ];

  const applicationsByType = [
    { name: 'New Connection', value: stats?.pending_applications || 0 },
    { name: 'Load Change', value: 12 },
    { name: 'Name Change', value: 8 },
    { name: 'Reconnection', value: 15 },
    { name: 'Solar Rooftop', value: 5 },
  ];

  const complaintsByStatus = [
    { name: 'Open', value: stats?.open_complaints || 0 },
    { name: 'In Progress', value: 8 },
    { name: 'Resolved', value: 45 },
    { name: 'Closed', value: 32 },
  ];

  const statCards = [
    {
      title: 'Total Customers',
      value: stats?.total_customers || 0,
      icon: PeopleIcon,
      color: '#1976d2',
      bgColor: '#e3f2fd',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Connections',
      value: stats?.active_connections || 0,
      icon: SuccessIcon,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Pending Applications',
      value: stats?.pending_applications || 0,
      icon: ApplicationIcon,
      color: '#ed6c02',
      bgColor: '#fff3e0',
      trend: '+5',
      trendUp: false,
      needsAction: true,
    },
    {
      title: 'Open Complaints',
      value: stats?.open_complaints || 0,
      icon: ComplaintIcon,
      color: '#d32f2f',
      bgColor: '#ffebee',
      trend: '-3',
      trendUp: true,
      needsAction: true,
    },
    {
      title: "Today's Revenue",
      value: `₹${stats?.today_revenue?.toLocaleString() || 0}`,
      icon: PaymentIcon,
      color: '#0288d1',
      bgColor: '#e1f5fe',
      trend: '+15%',
      trendUp: true,
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats?.month_revenue?.toLocaleString() || 0}`,
      icon: TrendingIcon,
      color: '#388e3c',
      bgColor: '#f1f8e9',
      trend: '+24%',
      trendUp: true,
    },
  ];

  return (
    <Box>
      {/* Header with Refresh Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time system statistics and performance metrics
          </Typography>
        </Box>
        <Tooltip title="Refresh Dashboard">
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderLeft: `4px solid ${card.color}`,
                bgcolor: card.bgColor,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'white',
                      boxShadow: 1,
                    }}
                  >
                    <card.icon sx={{ fontSize: 28, color: card.color }} />
                  </Box>
                  {card.needsAction && (
                    <Chip 
                      label="Action Required" 
                      size="small" 
                      color="error" 
                      sx={{ height: 24, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5, color: card.color }}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {card.title}
                </Typography>
                {card.trend && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ChartIcon 
                      sx={{ 
                        fontSize: 16, 
                        color: card.trendUp ? 'success.main' : 'error.main',
                        transform: card.trendUp ? 'rotate(0deg)' : 'rotate(180deg)'
                      }} 
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: card.trendUp ? 'success.main' : 'error.main',
                        fontWeight: 600 
                      }}
                    >
                      {card.trend} from last month
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Applications Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>Applications Trend</Typography>
                <Typography variant="body2" color="text.secondary">
                  Monthly application submissions and processing
                </Typography>
              </Box>
              <SpeedIcon sx={{ color: 'primary.main' }} />
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={applicationsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Bar dataKey="applications" fill="#1976d2" name="Total Applications" radius={[8, 8, 0, 0]} />
                <Bar dataKey="approved" fill="#2e7d32" name="Approved" radius={[8, 8, 0, 0]} />
                <Bar dataKey="rejected" fill="#d32f2f" name="Rejected" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Applications by Type */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              Applications by Type
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={applicationsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {applicationsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Revenue Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>Revenue Trend</Typography>
                <Typography variant="body2" color="text.secondary">
                  Monthly revenue collection analysis
                </Typography>
              </Box>
              <TrendingIcon sx={{ color: 'success.main' }} />
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#388e3c" 
                  strokeWidth={3}
                  name="Revenue (₹)"
                  dot={{ fill: '#388e3c', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Complaints by Status */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              Complaints Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={complaintsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {complaintsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              System Performance
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Application Processing Rate</Typography>
                <Typography variant="body2" fontWeight={600}>87%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={87} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Complaint Resolution Rate</Typography>
                <Typography variant="body2" fontWeight={600}>92%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={92} color="success" sx={{ height: 8, borderRadius: 4 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Customer Satisfaction</Typography>
                <Typography variant="body2" fontWeight={600}>94%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={94} color="success" sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'warning.lighter', borderRadius: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Pending Approvals</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats?.pending_applications || 0} applications waiting
                  </Typography>
                </Box>
                <Chip label="Review" color="warning" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'error.lighter', borderRadius: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Open Complaints</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats?.open_complaints || 0} complaints need attention
                  </Typography>
                </Box>
                <Chip label="Resolve" color="error" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'info.lighter', borderRadius: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>System Health</Typography>
                  <Typography variant="caption" color="text.secondary">All systems operational</Typography>
                </Box>
                <Chip label="Healthy" color="success" size="small" />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default AdminOverview;
