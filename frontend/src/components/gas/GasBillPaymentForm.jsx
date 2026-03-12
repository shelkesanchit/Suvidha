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
  TableHead,
  TableRow,
  Paper,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const EMI_TENURES = [
  { months: 3, label: '3 Months' },
  { months: 6, label: '6 Months' },
  { months: 9, label: '9 Months' },
  { months: 12, label: '12 Months' },
];

const GasBillPaymentForm = ({ onClose, gasType = 'lpg' }) => {
  const isPNG = gasType === 'png';
  const primaryColor = isPNG ? 'primary' : 'warning';
  const headerColor = isPNG ? '#1565c0' : '#f57c00';

  // Main tab: 0 = Pay Bill, 1 = Billing History, 2 = Download Invoice
  const [mainTab, setMainTab] = useState(0);

  // --- Pay Bill (Tab 0) ---
  const [step, setStep] = useState('search');
  const [loading, setLoading] = useState(false);
  const [consumerNumber, setConsumerNumber] = useState('');
  const [billData, setBillData] = useState(null);
  const [consumerData, setConsumerData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [receiptData, setReceiptData] = useState(null);
  // EMI
  const [emiSelected, setEmiSelected] = useState(false);
  const [emiTenure, setEmiTenure] = useState(3);

  // --- Billing History (Tab 1) ---
  const [historyConsumer, setHistoryConsumer] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // --- Download Invoice (Tab 2) ---
  const [invoiceConsumer, setInvoiceConsumer] = useState('');
  const [invoiceBill, setInvoiceBill] = useState(null);
  const [invoiceConsumerData, setInvoiceConsumerData] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

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
      const payload = {
        consumer_number: consumerNumber,
        bill_number: billData.bill_number,
        amount: billData.total_amount,
        payment_method: emiSelected ? 'emi' : paymentMethod,
        payment_type: emiSelected ? 'emi_payment' : 'bill_payment',
        ...(emiSelected && { emi_tenure: emiTenure }),
      };
      const response = await api.post('/gas/payments/process', payload);
      if (response.data.success) {
        setReceiptData(response.data.data);
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

  const handleFetchHistory = async () => {
    if (!historyConsumer) { toast.error('Please enter consumer number'); return; }
    setHistoryLoading(true);
    try {
      const response = await api.get(`/gas/bills/history/${historyConsumer}`);
      if (response.data.success) {
        setHistoryData(response.data.data);
      } else {
        toast.error(response.data.message || 'History not found');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch billing history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFetchInvoice = async () => {
    if (!invoiceConsumer) { toast.error('Please enter consumer number'); return; }
    setInvoiceLoading(true);
    try {
      const response = await api.get(`/gas/bills/fetch/${invoiceConsumer}`);
      if (response.data.success) {
        const bill = response.data.data.bill;
        setInvoiceBill({
          ...bill,
          gas_charges: parseFloat(bill.gas_charges) || 0,
          pipeline_rent: parseFloat(bill.pipeline_rent) || 0,
          service_tax: parseFloat(bill.service_tax) || 0,
          vat: parseFloat(bill.vat) || 0,
          arrears: parseFloat(bill.arrears) || 0,
          late_fee: parseFloat(bill.late_fee) || 0,
          total_amount: parseFloat(bill.total_amount) || 0,
        });
        setInvoiceConsumerData(response.data.data.consumer);
      } else {
        toast.error(response.data.message || 'Invoice not found');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch invoice');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const emiMonthlyAmount = emiSelected && billData
    ? (billData.arrears / emiTenure).toFixed(2)
    : '0.00';

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
      <DialogTitle sx={{ bgcolor: headerColor, color: 'white', pb: 0 }}>
        <Typography variant="h5" fontWeight={600}>
          {isPNG ? '🔵 PNG Billing & Payments' : '💳 LPG Billing & Payments'}
        </Typography>
        <Tabs
          value={mainTab}
          onChange={(_, v) => { setMainTab(v); setStep('search'); }}
          sx={{
            mt: 1,
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' },
            '& .Mui-selected': { color: 'white' },
            '& .MuiTabs-indicator': { bgcolor: 'white' },
          }}
        >
          <Tab icon={<PaymentIcon />} label="Pay Bill" iconPosition="start" />
          <Tab icon={<HistoryIcon />} label="Billing History" iconPosition="start" />
          <Tab icon={<DownloadIcon />} label="Download Invoice" iconPosition="start" />
        </Tabs>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>

        {/* ── Tab 0: Pay Bill ─────────────────────────────────────────────── */}
        {mainTab === 0 && (
          <>
            {step === 'search' && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Enter your {isPNG ? 'PNG' : 'LPG'} Consumer Number to view and pay your bill
                </Alert>
                <TextField
                  fullWidth
                  label="Consumer Number / उपभोक्ता नंबर"
                  placeholder={isPNG ? 'e.g., PNG2024000001' : 'e.g., GC2024000001'}
                  value={consumerNumber}
                  onChange={(e) => setConsumerNumber(e.target.value.toUpperCase())}
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  color={primaryColor}
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
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Consumer Details</Typography>
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
                      <TableRow><TableCell>Bill Number</TableCell><TableCell align="right">{billData.bill_number}</TableCell></TableRow>
                      <TableRow><TableCell>Bill Month</TableCell><TableCell align="right">{billData.bill_month}</TableCell></TableRow>
                      <TableRow><TableCell>Due Date</TableCell><TableCell align="right">{billData.due_date}</TableCell></TableRow>
                      <TableRow>
                        <TableCell>Meter Reading (Previous → Current)</TableCell>
                        <TableCell align="right">{billData.previous_reading} → {billData.current_reading} SCM</TableCell>
                      </TableRow>
                      <TableRow><TableCell>Consumption</TableCell><TableCell align="right">{billData.consumption_scm} SCM</TableCell></TableRow>
                      <TableRow><TableCell>Gas Charges</TableCell><TableCell align="right">₹ {billData.gas_charges}</TableCell></TableRow>
                      <TableRow><TableCell>Pipeline Rent</TableCell><TableCell align="right">₹ {billData.pipeline_rent}</TableCell></TableRow>
                      <TableRow><TableCell>Taxes</TableCell><TableCell align="right">₹ {(billData.service_tax + billData.vat).toFixed(2)}</TableCell></TableRow>
                      {billData.arrears > 0 && (
                        <TableRow sx={{ bgcolor: '#fff3e0' }}>
                          <TableCell><Typography color="error" fontWeight="bold">Arrears (Overdue)</Typography></TableCell>
                          <TableCell align="right"><Typography color="error" fontWeight="bold">₹ {billData.arrears}</Typography></TableCell>
                        </TableRow>
                      )}
                      {billData.late_fee > 0 && (
                        <TableRow><TableCell>Late Fee</TableCell><TableCell align="right" sx={{ color: 'error.main' }}>₹ {billData.late_fee}</TableCell></TableRow>
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

                {/* EMI Option — shown only when there are arrears */}
                {billData.arrears > 0 && (
                  <Box sx={{ mb: 3, p: 2, border: '2px solid #ff9800', borderRadius: 2 }}>
                    <FormControlLabel
                      control={
                        <Radio
                          checked={emiSelected}
                          onChange={() => setEmiSelected(!emiSelected)}
                          color="warning"
                        />
                      }
                      label={
                        <Typography fontWeight="bold" color="warning.dark">
                          📅 Pay Arrears in EMI — ₹ {billData.arrears} overdue
                        </Typography>
                      }
                    />
                    {emiSelected && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Select EMI Tenure:
                        </Typography>
                        <Grid container spacing={1}>
                          {EMI_TENURES.map((t) => (
                            <Grid item xs={3} key={t.months}>
                              <Box
                                onClick={() => setEmiTenure(t.months)}
                                sx={{
                                  border: '2px solid',
                                  borderColor: emiTenure === t.months ? 'warning.main' : 'grey.300',
                                  borderRadius: 1,
                                  p: 1,
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  bgcolor: emiTenure === t.months ? '#fff3e0' : 'white',
                                }}
                              >
                                <Typography fontWeight="bold" color="warning.dark" variant="body2">{t.label}</Typography>
                                <Typography variant="caption">₹ {(billData.arrears / t.months).toFixed(0)}/mo</Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                        <Alert severity="info" sx={{ mt: 2 }}>
                          1st EMI: ₹ {emiMonthlyAmount} + Current bill: ₹ {(billData.total_amount - billData.arrears).toFixed(2)} ={' '}
                          <strong>₹ {(parseFloat(emiMonthlyAmount) + billData.total_amount - billData.arrears).toFixed(2)}</strong> today
                        </Alert>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Payment Method — hidden when EMI is selected */}
                {!emiSelected && (
                  <>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Select Payment Method</Typography>
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                      <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} row>
                        <FormControlLabel value="upi" control={<Radio color={primaryColor} />} label="UPI" />
                        <FormControlLabel value="card" control={<Radio color={primaryColor} />} label="Card" />
                        <FormControlLabel value="netbanking" control={<Radio color={primaryColor} />} label="Net Banking" />
                        <FormControlLabel value="wallet" control={<Radio color={primaryColor} />} label="Wallet" />
                      </RadioGroup>
                    </FormControl>
                  </>
                )}
              </Box>
            )}
          </>
        )}

        {/* ── Tab 1: Billing History & Statements ─────────────────────────── */}
        {mainTab === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Enter your consumer number to view billing history and statements
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Consumer Number"
                placeholder={isPNG ? 'PNG2024XXXXXX' : 'GC2024XXXXXX'}
                value={historyConsumer}
                onChange={(e) => setHistoryConsumer(e.target.value.toUpperCase())}
              />
              <Button
                variant="contained"
                color={primaryColor}
                onClick={handleFetchHistory}
                disabled={historyLoading}
                sx={{ minWidth: 130 }}
              >
                {historyLoading ? <CircularProgress size={20} /> : 'View History'}
              </Button>
            </Box>
            {historyData && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: isPNG ? '#e3f2fd' : '#fff3e0' }}>
                      <TableCell><strong>Bill Month</strong></TableCell>
                      <TableCell><strong>Bill Number</strong></TableCell>
                      <TableCell align="right"><strong>Amount (₹)</strong></TableCell>
                      <TableCell><strong>Due Date</strong></TableCell>
                      <TableCell align="center"><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No billing history found</TableCell>
                      </TableRow>
                    ) : (
                      historyData.map((bill, i) => (
                        <TableRow key={i} hover>
                          <TableCell>{bill.bill_month}</TableCell>
                          <TableCell>{bill.bill_number}</TableCell>
                          <TableCell align="right">₹ {parseFloat(bill.total_amount || 0).toFixed(2)}</TableCell>
                          <TableCell>{bill.due_date}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={bill.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                              color={bill.payment_status === 'paid' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* ── Tab 2: Download / Print Invoice ─────────────────────────────── */}
        {mainTab === 2 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Enter your consumer number to view and print/download your current bill invoice
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Consumer Number"
                placeholder={isPNG ? 'PNG2024XXXXXX' : 'GC2024XXXXXX'}
                value={invoiceConsumer}
                onChange={(e) => setInvoiceConsumer(e.target.value.toUpperCase())}
              />
              <Button
                variant="contained"
                color={primaryColor}
                onClick={handleFetchInvoice}
                disabled={invoiceLoading}
                sx={{ minWidth: 130 }}
              >
                {invoiceLoading ? <CircularProgress size={20} /> : 'Fetch Invoice'}
              </Button>
            </Box>
            {invoiceBill && invoiceConsumerData && (
              <Paper variant="outlined" sx={{ p: 3 }}>
                {/* Invoice Header */}
                <Box
                  sx={{
                    textAlign: 'center',
                    mb: 3,
                    borderBottom: '2px solid',
                    borderColor: headerColor,
                    pb: 2,
                  }}
                >
                  <Typography variant="h5" fontWeight="bold" color={headerColor}>
                    {isPNG ? 'PNG Gas Bill Invoice' : 'LPG Gas Bill Invoice'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Municipal Gas Distribution Department
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    City Gas Distribution Corporation Ltd.
                  </Typography>
                </Box>
                {/* Consumer & Bill Info */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Consumer Name</Typography>
                    <Typography fontWeight="bold">{invoiceConsumerData.full_name}</Typography>
                    <Typography variant="body2">{invoiceConsumerData.address}</Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">Consumer Number</Typography>
                    <Typography fontWeight="bold">{invoiceConsumerData.consumer_number}</Typography>
                    <Typography variant="body2">Bill: {invoiceBill.bill_number}</Typography>
                    <Typography variant="body2">Period: {invoiceBill.bill_month}</Typography>
                    <Typography variant="body2" color="error">Due: {invoiceBill.due_date}</Typography>
                  </Grid>
                </Grid>
                {/* Invoice Breakdown */}
                <TableContainer sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Gas Charges</TableCell>
                        <TableCell align="right">₹ {invoiceBill.gas_charges?.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Pipeline / Cylinder Rent</TableCell>
                        <TableCell align="right">₹ {invoiceBill.pipeline_rent?.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Taxes (GST / VAT)</TableCell>
                        <TableCell align="right">
                          ₹ {((invoiceBill.service_tax || 0) + (invoiceBill.vat || 0)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                      {invoiceBill.arrears > 0 && (
                        <TableRow>
                          <TableCell sx={{ color: 'error.main' }}>Previous Arrears</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>
                            ₹ {invoiceBill.arrears?.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )}
                      {invoiceBill.late_fee > 0 && (
                        <TableRow>
                          <TableCell sx={{ color: 'error.main' }}>Late Fee</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>
                            ₹ {invoiceBill.late_fee?.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow sx={{ bgcolor: isPNG ? '#e3f2fd' : '#fff3e0' }}>
                        <TableCell><Typography fontWeight="bold">TOTAL PAYABLE</Typography></TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" fontWeight="bold" color={isPNG ? 'primary.dark' : 'warning.dark'}>
                            ₹ {invoiceBill.total_amount?.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ textAlign: 'center', mb: 2 }}
                >
                  Computer-generated invoice. Helpline: 1906 | gas@suvidha.gov.in
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color={primaryColor}
                    startIcon={<PrintIcon />}
                    onClick={() => window.print()}
                  >
                    Print / Download Invoice
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        {mainTab === 0 && step === 'bill' && (
          <>
            <Button onClick={() => setStep('search')}>Back</Button>
            <Button
              variant="contained"
              color={primaryColor}
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : emiSelected ? (
                `Pay ₹ ${(parseFloat(emiMonthlyAmount) + billData.total_amount - billData.arrears).toFixed(2)} Now`
              ) : (
                `Pay ₹ ${billData?.total_amount}`
              )}
            </Button>
          </>
        )}
      </DialogActions>
    </Box>
  );
};

export default GasBillPaymentForm;
