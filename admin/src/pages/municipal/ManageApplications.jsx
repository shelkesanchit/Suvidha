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
import { Visibility, Refresh, Search } from '@mui/icons-material';
import api from '../../utils/municipal/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const DEPT_LABELS = {
  vital_records: 'Vital Records',
  building: 'Building',
  grievance: 'Grievance',
  health_env: 'Health & Env',
  housing: 'Housing',
  roads: 'Roads',
  sanitation: 'Sanitation',
  trade_license: 'Trade License',
  admin_services: 'Admin Services',
  general: 'General',
};

const APP_TYPE_LABELS = {
  birth_certificate: 'Birth Certificate',
  death_certificate: 'Death Certificate',
  marriage_certificate: 'Marriage Certificate',
  domicile_certificate: 'Domicile Certificate',
  building_plan_approval: 'Building Plan Approval',
  completion_certificate: 'Completion Certificate',
  occupancy_certificate: 'Occupancy Certificate',
  demolition_permission: 'Demolition Permission',
  public_grievance: 'Public Grievance',
  rtl_application: 'RTI Application',
  health_license: 'Health License',
  food_establishment_license: 'Food Establishment License',
  environmental_noc: 'Environmental NOC',
  housing_scheme_application: 'Housing Scheme Application',
  tenement_registration: 'Tenement Registration',
  road_repair_request: 'Road Repair Request',
  road_cutting_permission: 'Road Cutting Permission',
  street_light_complaint: 'Street Light Complaint',
  garbage_collection_complaint: 'Garbage Collection',
  drainage_repair: 'Drainage Repair',
  new_trade_license: 'New Trade License',
  trade_license_renewal: 'Trade License Renewal',
  trade_license_amendment: 'Trade License Amendment',
  shop_establishment: 'Shop Establishment',
  name_change: 'Name Change',
  address_proof: 'Address Proof',
  income_certificate: 'Income Certificate',
  caste_certificate: 'Caste Certificate',
  residence_certificate: 'Residence Certificate',
  noc_certificate: 'NOC Certificate',
};

const STATUS_OPTIONS = [
  'submitted',
  'document_verification',
  'under_review',
  'approval_pending',
  'approved',
  'rejected',
  'work_in_progress',
  'completed',
  'closed',
];

const getStatusColor = (status) => {
  if (status === 'approved' || status === 'completed') return 'success';
  if (status === 'rejected') return 'error';
  if (status === 'under_review' || status === 'document_verification') return 'info';
  return 'warning';
};

const ManageApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updateForm, setUpdateForm] = useState({ status: '', remarks: '', current_stage: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, deptFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (deptFilter) params.department = deptFilter;
      if (searchTerm) params.search = searchTerm;
      const response = await api.get('/municipal/admin/applications', { params });
      setApplications(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchApplications();
  };

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setUpdateForm({ status: app.status || '', remarks: '', current_stage: app.current_stage || '' });
    setDetailsOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedApp) return;
    try {
      setProcessing(true);
      await api.patch(`/municipal/admin/applications/${selectedApp.id}/status`, updateForm);
      toast.success('Application status updated');
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
    { field: 'full_name', headerName: 'Applicant', width: 160 },
    { field: 'mobile', headerName: 'Mobile', width: 120 },
    {
      field: 'application_type',
      headerName: 'Type',
      width: 180,
      valueFormatter: (params) => APP_TYPE_LABELS[params.value] || params.value,
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 140,
      valueFormatter: (params) => DEPT_LABELS[params.value] || params.value,
    },
    { field: 'ward', headerName: 'Ward', width: 80 },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value?.replace(/_/g, ' ')}
          size="small"
          color={getStatusColor(params.value)}
        />
      ),
    },
    {
      field: 'submitted_at',
      headerName: 'Submitted',
      width: 110,
      valueFormatter: (params) => {
        try { return format(new Date(params.value), 'dd/MM/yyyy'); } catch { return params.value; }
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      renderCell: (params) => (
        <Tooltip title="View & Update">
          <IconButton onClick={() => handleViewDetails(params.row)} size="small">
            <Visibility />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const filteredApplications = applications.filter(a =>
    a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.mobile?.includes(searchTerm)
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
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">All Status</MenuItem>
                {STATUS_OPTIONS.map(s => (
                  <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select value={deptFilter} label="Department" onChange={(e) => setDeptFilter(e.target.value)}>
                <MenuItem value="">All Departments</MenuItem>
                {Object.entries(DEPT_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button startIcon={<Refresh />} onClick={fetchApplications} variant="outlined" size="small">
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
          getRowId={(row) => row.id}
        />
      </Paper>

      {/* Details / Update Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Application Details & Status Update</DialogTitle>
        <DialogContent dividers>
          {selectedApp && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Application Number</Typography>
                <Typography variant="body1" gutterBottom>{selectedApp.application_number}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Applicant Name</Typography>
                <Typography variant="body1" gutterBottom>{selectedApp.full_name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Mobile</Typography>
                <Typography variant="body1" gutterBottom>{selectedApp.mobile}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Ward</Typography>
                <Typography variant="body1" gutterBottom>{selectedApp.ward}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Application Type</Typography>
                <Typography variant="body1" gutterBottom>
                  {APP_TYPE_LABELS[selectedApp.application_type] || selectedApp.application_type}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                <Typography variant="body1" gutterBottom>
                  {DEPT_LABELS[selectedApp.department] || selectedApp.department}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Current Status</Typography>
                <Chip
                  label={selectedApp.status?.replace(/_/g, ' ')}
                  size="small"
                  color={getStatusColor(selectedApp.status)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Submitted At</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedApp.submitted_at ? format(new Date(selectedApp.submitted_at), 'dd/MM/yyyy HH:mm') : '-'}
                </Typography>
              </Grid>

              {/* Update Fields */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
                  Update Status
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>New Status</InputLabel>
                  <Select
                    value={updateForm.status}
                    label="New Status"
                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Current Stage"
                  value={updateForm.current_stage}
                  onChange={(e) => setUpdateForm({ ...updateForm, current_stage: e.target.value })}
                  placeholder="e.g., Officer Review"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Remarks"
                  multiline
                  rows={2}
                  value={updateForm.remarks}
                  onChange={(e) => setUpdateForm({ ...updateForm, remarks: e.target.value })}
                  placeholder="Add remarks or notes..."
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            color="primary"
            disabled={processing || !updateForm.status}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageApplications;
