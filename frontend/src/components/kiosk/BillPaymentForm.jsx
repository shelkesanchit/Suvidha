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
  CircularProgress,
} from '@mui/material';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const BillPaymentForm = ({ onClose }) => {
  const [consumerNumber, setConsumerNumber] = useState('');
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!consumerNumber) {
      toast.error('Please enter consumer number');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/bills/consumer/${consumerNumber}/unpaid`);
      if (response.data.length > 0) {
        setBill(response.data[0]);
      } else {
        toast.info('No unpaid bills found');
      }
    } catch (error) {
      toast.error('Failed to fetch bills. Please check consumer number.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    toast.success('Payment gateway integration in progress');
    // Payment gateway integration would go here
  };

  return (
    <Box>
      <DialogTitle>
        <Typography variant="h5" fontWeight={600}>
          Pay Electricity Bill
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <TextField
          fullWidth
          label="Consumer Number"
          value={consumerNumber}
          onChange={(e) => setConsumerNumber(e.target.value)}
          sx={{ mb: 2 }}
          helperText="Enter your 12-digit consumer number"
        />
        
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading}
          fullWidth
          sx={{ mb: 3 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Search Bills'}
        </Button>

        {bill && (
          <Box sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Bill Details</Typography>
            <Typography>Bill Number: {bill.bill_number}</Typography>
            <Typography>Billing Month: {bill.billing_month}</Typography>
            <Typography>Units Consumed: {bill.units_consumed}</Typography>
            <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
              Amount: ₹{bill.total_amount}
            </Typography>
            <Typography variant="caption" color="error">
              Due Date: {new Date(bill.due_date).toLocaleDateString()}
            </Typography>
            
            <Button
              variant="contained"
              color="success"
              fullWidth
              sx={{ mt: 3 }}
              onClick={handlePayment}
            >
              Pay Now
            </Button>
          </Box>
        )}

        <Alert severity="info" sx={{ mt: 3 }}>
          For demo purposes, use consumer number: EC2026001234
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Box>
  );
};

export default BillPaymentForm;
