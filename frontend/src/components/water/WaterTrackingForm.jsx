import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Chip,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  CheckCircle,
  AccessTime,
  Engineering,
  Assignment,
  Done,
  Cancel,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const statusColors = {
  'submitted': '#2196f3',
  'open': '#ff9800',
  'document_verification': '#9c27b0',
  'site_inspection': '#00bcd4',
  'approval_pending': '#ff9800',
  'assigned': '#2196f3',
  'in_progress': '#4caf50',
  'work_in_progress': '#4caf50',
  'approved': '#4caf50',
  'completed': '#4caf50',
  'resolved': '#4caf50',
  'closed': '#607d8b',
  'rejected': '#f44336',
};

const statusLabels = {
  'submitted': 'Submitted',
  'open': 'Open',
  'document_verification': 'Document Verification',
  'site_inspection': 'Site Inspection',
  'approval_pending': 'Pending Approval',
  'assigned': 'Assigned',
  'in_progress': 'In Progress',
  'work_in_progress': 'Work In Progress',
  'approved': 'Approved',
  'completed': 'Completed',
  'resolved': 'Resolved',
  'closed': 'Closed',
  'rejected': 'Rejected',
};

const categoryLabels = {
  'no-water': 'No Water Supply',
  'low-pressure': 'Low Pressure',
  'contaminated': 'Contaminated Water',
  'pipeline-leak': 'Pipeline Leak',
  'meter-stopped': 'Meter Stopped',
  'high-bill': 'High Bill Dispute',
  'illegal-connection': 'Illegal Connection',
  'sewerage': 'Sewerage Issue',
  'other': 'Other',
  'new_connection': 'New Connection',
  'reconnection': 'Reconnection',
  'disconnection': 'Disconnection',
  'transfer': 'Ownership Transfer',
  'pipe_size_change': 'Pipe Size Change',
  'meter_change': 'Meter Change',
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
  const [formData, setFormData] = useState({
    reference_number: '',
  });

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
      const isComplaint = refNumber.startsWith('WCP');
      const isApplication = refNumber.startsWith('WNC');
      
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
        
        // Build timeline based on type
        let timeline = [];
        
        if (isComplaint) {
          timeline.push({
            status: 'Registered',
            date: formatDate(data.created_at),
            description: 'Complaint registered successfully'
          });
          if (data.assigned_engineer) {
            timeline.push({
              status: 'Assigned',
              date: 'Pending',
              description: `Assigned to ${data.assigned_engineer}`
            });
          }
          if (data.status === 'in_progress') {
            timeline.push({
              status: 'In Progress',
              date: 'Current',
              description: 'Work in progress'
            });
          }
          if (data.resolved_at) {
            timeline.push({
              status: 'Resolved',
              date: formatDate(data.resolved_at),
              description: data.resolution_notes || 'Issue resolved'
            });
          }
          if (data.closed_at) {
            timeline.push({
              status: 'Closed',
              date: formatDate(data.closed_at),
              description: 'Complaint closed'
            });
          }
        } else {
          // Application timeline from stage_history
          if (data.stage_history && Array.isArray(data.stage_history) && data.stage_history.length > 0) {
            timeline = data.stage_history.map(stage => ({
              status: stage.stage || stage.status,
              date: formatDate(stage.timestamp),
              description: stage.remarks || stage.description || ''
            }));
          } else {
            // Default timeline
            timeline.push({
              status: 'Submitted',
              date: formatDate(data.submitted_at),
              description: 'Application submitted successfully'
            });
            if (data.current_stage && data.current_stage !== 'Application Submitted') {
              timeline.push({
                status: data.current_stage,
                date: 'Current',
                description: `Status: ${statusLabels[data.status] || data.status}`
              });
            }
          }
          if (data.processed_at && !timeline.find(t => t.status === 'Processed')) {
            timeline.push({
              status: 'Processed',
              date: formatDate(data.processed_at),
              description: 'Application processed'
            });
          }
          if (data.completed_at) {
            timeline.push({
              status: 'Completed',
              date: formatDate(data.completed_at),
              description: 'Application completed'
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
          // Application specific
          pipe_size: data.pipe_size_requested,
          connection_type: data.connection_type_requested,
          property_type: data.property_type,
          total_fee: data.total_fee,
          fee_paid: data.fee_paid,
          rejection_reason: data.rejection_reason,
          resolution_notes: data.resolution_notes,
          timeline: timeline,
          raw: data
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

  const getStatusColor = (status) => {
    return statusColors[status] || statusColors[trackingData?.status_key] || '#2196f3';
  };

  return (
    <Box>
      <DialogTitle sx={{ bgcolor: '#0288d1', color: 'white' }}>
        <Typography variant="h5" fontWeight={600}>
          🔍 Track Request / अनुरोध ट्रैक करें
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {!trackingData ? (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Enter your Application Number (WNC...) or Complaint ID (WCP...) to track real-time status
            </Alert>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Reference Number *"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleChange}
                  placeholder="E.g., WNC2026000001 or WCP2026000001"
                  helperText="Found on your application receipt or SMS"
                  onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box>
            {/* Header Card */}
            <Card sx={{ mb: 3, bgcolor: `${getStatusColor(trackingData.status_key)}15`, border: `2px solid ${getStatusColor(trackingData.status_key)}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="primary">
                    {trackingData.type === 'Complaint' ? '🚨' : '📋'} {trackingData.type}
                  </Typography>
                  <Chip
                    label={trackingData.current_status}
                    sx={{ bgcolor: getStatusColor(trackingData.status_key), color: 'white', fontWeight: 600 }}
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Reference Number</Typography>
                    <Typography variant="body1" fontWeight={600}>{trackingData.reference_number}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Name</Typography>
                    <Typography variant="body1" fontWeight={600}>{trackingData.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Mobile</Typography>
                    <Typography variant="body1">{trackingData.mobile}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Ward</Typography>
                    <Typography variant="body1">{trackingData.ward}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Category</Typography>
                    <Typography variant="body1">{trackingData.category}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Registered Date</Typography>
                    <Typography variant="body1">{trackingData.registered_date}</Typography>
                  </Grid>
                  
                  {trackingData.type === 'Complaint' ? (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Urgency</Typography>
                        <Chip 
                          label={trackingData.urgency?.toUpperCase() || 'Medium'} 
                          size="small"
                          color={trackingData.urgency === 'critical' ? 'error' : trackingData.urgency === 'high' ? 'warning' : 'default'}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Assigned To</Typography>
                        <Typography variant="body1">{trackingData.assigned_to}</Typography>
                      </Grid>
                      {trackingData.description && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">Description</Typography>
                          <Typography variant="body1">{trackingData.description}</Typography>
                        </Grid>
                      )}
                      {trackingData.resolution_notes && (
                        <Grid item xs={12}>
                          <Alert severity="success" sx={{ mt: 1 }}>
                            <strong>Resolution:</strong> {trackingData.resolution_notes}
                          </Alert>
                        </Grid>
                      )}
                    </>
                  ) : (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Property Type</Typography>
                        <Typography variant="body1">{trackingData.property_type || 'Residential'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Connection Type</Typography>
                        <Typography variant="body1">{trackingData.connection_type || 'Permanent'}</Typography>
                      </Grid>
                      {trackingData.pipe_size && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Pipe Size</Typography>
                          <Typography variant="body1">{trackingData.pipe_size}</Typography>
                        </Grid>
                      )}
                      {trackingData.total_fee > 0 && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Total Fee</Typography>
                          <Typography variant="body1">₹{trackingData.total_fee?.toLocaleString()}</Typography>
                        </Grid>
                      )}
                      {trackingData.rejection_reason && (
                        <Grid item xs={12}>
                          <Alert severity="error" sx={{ mt: 1 }}>
                            <strong>Rejection Reason:</strong> {trackingData.rejection_reason}
                          </Alert>
                        </Grid>
                      )}
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Typography variant="h6" color="primary" gutterBottom>
              📜 Progress Timeline
            </Typography>
            <Card>
              <CardContent>
                {trackingData.timeline.length > 0 ? (
                  <Stepper activeStep={trackingData.timeline.length - 1} orientation="vertical">
                    {trackingData.timeline.map((step, index) => (
                      <Step key={index} completed={true}>
                        <StepLabel
                          StepIconProps={{
                            sx: { color: '#4caf50', '&.Mui-completed': { color: '#4caf50' } },
                          }}
                        >
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>{step.status}</Typography>
                            <Typography variant="body2" color="textSecondary">{step.date}</Typography>
                            {step.description && (
                              <Typography variant="body2">{step.description}</Typography>
                            )}
                          </Box>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                ) : (
                  <Typography color="textSecondary">No timeline available yet</Typography>
                )}
              </CardContent>
            </Card>

            {trackingData.status_key === 'approval_pending' && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                <strong>Pending Approval:</strong> Your application is under review.
              </Alert>
            )}

            {(trackingData.status_key === 'completed' || trackingData.status_key === 'resolved') && (
              <Alert severity="success" sx={{ mt: 3 }}>
                Your request has been completed successfully! 🎉
              </Alert>
            )}

            {trackingData.status_key === 'rejected' && (
              <Alert severity="error" sx={{ mt: 3 }}>
                Your request was rejected. Please contact the office for more details.
              </Alert>
            )}
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
          <>
            <Button onClick={() => { setTrackingData(null); setFormData({ reference_number: '' }); }} variant="outlined">
              Track Another
            </Button>
            <Button variant="contained" onClick={onClose}>Close</Button>
          </>
        )}
      </DialogActions>
    </Box>
  );
};

export default WaterTrackingForm;
