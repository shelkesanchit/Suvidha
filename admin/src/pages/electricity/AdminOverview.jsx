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
  AttachMoney as RevenueIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  Warning as WarnIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  submitted:             'info',
  document_verification: 'warning',
  site_inspection:       'warning',
  approval_pending:      'warning',
  approved:              'success',
  work_in_progress:      'info',
  rejected:              'error',
  completed:             'success',
  open:                  'error',
  assigned:              'warning',
  in_progress:           'info',
  resolved:              'success',
  closed:                'default',
};

const PRIORITY_COLOR = {
  low: 'success', medium: 'warning', high: 'error', critical: 'error',
};

const StatCard = ({ title, value, icon: Icon, color, bgColor, subtitle, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.2s, transform 0.2s',
      '&:hover': onClick ? { boxShadow: 4, transform: 'translateY(-2px)' } : {},
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon sx={{ color, fontSize: 24 }} />
        </Box>
        {subtitle && (
          <Chip label={subtitle} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: bgColor, color }} />
        )}
      </Box>
      <Typography variant="h4" fontWeight={700} sx={{ color, mb: 0.5 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
    </CardContent>
  </Card>
);

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
        <CircularProgress size={48} />
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0d1b2a" sx={{ mb: 0.5 }}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Live electricity department overview — auto-refreshes every 60 seconds
          </Typography>
        </Box>
        <Tooltip title="Refresh now">
          <IconButton
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            sx={{ bgcolor: '#1976d2', color: '#fff', '&:hover': { bgcolor: '#1565c0' }, '&:disabled': { bgcolor: '#bbdefb' } }}
          >
            <RefreshIcon
              sx={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Total Consumers"        value={(s.total_customers || 0).toLocaleString()}        icon={PeopleIcon}    color="#1976d2" bgColor="#e3f2fd" onClick={() => navigate('/electricity/consumers')} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Active Connections"      value={(s.active_connections || 0).toLocaleString()}     icon={BoltIcon}      color="#2e7d32" bgColor="#e8f5e9" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Pending Applications"    value={(s.pending_applications || 0).toLocaleString()}   icon={AppIcon}       color="#f57c00" bgColor="#fff3e0" subtitle="Action needed" onClick={() => navigate('/electricity/applications')} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Approved Applications"   value={(s.approved_applications || 0).toLocaleString()}  icon={CheckIcon}     color="#2e7d32" bgColor="#e8f5e9" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Open Complaints"         value={(s.open_complaints || 0).toLocaleString()}        icon={ComplaintIcon} color="#d32f2f" bgColor="#ffebee" subtitle="Action needed" onClick={() => navigate('/electricity/complaints')} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Monthly Revenue"         value={`₹${monthRevenue.toLocaleString()}`}             icon={RevenueIcon}   color="#7b1fa2" bgColor="#f3e5f5" />
        </Grid>
      </Grid>

      {/* Recent Work */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Pending Applications */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ pb: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="h6" fontWeight={600}>Pending Applications</Typography>
                <Button
                  size="small" endIcon={<OpenIcon sx={{ fontSize: 14 }} />}
                  onClick={() => navigate('/electricity/applications')}
                  sx={{ fontSize: '0.75rem' }}
                >
                  View All
                </Button>
              </Box>
              {recentApps.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <CheckIcon sx={{ fontSize: 40, color: '#c8e6c9', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No pending applications</Typography>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>App No.</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Applicant</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentApps.map((app) => (
                        <TableRow
                          key={app.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate('/electricity/applications')}
                        >
                          <TableCell>
                            <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ fontFamily: 'monospace' }}>
                              {app.application_number?.slice(-8) || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" fontWeight={500}>{app.full_name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                              {app.application_type?.replace(/_/g, ' ')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(app.created_at).toLocaleDateString('en-IN')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={app.status?.replace(/_/g, ' ')}
                              color={STATUS_COLOR[app.status] || 'default'}
                              size="small"
                              sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }}
                            />
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
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ pb: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="h6" fontWeight={600}>Open Complaints</Typography>
                <Button
                  size="small" endIcon={<OpenIcon sx={{ fontSize: 14 }} />}
                  onClick={() => navigate('/electricity/complaints')}
                  sx={{ fontSize: '0.75rem' }}
                >
                  View All
                </Button>
              </Box>
              {recentComplaints.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <CheckIcon sx={{ fontSize: 40, color: '#c8e6c9', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No open complaints</Typography>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Complaint No.</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Consumer</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Priority</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentComplaints.map((c) => (
                        <TableRow
                          key={c.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate('/electricity/complaints')}
                        >
                          <TableCell>
                            <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ fontFamily: 'monospace' }}>
                              {c.complaint_number?.slice(-8) || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" fontWeight={500}>{c.full_name}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {c.consumer_number}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                              {c.complaint_type?.replace(/_/g, ' ')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={c.priority || '—'}
                              color={PRIORITY_COLOR[c.priority] || 'default'}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                          </TableCell>
                          <TableCell>
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
        {/* Revenue */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Revenue Summary</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Today's Collections</Typography>
                  <Typography variant="h5" fontWeight={700} color="#7b1fa2">
                    ₹{todayRevenue.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">This Month's Collections</Typography>
                  <Typography variant="h5" fontWeight={700} color="#2e7d32">
                    ₹{monthRevenue.toLocaleString()}
                  </Typography>
                </Box>
                <Button
                  variant="outlined" size="small" fullWidth
                  onClick={() => navigate('/electricity/reports')}
                  endIcon={<ArrowIcon />}
                >
                  View Full Reports
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Quick Actions</Typography>
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
                        '&:hover': { boxShadow: 2, transform: 'translateY(-1px)' },
                      }}
                    >
                      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${qa.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <qa.icon sx={{ color: qa.color, fontSize: 20 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} color={qa.color}>{qa.label}</Typography>
                        {qa.count !== null && (
                          <Typography variant="caption" color="text.secondary">{qa.count} records</Typography>
                        )}
                      </Box>
                      <ArrowIcon sx={{ color: qa.color, fontSize: 16 }} />
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
