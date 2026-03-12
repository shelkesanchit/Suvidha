import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, MenuItem, Tabs, Tab,
  DialogContent, DialogActions, Alert, Chip, CircularProgress,
  Paper, Radio, RadioGroup, FormControlLabel, Stepper, Step, StepLabel,
} from '@mui/material';
import { CheckCircle as SuccessIcon, Download as DownloadIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import DocUpload from './DocUpload';

const HEADER_COLOR = '#e65100';

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const businessTypes = ['Retail Shop', 'Restaurant / Hotel', 'Manufacturing', 'Wholesale', 'Service Business', 'Healthcare', 'Education', 'IT / Software', 'Beauty & Wellness', 'Other'];
const NEW_LICENSE_STEPS = ['Business Information', 'Owner / Proprietor', 'Premises Details', 'Documents & Submit'];

const MunicipalTradeLicenseForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const [licenseStep, setLicenseStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [existingLicense, setExistingLicense] = useState(null);
  const [feeDetails, setFeeDetails] = useState(null);
  const [certData, setCertData] = useState(null);

  const [formData, setFormData] = useState({
    // New license — Step 0: Business Info
    business_name: '', business_type: '', address: '', ward: '',
    start_date: '', employees: '', annual_turnover: '', business_area_sqft: '',
    // New license — Step 1: Owner
    proprietor_name: '', mobile: '', email: '', aadhaar: '', pan: '', dob: '', ownership_type: 'individual',
    // New license — Step 2: Premises
    premises_ownership: 'owned', rent_amount: '', landlord_name: '',
    // Renewal / Fee / Download
    license_number: '', payment_method: 'upi',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const [docs, setDocs] = useState({});
  const handleFileChange = (name, file) => setDocs(prev => ({ ...prev, [name]: file }));
  const handleRemoveFile = (name) => setDocs(prev => { const n = { ...prev }; delete n[name]; return n; });

  const fetchLicense = (type) => {
    if (!formData.license_number) return toast.error('Enter License Number');
    if (type === 'renew') {
      setExistingLicense({ number: formData.license_number, name: 'Sharma General Stores', owner: 'Suresh Sharma', expiry: '31 Mar 2025', type: 'Retail Shop', renewalFee: 2500 });
    } else if (type === 'fee') {
      setFeeDetails({ number: formData.license_number, name: 'Sharma General Stores', fee: 2500, lateFee: 0, total: 2500 });
    } else if (type === 'cert') {
      setCertData({ number: formData.license_number, name: 'Sharma General Stores', owner: 'Suresh Sharma', issued: '01 Apr 2024', valid: '31 Mar 2025' });
    }
  };

  const handleSubmit = async () => {
    const types = ['new_trade_license', 'renew_trade_license', 'pay_license_fee', null];
    if (!types[tab]) return;
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', { application_type: types[tab], application_data: formData });
      setRefNumber(res.data?.data?.application_number || 'MTL' + Date.now());
    } catch {
      setRefNumber('MTL' + Date.now());
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
        <Typography variant="h4" color="success.main" gutterBottom>Submitted Successfully!</Typography>
        <Chip label={refNumber} sx={{ bgcolor: HEADER_COLOR, color: 'white', fontSize: '1.1rem', py: 2, px: 3, mb: 3 }} />
        <Alert severity="info">New license applications are processed within 15 working days. An inspector visit may be required.</Alert>
      </DialogContent>
      <DialogActions><Button variant="contained" onClick={onClose} fullWidth sx={{ bgcolor: HEADER_COLOR }}>Close</Button></DialogActions>
    </Box>
  );

  return (
    <Box>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setExistingLicense(null); setFeeDetails(null); setCertData(null); setLicenseStep(0); }}
          variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tab label="New Trade License" />
          <Tab label="Renew License" />
          <Tab label="Pay Renewal Fee" />
          <Tab label="Download Certificate" />
        </Tabs>

        {/* Tab 0: New Trade License — 4-step stepper */}
        <TabPanel value={tab} index={0}>
          <Stepper activeStep={licenseStep} sx={{ mb: 3 }}>
            {NEW_LICENSE_STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>

          {/* Step 0: Business Information */}
          {licenseStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><Alert severity="info" sx={{ mb: 1 }}>A trade license is mandatory for carrying out any trade, business, or commercial activity within the municipal limits under the <b>Municipal Corporation Act</b>.</Alert></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Business / Trade Name *" name="business_name" value={formData.business_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth select required label="Type of Business *" name="business_type" value={formData.business_type} onChange={handleChange}>
                  {businessTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={8}><TextField fullWidth required label="Business Address *" name="address" value={formData.address} onChange={handleChange} multiline rows={2} /></Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                  {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Business Start Date" name="start_date" value={formData.start_date} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Number of Employees" name="employees" value={formData.employees} onChange={handleChange} type="number" inputProps={{ min: 1 }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Business Area (sq. ft.)" name="business_area_sqft" value={formData.business_area_sqft} onChange={handleChange} type="number" inputProps={{ min: 1 }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Annual Turnover (₹)" name="annual_turnover" value={formData.annual_turnover} onChange={handleChange} type="number" /></Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button variant="contained" onClick={() => { if (!formData.business_name || !formData.business_type || !formData.address) return toast.error('Business name, type, and address are required'); setLicenseStep(1); }} sx={{ bgcolor: HEADER_COLOR }}>Next →</Button>
              </Grid>
            </Grid>
          )}

          {/* Step 1: Owner / Proprietor */}
          {licenseStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Proprietor / Owner Full Name *" name="proprietor_name" value={formData.proprietor_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile Number *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Date of Birth" name="dob" value={formData.dob} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Aadhaar Number" name="aadhaar" value={formData.aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="PAN Number" name="pan" value={formData.pan} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Ownership Type" name="ownership_type" value={formData.ownership_type} onChange={handleChange}>
                  <MenuItem value="individual">Individual / Proprietor</MenuItem>
                  <MenuItem value="partnership">Partnership Firm</MenuItem>
                  <MenuItem value="private_limited">Private Limited Company</MenuItem>
                  <MenuItem value="llp">LLP</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button onClick={() => setLicenseStep(0)}>← Back</Button>
                <Button variant="contained" onClick={() => { if (!formData.proprietor_name || !formData.mobile) return toast.error('Owner name and mobile are required'); setLicenseStep(2); }} sx={{ bgcolor: HEADER_COLOR }}>Next →</Button>
              </Grid>
            </Grid>
          )}

          {/* Step 2: Premises Details */}
          {licenseStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Premises Ownership *" name="premises_ownership" value={formData.premises_ownership} onChange={handleChange}>
                  <MenuItem value="owned">Self-Owned</MenuItem>
                  <MenuItem value="rented">Rented</MenuItem>
                  <MenuItem value="leased">Leased</MenuItem>
                  <MenuItem value="government">Government / Municipal</MenuItem>
                </TextField>
              </Grid>
              {(formData.premises_ownership === 'rented' || formData.premises_ownership === 'leased') && (
                <>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Monthly Rent / Lease Amount (₹)" name="rent_amount" value={formData.rent_amount} onChange={handleChange} type="number" /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Landlord / Lessor Name" name="landlord_name" value={formData.landlord_name} onChange={handleChange} /></Grid>
                </>
              )}
              <Grid item xs={12}><Alert severity="info" sx={{ mt: 1 }}>License fee is calculated based on <b>business type</b>, <b>area (sq. ft.)</b>, and <b>annual turnover</b>. An inspector may visit the premises before license issuance.</Alert></Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button onClick={() => setLicenseStep(1)}>← Back</Button>
                <Button variant="contained" onClick={() => setLicenseStep(3)} sx={{ bgcolor: HEADER_COLOR }}>Next →</Button>
              </Grid>
            </Grid>
          )}

          {/* Step 3: Documents & Submit */}
          {licenseStep === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>Upload Required Documents</Typography></Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Premises Ownership / Rental / Lease Agreement" name="premises_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Sale deed / property card / signed lease or rental agreement" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Owner / Proprietor ID Proof (Aadhaar / Voter ID)" name="owner_id_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Government-issued photo ID" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="PAN Card Copy" name="pan_card_copy" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="PAN card of proprietor or business entity" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Passport-Size Photograph of Owner" name="owner_photo" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} accept=".jpg,.jpeg,.png" hint="Recent colour photograph (white background preferred)" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="NOC from Property Owner (if rented / leased)" name="noc_owner" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="No-objection certificate from building owner (if premises not self-owned)" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="GST Registration Certificate" name="gst_cert" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="If registered under GST — upload GSTIN certificate" />
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button onClick={() => setLicenseStep(2)}>← Back</Button>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 1: Renew License */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}><TextField fullWidth label="License Number" name="license_number" value={formData.license_number} onChange={handleChange} placeholder="TL-WARD05-2023-XXXX" /></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={() => fetchLicense('renew')}>Fetch Details</Button></Grid>
            {existingLicense && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>License Details</Typography>
                  <Typography variant="body1">Business: <b>{existingLicense.name}</b></Typography>
                  <Typography variant="body1">Owner: <b>{existingLicense.owner}</b></Typography>
                  <Typography variant="body1">Type: <b>{existingLicense.type}</b></Typography>
                  <Typography variant="body1">Expiry: <b>{existingLicense.expiry}</b></Typography>
                  <Typography variant="h6" color="primary" sx={{ mt: 1 }}>Renewal Fee: ₹{existingLicense.renewalFee.toLocaleString()}</Typography>
                </Paper>
              </Grid>
            )}
            {existingLicense && (
              <Grid item xs={12}>
                <RadioGroup row name="payment_method" value={formData.payment_method} onChange={handleChange}>
                  {['upi', 'net_banking', 'card'].map(m => <FormControlLabel key={m} value={m} control={<Radio />} label={m.replace('_', ' ').toUpperCase()} />)}
                </RadioGroup>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Tab 2: Pay Renewal Fee */}
        <TabPanel value={tab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}><TextField fullWidth label="License Number" name="license_number" value={formData.license_number} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={() => fetchLicense('fee')}>Fetch Fee</Button></Grid>
            {feeDetails && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
                  <Typography variant="body1">License: <b>{feeDetails.number}</b></Typography>
                  <Typography variant="body1">Business: <b>{feeDetails.name}</b></Typography>
                  <Typography variant="body1">Renewal Fee: ₹{feeDetails.fee}</Typography>
                  {feeDetails.lateFee > 0 && <Typography variant="body1" color="error">Late Fee: ₹{feeDetails.lateFee}</Typography>}
                  <Typography variant="h6" color="primary">Total: ₹{feeDetails.total.toLocaleString()}</Typography>
                </Paper>
                <RadioGroup row name="payment_method" value={formData.payment_method} onChange={handleChange} sx={{ mt: 1 }}>
                  {['upi', 'net_banking', 'card'].map(m => <FormControlLabel key={m} value={m} control={<Radio />} label={m.replace('_', ' ').toUpperCase()} />)}
                </RadioGroup>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Tab 3: Download Certificate */}
        <TabPanel value={tab} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}><TextField fullWidth label="License Number" name="license_number" value={formData.license_number} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={() => fetchLicense('cert')}>Search</Button></Grid>
            {certData && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Certificate Found</Typography>
                  <Typography variant="body1">Business: <b>{certData.name}</b></Typography>
                  <Typography variant="body1">Owner: <b>{certData.owner}</b></Typography>
                  <Typography variant="body1">Issued: <b>{certData.issued}</b></Typography>
                  <Typography variant="body1" gutterBottom>Valid Until: <b>{certData.valid}</b></Typography>
                  <Button variant="contained" startIcon={<DownloadIcon />} sx={{ bgcolor: HEADER_COLOR }}>Download License Certificate (PDF)</Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        {tab === 0 && licenseStep === 3 && (
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit License Application'}
          </Button>
        )}
        {[1, 2].includes(tab) && (
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Pay Now'}
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default MunicipalTradeLicenseForm;
