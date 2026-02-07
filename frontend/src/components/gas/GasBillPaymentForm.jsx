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
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Divider,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { CheckCircle as SuccessIcon, Receipt } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const GasBillPaymentForm = ({ onClose, gasType = 'lpg' }) => {
  const isPNG = gasType === 'png';
  const [step, setStep] = useState('search');
  const [loading, setLoading] = useState(false);
  const [consumerNumber, setConsumerNumber] = useState('');
  const [billData, setBillData] = useState(null);
  const [consumerData, setConsumerData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const handleFetchBill = async () => {
    if (!consumerNumber) {
      toast.error('Please enter consumer number');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.get(`/gas/bills/fetch/${consumerNumber}`);
      
      if (response.data.success) {
        // Convert string numbers to actual numbers
        const bill = response.data.data.bill;
        const processedBill = {
          ...bill,
          previous_reading: parseFloat(bill.previous_reading) || 0,
          current_reading: parseFloat(bill.current_reading) || 0,
          consumption_scm: parseFloat(bill.consumption_scm) || 0,
          gas_charges: parseFloat(bill.gas_charges) || 0,
          pipeline_rent: parseFloat(bill.pipeline_rent) || 0,
          service_tax: parseFloat(bill.service_tax) || 0,
          vat: parseFloat(bill.vat) || 0,
          other_charges: parseFloat(bill.other_charges) || 0,
          arrears: parseFloat(bill.arrears) || 0,
          late_fee: parseFloat(bill.late_fee) || 0,
          total_amount: parseFloat(bill.total_amount) || 0,
        };
        
        setBillData(processedBill);
        setConsumerData(response.data.data.consumer);
        setStep('bill');
      } else {
        toast.error(response.data.message || 'Bill not found');
      }
    } catch (error) {
      console.error('Fetch bill error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await api.post('/gas/payments/process', {
        consumer_number: consumerNumber,
        bill_number: billData.bill_number,
        amount: billData.total_amount,
        payment_method: paymentMethod,
        payment_type: 'bill_payment'
      });
      
      if (response.data.success) {
        setReceiptData(response.data.data);
        setPaymentSuccess(true);
        setStep('success');
        toast.success('Payment successful!');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <Box>
        <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white' }}>
          <Typography variant="h5" fontWeight={600}>
            ✓ Payment Successful
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" color="success.main" gutterBottom>
            Payment Completed!
          </Typography>
          
          <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 2, mt: 3, textAlign: 'left' }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Transaction ID</Typography>
                <Typography fontWeight="bold">{receiptData?.transaction_id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Receipt Number</Typography>
                <Typography fontWeight="bold">{receiptData?.receipt_number}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Amount Paid</Typography>
                <Typography fontWeight="bold" color="success.main">₹ {receiptData?.amount}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                <Typography fontWeight="bold">{receiptData?.payment_method?.toUpperCase()}</Typography>
              </Grid>
            </Grid>
          </Box>
          
          <Alert severity="success" sx={{ mt: 3 }}>
            Receipt sent to your registered mobile number
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
      <DialogTitle sx={{ bgcolor: isPNG ? '#1565c0' : '#f57c00', color: 'white' }}>
        <Typography variant="h5" fontWeight={600}>
          {isPNG ? '🔵 PNG Bill Payment' : '💳 LPG Bill Payment'}
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        {step === 'search' && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Enter your {isPNG ? 'PNG' : 'LPG'} Consumer Number to view and pay your bill
            </Alert>
            
            <TextField
              fullWidth
              label="Consumer Number / उपभोक्ता नंबर"
              placeholder={isPNG ? "e.g., PNG2024000001" : "e.g., GC2024000001"}
              value={consumerNumber}
              onChange={(e) => setConsumerNumber(e.target.value.toUpperCase())}
              sx={{ mb: 2 }}
            />
            
            <Button
              fullWidth
              variant="contained"
              color={isPNG ? 'primary' : 'warning'}
              onClick={handleFetchBill}
              disabled={loading}
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : 'Fetch Bill'}
            </Button>
          </Box>
        )}

        {step === 'bill' && billData && (
          <Box>
            {/* Consumer Details */}
            <Box sx={{ bgcolor: isPNG ? '#e3f2fd' : '#fff3e0', p: 2, borderRadius: 2, mb: 3 }}>
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
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Address</Typography>
                  <Typography>{consumerData?.address}</Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Bill Details */}
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Bill Number</TableCell>
                    <TableCell align="right">{billData.bill_number}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Bill Month</TableCell>
                    <TableCell align="right">{billData.bill_month}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">{billData.due_date}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Meter Reading (Previous → Current)</TableCell>
                    <TableCell align="right">{billData.previous_reading} → {billData.current_reading} SCM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Consumption</TableCell>
                    <TableCell align="right">{billData.consumption_scm} SCM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Gas Charges</TableCell>
                    <TableCell align="right">₹ {billData.gas_charges}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Pipeline Rent</TableCell>
                    <TableCell align="right">₹ {billData.pipeline_rent}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Taxes</TableCell>
                    <TableCell align="right">₹ {(billData.service_tax + billData.vat).toFixed(2)}</TableCell>
                  </TableRow>
                  {billData.arrears > 0 && (
                    <TableRow>
                      <TableCell>Arrears</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>₹ {billData.arrears}</TableCell>
                    </TableRow>
                  )}
                  <TableRow sx={{ bgcolor: isPNG ? '#e3f2fd' : '#fff3e0' }}>
                    <TableCell><strong>Total Amount</strong></TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color={isPNG ? 'primary.dark' : 'warning.dark'} fontWeight="bold">
                        ₹ {billData.total_amount}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Payment Method */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Select Payment Method
            </Typography>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                row
              >
                <FormControlLabel value="upi" control={<Radio color={isPNG ? 'primary' : 'warning'} />} label="UPI" />
                <FormControlLabel value="card" control={<Radio color={isPNG ? 'primary' : 'warning'} />} label="Card" />
                <FormControlLabel value="netbanking" control={<Radio color={isPNG ? 'primary' : 'warning'} />} label="Net Banking" />
                <FormControlLabel value="wallet" control={<Radio color={isPNG ? 'primary' : 'warning'} />} label="Wallet" />
              </RadioGroup>
            </FormControl>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        {step === 'bill' && (
          <>
            <Button onClick={() => setStep('search')}>Back</Button>
            <Button
              variant="contained"
              color={isPNG ? 'primary' : 'warning'}
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : `Pay ₹ ${billData?.total_amount}`}
            </Button>
          </>
        )}
      </DialogActions>
    </Box>
  );
};

export default GasBillPaymentForm;
