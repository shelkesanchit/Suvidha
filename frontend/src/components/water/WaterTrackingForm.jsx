import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Paper,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Alert,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  AccessTime,
  Search,
  ContentCopy,
  ExpandMore,
  ExpandLess,
  Warning,
  Info,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const statusColors = {
  submitted: '#2196f3',
  open: '#ff9800',
  document_verification: '#9c27b0',
  site_inspection: '#00bcd4',
  approval_pending: '#ff9800',
  assigned: '#2196f3',
  in_progress: '#4caf50',
  work_in_progress: '#4caf50',
  approved: '#4caf50',
  completed: '#4caf50',
  resolved: '#4caf50',
  closed: '#607d8b',
  rejected: '#f44336',
};

const statusLabels = {
  submitted: 'Submitted',
  open: 'Open',
  document_verification: 'Document Verification',
  site_inspection: 'Site Inspection',
  approval_pending: 'Pending Approval',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  work_in_progress: 'Work In Progress',
  approved: 'Approved',
  completed: 'Completed',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
};

const categoryLabels = {
  'no-water': 'No Water Supply',
  'low-pressure': 'Low Pressure',
  contaminated: 'Contaminated Water',
  'pipeline-leak': 'Pipeline Leak',
  'meter-stopped': 'Meter Stopped',
  'high-bill': 'High Bill Dispute',
  'illegal-connection': 'Illegal Connection',
  sewerage: 'Sewerage Issue',
  other: 'Other',
  new_connection: 'New Connection',
  reconnection: 'Reconnection',
  disconnection: 'Disconnection',
  transfer: 'Ownership Transfer',
  pipe_size_change: 'Pipe Size Change',
  meter_change: 'Meter Change',
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const WaterTrackingForm = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState(null);
  const [trackingType, setTrackingType] = useState('auto');
  const [showDetails, setShowDetails] = useState(true);
  const [formData, setFormData] = useState({
    reference_number: '',
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.toUpperCase() });
    setError(null);
  };

  const handleTrack = async () => {
    if (!formData.reference_number) {
      toast.error('Please enter Reference Number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const refNumber = formData.reference_number.trim().toUpperCase();
      const isComplaint = trackingType === 'complaint' || (trackingType === 'auto' && refNumber.startsWith('WCP'));
      const isApplication = trackingType === 'application' || (trackingType === 'auto' && refNumber.startsWith('WNC'));

      if (!isComplaint && !isApplication) {
        setError('Invalid reference number format. Use WNC... for applications or WCP... for complaints');
        setLoading(false);
        return;
      }

      let response;
      if (isComplaint) {
        response = await api.get(`/water/complaints/track/${refNumber}`);
      } else {
        response = await api.get(`/water/applications/track/${refNumber}`);
      }

      if (response.data.success) {
        const data = response.data.data;

        let timeline = [];

        if (isComplaint) {
          timeline.push({
            status: 'Registered',
            date: formatDate(data.created_at),
            description: 'Complaint registered successfully',
          });
          if (data.assigned_engineer) {
            timeline.push({
              status: 'Assigned',
              date: 'Pending',
              description: `Assigned to ${data.assigned_engineer}`,
            });
          }
          if (data.status === 'in_progress') {
            timeline.push({
              status: 'In Progress',
              date: 'Current',
              description: 'Work in progress',
            });
          }
          if (data.resolved_at) {
            timeline.push({
              status: 'Resolved',
              date: formatDate(data.resolved_at),
              description: data.resolution_notes || 'Issue resolved',
            });
          }
          if (data.closed_at) {
            timeline.push({
              status: 'Closed',
              date: formatDate(data.closed_at),
              description: 'Complaint closed',
            });
          }
        } else {
          if (data.stage_history && Array.isArray(data.stage_history) && data.stage_history.length > 0) {
            timeline = data.stage_history.map((stage) => ({
              status: stage.stage || stage.status,
              date: formatDate(stage.timestamp),
              description: stage.remarks || stage.description || '',
            }));
          } else {
            timeline.push({
              status: 'Submitted',
              date: formatDate(data.submitted_at),
              description: 'Application submitted successfully',
            });
            if (data.current_stage && data.current_stage !== 'Application Submitted') {
              timeline.push({
                status: data.current_stage,
                date: 'Current',
                description: `Status: ${statusLabels[data.status] || data.status}`,
              });
            }
          }
          if (data.processed_at && !timeline.find((t) => t.status === 'Processed')) {
            timeline.push({
              status: 'Processed',
              date: formatDate(data.processed_at),
              description: 'Application processed',
            });
          }
          if (data.completed_at) {
            timeline.push({
              status: 'Completed',
              date: formatDate(data.completed_at),
              description: 'Application completed',
            });
          }
        }

        const trackingResult = {
          type: isComplaint ? 'Complaint' : 'Application',
          reference_number: refNumber,
          name: data.contact_name || data.full_name,
          mobile: data.mobile,
          email: data.email,
          registered_date: formatDate(data.created_at || data.submitted_at),
          category: categoryLabels[data.complaint_category || data.application_type] || data.complaint_category || data.application_type,
          current_status: statusLabels[data.status] || data.status,
          status_key: data.status,
          ward: data.ward || 'N/A',
          address: data.address,
          landmark: data.landmark,
          assigned_to: data.assigned_engineer || 'Not yet assigned',
          description: data.description,
          urgency: data.urgency,
          pipe_size: data.pipe_size_requested,
          connection_type: data.connection_type_requested,
          property_type: data.property_type,
          total_fee: data.total_fee,
          fee_paid: data.fee_paid,
          rejection_reason: data.rejection_reason,
          resolution_notes: data.resolution_notes,
          timeline,
        };

        setTrackingData(trackingResult);
        toast.success('Status found!');
      } else {
        setError(response.data.message || 'Reference number not found');
      }
    } catch (err) {
      console.error('Track error:', err);
      if (err.response?.status === 404) {
        setError('Reference number not found. Please check and try again.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch status. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColorName = (status) => {
    const colorMap = {
      submitted: 'info',
      open: 'warning',
      document_verification: 'info',
      site_inspection: 'warning',
      approval_pending: 'warning',
      assigned: 'info',
      in_progress: 'warning',
      work_in_progress: 'warning',
      approved: 'success',
      completed: 'success',
      resolved: 'success',
      closed: 'default',
      rejected: 'error',
    };
    return colorMap[status] || 'default';
  };

  const getStatusIcon = (isCompleted, isCurrent) => {
    if (isCompleted) return <CheckCircle color="success" />;
    if (isCurrent) return <AccessTime color="primary" />;
    return <RadioButtonUnchecked color="disabled" />;
  };

  const getProgressPercentage = () => {
    if (!trackingData?.timeline?.length) return 0;
    const expectedStages = trackingData.type === 'Application' ? 6 : 4;
    return Math.min((trackingData.timeline.length / expectedStages) * 100, 100);
  };

  return (
    <Box>
      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
          Track Application / Complaint
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter your reference number to check real-time status and track progress
        </Typography>

        {!trackingData ? (
          <Box>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary">
                Search Criteria
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Select Track Type"
                    value={trackingType}
                    onChange={(e) => {
                      setTrackingType(e.target.value);
                      setTrackingData(null);
                      setError(null);
                    }}
                  >
                    <MenuItem value="auto">Auto Detect</MenuItem>
                    <MenuItem value="application">Application</MenuItem>
                    <MenuItem value="complaint">Complaint</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    required
                    label="Reference Number *"
                    name="reference_number"
                    value={formData.reference_number}
                    onChange={handleChange}
                    placeholder="E.g., WNC2026000001 or WCP2026000001"
                    helperText="Found on your application receipt or SMS"
                    onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                  />
                </Grid>
              </Grid>
            </Paper>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {loading && (
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                  <LinearProgress sx={{ width: '100%', borderRadius: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Fetching your details, please wait...
                  </Typography>
                </Box>
              </Paper>
            )}

            {!loading && !error && (
              <Paper elevation={0} sx={{ p: 4, bgcolor: 'background.default', borderRadius: 2, textAlign: 'center' }}>
                <Search sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Enter your reference number above to track the status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You can track both applications and complaints using their reference numbers
                </Typography>
              </Paper>
            )}
          </Box>
        ) : (
          <Box>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary">
                Status Overview
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Reference Number
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" fontWeight={700} color="primary">
                          {trackingData.reference_number}
                        </Typography>
                        <Tooltip title="Copy to clipboard">
                          <IconButton size="small" onClick={() => copyToClipboard(trackingData.reference_number)}>
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Chip
                      label={(trackingData.current_status || '').toUpperCase()}
                      color={getStatusColorName(trackingData.status_key)}
                      sx={{ fontWeight: 600, fontSize: '0.875rem', px: 2, py: 2.5 }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Type</Typography>
                  <Typography variant="body1" fontWeight={600}>{trackingData.type}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Registered Date</Typography>
                  <Typography variant="body1" fontWeight={600}>{trackingData.registered_date}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Category</Typography>
                  <Typography variant="body1" fontWeight={600}>{trackingData.category}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Ward</Typography>
                  <Typography variant="body1" fontWeight={600}>{trackingData.ward}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mt: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>Overall Progress</Typography>
                      <Typography variant="body2" color="primary" fontWeight={600}>{Math.round(getProgressPercentage())}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={getProgressPercentage()} sx={{ height: 8, borderRadius: 4 }} />
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2, mb: 3 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                onClick={() => setShowDetails(!showDetails)}
                sx={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <Typography variant="subtitle1" fontWeight={600} color="primary">
                  {trackingData.type} Details
                </Typography>
                <IconButton size="small">{showDetails ? <ExpandLess /> : <ExpandMore />}</IconButton>
              </Box>

              <Collapse in={showDetails}>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Name</Typography>
                    <Typography variant="body1" fontWeight={600}>{trackingData.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Mobile</Typography>
                    <Typography variant="body1" fontWeight={600}>{trackingData.mobile}</Typography>
                  </Grid>
                  {trackingData.email && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Email</Typography>
                      <Typography variant="body1" fontWeight={600}>{trackingData.email}</Typography>
                    </Grid>
                  )}
                  {trackingData.address && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Address</Typography>
                      <Typography variant="body1">{trackingData.address}</Typography>
                    </Grid>
                  )}
                  {trackingData.description && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Description</Typography>
                      <Typography variant="body1">{trackingData.description}</Typography>
                    </Grid>
                  )}
                  {trackingData.assigned_to && trackingData.assigned_to !== 'Not yet assigned' && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Assigned To</Typography>
                      <Typography variant="body1" fontWeight={600}>{trackingData.assigned_to}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Collapse>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary">
                Progress Timeline
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Track the journey of your {trackingData.type.toLowerCase()}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {trackingData.timeline.length > 0 ? (
                <Stepper orientation="vertical">
                  {trackingData.timeline.map((step, index) => {
                    const isLast = index === trackingData.timeline.length - 1;
                    const completed = !isLast || ['completed', 'resolved', 'approved', 'closed'].includes(trackingData.status_key);
                    return (
                      <Step key={index} active completed={completed}>
                        <StepLabel icon={getStatusIcon(completed, isLast && !completed)}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>{step.status}</Typography>
                            <Typography variant="caption" color="text.secondary">{step.date}</Typography>
                            {step.description && <Typography variant="body2">{step.description}</Typography>}
                          </Box>
                        </StepLabel>
                      </Step>
                    );
                  })}
                </Stepper>
              ) : (
                <Typography color="text.secondary">No timeline available yet</Typography>
              )}
            </Paper>

            {(trackingData.status_key === 'rejected' || trackingData.rejection_reason) && (
              <Alert severity="error" sx={{ mb: 3 }} icon={<Warning />}>
                {trackingData.rejection_reason || 'Your request was rejected. Please contact the office for more details.'}
              </Alert>
            )}

            {trackingData.resolution_notes && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <strong>Resolution:</strong> {trackingData.resolution_notes}
              </Alert>
            )}

            <Paper elevation={0} sx={{ p: 3, bgcolor: 'info.lighter', borderRadius: 2, border: '1px solid', borderColor: 'info.light', mb: 3 }}>
              <Box display="flex" alignItems="flex-start" gap={2}>
                <Info color="info" />
                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>Need Assistance?</Typography>
                  <Typography variant="body2" color="text.secondary">
                    For any queries related to your water application or complaint, contact helpline <strong>1916</strong>.
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => { setTrackingData(null); setFormData({ reference_number: '' }); setError(null); }}
            >
              Track Another Application / Complaint
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        {!trackingData ? (
          <>
            <Button onClick={onClose} color="inherit">Cancel</Button>
            <Button
              variant="contained"
              onClick={handleTrack}
              disabled={loading}
              sx={{ bgcolor: '#0288d1', '&:hover': { bgcolor: '#01579b' } }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Track Status'}
            </Button>
          </>
        ) : (
          <Button variant="contained" onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default WaterTrackingForm;
