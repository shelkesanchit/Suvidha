import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../utils/municipal/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const getPaymentStatusColor = (status) => {
  if (status === 'success' || status === 'completed') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'failed') return 'error';
  return 'default';
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    fetchPayments();
  }, [page, pageSize]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/municipal/admin/payments', {
        params: { page: page + 1, limit: pageSize },
      });
      setPayments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: 'transaction_id', headerName: 'Transaction ID', width: 180 },
    { field: 'application_number', headerName: 'Application No.', width: 160 },
    { field: 'payer_name', headerName: 'Payer Name', width: 160 },
    { field: 'mobile', headerName: 'Mobile', width: 120 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 110,
      valueFormatter: (params) => `₹${parseFloat(params.value || 0).toLocaleString('en-IN')}`,
    },
    {
      field: 'payment_type',
      headerName: 'Payment Type',
      width: 150,
      valueFormatter: (params) => params.value?.replace(/_/g, ' ') || '-',
    },
    {
      field: 'payment_method',
      headerName: 'Method',
      width: 120,
      valueFormatter: (params) => params.value?.replace(/_/g, ' ') || '-',
    },
    {
      field: 'payment_status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getPaymentStatusColor(params.value)}
        />
      ),
    },
    {
      field: 'payment_date',
      headerName: 'Date',
      width: 110,
      valueFormatter: (params) => {
        try { return format(new Date(params.value), 'dd/MM/yyyy'); } catch { return params.value || '-'; }
      },
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Payments
      </Typography>

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={payments}
          columns={columns}
          pageSize={pageSize}
          rowsPerPageOptions={[25, 50, 100]}
          loading={loading}
          disableSelectionOnClick
          getRowId={(row) => row.id || row.transaction_id}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => setPageSize(newSize)}
        />
      </Paper>
    </Box>
  );
};

export default Payments;
