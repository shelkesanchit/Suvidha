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
  Chip,
  CircularProgress,
} from '@mui/material';
import { CheckCircle as SuccessIcon, Phone as PhoneIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';

// =============================================================================
// COMPLAINT CATEGORIES - Different for PNG vs LPG
// =============================================================================
// NOTE: Gas Leak is NOT a form category — show emergency number 1906 only

// PNG Complaint Categories
const pngComplaintCategories = [
  { value: 'low-pressure', label: 'Low Gas Pressure / कम गैस प्रेशर', icon: '📉' },
  { value: 'billing-issue', label: 'Billing Issue / बिलिंग समस्या', icon: '💰' },
  { value: 'meter-issue', label: 'Meter Problem / मीटर समस्या', icon: '🔧' },
  { value: 'staff-behavior', label: 'Staff Behavior / कर्मचारी व्यवहार', icon: '👤' },
  { value: 'connection-issue', label: 'Connection Issue / कनेक्शन समस्या', icon: '🔌' },
  { value: 'other', label: 'Other / अन्य', icon: '📝' },
];

// LPG Complaint Categories
const lpgComplaintCategories = [
  { value: 'delivery-delay', label: 'Delivery Delay / डिलीवरी में देरी', icon: '🚚' },
  { value: 'overcharging', label: 'Overcharging / अधिक शुल्क', icon: '💰' },
  { value: 'staff-behavior', label: 'Staff Behavior / कर्मचारी व्यवहार', icon: '👤' },
  { value: 'cylinder-issues', label: 'Cylinder Issues / सिलेंडर समस्या', icon: '⛽' },
  { value: 'subsidy-issue', label: 'Subsidy Issue / सब्सिडी समस्या', icon: '🏦' },
  { value: 'other', label: 'Other / अन्य', icon: '📝' },
];

const GasComplaintForm = ({ onClose, gasType = 'lpg' }) => {
  const isPNG = gasType === 'png';
  const complaintCategories = isPNG ? pngComplaintCategories : lpgComplaintCategories;
  
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complaintNumber, setComplaintNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  
  const [formData, setFormData] = useState({
    consumer_number: '',
    mobile: '',
    otp: '',
    complaint_category: '',
    description: '',
    photo: null,
  });
  // Location auto-tag
  const [location, setLocation] = useState(null);

  // Auto-tag location on mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation(null)
      );
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, photo: e.target.files[0] });
    }
  };

  // OTP Functions
  const handleSendOTP = async () => {
    if (formData.mobile.length !== 10) { toast.error('Enter valid 10-digit mobile number'); return; }
    try {
      toast.success(`OTP sent to ${formData.mobile}`);
      setOtpSent(true);
    } catch {
      toast.error('Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (formData.otp.length !== 6) { toast.error('Enter valid 6-digit OTP'); return; }
    try {
      if (formData.otp === '123456') {
        toast.success('Mobile verified successfully!');
        setOtpVerified(true);
      } else {
        toast.error('Invalid OTP. Demo OTP: 123456');
      }
    } catch {
      toast.error('Failed to verify OTP');
    }
  };

  const handleSubmit = async () => {
    // Validate: at least one of consumer_number or mobile required
    if (!formData.consumer_number && !formData.mobile) {
      toast.error('Please enter Consumer Number OR Mobile Number');
      return;
    }
    if (!formData.complaint_category) {
      toast.error('Please select a complaint type');
      return;
    }
    if (!formData.description) {
      toast.error('Please describe the issue');
      return;
    }
    if (formData.mobile && formData.mobile.length !== 10) {
      toast.error('Enter valid 10-digit mobile number');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        complaint_data: {
          gas_type: gasType,
          consumer_number: formData.consumer_number,
          mobile: formData.mobile,
          complaint_category: formData.complaint_category,
          description: formData.description,
          location: location ? `${location.lat},${location.lng}` : null,
          urgency: 'medium',
        },
      };

      const response = await api.post('/gas/complaints/submit', submitData);

      if (response.data.success) {
        setComplaintNumber(response.data.data.complaint_number);
        setSubmitted(true);
        toast.success('Complaint registered successfully!');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <Box>
        <DialogTitle sx={{ bgcolor: isPNG ? '#1565c0' : '#f57c00', color: 'white' }}>
          <Typography variant="h5" fontWeight={600}>Complaint Registered</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" color="success.main" gutterBottom>Complaint Registered!</Typography>
          <Typography variant="h6" gutterBottom>Complaint Number:</Typography>
          <Chip label={complaintNumber} color={isPNG ? 'primary' : 'warning'} sx={{ fontSize: '1.5rem', py: 3, px: 4, mb: 3 }} />
          <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
            <Typography variant="body2">
              • Save your complaint number for reference<br />
              • Expected resolution: 24-48 hours<br />
              • SMS updates on: {formData.mobile || 'registered mobile'}<br />
              • Track status using complaint number
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose} fullWidth color={isPNG ? 'primary' : 'warning'}>Close</Button>
        </DialogActions>
      </Box>
    );
  }

  return (
    <Box>
      <DialogTitle sx={{ bgcolor: isPNG ? '#1565c0' : '#f57c00', color: 'white' }}>
        <Typography variant="h5" fontWeight={600}>
          {isPNG ? '🔵 Register PNG Complaint' : '🔥 Register LPG Complaint'}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>Non-emergency complaints only</Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {/* Gas Leak Emergency Warning — DO NOT route via form */}
        <Alert severity="error" sx={{ mb: 3, border: '2px solid #d32f2f' }}>
          <Typography fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon /> Gas Leak Emergency? CALL 1906 IMMEDIATELY
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Do NOT fill this form for gas leaks. Call <strong>1906</strong> (24x7 Helpline).<br />
            Evacuate the area. Do NOT use electrical switches or flames.
          </Typography>
        </Alert>

        {/* Complaint Category */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Complaint Type *
        </Typography>
        <Grid container spacing={1} sx={{ mb: 3 }}>
          {complaintCategories.map((cat) => (
            <Grid item xs={6} sm={4} key={cat.value}>
              <Box
                sx={{
                  border: '2px solid',
                  borderColor: formData.complaint_category === cat.value ? (isPNG ? 'primary.main' : 'warning.main') : 'grey.300',
                  borderRadius: 1,
                  p: 1.5,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: formData.complaint_category === cat.value ? (isPNG ? '#e3f2fd' : '#fff3e0') : 'white',
                  '&:hover': { borderColor: isPNG ? 'primary.light' : 'warning.light' },
                }}
                onClick={() => handleChange({ target: { name: 'complaint_category', value: cat.value } })}
              >
                <Typography fontSize="1.5rem">{cat.icon}</Typography>
                <Typography variant="caption">{cat.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Consumer Number OR Mobile */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Consumer Number / उपभोक्ता संख्या"
              name="consumer_number"
              value={formData.consumer_number}
              onChange={handleChange}
              placeholder="GC2024XXXXXX"
              helperText="Either Consumer No. or Mobile required"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Mobile Number / मोबाइल नंबर"
              name="mobile"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              inputProps={{ maxLength: 10 }}
              helperText="Either Consumer No. or Mobile required"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth required
              label="Describe the Problem / समस्या का वर्णन करें"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline rows={3}
              placeholder="Describe your issue in detail..."
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="outlined" component="label" sx={{ mr: 2 }}>
              Upload Photo (Optional)
              <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
            </Button>
            {formData.photo && (
              <Chip label={formData.photo.name} onDelete={() => setFormData({ ...formData, photo: null })} />
            )}
          </Grid>
          {location && (
            <Grid item xs={12}>
              <Alert severity="success" sx={{ py: 0 }}>
                <Typography variant="body2">
                  Location auto-tagged: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button
          variant="contained" color={isPNG ? 'primary' : 'warning'}
          onClick={handleSubmit} disabled={submitting}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Complaint'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default GasComplaintForm;
