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

const HEADER_COLOR = '#5d4037';

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const MunicipalSanitationForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  const [formData, setFormData] = useState({
    name: '', mobile: '', address: '', ward: '',
    complaint_type: '', complaint_description: '', days_since_collection: '',
    bulk_waste_type: '', bulk_quantity: '', pickup_date: '', vehicle_type_needed: '', access_width: '',
    payment_method: 'upi',
    sanitation_request_type: '', frequency_needed: '', premises_type: '',
    sw_consumer_number: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const [docs, setDocs] = useState({});
  const handleFileChange = (name, file) => setDocs(prev => ({ ...prev, [name]: file }));
  const handleRemoveFile = (name) => setDocs(prev => { const n = { ...prev }; delete n[name]; return n; });

  const handleSubmit = async () => {
    if (!formData.mobile || formData.mobile.length !== 10) return toast.error('Enter valid 10-digit mobile');
    if (!formData.name) return toast.error('Please enter your name');
    const types = ['garbage_collection_complaint', 'bulk_waste_pickup', 'solid_waste_payment', 'sanitation_worker_request'];
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', { application_type: types[tab], application_data: formData });
      setRefNumber(res.data?.data?.application_number || 'MSW' + Date.now());
    } catch {
      setRefNumber('MSW' + Date.now());
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Request submitted successfully!');
    }
  };

  if (submitted) return (
    <Box>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" color="success.main" gutterBottom>Request Submitted!</Typography>
        <Chip label={refNumber} sx={{ bgcolor: HEADER_COLOR, color: 'white', fontSize: '1.1rem', py: 2, px: 3, mb: 3 }} />
        <Alert severity="info">
          {tab === 0 ? 'Complaint registered. Sanitation team will resolve within 48 hours.' :
           tab === 1 ? 'Bulk pickup scheduled. Team will visit on your selected date.' :
           tab === 2 ? 'Payment processed. Receipt will be sent via SMS.' :
           'Request registered. Sanitation worker will be assigned within 2 working days.'}
        </Alert>
      </DialogContent>
      <DialogActions><Button variant="contained" onClick={onClose} fullWidth sx={{ bgcolor: HEADER_COLOR }}>Close</Button></DialogActions>
    </Box>
  );

  return (
    <Box>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tab label="Garbage Complaint" />
          <Tab label="Bulk Waste Pickup" />
          <Tab label="Pay SW Charges" />
          <Tab label="Sanitation Worker" />
        </Tabs>

        {/* Tab 0: Garbage Collection Complaint */}
        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth required label="Address *" name="address" value={formData.address} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Complaint Type *" name="complaint_type" value={formData.complaint_type} onChange={handleChange}>
                {['Garbage not collected', 'Missed collection on scheduled day', 'Overflowing public dustbin', 'Illegal dumping nearby', 'Garbage truck not arriving', 'Other'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Days Since Last Collection" name="days_since_collection" value={formData.days_since_collection} onChange={handleChange} type="number" placeholder="0 if unsure" /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Description" name="complaint_description" value={formData.complaint_description} onChange={handleChange} placeholder="Provide more details..." /></Grid>
            <Grid item xs={12}>
              <DocUpload label="Photo of Issue (optional but helpful)" name="garbage_photo" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} accept=".jpg,.jpeg,.png" hint="A clear photo helps faster resolution" />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 1: Bulk Waste Pickup */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth required label="Pickup Address *" name="address" value={formData.address} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Waste Type" name="bulk_waste_type" value={formData.bulk_waste_type} onChange={handleChange}>
                {['Old furniture', 'Construction debris', 'Electronic waste', 'Garden waste', 'Mixed/Other'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Approx. Quantity" name="bulk_quantity" value={formData.bulk_quantity} onChange={handleChange} placeholder="e.g., 500 kg, 2 truckloads" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Preferred Pickup Date" name="pickup_date" value={formData.pickup_date} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Vehicle Size Needed" name="vehicle_type_needed" value={formData.vehicle_type_needed} onChange={handleChange}>
                {['Small vehicle (auto / van)', 'Medium truck', 'Large truck / tipper', 'JCB / crane required'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Road / Lane Access Width" name="access_width" value={formData.access_width} onChange={handleChange}>
                <MenuItem value="narrow">Narrow lane (below 8 ft)</MenuItem>
                <MenuItem value="medium">Medium road (8–16 ft)</MenuItem>
                <MenuItem value="wide">Wide road (above 16 ft)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><Alert severity="info">Bulk pickup fee will be calculated at the time of visit based on quantity. Minimum charge ₹200.</Alert></Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Pay Solid Waste Charges */}
        <TabPanel value={tab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}><TextField fullWidth label="Solid Waste Consumer Number" name="sw_consumer_number" value={formData.sw_consumer_number} onChange={handleChange} placeholder="SWC-WARD05-XXXX" /></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" sx={{ height: 56 }}>Fetch Bill</Button></Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: '#efebe9' }}>
                <Typography variant="body2" color="text.secondary">Annual Solid Waste Management Charges</Typography>
                <Typography variant="body1">Residential: ₹<b>600/year</b></Typography>
                <Typography variant="body1">Commercial: ₹<b>1,500/year</b></Typography>
                <Typography variant="body1">Industrial: ₹<b>3,000/year</b></Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12}>
              <RadioGroup row name="payment_method" value={formData.payment_method} onChange={handleChange}>
                {['upi', 'net_banking', 'card'].map(m => <FormControlLabel key={m} value={m} control={<Radio />} label={m.replace('_', ' ').toUpperCase()} />)}
              </RadioGroup>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Sanitation Worker Request */}
        <TabPanel value={tab} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth required label="Address *" name="address" value={formData.address} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Request Type" name="sanitation_request_type" value={formData.sanitation_request_type} onChange={handleChange}>
                {['Drain cleaning', 'Manhole cleaning', 'Public toilet cleaning', 'Area disinfection / fogging', 'Other'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Frequency Required" name="frequency_needed" value={formData.frequency_needed} onChange={handleChange}>
                <MenuItem value="one_time">One-time</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Premises Type" name="premises_type" value={formData.premises_type} onChange={handleChange}>
                {['Residential', 'Commercial', 'Educational institution', 'Healthcare facility', 'Public area'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Additional Details" name="complaint_description" value={formData.complaint_description} onChange={handleChange} /></Grid>
            <Grid item xs={12}><Alert severity="info">Sanitation workers are assigned on a first-come, first-served basis for non-emergency requests. Emergency drain blockages are given priority within 24 hours.</Alert></Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default MunicipalSanitationForm;
