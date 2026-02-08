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
  Card,
  CardContent,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { CheckCircle as SuccessIcon, LocalShipping } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';

// Kiosk Cylinder Booking - Simplified Logic:
// 1. Ask for Registered Mobile Number
// 2. Send OTP
// 3. Allow booking if: 15-day rule satisfied (backend check) + Connection is active
// Kiosk should NOT: Handle DAC logic, Control delivery, Handle stock availability

const GasCylinderBookingForm = ({ onClose }) => {
  const [step, setStep] = useState('mobile'); // mobile -> otp -> booking -> success
  const [loading, setLoading] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [consumerData, setConsumerData] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [formData, setFormData] = useState({
    quantity: 1,
    delivery_preference: 'home_delivery',
  });

  // Step 1: Send OTP to registered mobile
  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      toast.error('Please enter valid 10-digit registered mobile number');
      return;
    }
    setLoading(true);
    try {
      // In production, this would send actual OTP via SMS gateway
      // For kiosk demo, simulate OTP sent
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOtpSent(true);
      setStep('otp');
      toast.success('OTP sent to your registered mobile number');
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and fetch consumer
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      // For demo, accept OTP 123456
      if (otp !== '123456') {
        toast.error('Invalid OTP. Use 123456 for demo.');
        setLoading(false);
        return;
      }
      
      // Fetch consumer by mobile number from gas_consumers table
      const response = await api.get(`/gas/applications/consumer-by-mobile/${mobileNumber}`);
      
      if (response.data.success && response.data.data) {
        const consumer = response.data.data;
        setConsumerData({
          consumer_number: consumer.consumer_number,
          full_name: consumer.full_name,
          address: consumer.address,
          mobile: consumer.mobile,
          gas_type: consumer.gas_type,
          connection_active: consumer.connection_status === 'active',
        });
        setStep('booking');
        toast.success('Mobile verified successfully!');
      } else {
        toast.error('No active connection found for this mobile number');
      }
    } catch (error) {
      console.error('Verification error:', error);
      const msg = error.response?.data?.message || 'Verification failed';
      if (msg.includes('No active consumer') || msg.includes('not found')) {
        toast.error('No active gas connection found for this mobile number. Please check the number or apply for a new connection.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Book cylinder
  const handleBookCylinder = async () => {
    setLoading(true);
    try {
      const response = await api.post('/gas/applications/cylinder-booking', {
        consumer_number: consumerData?.consumer_number,
        mobile: mobileNumber,
        quantity: formData.quantity,
        delivery_preference: formData.delivery_preference,
      });

      if (response.data.success) {
        setBookingData(response.data.data);
        setStep('success');
        toast.success('LPG refill booked successfully!');
      }
    } catch (error) {
      console.error('Booking error:', error);
      const msg = error.response?.data?.message || 'Booking failed';
      // Check for 15-day rule violation
      if (msg.includes('15-day') || msg.includes('too soon')) {
        toast.error('Cannot book: 15-day interval not met since last refill');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (step === 'success') {
    return (
      <Box>
        <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white' }}>
          <Typography variant="h5" fontWeight={600}>✓ LPG Refill Booked</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" color="success.main" gutterBottom>Booking Confirmed!</Typography>
          <Typography variant="h6" gutterBottom>Booking Number:</Typography>
          <Chip label={bookingData?.booking_number || 'GCB-PENDING'} color="success" sx={{ fontSize: '1.5rem', py: 3, px: 4, mb: 3 }} />
          <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 2, mt: 3, textAlign: 'left' }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Consumer</Typography>
                <Typography fontWeight="bold">{consumerData?.full_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Quantity</Typography>
                <Typography fontWeight="bold">{formData.quantity} Cylinder(s)</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Delivery</Typography>
                <Typography fontWeight="bold">{formData.delivery_preference === 'home_delivery' ? 'Home Delivery' : 'Self Pickup'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Estimated Delivery</Typography>
                <Typography fontWeight="bold">{bookingData?.estimated_delivery || '3-5 days'}</Typography>
              </Grid>
            </Grid>
          </Box>
          <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              • Delivery confirmation via OTP on {mobileNumber}<br />
              • Payment on delivery or online<br />
              • Track using booking number<br />
              • Stock availability & delivery handled by distributor
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose} fullWidth color="success">Close</Button>
        </DialogActions>
      </Box>
    );
  }

  return (
    <Box>
      <DialogTitle sx={{ bgcolor: '#e91e63', color: 'white' }}>
        <Typography variant="h5" fontWeight={600}>⛽ Book LPG Refill</Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>OTP-based authentication</Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {/* Step 1: Mobile Number */}
        {step === 'mobile' && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Enter your registered mobile number to book LPG cylinder refill.
              An OTP will be sent for verification.
            </Alert>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>Demo:</strong> Use these registered mobiles: <strong>9812345678</strong> (Rajesh Kumar), 
              <strong>9812345679</strong> (Priya Sharma), or <strong>9812345681</strong> (Amit Patel - LPG). 
              OTP is <strong>123456</strong>
            </Alert>
            <TextField
              fullWidth
              label="Registered Mobile Number / पंजीकृत मोबाइल नंबर"
              placeholder="Enter 10-digit mobile number"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              sx={{ mb: 3 }}
              inputProps={{ maxLength: 10 }}
            />
            <Button
              fullWidth variant="contained" size="large"
              sx={{ bgcolor: '#e91e63', '&:hover': { bgcolor: '#c2185b' } }}
              onClick={handleSendOtp} disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Send OTP'}
            </Button>
          </Box>
        )}

        {/* Step 2: OTP Verification */}
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
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 6 }}
            />
            <Button
              fullWidth variant="contained" size="large"
              sx={{ bgcolor: '#e91e63', '&:hover': { bgcolor: '#c2185b' } }}
              onClick={handleVerifyOtp} disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify OTP & Continue'}
            </Button>
            <Button fullWidth sx={{ mt: 1 }} onClick={handleSendOtp} disabled={loading}>
              Resend OTP
            </Button>
          </Box>
        )}

        {/* Step 3: Booking */}
        {step === 'booking' && (
          <Box>
            {/* Consumer Details */}
            <Box sx={{ bgcolor: '#fce4ec', p: 2, borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Consumer Details (Verified)</Typography>
              <Typography>{consumerData?.full_name}</Typography>
              <Typography variant="body2" color="text.secondary">Mobile: {mobileNumber}</Typography>
              <Chip label="Connection Active" color="success" size="small" sx={{ mt: 1 }} />
            </Box>

            {/* Quantity */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Quantity</Typography>
            <TextField
              fullWidth type="number" label="Number of Cylinders"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, Math.min(2, parseInt(e.target.value) || 1)) })}
              inputProps={{ min: 1, max: 2 }}
              helperText="Maximum 2 cylinders per booking"
              sx={{ mb: 3 }}
            />

            {/* Delivery Preference */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Delivery Preference</Typography>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <RadioGroup
                value={formData.delivery_preference}
                onChange={(e) => setFormData({ ...formData, delivery_preference: e.target.value })}
              >
                <FormControlLabel value="home_delivery"
                  control={<Radio sx={{ color: '#e91e63', '&.Mui-checked': { color: '#e91e63' } }} />}
                  label="Home Delivery" />
                <FormControlLabel value="pickup"
                  control={<Radio sx={{ color: '#e91e63', '&.Mui-checked': { color: '#e91e63' } }} />}
                  label="Self Pickup from Godown" />
              </RadioGroup>
            </FormControl>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Booking is subject to 15-day interval rule & active connection status.
                DAC logic, delivery scheduling & stock availability are handled by the backend.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        {step === 'otp' && <Button onClick={() => setStep('mobile')}>Back</Button>}
        {step === 'booking' && (
          <>
            <Button onClick={() => setStep('mobile')}>Back</Button>
            <Button variant="contained"
              sx={{ bgcolor: '#e91e63', '&:hover': { bgcolor: '#c2185b' } }}
              onClick={handleBookCylinder} disabled={loading}
              startIcon={<LocalShipping />}
            >
              {loading ? <CircularProgress size={24} /> : 'Book LPG Refill'}
            </Button>
          </>
        )}
      </DialogActions>
    </Box>
  );
};

export default GasCylinderBookingForm;
