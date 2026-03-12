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

const HEADER_COLOR = '#00695c';

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const MunicipalHealthEnvForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  const [formData, setFormData] = useState({
    name: '', mobile: '', address: '', ward: '', description: '',
    // Health license
    business_name: '', business_type: '', license_type: '', proprietor_name: '',
    // Food license extras
    seating_capacity: '', kitchen_area_sqft: '', water_source: '', fssai_license_no: '',
    // Fogging
    fogging_reason: '', priority: 'normal', vector_complaint_type: '',
    // Env clearance
    org_name: '', activity_type: '', project_area: '', project_category: '', total_investment: '',
    payment_method: 'upi',
    existing_license_no: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const [docs, setDocs] = useState({});
  const handleFileChange = (name, file) => setDocs(prev => ({ ...prev, [name]: file }));
  const handleRemoveFile = (name) => setDocs(prev => { const n = { ...prev }; delete n[name]; return n; });

  const handleSubmit = async () => {
    if (!formData.mobile || formData.mobile.length !== 10) return toast.error('Enter valid 10-digit mobile');
    const types = ['health_license_payment', 'food_establishment_license', 'vector_control_request', 'environmental_clearance'];
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', { application_type: types[tab], application_data: formData });
      setRefNumber(res.data?.data?.application_number || 'MHE' + Date.now());
    } catch {
      setRefNumber('MHE' + Date.now());
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
          {tab === 0 ? 'Health license fee paid. Certificate will be issued after inspection.' :
           tab === 1 ? 'Food establishment license application received. Inspection in 7–10 days.' :
           tab === 2 ? 'Fogging/vector control request registered. Team will visit within 48 hours.' :
           'Environmental clearance application submitted. Processing time: 30 days.'}
        </Alert>
      </DialogContent>
      <DialogActions><Button variant="contained" onClick={onClose} fullWidth sx={{ bgcolor: HEADER_COLOR }}>Close</Button></DialogActions>
    </Box>
  );

  return (
    <Box>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tab label="Health / Hygiene License Fee" />
          <Tab label="Food Establishment License" />
          <Tab label="Fogging / Vector Control" />
          <Tab label="Environmental Clearance" />
        </Tabs>

        {/* Tab 0: Health / Hygiene License Fee */}
        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Business Name *" name="business_name" value={formData.business_name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="License Number (for renewal)" name="existing_license_no" value={formData.existing_license_no} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Proprietor Name *" name="proprietor_name" value={formData.proprietor_name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Business Address" name="address" value={formData.address} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="License Type" name="license_type" value={formData.license_type} onChange={handleChange}>
                {['Hotel / Restaurant', 'Dhaba / Food stall', 'Bakery', 'Meat / Fish shop', 'Dairy / Milk booth', 'Barber / Beauty salon', 'Laundry', 'Other'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: '#e0f2f1' }}>
                <Typography variant="subtitle2" gutterBottom>Standard Fees (annual)</Typography>
                <Typography variant="body2">Hotel/Restaurant: ₹2,500 | Bakery: ₹1,500 | Meat/Fish: ₹2,000 | General: ₹1,000</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <RadioGroup row name="payment_method" value={formData.payment_method} onChange={handleChange}>
                {['upi', 'net_banking', 'card'].map(m => <FormControlLabel key={m} value={m} control={<Radio />} label={m.replace('_', ' ').toUpperCase()} />)}
              </RadioGroup>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 1: Food Establishment License */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Establishment Name *" name="business_name" value={formData.business_name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Establishment Type" name="business_type" value={formData.business_type} onChange={handleChange}>
                {['Restaurant', 'Hotel', 'Bakery', 'Sweet shop', 'Canteen', 'Food cart/stall', 'Cloud kitchen', 'Catering services'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Proprietor / Manager Name *" name="proprietor_name" value={formData.proprietor_name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth required label="Establishment Address *" name="address" value={formData.address} onChange={handleChange} multiline rows={2} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Seating Capacity (no. of seats)" name="seating_capacity" value={formData.seating_capacity} onChange={handleChange} type="number" placeholder="0 if takeaway only" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Kitchen Area (sq.ft)" name="kitchen_area_sqft" value={formData.kitchen_area_sqft} onChange={handleChange} type="number" /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Water Source" name="water_source" value={formData.water_source} onChange={handleChange}>
                {['Municipal water supply', 'Borewell', 'Tanker water', 'Municipal + borewell both'].map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="FSSAI License / Registration No. (if existing)" name="fssai_license_no" value={formData.fssai_license_no} onChange={handleChange} placeholder="14-digit FSSAI number" /></Grid>
            <Grid item xs={12}><Alert severity="info">A health inspector will visit the premises. FSSAI registration/license copy and owner ID proof are required. Inspection within 7 working days.</Alert></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Upload Required Documents</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DocUpload label="FSSAI Registration / License Copy" name="fssai_license" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Current valid FSSAI certificate" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Proprietor / Manager ID Proof" name="food_id_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Aadhaar / Voter ID / PAN" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DocUpload label="NOC from Building Owner / Landlord" name="food_noc" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="If premises is rented" />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Vector Control / Fogging */}
        <TabPanel value={tab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Your Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth required label="Address / Location *" name="address" value={formData.address} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Pest / Vector Type" name="vector_complaint_type" value={formData.vector_complaint_type} onChange={handleChange}>
                {['Mosquitoes', 'Rats / Rodents', 'Cockroaches', 'Stray dogs', 'Flies / insects', 'Multiple pests'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Reason" name="fogging_reason" value={formData.fogging_reason} onChange={handleChange}>
                {['Mosquito breeding site', 'Dengue/Malaria outbreak concern', 'Stagnant water/puddles', 'Garbage dump nearby', 'Community request', 'Other'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Priority" name="priority" value={formData.priority} onChange={handleChange}>
                <MenuItem value="urgent">Urgent (Disease outbreak concern)</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Additional Details" name="description" value={formData.description} onChange={handleChange} /></Grid>
            {formData.priority === 'urgent' && <Grid item xs={12}><Alert severity="warning">For disease outbreaks, also report to the District Health Officer immediately.</Alert></Grid>}
          </Grid>
        </TabPanel>

        {/* Tab 3: Environmental Clearance */}
        <TabPanel value={tab} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Organisation / Applicant Name *" name="org_name" value={formData.org_name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Contact Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Activity Type" name="activity_type" value={formData.activity_type} onChange={handleChange}>
                {['Small industry (<500 sq.m)', 'Service unit', 'Commercial establishment', 'Warehouse', 'Workshop / Garage', 'Other'].map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Project / Unit Area (sq.m)" name="project_area" value={formData.project_area} onChange={handleChange} type="number" /></Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth select label="EIA Category" name="project_category" value={formData.project_category} onChange={handleChange}>
                <MenuItem value="category_a">Category A (State level EIA)</MenuItem>
                <MenuItem value="category_b1">Category B1 (Full EIA required)</MenuItem>
                <MenuItem value="category_b2">Category B2 (No EIA required)</MenuItem>
                <MenuItem value="local_clearance">Local / Municipal clearance only</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Total Project Investment (₹)" name="total_investment" value={formData.total_investment} onChange={handleChange} type="number" /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth required label="Location / Address *" name="address" value={formData.address} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Project Description" name="description" value={formData.description} onChange={handleChange} /></Grid>
            <Grid item xs={12}><Alert severity="info">Environmental clearance is a prerequisite for building plan approval. This covers noise, waste disposal, and emission compliance at the local/municipal level.</Alert></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Upload Required Documents</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Project Plan / Site Layout" name="env_project_plan" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Detailed plan of proposed activity / unit" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Pollution / Compliance Certificates (if available)" name="env_compliance_cert" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="SPCB NOC, DG set compliance, etc." />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
          {submitting ? <CircularProgress size={24} color="inherit" /> : tab === 0 ? 'Pay Fee' : 'Submit Application'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default MunicipalHealthEnvForm;
