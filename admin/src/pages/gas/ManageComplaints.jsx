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
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Visibility,
  CheckCircle,
  Refresh,
  Search,
  Warning,
} from '@mui/icons-material';
import api from "../../utils/gas/api";
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ManageComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/gas/admin/complaints', { params });
      setComplaints(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setDetailsOpen(true);
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      setProcessing(true);
      await api.put(`/api/gas/admin/complaints/${complaintId}/status`, {
        status: newStatus,
        resolution_remarks: resolutionRemarks,
      });
      toast.success(`Complaint ${newStatus} successfully`);
      fetchComplaints();
      setDetailsOpen(false);
      setResolutionRemarks('');
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    { field: 'complaint_number', headerName: 'Complaint No.', width: 150 },
    { 
      field: 'complaint_category', 
      headerName: 'Category', 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.value === 'gas-leak' && <Warning sx={{ color: 'error.main', fontSize: 18 }} />}
          {params.value?.replace(/-/g, ' ')}
        </Box>
      )
    },
    { field: 'contact_name', headerName: 'Name', width: 150 },
    { field: 'mobile', headerName: 'Mobile', width: 120 },
    {
      field: 'urgency',
      headerName: 'Priority',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'critical' ? 'error' :
            params.value === 'high' ? 'warning' :
            params.value === 'medium' ? 'info' : 'default'
          }
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value?.replace(/_/g, ' ')}
          size="small"
          color={
            params.value === 'resolved' || params.value === 'closed' ? 'success' :
            params.value === 'in_progress' || params.value === 'assigned' ? 'info' :
            params.value === 'open' ? 'warning' : 'default'
          }
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Filed On',
      width: 110,
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
      width: 100,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton onClick={() => handleViewDetails(params.row)} size="small">
              <Visibility />
            </IconButton>
          </Tooltip>
          {params.row.status !== 'resolved' && (
            <Tooltip title="Resolve">
              <IconButton
                onClick={() => handleViewDetails(params.row)}
                size="small"
                color="success"
              >
                <CheckCircle />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const filteredComplaints = complaints.filter(c =>
    c.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.complaint_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile?.includes(searchTerm) ||
    c.complaint_category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Manage Complaints
      </Typography>

      {/* Emergency Alert */}
      {complaints.filter(c => c.urgency === 'critical' && c.status !== 'resolved' && c.status !== 'closed').length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning />
            <Typography fontWeight={600}>
              {complaints.filter(c => c.urgency === 'critical' && c.status !== 'resolved' && c.status !== 'closed').length} Emergency Complaints Require Immediate Attention!
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search complaints..."
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
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              startIcon={<Refresh />}
              onClick={fetchComplaints}
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
          rows={filteredComplaints}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={loading}
          disableSelectionOnClick
          getRowId={(row) => row.id || row.complaint_number}
        />
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complaint Details</DialogTitle>
        <DialogContent dividers>
          {selectedComplaint && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Complaint Number</Typography>
                <Typography variant="body1" gutterBottom>{selectedComplaint.complaint_number}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedComplaint.status} 
                  color={selectedComplaint.status === 'resolved' ? 'success' : 'warning'} 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                <Typography variant="body1" gutterBottom>{selectedComplaint.category}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                <Chip 
                  label={selectedComplaint.priority} 
                  color={selectedComplaint.priority === 'emergency' ? 'error' : 'warning'} 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Complainant</Typography>
                <Typography variant="body1" gutterBottom>{selectedComplaint.complainant_name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Mobile</Typography>
                <Typography variant="body1" gutterBottom>{selectedComplaint.mobile}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1" gutterBottom>{selectedComplaint.description}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                <Typography variant="body1" gutterBottom>{selectedComplaint.address}</Typography>
              </Grid>
              
              {selectedComplaint.status !== 'resolved' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Resolution Remarks"
                    multiline
                    rows={3}
                    value={resolutionRemarks}
                    onChange={(e) => setResolutionRemarks(e.target.value)}
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedComplaint?.status === 'pending' && (
            <Button
              onClick={() => handleStatusUpdate(selectedComplaint.id, 'in_progress')}
              color="info"
              variant="contained"
              disabled={processing}
            >
              Mark In Progress
            </Button>
          )}
          {selectedComplaint?.status !== 'resolved' && (
            <Button
              onClick={() => handleStatusUpdate(selectedComplaint.id, 'resolved')}
              color="success"
              variant="contained"
              disabled={processing}
            >
              Resolve
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageComplaints;
