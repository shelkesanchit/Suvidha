import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Assessment,
  Download,
  TrendingUp,
  People,
  AttachMoney,
  LocalFireDepartment,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { format, subMonths } from 'date-fns';
import toast from 'react-hot-toast';

const COLORS = ['#ff6b35', '#f7931e', '#2e7d32', '#0288d1', '#9c27b0'];

const Reports = () => {
  const [reportType, setReportType] = useState('monthly');
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 6), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const monthlyData = [
    { month: 'Jan', newConnections: 85, revenue: 125000, complaints: 12 },
    { month: 'Feb', newConnections: 92, revenue: 138000, complaints: 8 },
    { month: 'Mar', newConnections: 108, revenue: 156000, complaints: 15 },
    { month: 'Apr', newConnections: 95, revenue: 142000, complaints: 10 },
    { month: 'May', newConnections: 110, revenue: 168000, complaints: 7 },
    { month: 'Jun', newConnections: 125, revenue: 185000, complaints: 11 },
  ];

  const connectionTypeData = [
    { name: 'PNG Domestic', value: 450 },
    { name: 'PNG Commercial', value: 180 },
    { name: 'PNG Industrial', value: 65 },
    { name: 'LPG Single', value: 320 },
    { name: 'LPG Double', value: 85 },
  ];

  const cylinderSalesData = [
    { month: 'Jan', '14.2kg': 520, '19kg': 180, '5kg': 95 },
    { month: 'Feb', '14.2kg': 580, '19kg': 210, '5kg': 110 },
    { month: 'Mar', '14.2kg': 610, '19kg': 195, '5kg': 125 },
    { month: 'Apr', '14.2kg': 550, '19kg': 220, '5kg': 105 },
    { month: 'May', '14.2kg': 640, '19kg': 240, '5kg': 130 },
    { month: 'Jun', '14.2kg': 680, '19kg': 260, '5kg': 145 },
  ];

  const handleExportReport = (format) => {
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Reports & Analytics
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="monthly">Monthly Report</MenuItem>
                <MenuItem value="quarterly">Quarterly Report</MenuItem>
                <MenuItem value="yearly">Yearly Report</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {reportType === 'custom' && (
            <>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => handleExportReport('pdf')}
              sx={{ mr: 1 }}
            >
              PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExportReport('excel')}
            >
              Excel
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Connections</Typography>
                  <Typography variant="h4" fontWeight={700}>1,100</Typography>
                  <Typography variant="caption">+12% from last period</Typography>
                </Box>
                <LocalFireDepartment sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#2e7d32', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Revenue</Typography>
                  <Typography variant="h4" fontWeight={700}>₹9.14L</Typography>
                  <Typography variant="caption">This period</Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f7931e', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Cylinder Sales</Typography>
                  <Typography variant="h4" fontWeight={700}>4,650</Typography>
                  <Typography variant="caption">Units delivered</Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#0288d1', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Active Consumers</Typography>
                  <Typography variant="h4" fontWeight={700}>1,085</Typography>
                  <Typography variant="caption">All categories</Typography>
                </Box>
                <People sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Connections & Revenue Trend
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="newConnections" fill="#ff6b35" name="New Connections" />
                <Bar yAxisId="right" dataKey="revenue" fill="#2e7d32" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Connection Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={connectionTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Cylinder Sales by Type
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={cylinderSalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="14.2kg" stroke="#ff6b35" strokeWidth={2} />
                <Line type="monotone" dataKey="19kg" stroke="#f7931e" strokeWidth={2} />
                <Line type="monotone" dataKey="5kg" stroke="#2e7d32" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
