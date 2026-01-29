import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CategoryChangeForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    consumer_number: '',
    current_category: '',
    new_category: '',
    reason: '',
    contact_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/applications/submit', {
        application_type: 'category_change',
        application_data: formData,
      });

      setApplicationNumber(response.data.application_number);
      setSuccess(true);
      toast.success('Category change request submitted!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" color="success.main" gutterBottom>
          ✓ Request Submitted Successfully
        </Typography>
        <Typography variant="h6" sx={{ my: 3 }}>
          Application Number: <strong>{applicationNumber}</strong>
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Your category change request will be reviewed. Please submit required documents at the nearest office within 7 days.
        </Alert>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Category Change Request
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Change your electricity connection category
      </Typography>

      <TextField
        fullWidth
        label="Consumer Number"
        name="consumer_number"
        value={formData.consumer_number}
        onChange={handleChange}
        required
        margin="normal"
        placeholder="EC2026XXXXXX"
      />

      <TextField
        fullWidth
        select
        label="Current Category"
        name="current_category"
        value={formData.current_category}
        onChange={handleChange}
        required
        margin="normal"
      >
        <MenuItem value="residential">Residential (₹5.50-8.50/unit)</MenuItem>
        <MenuItem value="commercial">Commercial (₹9.00/unit)</MenuItem>
        <MenuItem value="industrial">Industrial (₹7.50/unit)</MenuItem>
        <MenuItem value="agricultural">Agricultural (₹4.00/unit)</MenuItem>
      </TextField>

      <TextField
        fullWidth
        select
        label="New Category Required"
        name="new_category"
        value={formData.new_category}
        onChange={handleChange}
        required
        margin="normal"
      >
        <MenuItem value="residential">Residential (₹5.50-8.50/unit)</MenuItem>
        <MenuItem value="commercial">Commercial (₹9.00/unit)</MenuItem>
        <MenuItem value="industrial">Industrial (₹7.50/unit)</MenuItem>
        <MenuItem value="agricultural">Agricultural (₹4.00/unit)</MenuItem>
      </TextField>

      <TextField
        fullWidth
        select
        label="Reason for Change"
        name="reason"
        value={formData.reason}
        onChange={handleChange}
        required
        margin="normal"
      >
        <MenuItem value="business_started">Started Business</MenuItem>
        <MenuItem value="business_closed">Business Closed</MenuItem>
        <MenuItem value="change_of_use">Change of Property Use</MenuItem>
        <MenuItem value="farming_activity">Starting Farming Activity</MenuItem>
        <MenuItem value="industrial_setup">Industrial Setup</MenuItem>
        <MenuItem value="other">Other</MenuItem>
      </TextField>

      <TextField
        fullWidth
        label="Contact Number"
        name="contact_number"
        value={formData.contact_number}
        onChange={handleChange}
        required
        margin="normal"
        inputProps={{ maxLength: 10 }}
      />

      <Alert severity="warning" sx={{ mt: 2 }}>
        <strong>Documents Required:</strong>
        <ul style={{ marginTop: 8, marginBottom: 0 }}>
          <li>Property ownership proof</li>
          <li>Business registration (for commercial)</li>
          <li>Land documents (for agricultural)</li>
          <li>Industrial license (for industrial)</li>
        </ul>
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
        <Button variant="outlined" fullWidth onClick={onClose}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default CategoryChangeForm;
