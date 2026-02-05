import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Chip,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  WaterDrop,
  Speed,
  Build,
  Receipt,
  Warning,
  BugReport,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';

// Complaint categories as per municipal standards (Section 5.1 of document)
const complaintCategories = [
  { value: 'no-water', label: 'No Water Supply / पानी नहीं आ रहा', icon: <WaterDrop />, color: '#f44336' },
  { value: 'low-pressure', label: 'Low Pressure / कम प्रेशर', icon: <Speed />, color: '#ff9800' },
  { value: 'contaminated', label: 'Contaminated Water / गंदा पानी', icon: <BugReport />, color: '#795548' },
  { value: 'pipeline-leak', label: 'Pipeline Leakage / पाइप टूट गया', icon: <Build />, color: '#e91e63' },
  { value: 'meter-stopped', label: 'Meter Stopped / मीटर खराब', icon: <Speed />, color: '#673ab7' },
  { value: 'high-bill', label: 'High Bill / ज़्यादा बिल', icon: <Receipt />, color: '#9c27b0' },
  { value: 'other', label: 'Other Issue / अन्य समस्या', icon: <Warning />, color: '#607d8b' },
];

const WaterComplaintForm = ({ onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complaintNumber, setComplaintNumber] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    // Mandatory fields as per Section 5.1
    consumer_number: '', // CCN / RR No - The unique key
    complaint_category: '',
    description: '',
    contact_name: '',
    mobile: '',
    email: '',
    ward: '',
    address: '',
    landmark: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'complaint_category') {
      setSelectedCategory(value);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setFormData({ ...formData, complaint_category: category });
  };

  const handleSubmit = async () => {
    if (!formData.complaint_category) {
      toast.error('Please select complaint type');
      return;
    }
    if (!formData.contact_name || !formData.mobile) {
      toast.error('Please fill contact details');
      return;
    }
    if (formData.mobile.length !== 10) {
      toast.error('Enter valid 10-digit mobile number');
      return;
    }
    if (!formData.description) {
      toast.error('Please describe your problem');
      return;
    }

    setSubmitting(true);
    try {
      const complaint_data = {
        complaint_category: formData.complaint_category,
        consumer_number: formData.consumer_number || null,
        contact_name: formData.contact_name,
        mobile: formData.mobile,
        email: formData.email || null,
        ward: formData.ward || null,
        address: formData.address || null,
        landmark: formData.landmark || null,
        description: formData.description,
        urgency: 'medium'
      };

      const response = await api.post('/water/complaints/submit', { complaint_data });
      setComplaintNumber(response.data.data.complaint_number);
      setSubmitted(true);
      toast.success('Complaint registered successfully!');
    } catch (error) {
      console.error('Complaint submission error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Box>
        <DialogTitle sx={{ bgcolor: '#f44336', color: 'white' }}>
          <Typography variant="h5" fontWeight={600}>
            🔧 Water Complaint
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" color="success.main" gutterBottom>
            Complaint Registered!
          </Typography>
          <Typography variant="h6" gutterBottom>
            Complaint ID (Token):
          </Typography>
          <Chip
            label={complaintNumber}
            color="error"
            sx={{ fontSize: '1.5rem', py: 3, px: 4, mb: 3 }}
          />
          <Box sx={{ bgcolor: '#fff3e0', p: 3, borderRadius: 2, mt: 2, textAlign: 'left' }}>
            <Typography variant="body1" gutterBottom>
              <strong>Complaint Type:</strong> {complaintCategories.find(c => c.value === selectedCategory)?.label}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Contact:</strong> {formData.contact_name}
            </Typography>
            <Typography variant="body1">
              <strong>Mobile:</strong> {formData.mobile}
            </Typography>
          </Box>
          <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              • Complaint assigned to Ward Engineer<br />
              • Track status using Complaint ID<br />
              • SMS update on resolution<br />
              • Emergency helpline: 1800-XXX-XXXX
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose} fullWidth>
            Close
          </Button>
        </DialogActions>
      </Box>
    );
  }

  return (
    <Box>
      <DialogTitle sx={{ bgcolor: '#f44336', color: 'white' }}>
        <Typography variant="h5" fontWeight={600}>
          🔧 Register Water Complaint / शिकायत दर्ज करें
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {/* Complaint Category Selection */}
        <Typography variant="h6" color="primary" gutterBottom>
          Select Problem Type / समस्या का प्रकार *
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {complaintCategories.map((category) => (
            <Grid item xs={6} sm={4} key={category.value}>
              <Card
                onClick={() => handleCategorySelect(category.value)}
                sx={{
                  cursor: 'pointer',
                  border: selectedCategory === category.value ? `3px solid ${category.color}` : '1px solid #e0e0e0',
                  bgcolor: selectedCategory === category.value ? `${category.color}15` : 'white',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'scale(1.02)', boxShadow: 3 },
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Box sx={{ color: category.color, mb: 1 }}>
                    {React.cloneElement(category.icon, { sx: { fontSize: 36 } })}
                  </Box>
                  <Typography variant="body2" fontWeight={selectedCategory === category.value ? 700 : 400}>
                    {category.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Contact Details */}
        <Typography variant="h6" color="primary" gutterBottom>
          Contact Information / संपर्क जानकारी
        </Typography>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Consumer Number (if available)"
              name="consumer_number"
              value={formData.consumer_number}
              onChange={handleChange}
              placeholder="E.g., WTR2024001234"
              helperText="Helps retrieve property history"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Contact Person Name *"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              placeholder="संपर्क व्यक्ति का नाम"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Mobile Number *"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="10-digit mobile"
              inputProps={{ maxLength: 10 }}
              helperText="For engineer to coordinate"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email (Optional)"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Ward Number"
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              placeholder="e.g., 1, 2, 3"
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Full Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Complete address of the problem location"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Landmark (Nearby Reference Point)"
              name="landmark"
              value={formData.landmark}
              onChange={handleChange}
              placeholder="E.g., Near City Hospital, Behind Bus Stand"
              helperText="Helps field staff locate the issue quickly"
            />
          </Grid>
        </Grid>

        {/* Problem Description */}
        <Typography variant="h6" color="primary" gutterBottom>
          Problem Description / समस्या का विवरण *
        </Typography>
        <TextField
          fullWidth
          required
          multiline
          rows={3}
          label="Describe your problem"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="E.g., No water supply since morning 6 AM, affecting all floors..."
          sx={{ mb: 2 }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedCategory || submitting}
          sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' } }}
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {submitting ? 'Submitting...' : 'Submit Complaint'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default WaterComplaintForm;
