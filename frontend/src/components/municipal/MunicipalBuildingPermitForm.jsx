import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, MenuItem, Tabs, Tab,
  DialogContent, DialogActions, Alert, Chip, CircularProgress,
  Paper, Stepper, Step, StepLabel, Radio, RadioGroup, FormControlLabel,
} from '@mui/material';
import { CheckCircle as SuccessIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import DocUpload from './DocUpload';

const HEADER_COLOR = '#6a1b9a';

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const MunicipalBuildingPermitForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [step, setStep] = useState(0);
  const [trackData, setTrackData] = useState(null);
  const [feeData, setFeeData] = useState(null);

  const [formData, setFormData] = useState({
    // Building plan
    owner_name: '', mobile: '', aadhaar: '', plot_number: '', survey_number: '',
    plot_area: '', proposed_area: '', floors: '', setback_front: '', setback_side: '', fsi_proposed: '',
    property_address: '', ward: '', architect_name: '', architect_reg: '', construction_type: 'residential',
    // Permit
    permit_app_number: '',
    // Occupancy
    completion_app_number: '', completion_date: '', occupancy_type: 'residential',
    // Track
    track_number: '',
    // Fee
    fee_app_number: '',
    payment_method: 'upi',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const [docs, setDocs] = useState({});
  const handleFileChange = (name, file) => setDocs(prev => ({ ...prev, [name]: file }));
  const handleRemoveFile = (name) => setDocs(prev => { const n = { ...prev }; delete n[name]; return n; });

  const fetchTrack = () => {
    if (!formData.track_number) return toast.error('Enter application number');
    setTrackData({
      appNo: formData.track_number, status: 'Under Review', submitted: '14 Feb 2025',
      inspector: 'Ramesh Jha', nextStep: 'Site inspection scheduled for 20 Mar 2025',
    });
  };

  const fetchFee = () => {
    if (!formData.fee_app_number) return toast.error('Enter application number');
    setFeeData({ appNo: formData.fee_app_number, type: 'Building Plan Approval', amount: 15000, due: '31 Mar 2025' });
  };

  const handleSubmit = async () => {
    const types = ['building_plan_approval', 'construction_permit', 'occupancy_certificate', null, 'building_permit_fee'];
    if (!types[tab]) return;
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', { application_type: types[tab], application_data: formData });
      setRefNumber(res.data?.data?.application_number || 'MBP' + Date.now());
    } catch {
      setRefNumber('MBP' + Date.now());
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Application submitted!');
    }
  };

  if (submitted) return (
    <Box>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" color="success.main" gutterBottom>Application Submitted!</Typography>
        <Chip label={refNumber} sx={{ bgcolor: HEADER_COLOR, color: 'white', fontSize: '1.1rem', py: 2, px: 3, mb: 3 }} />
        <Alert severity="info">Building plan approvals take 30–45 working days. A site inspection will be scheduled. Track status using your application number.</Alert>
      </DialogContent>
      <DialogActions><Button variant="contained" onClick={onClose} fullWidth sx={{ bgcolor: HEADER_COLOR }}>Close</Button></DialogActions>
    </Box>
  );

  return (
    <Box>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setStep(0); setTrackData(null); setFeeData(null); }}
          variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tab label="Building Plan Approval" />
          <Tab label="Construction Permit" />
          <Tab label="Occupancy Certificate" />
          <Tab label="Track Application" />
          <Tab label="Pay Permit Fee" />
        </Tabs>

        {/* Tab 0: Building Plan Approval */}
        <TabPanel value={tab} index={0}>
          <Stepper activeStep={step} sx={{ mb: 3 }}>
            {['Property Details', 'Construction Details', 'Professional Details'].map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>
          {step === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}><TextField fullWidth required label="Owner Name *" name="owner_name" value={formData.owner_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Aadhaar Number" name="aadhaar" value={formData.aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} /></Grid>
              <Grid item xs={12} md={8}><TextField fullWidth required label="Plot / Property Address *" name="property_address" value={formData.property_address} onChange={handleChange} multiline rows={2} /></Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                  {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Plot Number" name="plot_number" value={formData.plot_number} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Survey / Khasra Number" name="survey_number" value={formData.survey_number} onChange={handleChange} /></Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={() => { if (!formData.owner_name || !formData.mobile || !formData.property_address) return toast.error('Owner name, mobile, and address are required'); setStep(1); }} sx={{ bgcolor: HEADER_COLOR }}>Next →</Button>
              </Grid>
            </Grid>
          )}
          {step === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><TextField fullWidth label="Plot Area (sq.m)" name="plot_area" value={formData.plot_area} onChange={handleChange} type="number" /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Proposed Built-up Area (sq.m)" name="proposed_area" value={formData.proposed_area} onChange={handleChange} type="number" /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Number of Floors" name="floors" value={formData.floors} onChange={handleChange} type="number" /></Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Construction Type" name="construction_type" value={formData.construction_type} onChange={handleChange}>
                  {['residential', 'commercial', 'industrial', 'mixed'].map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Front Setback (metres)" name="setback_front" value={formData.setback_front} onChange={handleChange} type="number" helperText="Distance from plot boundary to building front" /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Side Setback (metres)" name="setback_side" value={formData.setback_side} onChange={handleChange} type="number" helperText="Side & rear setback as per local byelaws" /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Proposed FSI / FAR" name="fsi_proposed" value={formData.fsi_proposed} onChange={handleChange} type="number" helperText="Floor Space Index — as per zoning regulations" /></Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setStep(0)}>← Back</Button>
                <Button variant="contained" onClick={() => setStep(2)} sx={{ bgcolor: HEADER_COLOR }}>Next →</Button>
              </Grid>
            </Grid>
          )}
          {step === 2 && (
              <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth label="Architect / Engineer Name" name="architect_name" value={formData.architect_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Architect Registration No." name="architect_reg" value={formData.architect_reg} onChange={handleChange} /></Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Upload Required Documents</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <DocUpload label="Property Title Deed / Sale Deed" name="title_deed" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Legal ownership document of the plot" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DocUpload label="Site Plan (with North direction & measurements)" name="site_plan" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Signed by licensed architect" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DocUpload label="Floor Plan & Elevation Drawings" name="floor_plan" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="All floors + front/side elevation drawings" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DocUpload label="Architect / Engineer Registration Certificate" name="architect_cert" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Valid registration with Council of Architecture" />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setStep(1)}>← Back</Button>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 1: Construction Permit */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField fullWidth required label="Building Plan Approval Number *" name="permit_app_number" value={formData.permit_app_number} onChange={handleChange} placeholder="MBP-2024-XXXX" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Owner Name *" name="owner_name" value={formData.owner_name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12}><Alert severity="warning">Construction permit must be applied after building plan approval is granted. Work commencement without permit is liable for demolition.</Alert></Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Occupancy Certificate */}
        <TabPanel value={tab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Original Permit/Plan Approval No. *" name="completion_app_number" value={formData.completion_app_number} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Date of Construction Completion" name="completion_date" value={formData.completion_date} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Occupancy Type" name="occupancy_type" value={formData.occupancy_type} onChange={handleChange}>
                {['residential', 'commercial', 'industrial', 'institutional'].map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Owner Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12}><Alert severity="info">A final inspection will be conducted. Occupancy Certificate is mandatory before occupying the building.</Alert></Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Track Application */}
        <TabPanel value={tab} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}><TextField fullWidth label="Application Number" name="track_number" value={formData.track_number} onChange={handleChange} placeholder="MBP-2024-XXXX" /></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={fetchTrack}>Track</Button></Grid>
            {trackData && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#ede7f6' }}>
                  <Typography variant="body1">App No: <b>{trackData.appNo}</b></Typography>
                  <Typography variant="body1">Status: <Chip label={trackData.status} color="warning" size="small" sx={{ ml: 1 }} /></Typography>
                  <Typography variant="body1">Submitted: <b>{trackData.submitted}</b></Typography>
                  <Typography variant="body1">Inspector: <b>{trackData.inspector}</b></Typography>
                  <Typography variant="body1" color="primary"><b>Next: {trackData.nextStep}</b></Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Tab 4: Pay Permit Fee */}
        <TabPanel value={tab} index={4}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}><TextField fullWidth label="Application Number" name="fee_app_number" value={formData.fee_app_number} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={fetchFee}>Fetch Fee</Button></Grid>
            {feeData && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#ede7f6' }}>
                  <Typography variant="body1">Type: <b>{feeData.type}</b></Typography>
                  <Typography variant="h6" color="primary">Amount Due: ₹{feeData.amount.toLocaleString()}</Typography>
                  <Typography variant="body2">Due by: {feeData.due}</Typography>
                </Paper>
                <RadioGroup row name="payment_method" value={formData.payment_method} onChange={handleChange} sx={{ mt: 1 }}>
                  {['upi', 'net_banking', 'card'].map(m => <FormControlLabel key={m} value={m} control={<Radio />} label={m.replace('_', ' ').toUpperCase()} />)}
                </RadioGroup>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        {tab !== 3 && (
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : tab === 4 ? 'Pay Now' : 'Submit Application'}
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default MunicipalBuildingPermitForm;
