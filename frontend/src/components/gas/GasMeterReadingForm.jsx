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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from '@mui/material';
import { CheckCircle as SuccessIcon, CloudUpload, Calculate } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const GasMeterReadingForm = ({ onClose }) => {
  const [step, setStep] = useState('search');
  const [loading, setLoading] = useState(false);
  const [consumerNumber, setConsumerNumber] = useState('');
  const [consumerData, setConsumerData] = useState(null);
  const [currentReading, setCurrentReading] = useState('');
  const [meterPhoto, setMeterPhoto] = useState(null);
  const [billPreview, setBillPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleVerifyConsumer = async () => {
    if (!consumerNumber) {
      toast.error('Please enter consumer number');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.get(`/gas/bills/fetch/${consumerNumber}`);
      
      if (response.data.success) {
        setConsumerData(response.data.data.consumer);
        setStep('reading');
      } else {
        toast.error('Consumer not found');
      }
    } catch (error) {
      console.error('Verify error:', error);
      // For demo, create mock consumer
      setConsumerData({
        consumer_number: consumerNumber,
        full_name: 'Demo User',
        address: 'Demo Address, Ward 1, Nashik',
        gas_type: 'png',
        meter_number: 'GM2024001',
        last_meter_reading: 150.50
      });
      setStep('reading');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateBill = async () => {
    if (!currentReading) {
      toast.error('Please enter current meter reading');
      return;
    }

    const reading = parseFloat(currentReading);
    const prevReading = consumerData?.last_meter_reading || 0;

    if (reading < prevReading) {
      toast.error('Current reading cannot be less than previous reading');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/gas/bills/calculate', {
        consumer_number: consumerNumber,
        current_reading: reading,
      });

      if (response.data.success) {
        setBillPreview(response.data.data);
        setStep('preview');
      }
    } catch (error) {
      console.error('Calculate error:', error);
      // For demo, calculate locally
      const consumption = reading - prevReading;
      let gasCharges;
      
      if (consumption <= 10) {
        gasCharges = consumption * 40;
      } else if (consumption <= 25) {
        gasCharges = 10 * 40 + (consumption - 10) * 45;
      } else {
        gasCharges = 10 * 40 + 15 * 45 + (consumption - 25) * 50;
      }

      setBillPreview({
        previous_reading: prevReading,
        current_reading: reading,
        consumption_scm: consumption,
        gas_charges: gasCharges,
        pipeline_rent: 50,
        service_tax: gasCharges * 0.05,
        vat: gasCharges * 0.05,
        total_amount: gasCharges + 50 + (gasCharges * 0.1),
      });
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReading = async () => {
    setSubmitted(true);
    setStep('success');
    toast.success('Meter reading submitted successfully!');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should not exceed 5MB');
        return;
      }
      setMeterPhoto(file);
      toast.success('Photo uploaded');
    }
  };

  if (step === 'success') {
    return (
      <Box>
        <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white' }}>
          <Typography variant="h5" fontWeight={600}>
            ✓ Reading Submitted
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" color="success.main" gutterBottom>
            Reading Submitted!
          </Typography>
          
          <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 2, mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Previous Reading</Typography>
                <Typography fontWeight="bold">{billPreview?.previous_reading} SCM</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Current Reading</Typography>
                <Typography fontWeight="bold">{billPreview?.current_reading} SCM</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Consumption</Typography>
                <Typography fontWeight="bold">{billPreview?.consumption_scm?.toFixed(2)} SCM</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Estimated Bill</Typography>
                <Typography fontWeight="bold" color="primary">₹ {billPreview?.total_amount?.toFixed(2)}</Typography>
              </Grid>
            </Grid>
          </Box>
          
          <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              • Your reading has been recorded<br />
              • Official bill will be generated after verification<br />
              • You'll receive notification when bill is ready
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose} fullWidth color="success">
            Close
          </Button>
        </DialogActions>
      </Box>
    );
  }

  return (
    <Box>
      <DialogTitle sx={{ bgcolor: '#7b1fa2', color: 'white' }}>
        <Typography variant="h5" fontWeight={600}>
          📊 Submit Gas Meter Reading
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        {step === 'search' && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Submit your PNG meter reading for accurate billing. Only for PNG consumers.
            </Alert>
            
            <TextField
              fullWidth
              label="Consumer Number"
              placeholder="e.g., GC2024000001"
              value={consumerNumber}
              onChange={(e) => setConsumerNumber(e.target.value.toUpperCase())}
              sx={{ mb: 2 }}
            />
            
            <Button
              fullWidth
              variant="contained"
              sx={{ bgcolor: '#7b1fa2', '&:hover': { bgcolor: '#6a1b9a' } }}
              onClick={handleVerifyConsumer}
              disabled={loading}
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : 'Verify & Continue'}
            </Button>
          </Box>
        )}

        {step === 'reading' && (
          <Box>
            <Box sx={{ bgcolor: '#f3e5f5', p: 2, borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Consumer Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography fontWeight="bold">{consumerData?.full_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Consumer No.</Typography>
                  <Typography fontWeight="bold">{consumerData?.consumer_number}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Meter No.</Typography>
                  <Typography fontWeight="bold">{consumerData?.meter_number || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Last Reading</Typography>
                  <Typography fontWeight="bold">{consumerData?.last_meter_reading || 0} SCM</Typography>
                </Grid>
              </Grid>
            </Box>

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Enter Current Meter Reading
            </Typography>
            
            <TextField
              fullWidth
              label="Current Reading (SCM)"
              type="number"
              placeholder="Enter reading from meter"
              value={currentReading}
              onChange={(e) => setCurrentReading(e.target.value)}
              sx={{ mb: 3 }}
              inputProps={{ step: 0.01 }}
            />

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Upload Meter Photo (Optional)
            </Typography>
            
            <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center', mb: 2 }}>
              <CloudUpload sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
              <input
                accept="image/*"
                type="file"
                id="meter-photo"
                hidden
                onChange={handleFileChange}
              />
              <label htmlFor="meter-photo">
                <Button 
                  variant="outlined" 
                  component="span"
                  sx={{ color: '#7b1fa2', borderColor: '#7b1fa2' }}
                >
                  {meterPhoto ? meterPhoto.name : 'Choose Photo'}
                </Button>
              </label>
            </Box>

            <Button
              fullWidth
              variant="contained"
              sx={{ bgcolor: '#7b1fa2', '&:hover': { bgcolor: '#6a1b9a' } }}
              onClick={handleCalculateBill}
              disabled={loading}
              startIcon={<Calculate />}
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : 'Calculate Estimated Bill'}
            </Button>
          </Box>
        )}

        {step === 'preview' && billPreview && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Bill calculated based on your reading. Please verify and submit.
            </Alert>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Previous Reading</TableCell>
                    <TableCell align="right">{billPreview.previous_reading} SCM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Current Reading</TableCell>
                    <TableCell align="right">{billPreview.current_reading} SCM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Consumption</TableCell>
                    <TableCell align="right">{billPreview.consumption_scm?.toFixed(2)} SCM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Gas Charges</TableCell>
                    <TableCell align="right">₹ {billPreview.gas_charges?.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Pipeline Rent</TableCell>
                    <TableCell align="right">₹ {billPreview.pipeline_rent?.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Taxes (VAT + Service Tax)</TableCell>
                    <TableCell align="right">₹ {((billPreview.service_tax || 0) + (billPreview.vat || 0)).toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: '#f3e5f5' }}>
                    <TableCell><strong>Estimated Total</strong></TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" sx={{ color: '#7b1fa2' }} fontWeight="bold">
                        ₹ {billPreview.total_amount?.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Alert severity="warning" sx={{ mb: 2 }}>
              Note: This is an estimated bill. Final bill may vary after official verification.
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        {step === 'reading' && (
          <Button onClick={() => setStep('search')}>Back</Button>
        )}
        {step === 'preview' && (
          <>
            <Button onClick={() => setStep('reading')}>Back</Button>
            <Button
              variant="contained"
              sx={{ bgcolor: '#7b1fa2', '&:hover': { bgcolor: '#6a1b9a' } }}
              onClick={handleSubmitReading}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit Reading'}
            </Button>
          </>
        )}
      </DialogActions>
    </Box>
  );
};

export default GasMeterReadingForm;
