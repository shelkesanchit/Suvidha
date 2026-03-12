import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Receipt,
  CreditCard,
  QrCode2,
  AccountBalance,
  Money,
  History as HistoryIcon,
  LocalShipping as TankerIcon,
  Opacity as SewerIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const paymentMethods = [
  { value: 'upi', label: 'UPI', icon: <QrCode2 /> },
  { value: 'card', label: 'Credit/Debit Card', icon: <CreditCard /> },
  { value: 'netbanking', label: 'Net Banking', icon: <AccountBalance /> },
  { value: 'cash', label: 'Cash at Counter', icon: <Money /> },
];

const mockConsumptionHistory = [
  { month: 'Jan 2026', reading_prev: 4520, reading_curr: 4680, consumption: 16, amount: 508.80, status: 'Unpaid' },
  { month: 'Dec 2025', reading_prev: 4360, reading_curr: 4520, consumption: 16, amount: 501.60, status: 'Paid' },
  { month: 'Nov 2025', reading_prev: 4200, reading_curr: 4360, consumption: 16, amount: 498.40, status: 'Paid' },
  { month: 'Oct 2025', reading_prev: 4060, reading_curr: 4200, consumption: 14, amount: 463.20, status: 'Paid' },
  { month: 'Sep 2025', reading_prev: 3920, reading_curr: 4060, consumption: 14, amount: 460.90, status: 'Paid' },
  { month: 'Aug 2025', reading_prev: 3760, reading_curr: 3920, consumption: 16, amount: 501.60, status: 'Paid' },
];

