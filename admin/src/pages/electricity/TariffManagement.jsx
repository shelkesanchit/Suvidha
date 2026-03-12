import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  ElectricBolt as TariffIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import api from '../../utils/electricity/api';
import toast from 'react-hot-toast';

// Human-readable labels for tariff keys
const tariffLabels = {
  tariff_residential_upto_100: 'Residential — 0 to 100 units',
  tariff_residential_101_300: 'Residential — 101 to 300 units',
  tariff_residential_above_300: 'Residential — Above 300 units',
  tariff_commercial: 'Commercial (LT-II)',
  tariff_industrial: 'Industrial (HT)',
  tariff_agricultural: 'Agricultural',
  tariff_lt_i: 'LT-I Residential',
  tariff_lt_ii: 'LT-II Commercial',
  tariff_lt_iii: 'LT-III Industrial (Small)',
  tariff_ht_i: 'HT-I Industrial',
  tariff_ht_ii: 'HT-II Bulk',
  fixed_charge_residential: 'Fixed Charge — Residential',
  fixed_charge_commercial: 'Fixed Charge — Commercial',
  fixed_charge_industrial: 'Fixed Charge — Industrial',
  fixed_charge_agricultural: 'Fixed Charge — Agricultural',
  fixed_charge_lt_i: 'Fixed Charge — LT-I',
  fixed_charge_lt_ii: 'Fixed Charge — LT-II',
  tax_rate: 'Tax Rate (%)',
  late_payment_surcharge: 'Late Payment Surcharge (%)',
};

const TariffManagement = () => {
  const [tariffs, setTariffs] = useState({});
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTariffs();
  }, []);

  const fetchTariffs = async () => {
    try {
      setLoading(true);
      // GET /settings/tariffs/all returns {tariff_key: rate, ...}
      const response = await api.get('/settings/tariffs/all');
      setTariffs(response.data || {});
    } catch (error) {
      // Fallback: get all settings and filter tariff/fixed/tax keys
      try {
        const response = await api.get('/settings');
        const all = response.data || {};
        const filtered = {};
        Object.entries(all).forEach(([k, v]) => {
          if (k.startsWith('tariff_') || k.startsWith('fixed_charge') || k === 'tax_rate' || k === 'late_payment_surcharge') {
            filtered[k] = typeof v === 'object' ? v.value : v;
          }
        });
        setTariffs(filtered);
      } catch (e2) {
        toast.error('Failed to load tariff settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (key) => {
    setSelectedKey(key);
    setEditValue(String(tariffs[key] || ''));
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    const numVal = parseFloat(editValue);
    if (isNaN(numVal) || numVal < 0) {
      toast.error('Please enter a valid positive number');
      return;
    }
    try {
      setSaving(true);
      await api.put(`/settings/${selectedKey}`, { value: String(numVal) });
      toast.success('Tariff updated successfully');
      setTariffs((prev) => ({ ...prev, [selectedKey]: numVal }));
      setEditDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update tariff');
    } finally {
      setSaving(false);
    }
  };

  const tariffEntries = Object.entries(tariffs).filter(([k]) => k.startsWith('tariff_'));
  const fixedEntries = Object.entries(tariffs).filter(([k]) => k.startsWith('fixed_charge'));
  const otherEntries = Object.entries(tariffs).filter(([k]) => !k.startsWith('tariff_') && !k.startsWith('fixed_charge'));

  const renderTable = (entries, unit = 'Rs./kWh') => (
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: 'grey.50' }}>
          <TableCell><strong>Category / Slab</strong></TableCell>
          <TableCell><strong>Rate ({unit})</strong></TableCell>
          <TableCell><strong>Setting Key</strong></TableCell>
          <TableCell align="center"><strong>Action</strong></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {entries.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
              <Typography color="text.secondary" variant="body2">No entries</Typography>
            </TableCell>
          </TableRow>
        ) : (
          entries.map(([key, val]) => (
            <TableRow key={key} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {tariffLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={`${unit === '%' ? '' : '\u20b9'}${Number(val).toFixed(2)}${unit === '%' ? '%' : ''}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.85rem' }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  {key}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Tooltip title="Edit Rate">
                  <IconButton size="small" color="primary" onClick={() => handleEdit(key)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Tariff Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage electricity tariff rates, fixed charges, and applicable taxes
          </Typography>
        </Box>
        <Tooltip title="Refresh Tariffs">
          <IconButton onClick={fetchTariffs} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        Tariff changes affect all new bills immediately. Existing unpaid bills will not be recalculated.
      </Alert>

      <Grid container spacing={3}>
        {/* Energy Charges */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TariffIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>Energy Charges (Rs./kWh)</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {renderTable(tariffEntries, 'Rs./kWh')}
            </CardContent>
          </Card>
        </Grid>

        {/* Fixed Charges */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TariffIcon color="warning" />
                <Typography variant="h6" fontWeight={600}>Fixed Charges (Rs./month)</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {renderTable(fixedEntries, 'Rs./mo')}
            </CardContent>
          </Card>
        </Grid>

        {/* Other (Tax, Surcharge) */}
        {otherEntries.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TariffIcon color="error" />
                  <Typography variant="h6" fontWeight={600}>Taxes & Surcharges</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {renderTable(otherEntries, '%')}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon />
          Edit Tariff Rate
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ p: 2, mb: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">Setting Key</Typography>
            <Typography variant="body1" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{selectedKey}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {tariffLabels[selectedKey] || ''}
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="New Rate *"
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {selectedKey === 'tax_rate' || selectedKey === 'late_payment_surcharge' ? '%' : '\u20b9'}
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !editValue}
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TariffManagement;
