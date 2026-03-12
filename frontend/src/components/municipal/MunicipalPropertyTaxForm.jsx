import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, MenuItem, Tabs, Tab,
  DialogContent, DialogActions, Alert, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Radio, RadioGroup, FormControlLabel, Divider,
} from '@mui/material';
import { CheckCircle as SuccessIcon, Download as DownloadIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import DocUpload from './DocUpload';

const HEADER_COLOR = '#1565c0';

const mockReceipts = [
  { year: '2024-25', amount: 4200, date: '12 Apr 2024', receipt: 'PTX2024001' },
  { year: '2023-24', amount: 3900, date: '08 Mar 2024', receipt: 'PTX2023001' },
  { year: '2022-23', amount: 3650, date: '15 Feb 2023', receipt: 'PTX2022001' },
];

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const initialForm = {
  property_id: '', owner_name: '', mobile: '', address: '', ward: '', payment_method: 'upi',
  house_id: '', house_owner: '', house_mobile: '',
  receipt_property_id: '',
  assess_property_id: '', assess_reason: '', current_value: '', requested_value: '', remarks: '',

  new_property_address: '', new_property_type: 'residential', built_area: '', floors: '',
  new_owner_name: '', new_mobile: '', construction_year: '',
};

const MunicipalPropertyTaxForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [billData, setBillData] = useState(null);
  const [houseBillData, setHouseBillData] = useState(null);
  const [receipts, setReceipts] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const [docs, setDocs] = useState({});
  const handleFileChange = (name, file) => setDocs(prev => ({ ...prev, [name]: file }));
  const handleRemoveFile = (name) => setDocs(prev => { const n = { ...prev }; delete n[name]; return n; });

  const fetchBill = async (type) => {
    if (type === 'property' && !formData.property_id) return toast.error('Enter Property ID');
    if (type === 'house' && !formData.house_id) return toast.error('Enter House Tax ID');
    if (type === 'property') {
      setBillData({ id: formData.property_id, owner: 'Rajesh Kumar', amount: 4850, dueDate: '31 Mar 2025', area: '135 sq.m', ward: '5' });
    } else {
      setHouseBillData({ id: formData.house_id, owner: 'Priya Sharma', amount: 1200, dueDate: '31 Mar 2025' });
    }
  };

  const fetchReceipts = () => {
    if (!formData.receipt_property_id) return toast.error('Enter Property ID');
    setReceipts(mockReceipts);
  };

  const handleSubmit = async () => {
    const typeLabels = ['property_tax', 'house_tax', null, 'tax_assessment', 'self_assessment'];
    const type = typeLabels[tab];
    if (!type) return;
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', { application_type: type, application_data: formData });
      setRefNumber(res.data?.data?.application_number || 'MPT' + Date.now());
    } catch {
      setRefNumber('MPT' + Date.now());
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Submitted successfully!');
    }
  };

  if (submitted) return (
    <Box>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" color="success.main" gutterBottom>Request Submitted!</Typography>
        <Chip label={refNumber} color="primary" sx={{ fontSize: '1.1rem', py: 2, px: 3, mb: 3 }} />
        <Alert severity="info">You will receive an SMS confirmation. Processing time: 5–7 working days.</Alert>
      </DialogContent>
      <DialogActions><Button variant="contained" onClick={onClose} fullWidth sx={{ bgcolor: HEADER_COLOR }}>Close</Button></DialogActions>
    </Box>
  );

  return (
    <Box>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setBillData(null); setHouseBillData(null); setReceipts(null); }}
          variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tab label="Pay Property Tax" />
          <Tab label="Pay House Tax" />
          <Tab label="View Receipts" />
          <Tab label="Assessment / Revision" />
          <Tab label="Self-Assessment" />
        </Tabs>

        {/* Tab 0: Pay Property Tax */}
        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField fullWidth label="Property ID / Holding No." name="property_id" value={formData.property_id} onChange={handleChange} placeholder="WARD05-1234" />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={() => fetchBill('property')}>Fetch Bill</Button>
            </Grid>
            {billData && (
              <>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>Property Tax Details</Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}><Typography variant="body2">Owner: <b>{billData.owner}</b></Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2">Ward: <b>{billData.ward}</b></Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2">Built Area: <b>{billData.area}</b></Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2">Due Date: <b>{billData.dueDate}</b></Typography></Grid>
                      <Grid item xs={12}><Typography variant="h6" color="primary">Amount Due: ₹{billData.amount.toLocaleString()}</Typography></Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Payment Method</Typography>
                  <RadioGroup row name="payment_method" value={formData.payment_method} onChange={handleChange}>
                    {['upi', 'net_banking', 'card', 'cash'].map(m => <FormControlLabel key={m} value={m} control={<Radio />} label={m.replace('_', ' ').toUpperCase()} />)}
                  </RadioGroup>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>

        {/* Tab 1: Pay House Tax */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField fullWidth label="House Tax ID / Account No." name="house_id" value={formData.house_id} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={() => fetchBill('house')}>Fetch Bill</Button>
            </Grid>
            {houseBillData && (
              <>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                    <Typography variant="body1">Owner: <b>{houseBillData.owner}</b></Typography>
                    <Typography variant="body1">Due Date: <b>{houseBillData.dueDate}</b></Typography>
                    <Typography variant="h6" color="primary">Amount Due: ₹{houseBillData.amount.toLocaleString()}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <RadioGroup row name="payment_method" value={formData.payment_method} onChange={handleChange}>
                    {['upi', 'net_banking', 'card'].map(m => <FormControlLabel key={m} value={m} control={<Radio />} label={m.replace('_', ' ').toUpperCase()} />)}
                  </RadioGroup>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>

        {/* Tab 2: View Receipts */}
        <TabPanel value={tab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField fullWidth label="Property ID / Account No." name="receipt_property_id" value={formData.receipt_property_id} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={fetchReceipts}>Search</Button>
            </Grid>
            {receipts && (
              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: HEADER_COLOR }}>
                      <TableRow>{['Financial Year', 'Amount', 'Date', 'Receipt No.', 'Download'].map(h => <TableCell key={h} sx={{ color: 'white' }}>{h}</TableCell>)}</TableRow>
                    </TableHead>
                    <TableBody>
                      {receipts.map(r => (
                        <TableRow key={r.receipt}>
                          <TableCell>{r.year}</TableCell>
                          <TableCell>₹{r.amount.toLocaleString()}</TableCell>
                          <TableCell>{r.date}</TableCell>
                          <TableCell><Chip label={r.receipt} size="small" /></TableCell>
                          <TableCell><Button size="small" startIcon={<DownloadIcon />}>PDF</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Tab 3: Assessment / Revision */}
        <TabPanel value={tab} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Property ID *" name="assess_property_id" value={formData.assess_property_id} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Reason for Revision" name="assess_reason" value={formData.assess_reason} onChange={handleChange}>
                {['Incorrect area recorded', 'Wrong property category', 'Renovations / additions', 'Ownership change', 'Other'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Current Assessed Value (₹)" name="current_value" value={formData.current_value} onChange={handleChange} type="number" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Requested Value (₹)" name="requested_value" value={formData.requested_value} onChange={handleChange} type="number" /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Remarks / Justification" name="remarks" value={formData.remarks} onChange={handleChange} /></Grid>
            <Grid item xs={12}><Alert severity="info">A municipal assessor will visit the property within 15 working days. Revised assessment will be effective from the next financial year.</Alert></Grid>
            <Grid item xs={12}><Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Supporting Documents</Typography></Grid>
            <Grid item xs={12} md={6}>
              <DocUpload label="Existing Assessment Order / Old Tax Receipt" name="old_assessment_order" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Copy of the current assessment or last paid bill" />
            </Grid>
            <Grid item xs={12} md={6}>
              <DocUpload label="Property Site Plan / Map" name="property_site_plan" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Plot / property map showing boundaries and area" />
            </Grid>
            <Grid item xs={12} md={6}>
              <DocUpload label="Property Ownership Proof (Sale Deed / Index II)" name="ownership_proof_assess" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Document establishing ownership of the property" />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 4: Self-Assessment New Property */}
        <TabPanel value={tab} index={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField fullWidth required label="Property Address *" name="new_property_address" value={formData.new_property_address} onChange={handleChange} multiline rows={2} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Property Type" name="new_property_type" value={formData.new_property_type} onChange={handleChange}>
                {['residential', 'commercial', 'industrial', 'mixed'].map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Built-up Area (sq.m)" name="built_area" value={formData.built_area} onChange={handleChange} type="number" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Number of Floors" name="floors" value={formData.floors} onChange={handleChange} type="number" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Owner Name *" name="new_owner_name" value={formData.new_owner_name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth required label="Mobile *" name="new_mobile" value={formData.new_mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Construction Year" name="construction_year" value={formData.construction_year} onChange={handleChange} type="number" /></Grid>
            <Grid item xs={12}><Alert severity="warning">Self-assessment is subject to verification. Any under-reporting may result in penalty up to 2× the differential tax.</Alert></Grid>
            <Grid item xs={12}><Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Supporting Documents</Typography></Grid>
            <Grid item xs={12} md={6}>
              <DocUpload label="Property Ownership Document (Sale Deed / 7/12 Extract)" name="ownership_proof_new" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Legal document confirming ownership of the property" />
            </Grid>
            <Grid item xs={12} md={6}>
              <DocUpload label="Approved Building Plan (if available)" name="approved_building_plan" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Municipality-approved building plan / completion certificate" />
            </Grid>
            <Grid item xs={12} md={6}>
              <DocUpload label="Occupancy Certificate / Commencement Certificate" name="occupancy_cert" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="If construction is complete and building is occupied" />
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        {[0, 1, 3, 4].includes(tab) && (
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : tab <= 1 ? 'Pay Now' : 'Submit Application'}
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default MunicipalPropertyTaxForm;
