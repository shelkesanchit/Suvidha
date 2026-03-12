import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  InputAdornment,
  Tooltip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../../utils/electricity/api';
import toast from 'react-hot-toast';

// Group settings by prefix
const groupSettings = (settingsMap) => {
  const groups = {};
  Object.entries(settingsMap).forEach(([key, val]) => {
    const prefix = key.split('_')[0];
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push({ key, value: val.value, description: val.description });
  });
  return groups;
};

const groupLabels = {
  tariff: 'Tariff Rates',
  fixed: 'Fixed Charges',
  tax: 'Tax & Surcharges',
  late: 'Late Payment',
  contact: 'Contact Information',
  office: 'Office Hours',
  application: 'Application Settings',
  url: 'URLs & Links',
};

const SystemSettings = () => {
  const [settingsMap, setSettingsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState('');
  const [selectedDesc, setSelectedDesc] = useState('');
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      // Response is {setting_key: {value, description}, ...}
      setSettingsMap(response.data || {});
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (key, value, description) => {
    setSelectedKey(key);
    setSelectedDesc(description || '');
    setEditValue(value || '');
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/settings/${selectedKey}`, { value: editValue });
      toast.success('Setting updated successfully');
      setEditDialogOpen(false);
      setSettingsMap((prev) => ({
        ...prev,
        [selectedKey]: { ...prev[selectedKey], value: editValue },
      }));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const filteredEntries = Object.entries(settingsMap).filter(([key]) =>
    !searchQuery || key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groups = groupSettings(Object.fromEntries(filteredEntries));
  const groupNames = Object.keys(groups).sort((a, b) => {
    const order = ['tariff', 'fixed', 'tax', 'late', 'contact', 'office', 'application'];
    const ia = order.indexOf(a); const ib = order.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

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
            System Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure tariff rates, charges, contacts and other system parameters
          </Typography>
        </Box>
        <Tooltip title="Refresh Settings">
          <IconButton
            onClick={fetchSettings}
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Only administrators can modify system settings. Changes take effect immediately.
      </Alert>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search settings by key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Settings Groups */}
      {groupNames.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <SettingsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">No settings found</Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {groupNames.map((groupName) => (
            <Grid item xs={12} md={6} key={groupName}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon fontSize="small" color="primary" />
                    {groupLabels[groupName] || groupName.charAt(0).toUpperCase() + groupName.slice(1) + ' Settings'}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Key</strong></TableCell>
                        <TableCell><strong>Value</strong></TableCell>
                        <TableCell align="center"><strong>Edit</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {groups[groupName].map(({ key, value, description }) => (
                        <TableRow key={key} hover>
                          <TableCell>
                            <Tooltip title={description || key} placement="top-start">
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', cursor: 'help' }}>
                                {key}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={value || '—'}
                              size="small"
                              variant="outlined"
                              color={
                                groupName === 'tariff' || groupName === 'fixed' || groupName === 'tax'
                                  ? 'primary'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="primary" onClick={() => handleEdit(key, value, description)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon />
          Edit Setting
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ p: 2, mb: 2, bgcolor: 'grey.50', borderRadius: 1, fontFamily: 'monospace' }}>
            <Typography variant="caption" color="text.secondary">Setting Key</Typography>
            <Typography variant="body1" fontWeight={600}>{selectedKey}</Typography>
            {selectedDesc && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {selectedDesc}
              </Typography>
            )}
          </Box>
          <TextField
            fullWidth
            label="Value *"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            multiline={editValue?.length > 40}
            rows={editValue?.length > 40 ? 3 : 1}
            helperText="Enter the new value for this setting"
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
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemSettings;
