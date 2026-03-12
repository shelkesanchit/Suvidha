import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
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
  CircularProgress,
  Divider,
  InputAdornment,
  TableContainer,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  ElectricMeter as MeterIcon,
  History as HistoryIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/electricity/api';

const MeterReadingManagement = () => {
  const [filters, setFilters] = useState({ state: '', city: '', pincode: '' });
  const [customerList, setCustomerList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [meterReadings, setMeterReadings] = useState({});
  const [readingDates, setReadingDates] = useState({});
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCustomer, setDialogCustomer] = useState(null);
  const [dialogReading, setDialogReading] = useState('');
  const [dialogDate, setDialogDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.state) params.append('state', filters.state);
      if (filters.city) params.append('city', filters.city);
      if (filters.pincode) params.append('pincode', filters.pincode);
      const response = await api.get(`/admin/meter-readings/customers?${params.toString()}`);
      setCustomerList(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load customers');
      setCustomerList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadCustomers();
  };

  const handleClearFilters = () => {
    setFilters({ state: '', city: '', pincode: '' });
    setTimeout(() => loadCustomers(), 100);
  };

  const handleOpenDialog = (customer) => {
    setDialogCustomer(customer);
    setDialogReading(meterReadings[customer.id] || '');
    setDialogDate(readingDates[customer.id] || new Date().toISOString().split('T')[0]);
    setDialogOpen(true);
  };

  const handleSubmitSingle = async () => {
    const current = parseFloat(dialogReading);
    if (!dialogReading || isNaN(current)) {
      toast.error('Please enter a valid meter reading');
      return;
    }
    if (current <= dialogCustomer.previousReading) {
      toast.error('Current reading must be greater than previous reading (' + dialogCustomer.previousReading + ')');
      return;
    }
    try {
      setSubmitting(true);
      const response = await api.post('/admin/meter-readings/submit', {
        customerId: dialogCustomer.id,
        currentReading: current,
        previousReading: dialogCustomer.previousReading,
        readingDate: dialogDate,
      });
      toast.success(`Reading submitted! Bill: Rs. ${response.data.data?.calculatedBill?.toLocaleString('en-IN') || 'N/A'}`);
      setCustomerList((prev) =>
        prev.map((c) =>
          c.id === dialogCustomer.id
            ? { ...c, previousReading: current, lastReadingDate: dialogDate }
            : c
        )
      );
      const newReadings = { ...meterReadings };
      delete newReadings[dialogCustomer.id];
      setMeterReadings(newReadings);
      setDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit reading');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async () => {
    const today = new Date().toISOString().split('T')[0];
    const readingsToSubmit = selectedCustomers
      .map((customerId) => {
        const customer = customerList.find((c) => c.id === customerId);
        const current = parseFloat(meterReadings[customerId] || 0);
        return {
          customerId,
          currentReading: current,
          previousReading: customer?.previousReading || 0,
          readingDate: readingDates[customerId] || today,
        };
      })
      .filter((r) => r.currentReading > r.previousReading);

    if (readingsToSubmit.length === 0) {
      toast.error('No valid readings to submit. Check that current > previous for all selected.');
      return;
    }
    if (readingsToSubmit.length < selectedCustomers.length) {
      toast.error(`${selectedCustomers.length - readingsToSubmit.length} readings skipped (invalid)`);
    }

    try {
      setSubmitting(true);
      const response = await api.post('/admin/meter-readings/bulk', { readings: readingsToSubmit });
      const { successCount, errorCount } = response.data.data || {};
      toast.success(`${successCount || readingsToSubmit.length} readings submitted${errorCount ? `, ${errorCount} errors` : ''}`);
      loadCustomers();
      setSelectedCustomers([]);
      setMeterReadings({});
      setReadingDates({});
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit bulk readings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewHistory = async (customer) => {
    setHistoryCustomer(customer);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    try {
      const response = await api.get(`/admin/meter-readings/history/${customer.id}`);
      setHistoryData(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load reading history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const pageIds = paginatedCustomers.map((c) => c.id);
      setSelectedCustomers((prev) => [...new Set([...prev, ...pageIds])]);
    } else {
      const pageIds = new Set(paginatedCustomers.map((c) => c.id));
      setSelectedCustomers((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const rows = [
      ['Consumer Number', 'Name', 'Mobile', 'City', 'State', 'Pincode', 'Meter Number', 'Category', 'Previous Reading', 'Last Reading Date'],
      ...customerList.map((c) => [
        c.consumer_number,
        c.name,
        c.mobile,
        c.city,
        c.state,
        c.pincode,
        c.meter_number,
        c.connectionType,
        c.previousReading,
        c.lastReadingDate || '',
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `meter_readings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV downloaded');
  };

  const paginatedCustomers = customerList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const pageAllSelected =
    paginatedCustomers.length > 0 && paginatedCustomers.every((c) => selectedCustomers.includes(c.id));
  const pageSomeSelected = paginatedCustomers.some((c) => selectedCustomers.includes(c.id)) && !pageAllSelected;

  const readingValid = (customerId) => {
    const current = parseFloat(meterReadings[customerId] || 0);
    const customer = customerList.find((c) => c.id === customerId);
    return current > (customer?.previousReading || 0);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Meter Reading Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submit and manage electricity meter readings for active consumers
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadCustomers} disabled={loading}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Filter Customers</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                fullWidth size="small" label="State"
                value={filters.state}
                onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                placeholder="e.g. Maharashtra"
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                fullWidth size="small" label="City"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                placeholder="e.g. Mumbai"
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                fullWidth size="small" label="Pincode"
                value={filters.pincode}
                onChange={(e) => setFilters({ ...filters, pincode: e.target.value })}
                placeholder="e.g. 400001"
                inputProps={{ maxLength: 6 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1.5}>
              <Button fullWidth variant="contained" onClick={handleApplyFilters}>Apply</Button>
            </Grid>
            <Grid item xs={12} sm={6} md={1.5}>
              <Button fullWidth variant="outlined" onClick={handleClearFilters}>Clear</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h5" fontWeight={700} color="primary">{customerList.length}</Typography>
              <Typography variant="caption">Total Consumers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h5" fontWeight={700} color="success.main">{selectedCustomers.length}</Typography>
              <Typography variant="caption">Selected</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h5" fontWeight={700} color="warning.main">
                {selectedCustomers.filter((id) => meterReadings[id]).length}
              </Typography>
              <Typography variant="caption">Readings Entered</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h5" fontWeight={700} color="error.main">
                {selectedCustomers.filter((id) => meterReadings[id] && !readingValid(id)).length}
              </Typography>
              <Typography variant="caption">Invalid Readings</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bulk Action Bar */}
      {selectedCustomers.length > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              variant="outlined"
              size="small"
              onClick={handleBulkSubmit}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={14} /> : <SaveIcon />}
            >
              {submitting ? 'Submitting...' : `Submit ${selectedCustomers.length} Readings`}
            </Button>
          }
        >
          {selectedCustomers.length} customers selected.
          Enter readings in the table below, then click Submit.
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Customer Table */}
      <Card>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={pageAllSelected}
                    indeterminate={pageSomeSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell><strong>Consumer</strong></TableCell>
                <TableCell><strong>Meter No.</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Location</strong></TableCell>
                <TableCell><strong>Prev. Reading</strong></TableCell>
                <TableCell><strong>Last Read Date</strong></TableCell>
                <TableCell><strong>New Reading</strong></TableCell>
                <TableCell><strong>Reading Date</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <MeterIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">
                      {loading ? 'Loading...' : 'No active consumers found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => {
                  const current = parseFloat(meterReadings[customer.id] || 0);
                  const isValid = meterReadings[customer.id] && current > customer.previousReading;
                  const isInvalid = meterReadings[customer.id] && current <= customer.previousReading;
                  return (
                    <TableRow
                      key={customer.id}
                      selected={selectedCustomers.includes(customer.id)}
                      sx={{ bgcolor: isInvalid ? 'error.50' : isValid ? 'success.50' : undefined }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => toggleSelect(customer.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{customer.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{customer.consumer_number}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{customer.meter_number || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={customer.connectionType || 'Residential'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{customer.city || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{customer.state}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{customer.previousReading} kWh</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {customer.lastReadingDate || <span style={{ color: '#999' }}>Never</span>}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 130 }}>
                        <TextField
                          size="small"
                          type="number"
                          placeholder="Reading"
                          value={meterReadings[customer.id] || ''}
                          onChange={(e) =>
                            setMeterReadings({ ...meterReadings, [customer.id]: e.target.value })
                          }
                          error={isInvalid}
                          sx={{ width: 120 }}
                          InputProps={{
                            endAdornment: isValid ? (
                              <InputAdornment position="end"><CheckIcon color="success" fontSize="small" /></InputAdornment>
                            ) : isInvalid ? (
                              <InputAdornment position="end"><WarningIcon color="error" fontSize="small" /></InputAdornment>
                            ) : null,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        <TextField
                          size="small"
                          type="date"
                          value={readingDates[customer.id] || new Date().toISOString().split('T')[0]}
                          onChange={(e) =>
                            setReadingDates({ ...readingDates, [customer.id]: e.target.value })
                          }
                          sx={{ width: 140 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Enter Reading & Submit">
                            <IconButton size="small" color="primary" onClick={() => handleOpenDialog(customer)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Reading History">
                            <IconButton size="small" color="default" onClick={() => handleViewHistory(customer)}>
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={customerList.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>

      {/* Single Reading Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MeterIcon />
            <Typography variant="h6">Submit Meter Reading</Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {dialogCustomer && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Consumer</Typography>
                <Typography variant="body1" fontWeight={600}>{dialogCustomer.name}</Typography>
                <Typography variant="body2" color="text.secondary">{dialogCustomer.consumer_number}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Meter Number</Typography>
                <Typography variant="body1" fontWeight={600}>{dialogCustomer.meter_number || '—'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Previous Reading</Typography>
                <Typography variant="h6" fontWeight={700} color="text.secondary">
                  {dialogCustomer.previousReading} kWh
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last Read: {dialogCustomer.lastReadingDate || 'Never'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Current Reading (kWh) *"
                  type="number"
                  value={dialogReading}
                  onChange={(e) => setDialogReading(e.target.value)}
                  error={parseFloat(dialogReading || 0) <= dialogCustomer.previousReading && dialogReading !== ''}
                  helperText={
                    parseFloat(dialogReading || 0) <= dialogCustomer.previousReading && dialogReading !== ''
                      ? `Must be > ${dialogCustomer.previousReading}`
                      : `Consumption: ${Math.max(0, parseFloat(dialogReading || 0) - dialogCustomer.previousReading).toFixed(2)} kWh`
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reading Date *"
                  type="date"
                  value={dialogDate}
                  onChange={(e) => setDialogDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitSingle}
            disabled={
              submitting ||
              !dialogReading ||
              parseFloat(dialogReading || 0) <= (dialogCustomer?.previousReading || 0)
            }
            startIcon={submitting ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {submitting ? 'Submitting...' : 'Submit & Generate Bill'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            <Typography variant="h6">
              Reading History — {historyCustomer?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : historyData.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No reading history found
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Reading (kWh)</strong></TableCell>
                  <TableCell><strong>Bill Amount</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyData.map((h, idx) => (
                  <TableRow key={h.id || idx}>
                    <TableCell>{h.date}</TableCell>
                    <TableCell>{h.reading} kWh</TableCell>
                    <TableCell>
                      {h.bill > 0 ? `Rs. ${h.bill.toLocaleString('en-IN')}` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeterReadingManagement;
