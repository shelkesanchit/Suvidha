import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Paper,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Grid,
  Card,
  CardContent,
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
  Phone,
  Email,
  LocationOn,
  Description,
  CalendarToday,
  Assignment,
  Warning,
  Info,
} from '@mui/icons-material';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const TrackingForm = ({ onClose }) => {
  const [trackingType, setTrackingType] = useState('application');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleTrack = async () => {
    const trimmedReference = referenceNumber.trim();

    if (!trimmedReference) {
      toast.error('Please enter reference number');
      return;
    }

    setLoading(true);
    try {
      const endpoint = trackingType === 'application'
        ? `/electricity/applications/track/${trimmedReference}`
        : `/electricity/complaints/track/${trimmedReference}`;

      console.log('Tracking:', endpoint);
      const response = await api.get(endpoint);
      // Extract actual data from nested response format
      const data = response.data.application || response.data.complaint || response.data;
      setTrackingData(data);
      toast.success('Record found!');
    } catch (error) {
      console.error('Tracking error:', error);
      toast.error(error.response?.data?.error || 'No record found with this reference number');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'info',
      document_verification: 'info',
      site_inspection: 'warning',
      approval_pending: 'warning',
      approved: 'success',
      rejected: 'error',
      work_in_progress: 'warning',
      completed: 'success',
      open: 'info',
      assigned: 'warning',
      in_progress: 'warning',
      resolved: 'success',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status, isCompleted) => {
    if (isCompleted) {
      return <CheckCircle color="success" />;
    }
    if (status === 'current') {
      return <AccessTime color="primary" />;
    }
    return <RadioButtonUnchecked color="disabled" />;
  };

  const getProgressPercentage = () => {
    if (!trackingData?.stage_history) return 0;
    const totalStages = trackingData.stage_history.length;
    const currentStage = totalStages;
    const expectedStages = trackingType === 'application' ? 6 : 4; // Typical stages
    return Math.min((currentStage / expectedStages) * 100, 100);
  };

  const getExpectedCompletionDays = (status) => {
    const daysMap = {
      submitted: 7,
      document_verification: 5,
      site_inspection: 10,
      approval_pending: 3,
      approved: 1,
      work_in_progress: 7,
      open: 2,
      assigned: 3,
      in_progress: 5,
    };
    return daysMap[status] || 'N/A';
  };

  return (
    <Box>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
              Track Application/Complaint Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your reference number to check the real-time status and track progress
            </Typography>
          </Box>
          <Search sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
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
                label="Select Track Type *"
                value={trackingType}
                onChange={(e) => {
                  setTrackingType(e.target.value);
                  setTrackingData(null);
                  setReferenceNumber('');
                }}
                variant="outlined"
              >
                <MenuItem value="application">Application Status</MenuItem>
                <MenuItem value="complaint">Complaint Status</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Reference Number *"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value.toUpperCase().trim())}
                placeholder={trackingType === 'application' ? 'NC2026000001, CL2026000001, LCH2026000001' : 'CMP2026000001'}
                helperText={trackingType === 'application'
                  ? 'Enter your application reference number'
                  : 'Enter your complaint reference number'}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleTrack}
                disabled={loading || !referenceNumber.trim()}
                startIcon={<Search />}
                fullWidth
                size="large"
              >
                {loading ? 'Searching...' : 'Track Status'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading && (
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <LinearProgress sx={{ width: '100%', borderRadius: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Fetching your application details, please wait...
              </Typography>
            </Box>
          </Paper>
        )}

        {trackingData && !loading && (
          <Box>
            {/* Status Overview Section */}
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
                          {trackingData.application_number || trackingData.complaint_number}
                        </Typography>
                        <Tooltip title="Copy to clipboard">
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(trackingData.application_number || trackingData.complaint_number)}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Chip
                      label={trackingData.status.replace(/_/g, ' ').toUpperCase()}
                      color={getStatusColor(trackingData.status)}
                      sx={{ fontWeight: 600, fontSize: '0.875rem', px: 2, py: 2.5 }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Type
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {trackingData.application_type?.replace(/_/g, ' ').toUpperCase() ||
                        trackingData.complaint_type?.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Submitted On
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {new Date(trackingData.submitted_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </Grid>

                {trackingData.consumer_number && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Consumer Number
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {trackingData.consumer_number}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {trackingData.priority && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Priority
                      </Typography>
                      <Chip
                        label={trackingData.priority.toUpperCase()}
                        color={trackingData.priority === 'critical' ? 'error' : trackingData.priority === 'high' ? 'warning' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Overall Progress
                      </Typography>
                      <Typography variant="body2" color="primary" fontWeight={600}>
                        {Math.round(getProgressPercentage())}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getProgressPercentage()}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    {trackingData.status !== 'completed' && trackingData.status !== 'resolved' && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Expected completion: ~{getExpectedCompletionDays(trackingData.status)} working days
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Application/Complaint Details */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2, mb: 3 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                onClick={() => setShowDetails(!showDetails)}
                sx={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <Typography variant="subtitle1" fontWeight={600} color="primary">
                  {trackingType === 'application' ? 'Application' : 'Complaint'} Details
                </Typography>
                <IconButton size="small">
                  {showDetails ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={showDetails}>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={3}>
                  {trackingData.application_data?.full_name && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Applicant Name
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {trackingData.application_data.full_name}
                      </Typography>
                    </Grid>
                  )}

                  {trackingData.application_data?.phone && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Contact Number
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {trackingData.application_data.phone}
                      </Typography>
                    </Grid>
                  )}

                  {trackingData.application_data?.email && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Email Address
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {trackingData.application_data.email}
                      </Typography>
                    </Grid>
                  )}

                  {trackingData.application_data?.address && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Address
                      </Typography>
                      <Typography variant="body1">
                        {trackingData.application_data.address}
                      </Typography>
                    </Grid>
                  )}

                  {trackingData.description && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {trackingData.description}
                      </Typography>
                    </Grid>
                  )}

                  {trackingData.current_stage && (
                    <Grid item xs={12}>
                      <Alert severity="info" icon={<Info />}>
                        <Typography variant="body2" fontWeight={600}>
                          Current Stage: {trackingData.current_stage}
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </Collapse>
            </Paper>

            {/* Progress Timeline */}
            {trackingData.stage_history && trackingData.stage_history.length > 0 && (
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary">
                  Progress Timeline
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Track the journey of your {trackingType}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Stepper orientation="vertical">
                  {trackingData.stage_history.map((stage, index) => {
                    const isLastStage = index === trackingData.stage_history.length - 1;
                    const isApplicationComplete = ['completed', 'approved', 'resolved', 'closed'].includes(trackingData.status);
                    const showCheckmark = !isLastStage || isApplicationComplete;

                    return (
                      <Step key={index} active completed={showCheckmark}>
                        <StepLabel
                          icon={getStatusIcon(
                            isLastStage && !isApplicationComplete ? 'current' : 'completed',
                            showCheckmark
                          )}
                        >
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {stage.stage}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(stage.timestamp).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>
                        </StepLabel>
                        {stage.remarks && (
                          <StepContent>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography variant="body2" color="text.secondary">
                                {stage.remarks}
                              </Typography>
                            </Paper>
                          </StepContent>
                        )}
                      </Step>
                    );
                  })}
                </Stepper>
              </Paper>
            )}

            {/* Additional Remarks */}
            {trackingData.remarks && (
              <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Important Notice
                </Typography>
                <Typography variant="body2">{trackingData.remarks}</Typography>
              </Alert>
            )}

            {/* Help Section */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'info.lighter', borderRadius: 2, border: '1px solid', borderColor: 'info.light' }}>
              <Box display="flex" alignItems="flex-start" gap={2}>
                <Info color="info" />
                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Need Assistance?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    For any queries or assistance regarding your {trackingType}, please contact our customer care at <strong>1912</strong> or visit your nearest electricity board office. Our support team is available 24/7 to help you.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {!trackingData && !loading && (
          <Paper elevation={0} sx={{ p: 4, bgcolor: 'background.default', borderRadius: 2, textAlign: 'center' }}>
            <Search sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Enter your reference number above to track the status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You can track both applications and complaints using their respective reference numbers
            </Typography>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: 'background.default' }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {trackingData && (
          <Button
            onClick={() => {
              setTrackingData(null);
              setReferenceNumber('');
            }}
            variant="contained"
          >
            Track Another
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default TrackingForm;
