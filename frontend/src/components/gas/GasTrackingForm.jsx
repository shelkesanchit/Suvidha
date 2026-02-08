import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle,
  HourglassEmpty,
  LocalShipping,
  Assignment,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';

// Updated Tracking Form - OTP-based authentication per spec
const GasTrackingForm = ({ onClose, gasType = 'lpg' }) => {
  const isPNG = gasType === 'png';
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('input'); // input -> otp -> result
  const [searchValue, setSearchValue] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState('');

  // Send OTP for verification
  const handleSendOtp = async () => {
    if (!searchValue) {
      toast.error(`Please enter ${tabValue === 0 ? 'Application' : 'Complaint'} Number`);
      return;
    }
    if (!mobileNumber || mobileNumber.length !== 10) {
      toast.error('Please enter valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      // In production, send actual OTP
      await new Promise(resolve => setTimeout(resolve, 800));
      setOtpSent(true);
      setStep('otp');
      toast.success('OTP sent to your mobile number');
    } catch (err) {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and fetch tracking data
  const handleVerifyAndTrack = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    setTrackingData(null);

    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 500));

      let response;
      if (tabValue === 0) {
        response = await api.get(`/gas/applications/track/${searchValue}`);
      } else {
        response = await api.get(`/gas/complaints/track/${searchValue}`);
      }

      if (response.data.success) {
        setTrackingData(response.data.data);
        setStep('result');
        toast.success('Tracking data fetched successfully');
      } else {
        setError(response.data.message || 'Not found');
      }
    } catch (error) {
      console.error('Tracking error:', error);
      setError(error.response?.data?.message || 'Not found. Please check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setSearchValue('');
    setMobileNumber('');
    setOtp('');
    setOtpSent(false);
    setTrackingData(null);
    setError('');
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'info',
      document_verification: 'warning',
      site_inspection: 'warning',
      approval_pending: 'warning',
      approved: 'success',
      rejected: 'error',
      work_in_progress: 'info',
      completed: 'success',
      open: 'error',
      assigned: 'warning',
      in_progress: 'info',
      resolved: 'success',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    if (['completed', 'approved', 'resolved', 'closed'].includes(status)) {
      return <CheckCircle color="success" />;
    }
    if (['work_in_progress', 'in_progress', 'assigned'].includes(status)) {
      return <LocalShipping color="info" />;
    }
    return <HourglassEmpty color="warning" />;
  };

  const renderApplicationTracking = () => {
    if (!trackingData) return null;
    const status = trackingData.application_status || trackingData.status;

    return (
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: isPNG ? '#e3f2fd' : '#fff3e0' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Application Number</Typography>
              <Typography variant="h6" fontWeight="bold">{trackingData.application_number}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip 
                label={status?.replace(/_/g, ' ').toUpperCase()} 
                color={getStatusColor(status)}
                icon={getStatusIcon(status)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Applicant Name</Typography>
              <Typography fontWeight="bold">{trackingData.full_name}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Connection Type</Typography>
              <Typography fontWeight="bold">{trackingData.connection_type?.replace(/_/g, ' ').toUpperCase()}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Cylinder Type</Typography>
              <Typography fontWeight="bold">{trackingData.cylinder_type?.toUpperCase() || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Submitted Date</Typography>
              <Typography fontWeight="bold">{new Date(trackingData.created_at).toLocaleDateString()}</Typography>
            </Grid>
            {trackingData.consumer_id && (
              <Grid item xs={12}>
                <Alert severity="success" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Consumer ID:</strong> {trackingData.consumer_id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Use this Consumer ID for bill payments and future services
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </Paper>

        {trackingData.distributor_name && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2"><strong>Distributor:</strong> {trackingData.distributor_name}</Typography>
          </Alert>
        )}

        {status === 'approved' && !trackingData.consumer_id && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">Your application has been approved. Consumer ID will be assigned shortly.</Typography>
          </Alert>
        )}
      </Box>
    );
  };

  const renderComplaintTracking = () => {
    if (!trackingData) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: isPNG ? '#e3f2fd' : '#fff3e0' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Complaint Number</Typography>
              <Typography variant="h6" fontWeight="bold">{trackingData.complaint_number}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip 
                label={trackingData.status?.toUpperCase()} 
                color={getStatusColor(trackingData.status)}
                icon={getStatusIcon(trackingData.status)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Category</Typography>
              <Chip label={trackingData.complaint_category?.replace(/-/g, ' ').toUpperCase()} color="warning" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Registered Date</Typography>
              <Typography fontWeight="bold">{new Date(trackingData.created_at).toLocaleDateString()}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Description</Typography>
              <Typography>{trackingData.description}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {trackingData.assigned_engineer && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2"><strong>Assigned Engineer:</strong> {trackingData.assigned_engineer}</Typography>
          </Alert>
        )}
        {trackingData.resolution_notes && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2"><strong>Resolution:</strong> {trackingData.resolution_notes}</Typography>
          </Alert>
        )}
        {trackingData.resolved_at && (
          <Alert severity="success">
            <Typography variant="body2"><strong>Resolved on:</strong> {new Date(trackingData.resolved_at).toLocaleString()}</Typography>
          </Alert>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <DialogTitle sx={{ bgcolor: isPNG ? '#1565c0' : '#f57c00', color: 'white' }}>
        <Typography component="span" variant="body1" fontWeight={600}>
          {isPNG ? '🔵 Track PNG Application / Complaint' : '🔥 Track LPG Application / Complaint'}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>OTP-based verification</Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {step !== 'result' && (
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => { setTabValue(v); handleReset(); }}
            sx={{ mb: 3 }}
            textColor="inherit"
            TabIndicatorProps={{ style: { backgroundColor: isPNG ? '#1565c0' : '#f57c00' } }}
          >
            <Tab label="Track Application" icon={<Assignment />} iconPosition="start" />
            <Tab label="Track Complaint" icon={<SearchIcon />} iconPosition="start" />
          </Tabs>
        )}

        {/* Step 1: Enter Number + Mobile */}
        {step === 'input' && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Enter your {tabValue === 0 ? 'Application' : 'Complaint'} Number and registered mobile to receive OTP.
            </Alert>
            <TextField
              fullWidth
              label={tabValue === 0 ? "Application Number / आवेदन संख्या" : "Complaint Number / शिकायत संख्या"}
              placeholder={tabValue === 0 ? "e.g., GNC2024000001" : "e.g., GCP2024000001"}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Registered Mobile Number / पंजीकृत मोबाइल नंबर"
              placeholder="Enter 10-digit mobile number"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              inputProps={{ maxLength: 10 }}
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth variant="contained" size="large" color={isPNG ? 'primary' : 'warning'}
              onClick={handleSendOtp} disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Send OTP & Track'}
            </Button>
          </Box>
        )}

        {/* Step 2: Enter OTP */}
        {step === 'otp' && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              OTP sent to {mobileNumber}. Please enter the 6-digit code.
            </Alert>
            <TextField
              fullWidth
              label="Enter OTP / ओटीपी दर्ज करें"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ maxLength: 6 }}
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth variant="contained" size="large" color={isPNG ? 'primary' : 'warning'}
              onClick={handleVerifyAndTrack} disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify & View Status'}
            </Button>
            <Button fullWidth sx={{ mt: 1 }} onClick={handleSendOtp} disabled={loading}>
              Resend OTP
            </Button>
          </Box>
        )}

        {/* Step 3: Results */}
        {step === 'result' && (
          <Box>
            <Button variant="outlined" color={isPNG ? 'primary' : 'warning'} onClick={handleReset} sx={{ mb: 2 }}>
              ← Track Another
            </Button>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {tabValue === 0 ? renderApplicationTracking() : renderComplaintTracking()}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined" color={isPNG ? 'primary' : 'warning'}>Close</Button>
      </DialogActions>
    </Box>
  );
};

export default GasTrackingForm;
