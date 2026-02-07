import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Refresh,
  Search,
} from '@mui/icons-material';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ManageApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/api/gas/admin/applications', { params });
      setApplications(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setDetailsOpen(true);
  };

  const handleStatusUpdate = async (appId, newStatus, remarks = '') => {
    try {
      setProcessing(true);
      await api.put(`/api/gas/admin/applications/${appId}/status`, {
        status: newStatus,
        remarks,
      });
      toast.success(`Application ${newStatus} successfully`);
      fetchApplications();
      setDetailsOpen(false);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    { field: 'application_number', headerName: 'App No.', width: 150 },
    { field: 'full_name', headerName: 'Applicant', width: 180 },
    { field: 'mobile', headerName: 'Mobile', width: 130 },
    { field: 'application_type', headerName: 'Type', width: 120 },
    { field: 'gas_type', headerName: 'Gas Type', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value?.replace(/_/g, ' ')}
          size="small"
          color={
            params.value === 'approved' || params.value === 'completed' ? 'success' :
            params.value === 'rejected' ? 'error' :
            params.value === 'submitted' || params.value === 'pending' ? 'warning' : 'default'
          }
        />
      ),
    },
    {
      field: 'submitted_at',
      headerName: 'Applied On',
      width: 120,
      valueFormatter: (params) => {
        try {
          return format(new Date(params.value), 'dd/MM/yyyy');
        } catch {
          return params.value;
        }
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton onClick={() => handleViewDetails(params.row)} size="small">
              <Visibility />
            </IconButton>
          </Tooltip>
          {params.row.status === 'pending' && (
            <>
              <Tooltip title="Approve">
                <IconButton
                  onClick={() => handleStatusUpdate(params.row.id, 'approved')}
                  size="small"
                  color="success"
                >
                  <CheckCircle />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton
                  onClick={() => handleStatusUpdate(params.row.id, 'rejected')}
                  size="small"
                  color="error"
                >
                  <Cancel />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  const filteredApplications = applications.filter(app =>
    app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.mobile?.includes(searchTerm)
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Manage Applications
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, app no., or mobile"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              startIcon={<Refresh />}
              onClick={fetchApplications}
              variant="outlined"
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredApplications}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={loading}
          disableSelectionOnClick
          getRowId={(row) => row.id || row.application_number}
        />
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent dividers>
          {selectedApp && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Application Number</Typography>
                <Typography variant="body1" gutterBottom>{selectedApp.application_number}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip label={selectedApp.status} color={selectedApp.status === 'approved' ? 'success' : 'warning'} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Applicant Name</Typography>
                <Typography variant="body1" gutterBottom>{selectedApp.applicant_name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Mobile</Typography>
                <Typography variant="body1" gutterBottom>{selectedApp.mobile}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Connection Type</Typography>
                <Typography variant="body1" gutterBottom>{selectedApp.connection_type}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Gas Type</Typography>
                <Typography variant="body1" gutterBottom>{selectedApp.gas_type}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                <Typography variant="body1" gutterBottom>{selectedApp.address}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedApp?.status === 'pending' && (
            <>
              <Button
                onClick={() => handleStatusUpdate(selectedApp.id, 'approved')}
                color="success"
                variant="contained"
                disabled={processing}
              >
                Approve
              </Button>
              <Button
                onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')}
                color="error"
                variant="contained"
                disabled={processing}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageApplications;
