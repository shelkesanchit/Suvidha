import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress,
  IconButton, Tooltip, Chip, Table, TableHead, TableRow,
  TableCell, TableBody, Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AppIcon,
  Report as ComplaintIcon,
  ElectricBolt as BoltIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  Warning as WarnIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const DEPT_COLOR = '#1976d2';

const STATUS_COLOR = {
  submitted: 'info', document_verification: 'warning', site_inspection: 'warning',
  approval_pending: 'warning', approved: 'success', work_in_progress: 'info',
  rejected: 'error', completed: 'success', open: 'error', assigned: 'warning',
  in_progress: 'info', resolved: 'success', closed: 'default',
};

const PRIORITY_COLOR = {
  low: 'success', medium: 'warning', high: 'error', critical: 'error',
};

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchAll = async (showToast = false) => {
    try {
      setRefreshing(true);
      const [statsRes, appsRes, complaintsRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/applications?status=submitted'),
        api.get('/admin/complaints?status=open'),
      ]);
      setStats(statsRes.data.data || statsRes.data);
      const apps = Array.isArray(appsRes.data) ? appsRes.data : (appsRes.data.data || []);
      const complaints = Array.isArray(complaintsRes.data) ? complaintsRes.data : (complaintsRes.data.data || []);
      setRecentApps(apps.slice(0, 8));
      setRecentComplaints(complaints.slice(0, 8));
      if (showToast) toast.success('Dashboard refreshed');
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const id = setInterval(() => fetchAll(), 60000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 2 }}>
        <CircularProgress size={48} sx={{ color: DEPT_COLOR }} />
        <Typography color="text.secondary">Loading dashboard...</Typography>
      </Box>
    );
  }

  const s = stats || {};
  const monthRevenue = Number(s.month_revenue || 0);
  const todayRevenue = Number(s.today_revenue || 0);

  const quickActions = [
    { label: 'Pending Applications', count: s.pending_applications || 0, color: '#f57c00', bg: '#fff3e0', path: '/electricity/applications', icon: PendingIcon },
    { label: 'Open Complaints',       count: s.open_complaints || 0,      color: '#d32f2f', bg: '#ffebee', path: '/electricity/complaints',   icon: WarnIcon },
    { label: 'Submit Meter Readings', count: null,                         color: '#1976d2', bg: '#e3f2fd', path: '/electricity/meter-readings', icon: BoltIcon },
    { label: 'View All Consumers',    count: s.total_customers || 0,      color: '#2e7d32', bg: '#e8f5e9', path: '/electricity/consumers',    icon: PeopleIcon },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 1.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#1a1a1a' }}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
            Electricity Department — auto-refreshes every 60 seconds
          </Typography>
        </Box>
        <Tooltip title="Refresh now">
          <span>
            <IconButton
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              sx={{ bgcolor: DEPT_COLOR, color: '#fff', '&:hover': { bgcolor: '#1565c0' }, '&:disabled': { bgcolor: '#bbdefb', color: 'white' } }}
            >
              <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Recent Work */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Pending Applications */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderTop: `3px solid ${DEPT_COLOR}` }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Pending Applications</Typography>
                  <Typography variant="caption" color="text.secondary">Awaiting review</Typography>
                </Box>
                <Button size="small" endIcon={<OpenIcon sx={{ fontSize: 13 }} />} onClick={() => navigate('/electricity/applications')} sx={{ fontSize: '0.75rem', color: DEPT_COLOR }}>
                  View All
                </Button>
              </Box>
              {recentApps.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <CheckIcon sx={{ fontSize: 36, color: '#c8e6c9', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No pending applications</Typography>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>App No.</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>Applicant</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', display: { xs: 'none', sm: 'table-cell' } }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', display: { xs: 'none', md: 'table-cell' } }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }} align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentApps.map((app) => (
                        <TableRow key={app.id} hover sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }} onClick={() => navigate('/electricity/applications')}>
                          <TableCell>
                            <Typography variant="caption" fontWeight={600} color="primary" sx={{ fontFamily: 'monospace' }}>
                              {app.application_number?.slice(-8) || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" fontWeight={500}>{app.full_name}</Typography>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                              {app.application_type?.replace(/_/g, ' ')}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(app.created_at).toLocaleDateString('en-IN')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={app.status?.replace(/_/g, ' ')} color={STATUS_COLOR[app.status] || 'default'} size="small" sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Open Complaints */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderTop: '3px solid #d32f2f' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Open Complaints</Typography>
                  <Typography variant="caption" color="text.secondary">Needs attention</Typography>
                </Box>
                <Button size="small" endIcon={<OpenIcon sx={{ fontSize: 13 }} />} onClick={() => navigate('/electricity/complaints')} sx={{ fontSize: '0.75rem', color: '#d32f2f' }}>
                  View All
                </Button>
              </Box>
              {recentComplaints.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <CheckIcon sx={{ fontSize: 36, color: '#c8e6c9', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No open complaints</Typography>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>Complaint No.</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>Consumer</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', display: { xs: 'none', sm: 'table-cell' } }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>Priority</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', display: { xs: 'none', md: 'table-cell' } }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentComplaints.map((c) => (
                        <TableRow key={c.id} hover sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }} onClick={() => navigate('/electricity/complaints')}>
                          <TableCell>
                            <Typography variant="caption" fontWeight={600} color="error" sx={{ fontFamily: 'monospace' }}>
                              {c.complaint_number?.slice(-8) || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" fontWeight={500}>{c.full_name}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block">{c.consumer_number}</Typography>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                              {c.complaint_type?.replace(/_/g, ' ')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={c.priority || '—'} color={PRIORITY_COLOR[c.priority] || 'default'} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(c.created_at).toLocaleDateString('en-IN')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue Summary + Quick Actions */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderTop: '3px solid #7b1fa2' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Revenue Summary</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Today's Collections</Typography>
                  <Typography variant="h5" fontWeight={700} color="#7b1fa2">₹{todayRevenue.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>This Month's Collections</Typography>
                  <Typography variant="h5" fontWeight={700} color="#2e7d32">₹{monthRevenue.toLocaleString()}</Typography>
                </Box>
                <Button variant="outlined" size="small" fullWidth onClick={() => navigate('/electricity/reports')} endIcon={<ArrowIcon />} sx={{ mt: 0.5, borderColor: DEPT_COLOR, color: DEPT_COLOR, '&:hover': { borderColor: '#1565c0', color: '#1565c0' } }}>
                  View Full Reports
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={8}>
          <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Quick Actions</Typography>
              <Grid container spacing={1.5}>
                {quickActions.map((qa) => (
                  <Grid item xs={12} sm={6} key={qa.label}>
                    <Box
                      onClick={() => navigate(qa.path)}
                      sx={{
                        p: 2, borderRadius: 2, bgcolor: qa.bg, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        border: `1px solid ${qa.color}22`,
                        transition: 'all 0.15s',
                        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' },
                      }}
                    >
                      <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: `${qa.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <qa.icon sx={{ color: qa.color, fontSize: 20 }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} color={qa.color} noWrap>{qa.label}</Typography>
                        {qa.count !== null && (
                          <Typography variant="caption" color="text.secondary">{qa.count} records</Typography>
                        )}
                      </Box>
                      <ArrowIcon sx={{ color: qa.color, fontSize: 16, flexShrink: 0 }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
