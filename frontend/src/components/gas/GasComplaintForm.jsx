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
// Gas Leak: shows emergency prompt first; user can then report a past incident
// DB ENUM: 'gas-leak', 'no-supply', 'low-pressure', 'meter-issue', 'billing-dispute',
//          'cylinder-delivery', 'equipment-malfunction', 'safety-concern', 'other'
// NOTE: 'meter-testing' is mapped to 'meter-issue' before API submission

// PNG Complaint Categories
const pngComplaintCategories = [
  { value: 'gas-leak', label: 'Report Gas Leakage / गैस रिसाव', icon: '🚨', isEmergency: true },
  { value: 'no-supply', label: 'No Gas Supply / गैस सप्लाई नहीं', icon: '🚫' },
  { value: 'low-pressure', label: 'Low Gas Pressure / कम गैस प्रेशर', icon: '📉' },
  { value: 'meter-issue', label: 'Meter Reading Dispute / मीटर रीडिंग विवाद', icon: '🔢' },
  { value: 'meter-testing', label: 'Request Meter Testing / मीटर जांच', icon: '🔧' },
  { value: 'billing-dispute', label: 'Billing Error / Report / बिलिंग गलती', icon: '💰' },
  { value: 'equipment-malfunction', label: 'Equipment Issue / उपकरण समस्या', icon: '⚙️' },
  { value: 'safety-concern', label: 'Safety Concern / सुरक्षा चिंता', icon: '⚠️' },
  { value: 'other', label: 'Other / अन्य', icon: '📝' },
];

// LPG Complaint Categories
const lpgComplaintCategories = [
  { value: 'gas-leak', label: 'Report Gas Leakage / गैस रिसाव', icon: '🚨', isEmergency: true },
  { value: 'cylinder-delivery', label: 'Delivery Delay / डिलीवरी में देरी', icon: '🚚' },
  { value: 'billing-dispute', label: 'Overcharging / Billing Error / अधिक शुल्क', icon: '💰' },
  { value: 'meter-issue', label: 'Meter Reading Dispute / मीटर विवाद', icon: '🔢' },
  { value: 'equipment-malfunction', label: 'Cylinder / Regulator Issue / सिलेंडर समस्या', icon: '⛽' },
  { value: 'safety-concern', label: 'Safety Concern / सुरक्षा चिंता', icon: '⚠️' },
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
  // Gas leak handling: null = no selection, 'active' = show emergency, 'report' = allow form
  const [gasLeakMode, setGasLeakMode] = useState(null);
  
  const [formData, setFormData] = useState({
    consumer_number: '',
    contact_name: '',
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

  const handleCategoryChange = (value) => {
    handleChange({ target: { name: 'complaint_category', value } });
    if (value === 'gas-leak') {
      setGasLeakMode(null); // reset to show the gas-leak prompt
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
    // Block active gas leak submissions — user must call 1906
    if (formData.complaint_category === 'gas-leak' && gasLeakMode !== 'report') {
      toast.error('For active gas leaks please call 1906 immediately');
      return;
    }

    setSubmitting(true);
    try {
      // Map UI categories to valid backend ENUM values
      const categoryMap = { 'meter-testing': 'meter-issue' };
      const backendCategory = categoryMap[formData.complaint_category] || formData.complaint_category;
      // Prefix description for specific sub-types so admins can distinguish them
      const descriptionPrefix = formData.complaint_category === 'meter-testing'
        ? '[Meter Testing Request] '
        : formData.complaint_category === 'gas-leak'
          ? '[Past Gas Leak Incident Report] '
          : '';

      const submitData = {
        complaint_data: {
          gas_type: gasType,
          consumer_number: formData.consumer_number,
          contact_name: formData.contact_name,
          mobile: formData.mobile,
          complaint_category: backendCategory,
          description: descriptionPrefix + formData.description,
          location: location ? `${location.lat},${location.lng}` : null,
          urgency: formData.complaint_category === 'gas-leak' ? 'high' : 'medium',
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
              onClick={() => handleCategoryChange(cat.value)}
              >
                <Typography fontSize="1.5rem">{cat.icon}</Typography>
                <Typography variant="caption">{cat.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Gas Leak emergency prompt */}
        {formData.complaint_category === 'gas-leak' && gasLeakMode === null && (
          <Box
            sx={{
              border: '3px solid #d32f2f',
              borderRadius: 2,
              p: 3,
              mb: 3,
              bgcolor: '#ffebee',
            }}
          >
            <Typography variant="h6" color="error" fontWeight="bold" gutterBottom>
              🚨 Is this an ACTIVE gas leak?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose how to proceed:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<PhoneIcon />}
                onClick={() => setGasLeakMode('active')}
              >
                Active / Ongoing Leak
              </Button>
              <Button
                variant="outlined"
                color="warning"
                size="large"
                onClick={() => setGasLeakMode('report')}
              >
                Report Past Incident
              </Button>
            </Box>
          </Box>
        )}

        {/* Active gas leak: show emergency info, no form */}
        {formData.complaint_category === 'gas-leak' && gasLeakMode === 'active' && (
          <Box
            sx={{
              border: '3px solid #d32f2f',
              borderRadius: 2,
              p: 3,
              mb: 3,
              bgcolor: '#d32f2f',
              color: 'white',
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              🚨 CALL 1906 IMMEDIATELY
            </Typography>
            <Typography variant="h6" gutterBottom>
              National Gas Leak Helpline (24x7 Free)
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Also call: <strong>1800-180-1906</strong> (Toll Free)
            </Typography>
            <Alert severity="warning" sx={{ textAlign: 'left', mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">Immediate steps:</Typography>
              <Typography variant="body2">
                1. Do NOT use electrical switches, fans, or lighters<br />
                2. Open all windows and doors immediately<br />
                3. Turn off the gas regulator / main valve if safe to do so<br />
                4. Evacuate everyone from the premises<br />
                5. Call 1906 from outside the building
              </Typography>
            </Alert>
            <Button
              variant="contained"
              sx={{ bgcolor: 'white', color: '#d32f2f', '&:hover': { bgcolor: '#ffcdd2' } }}
              onClick={() => setGasLeakMode(null)}
            >
              Back
            </Button>
          </Box>
        )}

        {/* Consumer Number OR Mobile */}
        {(formData.complaint_category !== 'gas-leak' || gasLeakMode === 'report') && (
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
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Your Name / आपका नाम"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              placeholder="Enter your name"
              helperText="Optional if consumer no. provided"
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
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        {(formData.complaint_category !== 'gas-leak' || gasLeakMode === 'report') && (
          <Button
            variant="contained" color={isPNG ? 'primary' : 'warning'}
            onClick={handleSubmit} disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Complaint'}
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default GasComplaintForm;
