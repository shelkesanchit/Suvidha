import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as ApplicationIcon,
  Report as ComplaintIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingIcon,
  CheckCircle as SuccessIcon,
  Refresh as RefreshIcon,
  WaterDrop,
  Warning,
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
  AreaChart,
  Area,
} from 'recharts';
import api from "../../utils/water/api";
import toast from 'react-hot-toast';

const COLORS = ['#0288d1', '#00bcd4', '#4fc3f7', '#80deea', '#b2ebf2', '#4dd0e1'];
const STATUS_COLORS = {
  open: '#ff9800',
  assigned: '#2196f3',
  in_progress: '#9c27b0',
  resolved: '#4caf50',
  closed: '#607d8b',
};

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async (showToast = false) => {
    try {
      setRefreshing(true);
      const response = await api.get('/water/admin/dashboard/stats');
      setStats(response.data);
      if (showToast) {
        toast.success('Dashboard refreshed');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to fetch dashboard stats from database');
      // Set empty data instead of mock
      setStats({
        total_consumers: 0,
        active_connections: 0,
        pending_applications: 0,
        open_complaints: 0,
        today_revenue: 0,
        month_revenue: 0,
        today_applications: 0,
        today_complaints: 0,
        applicationsTrend: [],
        revenueTrend: [],
        applicationsByType: [],
        complaintsByCategory: [],
        complaintsByStatus: [],
      });
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
        <CircularProgress size={50} sx={{ color: 'primary.main' }} />
        <Typography variant="h6" color="text.secondary">Loading dashboard...</Typography>
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Total Consumers',
      value: stats?.total_consumers || 0,
      icon: PeopleIcon,
      color: '#0288d1',
      bgColor: '#e3f2fd',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Connections',
      value: stats?.active_connections || 0,
      icon: WaterDrop,
      color: '#00bcd4',
      bgColor: '#e0f7fa',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Pending Applications',
      value: stats?.pending_applications || 0,
      icon: ApplicationIcon,
      color: '#ff9800',
      bgColor: '#fff3e0',
      trend: `+${stats?.today_applications || 0} today`,
      needsAction: true,
    },
    {
      title: 'Open Complaints',
      value: stats?.open_complaints || 0,
      icon: ComplaintIcon,
      color: '#f44336',
      bgColor: '#ffebee',
      trend: `+${stats?.today_complaints || 0} today`,
      needsAction: true,
    },
    {
      title: "Today's Collection",
      value: `₹${(stats?.today_revenue || 0).toLocaleString()}`,
      icon: PaymentIcon,
      color: '#4caf50',
      bgColor: '#e8f5e9',
      trend: '+15%',
      trendUp: true,
    },
    {
      title: 'Monthly Collection',
      value: `₹${(stats?.month_revenue || 0).toLocaleString()}`,
      icon: TrendingIcon,
      color: '#9c27b0',
      bgColor: '#f3e5f5',
      trend: '+24%',
      trendUp: true,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        gap: 2
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" gutterBottom fontWeight={600} color="primary.dark" sx={{ mb: 0.5 }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time water department statistics and metrics
          </Typography>
        </Box>
        <Tooltip title="Refresh Dashboard">
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white', 
              '&:hover': { bgcolor: 'primary.dark' },
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card
              className="hover-lift"
              sx={{
                height: '100%',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: card.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <card.icon sx={{ color: card.color, fontSize: 26 }} />
                  </Box>
                  {card.needsAction && card.value > 0 && (
                    <Chip
                      icon={<Warning sx={{ fontSize: 14 }} />}
                      label="Action"
                      size="small"
                      color="warning"
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 2, color: card.color }}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {card.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: card.trendUp ? 'success.main' : 'text.secondary',
                    fontWeight: 500,
                  }}
                >
                  {card.trend}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Applications Trend */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Applications Trend
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={stats?.applicationsTrend || []}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0288d1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0288d1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="applications" stroke="#0288d1" fillOpacity={1} fill="url(#colorApps)" name="Total" />
                  <Area type="monotone" dataKey="approved" stroke="#4caf50" fillOpacity={1} fill="url(#colorApproved)" name="Approved" />
                  <Line type="monotone" dataKey="rejected" stroke="#f44336" name="Rejected" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Applications by Type */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Applications by Type
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={stats?.applicationsByType || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {(stats?.applicationsByType || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3}>
        {/* Revenue Trend */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: 380 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Revenue Collection Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.revenueTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
                  <ChartTooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#0288d1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Complaints by Category */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: 380 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Complaints by Category
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.complaintsByCategory || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <ChartTooltip />
                  <Bar dataKey="value" fill="#00bcd4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardOverview;
