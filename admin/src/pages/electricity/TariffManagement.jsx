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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import api from '../../utils/electricity/api';
import toast from 'react-hot-toast';

const TariffManagement = () => {
  const [tariffs, setTariffs] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    slab_from: '',
    slab_to: '',
    rate: '',
    fixed_charge: '',
  });

  useEffect(() => {
    fetchTariffs();
  }, []);

  const fetchTariffs = async () => {
    try {
      const response = await api.get('/settings/tariffs/all');
      setTariffs(response.data);
    } catch (error) {
      toast.error('Failed to load tariff rates');
    }
  };

  const handleOpenDialog = (tariff = null) => {
    if (tariff) {
      setEditMode(true);
      setFormData(tariff);
    } else {
      setEditMode(false);
      setFormData({
        category: '',
        slab_from: '',
        slab_to: '',
        rate: '',
        fixed_charge: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await api.put(`/settings/tariff/${formData.id}`, formData);
        toast.success('Tariff updated successfully');
      } else {
        await api.post('/settings/tariff', formData);
        toast.success('Tariff added successfully');
      }
      setDialogOpen(false);
      fetchTariffs();
    } catch (error) {
      toast.error('Failed to save tariff');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      residential: '#1976d2',
      commercial: '#f57c00',
      industrial: '#388e3c',
      agricultural: '#7b1fa2',
    };
    return colors[category] || '#757575';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Tariff Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage electricity tariff rates and slabs
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Tariff
        </Button>
      </Box>

      <Grid container spacing={3}>
        {['residential', 'commercial', 'industrial', 'agricultural'].map(
          (category) => (
            <Grid item xs={12} key={category}>
              <Card>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: getCategoryColor(category) }}
                  >
                    {category.toUpperCase()} TARIFF
                  </Typography>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Slab (Units)</TableCell>
                        <TableCell>Rate (₹/kWh)</TableCell>
                        <TableCell>Fixed Charge (₹/month)</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tariffs
                        .filter((t) => t.category === category)
                        .map((tariff) => (
                          <TableRow key={tariff.id}>
                            <TableCell>
                              {tariff.slab_from} - {tariff.slab_to} units
                            </TableCell>
                            <TableCell>
                              <strong>₹{tariff.rate}</strong>
                            </TableCell>
                            <TableCell>₹{tariff.fixed_charge}</TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleOpenDialog(tariff)}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      {tariffs.filter((t) => t.category === category).length ===
                        0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No tariff slabs defined
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          )
        )}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Edit Tariff Slab' : 'Add New Tariff Slab'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="">Select Category</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
            <option value="agricultural">Agricultural</option>
          </TextField>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Slab From (Units)"
                type="number"
                value={formData.slab_from}
                onChange={(e) =>
                  setFormData({ ...formData, slab_from: e.target.value })
                }
                margin="normal"
                inputProps={{ min: '0' }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Slab To (Units)"
                type="number"
                value={formData.slab_to}
                onChange={(e) =>
                  setFormData({ ...formData, slab_to: e.target.value })
                }
                margin="normal"
                inputProps={{ min: '0' }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Rate per kWh"
            type="number"
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
            margin="normal"
            inputProps={{ step: '0.01', min: '0' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">₹</InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Fixed Charge (Monthly)"
            type="number"
            value={formData.fixed_charge}
            onChange={(e) =>
              setFormData({ ...formData, fixed_charge: e.target.value })
            }
            margin="normal"
            inputProps={{ step: '1', min: '0' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">₹</InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TariffManagement;
