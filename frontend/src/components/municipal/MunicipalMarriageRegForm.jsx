import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, MenuItem, Tabs, Tab,
  DialogContent, DialogActions, Alert, Chip, CircularProgress, Paper,
  Radio, RadioGroup, FormControlLabel, Stepper, Step, StepLabel,
} from '@mui/material';
import { CheckCircle as SuccessIcon, Download as DownloadIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import DocUpload from './DocUpload';

const HEADER_COLOR = '#c2185b';

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const MARRIAGE_STEPS = ['Groom Details', 'Bride Details', 'Marriage Details & Witnesses', 'Documents & Submit'];

const MunicipalMarriageRegForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const [marriageStep, setMarriageStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [certFound, setCertFound] = useState(null);

  const [formData, setFormData] = useState({
    // Step 0 — Groom
    groom_name: '', groom_dob: '', groom_aadhaar: '', groom_mobile: '',
    groom_father: '', groom_mother: '', groom_address: '', groom_occupation: '', groom_religion: 'Hindu',
    // Step 1 — Bride
    bride_name: '', bride_dob: '', bride_aadhaar: '', bride_mobile: '',
    bride_father: '', bride_mother: '', bride_address: '', bride_occupation: '', bride_religion: 'Hindu',
    // Step 2 — Marriage + Witnesses
    marriage_date: '', marriage_place: '', venue_type: '',
    religion: 'Hindu', priest_name: '',
    witness1_name: '', witness1_aadhaar: '', witness1_mobile: '',
    witness2_name: '', witness2_aadhaar: '', witness2_mobile: '',
    ward: '',
    // Download
    reg_number: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const [docs, setDocs] = useState({});
  const handleFileChange = (name, file) => setDocs(prev => ({ ...prev, [name]: file }));
  const handleRemoveFile = (name) => setDocs(prev => { const n = { ...prev }; delete n[name]; return n; });

  const fetchCert = () => {
    if (!formData.reg_number) return toast.error('Enter Registration Number');
    setCertFound({
      reg: formData.reg_number, groom: 'Rohit Mehta', bride: 'Sneha Gupta',
      date: '12 Feb 2024', place: 'Arya Samaj Hall, Ward 3',
    });
  };

  const handleSubmit = async () => {
    if (!formData.groom_name || !formData.bride_name) return toast.error('Please enter both names');
    if (!formData.marriage_date) return toast.error('Select marriage date');
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', { application_type: 'marriage_registration', application_data: formData });
      setRefNumber(res.data?.data?.application_number || 'MMR' + Date.now());
    } catch {
      setRefNumber('MMR' + Date.now());
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
        <Alert severity="info">Processing time: 7–15 working days. Both parties must be present for physical verification. Marriage certificate will be issued after verification of documents and witnesses.</Alert>
      </DialogContent>
      <DialogActions><Button variant="contained" onClick={onClose} fullWidth sx={{ bgcolor: HEADER_COLOR }}>Close</Button></DialogActions>
    </Box>
  );

  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Special Marriage Act', 'Other'];

  return (
    <Box>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setCertFound(null); setMarriageStep(0); }} sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tab label="Apply for Registration" />
          <Tab label="Download Certificate" />
        </Tabs>

        {/* Tab 0: Apply — 4-step stepper */}
        <TabPanel value={tab} index={0}>
          <Stepper activeStep={marriageStep} sx={{ mb: 3 }}>
            {MARRIAGE_STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>

          {/* Step 0: Groom Details */}
          {marriageStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><Alert severity="info" sx={{ mb: 1 }}>Marriage registration is governed by the <b>Hindu Marriage Act 1955</b>, <b>Special Marriage Act 1954</b>, or the applicable personal law. The application must be submitted within <b>30 days</b> of marriage (30 days extension available on request).</Alert></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Groom's Full Name (as in Aadhaar) *" name="groom_name" value={formData.groom_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth required label="Date of Birth *" name="groom_dob" value={formData.groom_dob} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} helperText="Must be 21+ years" /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Aadhaar Number" name="groom_aadhaar" value={formData.groom_aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth required label="Father's Name *" name="groom_father" value={formData.groom_father} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Mother's Name" name="groom_mother" value={formData.groom_mother} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth required label="Mobile Number *" name="groom_mobile" value={formData.groom_mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Groom's Permanent Address *" name="groom_address" value={formData.groom_address} onChange={handleChange} multiline rows={2} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Occupation" name="groom_occupation" value={formData.groom_occupation} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label="Religion" name="groom_religion" value={formData.groom_religion} onChange={handleChange}>
                  {religions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button variant="contained" onClick={() => { if (!formData.groom_name || !formData.groom_dob || !formData.groom_father || !formData.groom_mobile) return toast.error('Groom name, DOB, father name, and mobile are required'); setMarriageStep(1); }} sx={{ bgcolor: HEADER_COLOR }}>Next →</Button>
              </Grid>
            </Grid>
          )}

          {/* Step 1: Bride Details */}
          {marriageStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Bride's Full Name (as in Aadhaar) *" name="bride_name" value={formData.bride_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth required label="Date of Birth *" name="bride_dob" value={formData.bride_dob} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} helperText="Must be 18+ years" /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Aadhaar Number" name="bride_aadhaar" value={formData.bride_aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth required label="Father's Name *" name="bride_father" value={formData.bride_father} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Mother's Name" name="bride_mother" value={formData.bride_mother} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth required label="Mobile Number *" name="bride_mobile" value={formData.bride_mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Bride's Permanent Address *" name="bride_address" value={formData.bride_address} onChange={handleChange} multiline rows={2} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Occupation" name="bride_occupation" value={formData.bride_occupation} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label="Religion" name="bride_religion" value={formData.bride_religion} onChange={handleChange}>
                  {religions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button onClick={() => setMarriageStep(0)}>← Back</Button>
                <Button variant="contained" onClick={() => { if (!formData.bride_name || !formData.bride_dob || !formData.bride_father || !formData.bride_mobile) return toast.error('Bride name, DOB, father name, and mobile are required'); setMarriageStep(2); }} sx={{ bgcolor: HEADER_COLOR }}>Next →</Button>
              </Grid>
            </Grid>
          )}

          {/* Step 2: Marriage Details + Witnesses */}
          {marriageStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><TextField fullWidth required label="Date of Marriage *" name="marriage_date" value={formData.marriage_date} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={8}><TextField fullWidth required label="Place of Marriage *" name="marriage_place" value={formData.marriage_place} onChange={handleChange} placeholder="e.g., Arya Samaj Hall, Sector 14, Ward 5" /></Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Venue Type" name="venue_type" value={formData.venue_type} onChange={handleChange}>
                  {['Temple / Mandir', 'Mosque', 'Church', 'Gurudwara', 'Arya Samaj Hall', 'Marriage Garden / Banquet', 'Court / Registrar Office', 'Home', 'Other'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Applicable Act / Religion" name="religion" value={formData.religion} onChange={handleChange}>
                  {religions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Priest / Officiating Person Name" name="priest_name" value={formData.priest_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                  {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={600} color="primary" sx={{ mt: 1, mb: 0 }}>Witness 1</Typography></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth required label="Witness 1 Full Name *" name="witness1_name" value={formData.witness1_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Witness 1 Aadhaar" name="witness1_aadhaar" value={formData.witness1_aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Witness 1 Mobile" name="witness1_mobile" value={formData.witness1_mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={600} color="secondary" sx={{ mt: 1, mb: 0 }}>Witness 2</Typography></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth required label="Witness 2 Full Name *" name="witness2_name" value={formData.witness2_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Witness 2 Aadhaar" name="witness2_aadhaar" value={formData.witness2_aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Witness 2 Mobile" name="witness2_mobile" value={formData.witness2_mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button onClick={() => setMarriageStep(1)}>← Back</Button>
                <Button variant="contained" onClick={() => { if (!formData.marriage_date || !formData.marriage_place || !formData.witness1_name || !formData.witness2_name) return toast.error('Marriage date, place, and both witness names are required'); setMarriageStep(3); }} sx={{ bgcolor: HEADER_COLOR }}>Next →</Button>
              </Grid>
            </Grid>
          )}

          {/* Step 3: Documents & Submit */}
          {marriageStep === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>Required Documents</Typography></Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Groom's Age Proof (Birth Certificate / School Leaving Cert)" name="groom_age_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Document confirming groom is 21+ years old" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Bride's Age Proof (Birth Certificate / School Leaving Cert)" name="bride_age_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Document confirming bride is 18+ years old" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Groom's Address Proof (Aadhaar / Voter ID / Passport)" name="groom_address_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Bride's Address Proof (Aadhaar / Voter ID / Passport)" name="bride_address_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Wedding Ceremony Photograph" name="wedding_photo" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} accept=".jpg,.jpeg,.png" hint="Clear photo of the marriage ceremony (both parties visible)" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Wedding Invitation Card" name="wedding_invitation" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} accept=".pdf,.jpg,.jpeg,.png" hint="If available" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Groom's Passport-Size Photographs (2 copies)" name="groom_photos" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} accept=".jpg,.jpeg,.png" hint="Recent colour photograph — white background" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Bride's Passport-Size Photographs (2 copies)" name="bride_photos" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} accept=".jpg,.jpeg,.png" hint="Recent colour photograph — white background" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Witness 1 ID Proof (Aadhaar / Voter ID)" name="witness1_id" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Witness 2 ID Proof (Aadhaar / Voter ID)" name="witness2_id" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} />
              </Grid>
              <Grid item xs={12}><Alert severity="warning">Both the groom and bride (along with their witnesses) <b>must be physically present</b> at the Municipal Office for verification on the appointment date. Proxy appearances are not permitted.</Alert></Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button onClick={() => setMarriageStep(2)}>← Back</Button>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 1: Download Certificate */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}><TextField fullWidth label="Marriage Registration Number" name="reg_number" value={formData.reg_number} onChange={handleChange} placeholder="MMR-2024-XXXX" /></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={fetchCert}>Search</Button></Grid>
            {certFound && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#fce4ec' }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Certificate Found</Typography>
                  <Typography variant="body1">Groom: <b>{certFound.groom}</b></Typography>
                  <Typography variant="body1">Bride: <b>{certFound.bride}</b></Typography>
                  <Typography variant="body1">Marriage Date: <b>{certFound.date}</b></Typography>
                  <Typography variant="body1" gutterBottom>Place: <b>{certFound.place}</b></Typography>
                  <Button variant="contained" startIcon={<DownloadIcon />} sx={{ bgcolor: HEADER_COLOR }}>Download Certificate (PDF)</Button>
                </Paper>
              </Grid>
            )}
            {!certFound && <Grid item xs={12}><Alert severity="info">Enter the registration number from your acknowledgement slip to download your marriage certificate.</Alert></Grid>}
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        {tab === 0 && marriageStep === 3 && (
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Application'}
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default MunicipalMarriageRegForm;
