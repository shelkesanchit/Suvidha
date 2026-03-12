import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  TableContainer,
  Paper,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import api from '../../utils/electricity/api';
import toast from 'react-hot-toast';

const Reports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/admin/reports/payments', {
        params: { start_date: startDate, end_date: endDate },
      });
      const data = response.data.data || [];
      const sum = response.data.summary || null;
      setReportData(data);
      setSummary(sum);
      toast.success(`Report generated: ${data.length} records found`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (reportData.length === 0) {
      toast.error('No data to download');
      return;
    }
    const rows = [
      ['Date', 'Consumer Number', 'Amount', 'Method', 'Status', 'Transaction ID'],
      ...reportData.map((row) => [
        row.date ? new Date(row.date).toLocaleDateString('en-IN') : '',
        row.consumer_number || '',
        row.amount || '',
        row.method || row.payment_method || '',
        row.status || '',
        row.transaction_id || row.reference_number || '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `payment_report_${startDate}_to_${endDate}.csv`;
    a.click();
    toast.success('CSV downloaded');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Payment Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Generate and export payment collection reports by date range
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Generate Report
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                fullWidth
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ReportIcon />}
                onClick={handleGenerateReport}
                disabled={loading}
                size="large"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </Grid>
            {reportData.length > 0 && (
              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadCSV}
                  size="large"
                >
                  Download CSV
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Records', value: summary.total_records || reportData.length, color: 'primary' },
            { label: 'Total Amount', value: `\u20b9${Number(summary.total_amount || 0).toLocaleString('en-IN')}`, color: 'success' },
            { label: 'Paid', value: summary.paid_count || 'â€”', color: 'success' },
            { label: 'Pending', value: summary.pending_count || 'â€”', color: 'warning' },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h5" fontWeight={700} color={`${s.color}.main`}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {reportData.length > 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Payment Records ({reportData.length})
              </Typography>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>#</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Consumer No.</strong></TableCell>
                    <TableCell><strong>Consumer Name</strong></TableCell>
                    <TableCell><strong>Billing Month</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>Method</strong></TableCell>
                    <TableCell><strong>Transaction ID</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {row.date ? new Date(row.date).toLocaleDateString('en-IN') : row.payment_date ? new Date(row.payment_date).toLocaleDateString('en-IN') : 'â€”'}
                      </TableCell>
                      <TableCell>{row.consumer_number || 'â€”'}</TableCell>
                      <TableCell>{row.full_name || row.consumer_name || 'â€”'}</TableCell>
                      <TableCell>{row.billing_month || 'â€”'}</TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {row.amount != null ? `\u20b9${Number(row.amount).toLocaleString('en-IN')}` : 'â€”'}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.method || row.payment_method || 'â€”'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {row.transaction_id || row.reference_number || 'â€”'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={(row.status || 'unknown').toUpperCase()}
                          size="small"
                          color={row.status === 'success' || row.status === 'completed' ? 'success' : row.status === 'pending' ? 'warning' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        !loading && (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <TrendingIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No report generated yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select a date range and click "Generate Report" to view payment data
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )
      )}
    </Box>
  );
};

export default Reports;
