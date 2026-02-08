import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  TablePagination,
  Checkbox,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  FileDownload as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import api from '../utils/api';

const MeterReadingManagement = () => {
  // State management
  const [filters, setFilters] = useState({
    state: '',
    city: '',
    area: '',
    pincode: '',
  });

  const [customerList, setCustomerList] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [meterReadings, setMeterReadings] = useState({});
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogCustomer, setDialogCustomer] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Available options for filters
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    cities: [],
    areas: [],
    pincodes: [],
  });

  // Sample Indian States and Data
  const indianStates = [
    'Maharashtra',
    'Gujarat',
    'Madhya Pradesh',
    'Karnataka',
    'Tamil Nadu',
    'Uttar Pradesh',
    'Rajasthan',
    'West Bengal',
  ];

  const citiesByState = {
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Aurangabad', 'Nashik'],
    Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Gwalior'],
    Karnataka: ['Bangalore', 'Pune', 'Mysore', 'Davangere'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi'],
    Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur'],
    'West Bengal': ['Kolkata', 'Howrah', 'Darjeeling'],
  };

  const areasByCity = {
    Mumbai: ['Andheri', 'Bandra', 'Dadar', 'Fort', 'Goregaon', 'Thane'],
    Pune: ['Aundh', 'Baner', 'Koregaon Park', 'Hadapsar', 'Camp'],
    Nagpur: ['Ratnagiri', 'Dhantoli', 'Sadar', 'Itwari'],
    Bangalore: ['Whitefield', 'Koramangala', 'Indiranagar', 'Marathahalli'],
    Ahmedabad: ['Navrangpura', 'Maninagar', 'Paldi', 'Satellite'],
  };

  const pincodesByArea = {
    Andheri: ['400058', '400059', '400060'],
    Bandra: ['400051', '400052', '400053'],
    Dadar: ['400014', '400015', '400016'],
    Aundh: ['411007', '411008'],
    'Koregaon Park': ['411001', '411002'],
    Whitefield: ['560066', '560067', '560068'],
    Koramangala: ['560034', '560035', '560036'],
  };

  // Load initial customer data
  useEffect(() => {
    loadCustomers();
    loadFilterOptions();
  }, []);

  // Load customers from API
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/customers');
      setCustomerList(response.data.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
      setCustomerList([]);
    } finally {
      setLoading(false);
    }
  };

  // Load filter options
  const loadFilterOptions = () => {
    setFilterOptions({
      states: indianStates,
      cities: filters.state ? citiesByState[filters.state] || [] : [],
      areas: filters.city ? areasByCity[filters.city] || [] : [],
      pincodes: filters.area ? pincodesByArea[filters.area] || [] : [],
    });
  };

  // Update filter and refresh options
  const handleFilterChange = (field) => (event) => {
    const newFilters = { ...filters, [field]: event.target.value };

    // Reset dependent fields
    if (field === 'state') {
      newFilters.city = '';
      newFilters.area = '';
      newFilters.pincode = '';
    } else if (field === 'city') {
      newFilters.area = '';
      newFilters.pincode = '';
    } else if (field === 'area') {
      newFilters.pincode = '';
    }

    setFilters(newFilters);
  };

  // Apply filters
  useEffect(() => {
    let filtered = customerList;

    if (filters.state) {
      filtered = filtered.filter((c) => c.state === filters.state);
    }
    if (filters.city) {
      filtered = filtered.filter((c) => c.city === filters.city);
    }
    if (filters.area) {
      filtered = filtered.filter((c) => c.area === filters.area);
    }
    if (filters.pincode) {
      filtered = filtered.filter((c) => c.pincode === filters.pincode);
    }

    setFilteredCustomers(filtered);
    setPage(0);
    loadFilterOptions();
  }, [filters, customerList]);

  // Handle meter reading input
  const handleMeterReadingChange = (customerId, value) => {
    setMeterReadings({
      ...meterReadings,
      [customerId]: value,
    });
  };

  // Open edit dialog
  const handleOpenDialog = (customer) => {
    setDialogCustomer(customer);
    setEditingId(customer.id);
    setMeterReadings({
      ...meterReadings,
      [customer.id]: meterReadings[customer.id] || '',
    });
    setOpenDialog(true);
  };

  // Close edit dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogCustomer(null);
    setEditingId(null);
  };

  // Submit meter readings
  const handleSubmitReading = async () => {
    if (!meterReadings[editingId]) {
      toast.error('Please enter meter reading');
      return;
    }

    const reading = parseFloat(meterReadings[editingId]);
    const customer = customerList.find((c) => c.id === editingId);

    if (reading <= customer.previousReading) {
      toast.error('Current reading must be greater than previous reading');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        '/admin/meter-readings/submit',
        {
          customerId: editingId,
          currentReading: reading,
          previousReading: customer.previousReading,
          readingDate: new Date().toISOString().split('T')[0],
          meterNumber: customer.meterNumber,
        }
      );

      if (response.data.success) {
        toast.success(
          `✓ Reading submitted! Bill calculated: ₹${response.data.data.calculatedBill}`
        );

        // Update customer list with new reading
        setCustomerList(
          customerList.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  previousReading: reading,
                  lastReadingDate: new Date().toISOString().split('T')[0],
                }
              : c
            )
        );

        // Clear reading and close dialog
        const newReadings = { ...meterReadings };
        delete newReadings[editingId];
        setMeterReadings(newReadings);
        handleCloseDialog();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit reading');
    } finally {
      setLoading(false);
    }
  };

  // Bulk submit readings
  const handleBulkSubmit = async () => {
    const readingsToSubmit = selectedCustomers.map((customerId) => {
      const customer = customerList.find((c) => c.id === customerId);
      return {
        customerId,
        currentReading: parseFloat(meterReadings[customerId] || 0),
        previousReading: customer.previousReading,
        readingDate: new Date().toISOString().split('T')[0],
        meterNumber: customer.meterNumber,
      };
    });

    if (readingsToSubmit.some((r) => !r.currentReading || r.currentReading <= r.previousReading)) {
      toast.error('Check all readings are valid and greater than previous');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        '/admin/meter-readings/bulk-submit',
        { readings: readingsToSubmit }
      );

      if (response.data.success) {
        toast.success(
          `✓ ${selectedCustomers.length} readings submitted successfully!`
        );

        // Update customer list
        const updated = customerList.map((c) => {
          const reading = readingsToSubmit.find((r) => r.customerId === c.id);
          return reading
            ? {
                ...c,
                previousReading: reading.currentReading,
                lastReadingDate: reading.readingDate,
              }
            : c;
        });

        setCustomerList(updated);
        setSelectedCustomers([]);
        setMeterReadings({});
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit readings');
    } finally {
      setLoading(false);
    }
  };

  // Select all in page
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const pageCustomers = filteredCustomers
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((c) => c.id);
      setSelectedCustomers([...new Set([...selectedCustomers, ...pageCustomers])]);
    } else {
      setSelectedCustomers([]);
    }
  };

  // Toggle single select
  const handleSelectCustomer = (customerId) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter((id) => id !== customerId));
    } else {
      setSelectedCustomers([...selectedCustomers, customerId]);
    }
  };

  // Export data to CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Customer ID', 'Name', 'Mobile', 'Area', 'Pincode', 'Previous Reading', 'Last Read Date'],
      ...filteredCustomers.map((c) => [
        c.id,
        c.name,
        c.mobile,
        c.area,
        c.pincode,
        c.previousReading,
        c.lastReadingDate,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
    element.setAttribute('download', `customers_${filters.area || 'all'}.csv`);
    element.click();

    toast.success('✓ CSV downloaded');
  };

  const paginatedCustomers = filteredCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          ⚡ Meter Reading Management
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage and submit meter readings for customers organized by geographic location
        </Typography>
      </Box>

      {/* Filters Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            🗺️ Geographic Filters
          </Typography>
          <Grid container spacing={2}>
            {/* State Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>State</InputLabel>
                <Select
                  value={filters.state}
                  label="State"
                  onChange={handleFilterChange('state')}
                >
                  <MenuItem value="">All States</MenuItem>
                  {filterOptions.states.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* City Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth disabled={!filters.state}>
                <InputLabel>City</InputLabel>
                <Select
                  value={filters.city}
                  label="City"
                  onChange={handleFilterChange('city')}
                >
                  <MenuItem value="">All Cities</MenuItem>
                  {filterOptions.cities.map((city) => (
                    <MenuItem key={city} value={city}>
                      {city}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Area Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth disabled={!filters.city}>
                <InputLabel>Area</InputLabel>
                <Select
                  value={filters.area}
                  label="Area"
                  onChange={handleFilterChange('area')}
                >
                  <MenuItem value="">All Areas</MenuItem>
                  {filterOptions.areas.map((area) => (
                    <MenuItem key={area} value={area}>
                      {area}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Pincode Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth disabled={!filters.area}>
                <InputLabel>Pincode</InputLabel>
                <Select
                  value={filters.pincode}
                  label="Pincode"
                  onChange={handleFilterChange('pincode')}
                >
                  <MenuItem value="">All Pincodes</MenuItem>
                  {filterOptions.pincodes.map((pincode) => (
                    <MenuItem key={pincode} value={pincode}>
                      {pincode}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Customers
              </Typography>
              <Typography variant="h5">{filteredCustomers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Selected for Reading
              </Typography>
              <Typography variant="h5" sx={{ color: '#f57c00' }}>
                {selectedCustomers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Readings Added
              </Typography>
              <Typography variant="h5" sx={{ color: '#4caf50' }}>
                {Object.keys(meterReadings).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Current Filter
              </Typography>
              <Typography variant="body2">
                {filters.area || filters.city || filters.state || 'All'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={selectedCustomers.length === 0 || loading}
          onClick={handleBulkSubmit}
        >
          Submit {selectedCustomers.length} Readings
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
        >
          Export to CSV
        </Button>
      </Box>

      {/* Loading Bar */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Customers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={
                    paginatedCustomers.length > 0 &&
                    paginatedCustomers.every((c) => selectedCustomers.includes(c.id))
                  }
                  indeterminate={
                    paginatedCustomers.some((c) => selectedCustomers.includes(c.id)) &&
                    !paginatedCustomers.every((c) => selectedCustomers.includes(c.id))
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Customer ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Mobile</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Area / Pincode</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Plot No.</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Prev. Reading</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Last Read Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Current Reading</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCustomers.length > 0 ? (
              paginatedCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  sx={{
                    backgroundColor: selectedCustomers.includes(customer.id)
                      ? '#fff3e0'
                      : 'white',
                    '&:hover': { backgroundColor: '#fafafa' },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => handleSelectCustomer(customer.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={customer.id} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.mobile}</TableCell>
                  <TableCell>
                    {customer.area} / <strong>{customer.pincode}</strong>
                  </TableCell>
                  <TableCell>{customer.plotNumber}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{customer.previousReading}</TableCell>
                  <TableCell>{customer.lastReadingDate}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      variant="outlined"
                      value={meterReadings[customer.id] || ''}
                      onChange={(e) => handleMeterReadingChange(customer.id, e.target.value)}
                      placeholder="Enter reading"
                      sx={{ width: 120 }}
                      disabled={loading}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit & Submit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(customer)}
                        disabled={!meterReadings[customer.id] || loading}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">No customers found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {filteredCustomers.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredCustomers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        )}
      </TableContainer>

      {/* Edit Reading Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Submit Meter Reading - {dialogCustomer?.id}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {dialogCustomer && (
            <>
              <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Customer Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {dialogCustomer.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Area / Pincode
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {dialogCustomer.area} / {dialogCustomer.pincode}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Previous Reading
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {dialogCustomer.previousReading} kWh
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Last Read Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {dialogCustomer.lastReadingDate}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <TextField
                autoFocus
                fullWidth
                label="Current Meter Reading (kWh)"
                type="number"
                value={meterReadings[dialogCustomer.id] || ''}
                onChange={(e) => handleMeterReadingChange(dialogCustomer.id, e.target.value)}
                placeholder="Enter current reading"
                helperText={`Must be greater than ${dialogCustomer.previousReading}`}
                variant="outlined"
              />

              {meterReadings[dialogCustomer.id] && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#e8f5e9', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Consumption
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {meterReadings[dialogCustomer.id] - dialogCustomer.previousReading} kWh
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitReading}
            variant="contained"
            color="primary"
            disabled={!meterReadings[editingId] || loading}
          >
            Submit Reading
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MeterReadingManagement;
