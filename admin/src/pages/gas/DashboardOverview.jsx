import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  People,
  Description,
  Report,
  AttachMoney,
  TrendingUp,
  Warning,
  PropaneTank as CylinderIcon,
  LocalFireDepartment as GasIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from "../../utils/gas/api";
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} color={color}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ color, fontSize: 28 }} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const COLORS = ['#ff6b35', '#f7931e', '#2e7d32', '#0288d1', '#d32f2f'];

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConsumers: 0,
    activePNGConnections: 0,
    activeLPGConnections: 0,
    pendingApplications: 0,
    activeComplaints: 0,
    cylinderBookingsToday: 0,
    monthlyRevenue: 0,
    emergencyComplaints: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/gas/admin/dashboard/stats');
      if (response.data && response.data.data) {
        const data = response.data.data;
        setStats({
          totalConsumers: data.stats?.total_consumers || 0,
          pendingApplications: data.stats?.pending_applications || 0,
          activeComplaints: data.stats?.open_complaints || 0,
          monthlyRevenue: data.stats?.pending_payments || 0,
        });
        setRecentApplications(data.recent_applications || []);
        setRecentComplaints(data.recent_complaints || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Jan', connections: 65, revenue: 42000 },
    { name: 'Feb', connections: 78, revenue: 51000 },
    { name: 'Mar', connections: 90, revenue: 59000 },
    { name: 'Apr', connections: 81, revenue: 47000 },
    { name: 'May', connections: 95, revenue: 62000 },
    { name: 'Jun', connections: 110, revenue: 75000 },
  ];

  const connectionTypeData = [
    { name: 'PNG Domestic', value: 45 },
    { name: 'PNG Commercial', value: 25 },
    { name: 'LPG Single', value: 20 },
    { name: 'LPG Double', value: 10 },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Dashboard Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Welcome to Gas Distribution Admin Panel
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Consumers"
            value={stats.totalConsumers}
            icon={People}
            color="#ff6b35"
            subtitle="Active connections"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Applications"
            value={stats.pendingApplications}
            icon={Description}
            color="#f7931e"
            subtitle="Awaiting review"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Complaints"
            value={stats.activeComplaints}
            icon={Report}
            color="#d32f2f"
            subtitle={`${stats.emergencyComplaints} emergency`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value={`₹${(stats.monthlyRevenue / 1000).toFixed(0)}K`}
            icon={AttachMoney}
            color="#2e7d32"
            subtitle="This month"
          />
        </Grid>
      </Grid>

      {/* Second Row Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="PNG Connections"
            value={stats.activePNGConnections}
            icon={GasIcon}
            color="#0288d1"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="LPG Connections"
            value={stats.activeLPGConnections}
            icon={CylinderIcon}
            color="#e91e63"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Bookings"
            value={stats.cylinderBookingsToday}
            icon={CylinderIcon}
            color="#9c27b0"
            subtitle="Cylinder deliveries"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Growth Rate"
            value="+12%"
            icon={TrendingUp}
            color="#4caf50"
            subtitle="vs last month"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Connections & Revenue Trend
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="connections"
                  stroke="#ff6b35"
                  strokeWidth={2}
                  name="New Connections"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2e7d32"
                  strokeWidth={2}
                  name="Revenue (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Connection Types
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={connectionTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {connectionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Applications
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>App No.</TableCell>
                    <TableCell>Applicant</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentApplications.length > 0 ? (
                    recentApplications.slice(0, 5).map((app, index) => (
                      <TableRow key={index}>
                        <TableCell>{app.application_number}</TableCell>
                        <TableCell>{app.applicant_name}</TableCell>
                        <TableCell>{app.connection_type}</TableCell>
                        <TableCell>
                          <Chip
                            label={app.status}
                            size="small"
                            color={
                              app.status === 'approved' ? 'success' :
                              app.status === 'pending' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No recent applications
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Complaints
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Complaint No.</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentComplaints.length > 0 ? (
                    recentComplaints.slice(0, 5).map((complaint, index) => (
                      <TableRow key={index}>
                        <TableCell>{complaint.complaint_number}</TableCell>
                        <TableCell>{complaint.category}</TableCell>
                        <TableCell>
                          <Chip
                            label={complaint.priority}
                            size="small"
                            color={
                              complaint.priority === 'emergency' ? 'error' :
                              complaint.priority === 'high' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={complaint.status}
                            size="small"
                            color={
                              complaint.status === 'resolved' ? 'success' :
                              complaint.status === 'in_progress' ? 'info' : 'warning'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No recent complaints
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardOverview;
