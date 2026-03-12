import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, TextField, MenuItem,
  Select, FormControl, InputLabel, InputAdornment, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid,
  Skeleton, Alert
} from '@mui/material';
import {
  Search as SearchIcon, Refresh as RefreshIcon, Visibility as ViewIcon,
  Person as PersonIcon, LocationOn as LocationIcon, ElectricBolt as MeterIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/electricity/api';

const STATUS_COLORS = {
  active: 'success',
  disconnected: 'error',
  suspended: 'warning',
};

const CATEGORY_LABELS = {
  domestic: 'Domestic',
  commercial: 'Commercial',
  industrial: 'Industrial',
  agricultural: 'Agricultural',
};

function DetailRow({ label, value }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

export default function ConsumerAccounts() {
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchConsumers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get('/admin/consumers', { params });
      const rows = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setConsumers(rows);
      setTotal(res.data.total || rows.length);
    } catch (err) {
      setError('Failed to load consumers.');
      toast.error('Failed to load consumers');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchConsumers();
  }, [fetchConsumers]);

  const filtered = search.trim()
    ? consumers.filter((c) => {
        const q = search.toLowerCase();
        return (
          (c.consumer_number || '').toLowerCase().includes(q) ||
          (c.full_name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          (c.meter_number || '').toLowerCase().includes(q)
        );
      })
    : consumers;

  const handleView = (consumer) => {
    setSelected(consumer);
    setDetailOpen(true);
  };

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  const summaryStats = [
    { label: 'Total', value: total, color: '#1976d2' },
    { label: 'Active', value: consumers.filter(c => c.connection_status === 'active').length, color: '#2e7d32' },
    { label: 'Disconnected', value: consumers.filter(c => c.connection_status === 'disconnected').length, color: '#c62828' },
    { label: 'Suspended', value: consumers.filter(c => c.connection_status === 'suspended').length, color: '#e65100' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Consumer Accounts</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchConsumers} disabled={loading}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryStats.map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Paper sx={{ p: 2, textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>
                {loading ? <Skeleton width={40} sx={{ mx: 'auto' }} /> : s.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, consumer #, email, phone, meter #"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="disconnected">Disconnected</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={categoryFilter} label="Category" onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="domestic">Domestic</MenuItem>
                <MenuItem value="commercial">Commercial</MenuItem>
                <MenuItem value="industrial">Industrial</MenuItem>
                <MenuItem value="agricultural">Agricultural</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                <TableCell>Consumer #</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email / Phone</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Meter #</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : filtered.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No consumers found
                      </TableCell>
                    </TableRow>
                  )
                : filtered.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                          {c.consumer_number || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>{c.full_name || '—'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{c.email || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.phone || ''}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={CATEGORY_LABELS[c.category] || c.category || '—'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {c.meter_number || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{c.city || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.state || ''}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={c.connection_status || 'unknown'}
                          size="small"
                          color={STATUS_COLORS[c.connection_status] || 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleView(c)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          Consumer Details
        </DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonIcon fontSize="small" /> Personal Information
                </Typography>
              </Grid>
              <Grid item xs={6}><DetailRow label="Full Name" value={selected.full_name} /></Grid>
              <Grid item xs={6}><DetailRow label="Email" value={selected.email} /></Grid>
              <Grid item xs={6}><DetailRow label="Phone" value={selected.phone} /></Grid>
              <Grid item xs={6}><DetailRow label="Consumer Number" value={selected.consumer_number} /></Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MeterIcon fontSize="small" /> Connection Details
                </Typography>
              </Grid>
              <Grid item xs={6}><DetailRow label="Meter Number" value={selected.meter_number} /></Grid>
              <Grid item xs={6}><DetailRow label="Category" value={CATEGORY_LABELS[selected.category] || selected.category} /></Grid>
              <Grid item xs={6}><DetailRow label="Tariff Type" value={selected.tariff_type} /></Grid>
              <Grid item xs={6}><DetailRow label="Sanctioned Load" value={selected.sanctioned_load ? `${selected.sanctioned_load} kW` : null} /></Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">Status</Typography>
                <Chip
                  label={selected.connection_status || 'unknown'}
                  size="small"
                  color={STATUS_COLORS[selected.connection_status] || 'default'}
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid item xs={6}><DetailRow label="Member Since" value={selected.created_at ? new Date(selected.created_at).toLocaleDateString() : null} /></Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon fontSize="small" /> Address
                </Typography>
              </Grid>
              <Grid item xs={12}><DetailRow label="Address Line 1" value={selected.address_line1} /></Grid>
              {selected.address_line2 && (
                <Grid item xs={12}><DetailRow label="Address Line 2" value={selected.address_line2} /></Grid>
              )}
              <Grid item xs={4}><DetailRow label="City" value={selected.city} /></Grid>
              <Grid item xs={4}><DetailRow label="State" value={selected.state} /></Grid>
              <Grid item xs={4}><DetailRow label="Pincode" value={selected.pincode} /></Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
