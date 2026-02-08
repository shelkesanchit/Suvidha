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
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SystemSettings = () => {
  const [settings, setSettings] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (error) {
      toast.error('Failed to load settings');
    }
  };

  const handleEdit = (setting) => {
    setSelectedSetting(setting);
    setEditValue(setting.value);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await api.put(`/settings/${selectedSetting.setting_key}`, {
        value: editValue,
      });
      toast.success('Setting updated successfully');
      setEditDialogOpen(false);
      fetchSettings();
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        System Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure system-wide settings and parameters
      </Typography>

      <Grid container spacing={3}>
        {/* Tariff Rates */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Electricity Tariff Rates (₹/unit)
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Rate (₹/kWh)</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settings
                    .filter((s) => s.setting_key.includes('tariff_rate'))
                    .map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell>
                          {setting.setting_key
                            .replace('tariff_rate_', '')
                            .toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <strong>₹{setting.value}</strong>
                        </TableCell>
                        <TableCell>
                          {new Date(setting.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(setting)}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Other Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Settings
              </Typography>
              <Table size="small">
                <TableBody>
                  {settings
                    .filter(
                      (s) =>
                        s.setting_key.includes('application') ||
                        s.setting_key.includes('bill')
                    )
                    .map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell>{setting.setting_key}</TableCell>
                        <TableCell>{setting.value}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(setting)}
                          >
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

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Table size="small">
                <TableBody>
                  {settings
                    .filter((s) => s.setting_key.includes('contact'))
                    .map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell>{setting.setting_key}</TableCell>
                        <TableCell>{setting.value}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(setting)}
                          >
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
      </Grid>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Setting</DialogTitle>
        <DialogContent>
          {selectedSetting && (
            <>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedSetting.setting_key}
              </Typography>
              <TextField
                fullWidth
                label="Value"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                margin="normal"
                type={
                  selectedSetting.setting_key.includes('rate')
                    ? 'number'
                    : 'text'
                }
                inputProps={
                  selectedSetting.setting_key.includes('rate')
                    ? { step: '0.01', min: '0' }
                    : {}
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemSettings;
