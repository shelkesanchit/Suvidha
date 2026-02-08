import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Edit,
  Add,
  Refresh,
} from '@mui/icons-material';
import api from "../../utils/gas/api";
import toast from 'react-hot-toast';

const TariffManagement = () => {
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    gas_type: 'PNG',
    rate_per_unit: '',
    fixed_charges: '',
    min_charges: '',
    effective_from: '',
  });

  useEffect(() => {
    fetchTariffs();
  }, []);

  const fetchTariffs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/gas/admin/tariffs');
      setTariffs(response.data.tariffs || []);
    } catch (error) {
      console.error('Failed to fetch tariffs:', error);
      toast.error('Failed to load tariffs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tariff = null) => {
    if (tariff) {
      setEditingTariff(tariff);
      setFormData({
        category: tariff.category,
        gas_type: tariff.gas_type,
        rate_per_unit: tariff.rate_per_unit,
        fixed_charges: tariff.fixed_charges,
        min_charges: tariff.min_charges || '',
        effective_from: tariff.effective_from?.split('T')[0] || '',
      });
    } else {
      setEditingTariff(null);
      setFormData({
        category: '',
        gas_type: 'PNG',
        rate_per_unit: '',
        fixed_charges: '',
        min_charges: '',
        effective_from: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingTariff) {
        await api.put(`/api/gas/admin/tariffs/${editingTariff.id}`, formData);
        toast.success('Tariff updated successfully');
      } else {
        await api.post('/gas/admin/tariffs', formData);
        toast.success('Tariff created successfully');
      }
      fetchTariffs();
      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save tariff');
    }
  };

  const columns = [
    { field: 'category', headerName: 'Category', width: 180 },
    { 
      field: 'gas_type', 
      headerName: 'Gas Type', 
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.value === 'PNG' ? 'primary' : 'secondary'} 
        />
      )
    },
    { 
      field: 'rate_per_unit', 
      headerName: 'Rate/Unit (₹)', 
      width: 130,
      valueFormatter: (params) => `₹${params.value}`
    },
    { 
      field: 'fixed_charges', 
      headerName: 'Fixed Charges (₹)', 
      width: 150,
      valueFormatter: (params) => `₹${params.value}`
    },
    { 
      field: 'min_charges', 
      headerName: 'Min Charges (₹)', 
      width: 140,
      valueFormatter: (params) => params.value ? `₹${params.value}` : '-'
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Active' : 'Inactive'} 
          size="small" 
          color={params.value ? 'success' : 'default'} 
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      renderCell: (params) => (
        <Tooltip title="Edit">
          <IconButton onClick={() => handleOpenDialog(params.row)} size="small">
            <Edit />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Tariff Management
        </Typography>
        <Box>
          <Button
            startIcon={<Refresh />}
            onClick={fetchTariffs}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => handleOpenDialog()}
          >
            Add Tariff
          </Button>
        </Box>
      </Box>

      {/* Info Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
            <Typography variant="h6">PNG Tariffs</Typography>
            <Typography variant="h4" fontWeight={700}>
              {tariffs.filter(t => t.gas_type === 'PNG').length}
            </Typography>
            <Typography variant="body2">Active categories</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'secondary.main', color: 'white' }}>
            <Typography variant="h6">LPG Tariffs</Typography>
            <Typography variant="h4" fontWeight={700}>
              {tariffs.filter(t => t.gas_type === 'LPG').length}
            </Typography>
            <Typography variant="body2">Active categories</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'success.main', color: 'white' }}>
            <Typography variant="h6">Avg Rate</Typography>
            <Typography variant="h4" fontWeight={700}>
              ₹{tariffs.length > 0 ? (tariffs.reduce((a, t) => a + parseFloat(t.rate_per_unit || 0), 0) / tariffs.length).toFixed(2) : 0}
            </Typography>
            <Typography variant="body2">Per SCM/Kg</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Data Grid */}
      <Paper sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={tariffs}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25]}
          loading={loading}
          disableSelectionOnClick
          getRowId={(row) => row.id}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTariff ? 'Edit Tariff' : 'Add New Tariff'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Domestic, Commercial"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Gas Type</InputLabel>
                <Select
                  value={formData.gas_type}
                  label="Gas Type"
                  onChange={(e) => setFormData({ ...formData, gas_type: e.target.value })}
                >
                  <MenuItem value="PNG">PNG</MenuItem>
                  <MenuItem value="LPG">LPG</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rate per Unit (₹)"
                type="number"
                value={formData.rate_per_unit}
                onChange={(e) => setFormData({ ...formData, rate_per_unit: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fixed Charges (₹)"
                type="number"
                value={formData.fixed_charges}
                onChange={(e) => setFormData({ ...formData, fixed_charges: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Minimum Charges (₹)"
                type="number"
                value={formData.min_charges}
                onChange={(e) => setFormData({ ...formData, min_charges: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Effective From"
                type="date"
                value={formData.effective_from}
                onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTariff ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TariffManagement;
