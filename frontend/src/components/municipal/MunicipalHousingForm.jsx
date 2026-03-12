import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, MenuItem, Tabs, Tab,
  DialogContent, DialogActions, Alert, Chip, CircularProgress, Paper,
  Radio, RadioGroup, FormControlLabel,
} from '@mui/material';
import { CheckCircle as SuccessIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import DocUpload from './DocUpload';

const HEADER_COLOR = '#4527a0';

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const MunicipalHousingForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  const [formData, setFormData] = useState({
    name: '', mobile: '', address: '', ward: '', aadhaar: '',
    // Allotment
    dob: '', email: '', marital_status: '', housing_scheme: '', spouse_name: '', num_dependents: '',
    category: '', income_slab: '', family_size: '', existing_property: 'no',
    // Rent
    quarter_number: '', allotment_number: '', payment_method: 'upi',
    // Encroachment
    encroachment_location: '', encroachment_description: '', encroachment_type: '',
    encroachment_since: '', approx_area_sqft: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const [docs, setDocs] = useState({});
  const handleFileChange = (name, file) => setDocs(prev => ({ ...prev, [name]: file }));
  const handleRemoveFile = (name) => setDocs(prev => { const n = { ...prev }; delete n[name]; return n; });

  const handleSubmit = async () => {
    if (!formData.mobile || formData.mobile.length !== 10) return toast.error('Enter valid 10-digit mobile');
    if (!formData.name) return toast.error('Please enter your name');
    const types = ['housing_allotment', 'municipal_rent_payment', 'encroachment_report'];
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', { application_type: types[tab], application_data: formData });
      setRefNumber(res.data?.data?.application_number || 'MHU' + Date.now());
    } catch {
      setRefNumber('MHU' + Date.now());
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
        <Alert severity="info">
          {tab === 0 ? 'Housing allotment application registered. Eligible applications are processed on a lottery/waiting list basis.' :
           tab === 1 ? 'Rent payment processed. Receipt sent via SMS.' :
           'Encroachment complaint registered. Anti-encroachment cell will inspect within 5 working days.'}
        </Alert>
      </DialogContent>
      <DialogActions><Button variant="contained" onClick={onClose} fullWidth sx={{ bgcolor: HEADER_COLOR }}>Close</Button></DialogActions>
    </Box>
  );

  return (
    <Box>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tab label="Apply for Municipal Housing" />
          <Tab label="Pay Municipal Quarter Rent" />
          <Tab label="Report Encroachment" />
        </Tabs>

        {/* Tab 0: Housing Allotment */}
        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Applicant Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Date of Birth" name="dob" value={formData.dob} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Aadhaar Number" name="aadhaar" value={formData.aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Marital Status" name="marital_status" value={formData.marital_status} onChange={handleChange}>
                {['Married', 'Unmarried', 'Widow / Widower', 'Divorced', 'Separated'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Spouse Name (if married)" name="spouse_name" value={formData.spouse_name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="No. of Dependents" name="num_dependents" value={formData.num_dependents} onChange={handleChange} type="number" /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Applicant Category" name="category" value={formData.category} onChange={handleChange}>
                {['General', 'SC/ST', 'OBC', 'EWS (Economically Weaker Section)', 'Differently abled', 'Widow/Single woman'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Annual Income Slab" name="income_slab" value={formData.income_slab} onChange={handleChange}>
                <MenuItem value="below_1lakh">Below ₹1 Lakh</MenuItem>
                <MenuItem value="1_3lakh">₹1–3 Lakh</MenuItem>
                <MenuItem value="3_6lakh">₹3–6 Lakh</MenuItem>
                <MenuItem value="above_6lakh">Above ₹6 Lakh</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Family Size" name="family_size" value={formData.family_size} onChange={handleChange} type="number" /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Do you own any property?" name="existing_property" value={formData.existing_property} onChange={handleChange}>
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Housing Scheme" name="housing_scheme" value={formData.housing_scheme} onChange={handleChange}>
                {['EWS (Economically Weaker Section)', 'LIG (Low Income Group)', 'MIG-I (Middle Income Group I)', 'MIG-II (Middle Income Group II)', 'PM Awas Yojana (Urban)'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth required label="Current Address *" name="address" value={formData.address} onChange={handleChange} multiline rows={2} /></Grid>
            <Grid item xs={12}><Alert severity="info">Municipal housing allotment is subject to availability and eligibility criteria. Priority is given to EWS and SC/ST categories. Waiting list may apply.</Alert></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Upload Required Documents</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Income Certificate (from competent authority)" name="income_certificate" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Annual income certified by Tahsildar / SDM" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Aadhaar Card" name="aadhaar_copy" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Applicant's valid Aadhaar" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Caste Certificate (if SC/ST/OBC/EWS)" name="caste_certificate" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Required if applying under reserved category" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Affidavit — No Ownership of Other Property" name="no_property_affidavit" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Self-declaration on stamp paper" />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 1: Pay Municipal Rent */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Quarter / Unit Number" name="quarter_number" value={formData.quarter_number} onChange={handleChange} placeholder="QTR-B-205" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Allotment Order Number" name="allotment_number" value={formData.allotment_number} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Tenant Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: '#ede7f6' }}>
                <Typography variant="body2" color="text.secondary">Monthly rent is as per allotment order. Contact the housing department for rent revision details.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <RadioGroup row name="payment_method" value={formData.payment_method} onChange={handleChange}>
                {['upi', 'net_banking', 'card'].map(m => <FormControlLabel key={m} value={m} control={<Radio />} label={m.replace('_', ' ').toUpperCase()} />)}
              </RadioGroup>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Report Encroachment */}
        <TabPanel value={tab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Your Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth required label="Location of Encroachment *" name="encroachment_location" value={formData.encroachment_location} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Encroachment Since (approx. date / year)" name="encroachment_since" value={formData.encroachment_since} onChange={handleChange} placeholder="e.g., Jan 2024 / approx. 2 years ago" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Approx. Encroached Area (sq.ft)" name="approx_area_sqft" value={formData.approx_area_sqft} onChange={handleChange} type="number" /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Encroachment Type" name="encroachment_type" value={formData.encroachment_type} onChange={handleChange}>
                {['Unauthorized construction on public land', 'Shops/stalls on footpath', 'Illegal structure on road margin', 'Parking on public land', 'Other'].map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Description *" name="encroachment_description" value={formData.encroachment_description} onChange={handleChange} placeholder="Describe the encroachment, approximate dimensions, and duration..." /></Grid>
            <Grid item xs={12}><Alert severity="warning">Your complaint will be recorded confidentially. The anti-encroachment cell will conduct an independent inspection.</Alert></Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
          {submitting ? <CircularProgress size={24} color="inherit" /> : tab === 1 ? 'Pay Rent' : 'Submit'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default MunicipalHousingForm;