const WaterBillPaymentForm = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [billData, setBillData] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [tankerConsumerNo, setTankerConsumerNo] = useState('');
  const [tankerBill, setTankerBill] = useState(null);
  const [tankerLoading, setTankerLoading] = useState(false);
  const [tankerPaymentSuccess, setTankerPaymentSuccess] = useState(false);
  const [formData, setFormData] = useState({
    consumer_number: '',
    mobile: '',
    payment_method: 'upi',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const fetchBill = async () => {
    if (!formData.consumer_number) {
      toast.error('Please enter Consumer Number (CCN)');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const mockBill = {
        consumer_number: formData.consumer_number,
        consumer_name: 'Rajesh Kumar',
        father_name: 'Ramesh Kumar',
        address: '45-A, Green Valley Apartments, Ward 3',
        property_id: 'PROP-2024-12345',
        connection_type: 'Domestic / Metered',
        meter_no: 'WM-' + formData.consumer_number,
        bill_month: 'January 2026',
        bill_date: '01-Jan-2026',
        due_date: '15-Feb-2026',
        previous_reading: 4520,
        current_reading: 4680,
        consumption_kl: 16,
        water_charges: 400.00,
        sewerage_charges: 80.00,
        service_tax: 28.80,
        arrears: 0,
        late_fee: 0,
        total_amount: 508.80,
        status: 'Unpaid',
      };
      setBillData(mockBill);
      setStep(2);
      setLoading(false);
      toast.success('Bill fetched successfully!');
    }, 1500);
  };

  const handlePayment = async () => {
    setLoading(true);
    setTimeout(() => {
      const txnId = 'WTR' + Date.now();
      setTransactionId(txnId);
      setPaymentSuccess(true);
      setLoading(false);
      toast.success('Payment successful!');
    }, 2000);
  };

  const fetchTankerBill = () => {
    if (!tankerConsumerNo) {
      toast.error('Please enter Consumer Number');
      return;
    }
    setTankerLoading(true);
    setTimeout(() => {
      setTankerBill({
        consumer_number: tankerConsumerNo,
        consumer_name: 'Rajesh Kumar',
        tanker_deliveries: [
          { date: '12-Jan-2026', volume_kl: 4, rate_per_kl: 120, amount: 480, status: 'Unpaid' },
          { date: '05-Jan-2026', volume_kl: 4, rate_per_kl: 120, amount: 480, status: 'Paid' },
        ],
        total_unpaid: 480,
      });
      setTankerLoading(false);
    }, 1200);
  };

  const handleTankerPayment = () => {
    setTankerLoading(true);
    setTimeout(() => {
      setTankerPaymentSuccess(true);
      setTankerLoading(false);
      toast.success('Tanker charges paid successfully!');
    }, 1500);
  };

  if (paymentSuccess) {
    return (
      <Box>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" color="success.main" gutterBottom>Payment Successful!</Typography>
          <Chip label={transactionId} color="primary" sx={{ fontSize: '1.1rem', py: 2, px: 3, mb: 3 }} />
          <Box sx={{ bgcolor: '#e8f5e9', p: 3, borderRadius: 2 }}>
            <Typography variant="body1" gutterBottom><strong>Consumer Number:</strong> {billData?.consumer_number}</Typography>
            <Typography variant="body1" gutterBottom><strong>Amount Paid:</strong> ₹{billData?.total_amount?.toFixed(2)}</Typography>
            <Typography variant="body1" gutterBottom><strong>Bill Month:</strong> {billData?.bill_month}</Typography>
            <Typography variant="body1"><strong>Payment Method:</strong> {paymentMethods.find(m => m.value === formData.payment_method)?.label}</Typography>
          </Box>
          <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
            Receipt sent to registered mobile • Payment updated within 24 hours • Helpline: 1916
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose} fullWidth>Close</Button>
        </DialogActions>
      </Box>
    );
  }

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(e, val) => { setActiveTab(val); setStep(1); setBillData(null); }}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<Receipt />} label="Pay Water Bill" iconPosition="start" />
        <Tab icon={<SewerIcon />} label="Sewerage Charges" iconPosition="start" />
        <Tab icon={<HistoryIcon />} label="Consumption History" iconPosition="start" />
        <Tab icon={<TankerIcon />} label="Tanker Charges" iconPosition="start" />
      </Tabs>

      <DialogContent sx={{ mt: 1 }}>
        {/* Tab 0: Pay Water Bill */}
        {activeTab === 0 && (
          <Box>
            {step === 1 && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>Enter your Consumer Number (CCN / RR Number) to view bill</Alert>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField fullWidth required label="Consumer Number (CCN) *" name="consumer_number"
                      value={formData.consumer_number} onChange={handleChange}
                      placeholder="E.g., WTR2024001234"
                      helperText="Consumer Number is printed on your water bill" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Mobile Number (for receipt)" name="mobile"
                      value={formData.mobile} onChange={handleChange}
                      placeholder="10-digit mobile" inputProps={{ maxLength: 10 }} />
                  </Grid>
                </Grid>
              </Box>
            )}
            {step === 2 && billData && (
              <Box>
                <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} /> Consumer Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}><Typography variant="body2" color="textSecondary">Consumer Number</Typography><Typography fontWeight={600}>{billData.consumer_number}</Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2" color="textSecondary">Consumer Name</Typography><Typography fontWeight={600}>{billData.consumer_name}</Typography></Grid>
                      <Grid item xs={12}><Typography variant="body2" color="textSecondary">Address</Typography><Typography>{billData.address}</Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2" color="textSecondary">Connection Type</Typography><Typography>{billData.connection_type}</Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2" color="textSecondary">Meter No</Typography><Typography>{billData.meter_no}</Typography></Grid>
                    </Grid>
                  </CardContent>
                </Card>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">Bill Details - {billData.bill_month}</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}><Typography variant="body2" color="textSecondary">Previous Reading</Typography><Typography>{billData.previous_reading} KL</Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2" color="textSecondary">Current Reading</Typography><Typography>{billData.current_reading} KL</Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2" color="textSecondary">Consumption</Typography><Typography>{billData.consumption_kl} KL</Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2" color="textSecondary">Due Date</Typography><Typography color="error">{billData.due_date}</Typography></Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 1 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={8}><Typography>Water Charges</Typography></Grid>
                        <Grid item xs={4} textAlign="right"><Typography>₹{billData.water_charges.toFixed(2)}</Typography></Grid>
                        <Grid item xs={8}><Typography>Sewerage Charges</Typography></Grid>
                        <Grid item xs={4} textAlign="right"><Typography>₹{billData.sewerage_charges.toFixed(2)}</Typography></Grid>
                        <Grid item xs={8}><Typography>Service Tax</Typography></Grid>
                        <Grid item xs={4} textAlign="right"><Typography>₹{billData.service_tax.toFixed(2)}</Typography></Grid>
                      </Grid>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h5" color="primary" fontWeight={700}>Total Amount:</Typography>
                      <Typography variant="h4" color="primary" fontWeight={700}>₹{billData.total_amount.toFixed(2)}</Typography>
                    </Box>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <FormControl component="fieldset" fullWidth>
                      <FormLabel><Typography variant="h6" color="primary">Select Payment Method</Typography></FormLabel>
                      <RadioGroup name="payment_method" value={formData.payment_method} onChange={handleChange}>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {paymentMethods.map((method) => (
                            <Grid item xs={6} key={method.value}>
                              <Box sx={{ border: formData.payment_method === method.value ? '2px solid #4facfe' : '1px solid #e0e0e0', borderRadius: 2, p: 2, cursor: 'pointer', bgcolor: formData.payment_method === method.value ? '#e3f2fd' : 'white', '&:hover': { borderColor: '#4facfe' } }}
                                onClick={() => setFormData({ ...formData, payment_method: method.value })}>
                                <FormControlLabel value={method.value} control={<Radio />}
                                  label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{method.icon}<Typography>{method.label}</Typography></Box>} />
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </RadioGroup>
                    </FormControl>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        )}

        {/* Tab 1: Sewerage Charges */}
        {activeTab === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Sewerage / drainage charges are levied separately for properties connected to the municipal sewer network.
            </Alert>
            {step === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField fullWidth required label="Consumer Number (CCN) *" name="consumer_number"
                    value={formData.consumer_number} onChange={handleChange} placeholder="E.g., WTR2024001234" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} />
                </Grid>
              </Grid>
            )}
            {step === 2 && billData && (
              <Box>
                <Card sx={{ mb: 3, bgcolor: '#e8f5e9' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>Sewerage Charge Breakup</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}><Typography variant="body2" color="textSecondary">Consumer</Typography><Typography fontWeight={600}>{billData.consumer_name}</Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2" color="textSecondary">Sewer Connection</Typography><Typography>Yes — Active</Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2" color="textSecondary">Month</Typography><Typography>{billData.bill_month}</Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2" color="textSecondary">Due Date</Typography><Typography color="error">{billData.due_date}</Typography></Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 1 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={8}><Typography>Sewerage Connection Charge</Typography></Grid>
                        <Grid item xs={4} textAlign="right"><Typography>₹60.00</Typography></Grid>
                        <Grid item xs={8}><Typography>Drainage Maintenance</Typography></Grid>
                        <Grid item xs={4} textAlign="right"><Typography>₹15.00</Typography></Grid>
                        <Grid item xs={8}><Typography>GST (5%)</Typography></Grid>
                        <Grid item xs={4} textAlign="right"><Typography>₹3.75</Typography></Grid>
                      </Grid>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h5" color="primary" fontWeight={700}>Total:</Typography>
                      <Typography variant="h4" color="primary" fontWeight={700}>₹78.75</Typography>
                    </Box>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <FormControl component="fieldset" fullWidth>
                      <FormLabel><Typography variant="h6" color="primary">Select Payment Method</Typography></FormLabel>
                      <RadioGroup name="payment_method" value={formData.payment_method} onChange={handleChange}>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {paymentMethods.map((method) => (
                            <Grid item xs={6} key={method.value}>
                              <Box sx={{ border: formData.payment_method === method.value ? '2px solid #4caf50' : '1px solid #e0e0e0', borderRadius: 2, p: 2, cursor: 'pointer', bgcolor: formData.payment_method === method.value ? '#e8f5e9' : 'white', '&:hover': { borderColor: '#4caf50' } }}
                                onClick={() => setFormData({ ...formData, payment_method: method.value })}>
                                <FormControlLabel value={method.value} control={<Radio />}
                                  label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{method.icon}<Typography>{method.label}</Typography></Box>} />
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </RadioGroup>
                    </FormControl>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        )}

        {/* Tab 2: Consumption History */}
        {activeTab === 2 && (
          <Box>
            {step === 1 && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>Enter your Consumer Number to view the last 6 months of consumption history</Alert>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField fullWidth required label="Consumer Number (CCN) *" name="consumer_number"
                      value={formData.consumer_number} onChange={handleChange} placeholder="E.g., WTR2024001234" />
                  </Grid>
                </Grid>
              </Box>
            )}
            {step === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom color="primary">6-Month Consumption History</Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#e3f2fd' }}>
                      <TableRow>
                        <TableCell><strong>Month</strong></TableCell>
                        <TableCell align="right"><strong>Prev (KL)</strong></TableCell>
                        <TableCell align="right"><strong>Curr (KL)</strong></TableCell>
                        <TableCell align="right"><strong>Used (KL)</strong></TableCell>
                        <TableCell align="right"><strong>Amount</strong></TableCell>
                        <TableCell align="center"><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockConsumptionHistory.map((row) => (
                        <TableRow key={row.month} hover>
                          <TableCell>{row.month}</TableCell>
                          <TableCell align="right">{row.reading_prev}</TableCell>
                          <TableCell align="right">{row.reading_curr}</TableCell>
                          <TableCell align="right">{row.consumption}</TableCell>
                          <TableCell align="right">₹{row.amount.toFixed(2)}</TableCell>
                          <TableCell align="center">
                            <Chip label={row.status} size="small"
                              color={row.status === 'Paid' ? 'success' : 'error'}
                              variant={row.status === 'Paid' ? 'outlined' : 'filled'} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Alert severity="success" sx={{ mt: 2 }}>Avg. monthly consumption: 15.3 KL &nbsp;|&nbsp; Annual total: 92 KL</Alert>
              </Box>
            )}
          </Box>
        )}

        {/* Tab 3: Tanker Water Charges */}
        {activeTab === 3 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>Pay charges for municipal water tanker deliveries to your property</Alert>
            {!tankerBill && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField fullWidth required label="Consumer Number (CCN) *"
                    value={tankerConsumerNo} onChange={(e) => setTankerConsumerNo(e.target.value)}
                    placeholder="E.g., WTR2024001234" />
                </Grid>
              </Grid>
            )}
            {tankerBill && !tankerPaymentSuccess && (
              <Box>
                <Typography variant="h6" gutterBottom color="primary">Tanker Delivery Summary — {tankerBill.consumer_name}</Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#fff3e0' }}>
                      <TableRow>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell align="right"><strong>Volume (KL)</strong></TableCell>
                        <TableCell align="right"><strong>Rate/KL</strong></TableCell>
                        <TableCell align="right"><strong>Amount</strong></TableCell>
                        <TableCell align="center"><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tankerBill.tanker_deliveries.map((row, i) => (
                        <TableRow key={i} hover>
                          <TableCell>{row.date}</TableCell>
                          <TableCell align="right">{row.volume_kl}</TableCell>
                          <TableCell align="right">₹{row.rate_per_kl}</TableCell>
                          <TableCell align="right">₹{row.amount}</TableCell>
                          <TableCell align="center">
                            <Chip label={row.status} size="small" color={row.status === 'Paid' ? 'success' : 'warning'} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                  <Typography variant="h5" color="warning.dark" fontWeight={700}>Total Unpaid:</Typography>
                  <Typography variant="h4" color="warning.dark" fontWeight={700}>₹{tankerBill.total_unpaid}</Typography>
                </Box>
              </Box>
            )}
            {tankerPaymentSuccess && (
              <Box textAlign="center" py={3}>
                <SuccessIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" color="success.main">Tanker Charges Paid!</Typography>
                <Typography variant="body1" mt={1}>Transaction ID: TKR{Date.now()}</Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        {/* Tab 0 actions */}
        {activeTab === 0 && step === 1 && (
          <Button variant="contained" onClick={fetchBill} disabled={loading}
            sx={{ bgcolor: '#4facfe', '&:hover': { bgcolor: '#0288d1' } }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Fetch Bill'}
          </Button>
        )}
        {activeTab === 0 && step === 2 && (
          <>
            <Button variant="outlined" onClick={() => setStep(1)}>Back</Button>
            <Button variant="contained" onClick={handlePayment} disabled={loading}
              sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : `Pay ₹${billData?.total_amount?.toFixed(2)}`}
            </Button>
          </>
        )}
        {/* Tab 1 actions */}
        {activeTab === 1 && step === 1 && (
          <Button variant="contained" onClick={fetchBill} disabled={loading}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Fetch Sewerage Bill'}
          </Button>
        )}
        {activeTab === 1 && step === 2 && (
          <>
            <Button variant="outlined" onClick={() => setStep(1)}>Back</Button>
            <Button variant="contained" onClick={handlePayment} disabled={loading}
              sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Pay ₹78.75'}
            </Button>
          </>
        )}
        {/* Tab 2 actions */}
        {activeTab === 2 && step === 1 && (
          <Button variant="contained" onClick={() => { if (!formData.consumer_number) { toast.error('Enter CCN'); return; } setStep(2); }}
            sx={{ bgcolor: '#1976d2' }}>
            View History
          </Button>
        )}
        {activeTab === 2 && step === 2 && (
          <Button variant="outlined" onClick={() => setStep(1)}>Back</Button>
        )}
        {/* Tab 3 actions */}
        {activeTab === 3 && !tankerBill && !tankerPaymentSuccess && (
          <Button variant="contained" onClick={fetchTankerBill} disabled={tankerLoading}
            sx={{ bgcolor: '#f57c00', '&:hover': { bgcolor: '#e65100' } }}>
            {tankerLoading ? <CircularProgress size={24} color="inherit" /> : 'Fetch Tanker Dues'}
          </Button>
        )}
        {activeTab === 3 && tankerBill && !tankerPaymentSuccess && (
          <>
            <Button variant="outlined" onClick={() => setTankerBill(null)}>Back</Button>
            <Button variant="contained" onClick={handleTankerPayment} disabled={tankerLoading}
              sx={{ bgcolor: '#f57c00', '&:hover': { bgcolor: '#e65100' } }}>
              {tankerLoading ? <CircularProgress size={24} color="inherit" /> : `Pay ₹${tankerBill.total_unpaid}`}
            </Button>
          </>
        )}
      </DialogActions>
    </Box>
  );
};

export default WaterBillPaymentForm;
