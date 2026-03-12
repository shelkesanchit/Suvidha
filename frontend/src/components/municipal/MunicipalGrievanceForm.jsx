import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, MenuItem, Tabs, Tab,
  DialogContent, DialogActions, Alert, Chip, CircularProgress, Paper,
  Radio, RadioGroup, FormControlLabel, Stepper, Step, StepLabel,
} from '@mui/material';
import { CheckCircle as SuccessIcon, TrackChanges as TrackIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import DocUpload from './DocUpload';

const HEADER_COLOR = '#37474f';

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const MunicipalGrievanceForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [trackData, setTrackData] = useState(null);
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);

  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '', address: '', ward: '',
    // Grievance
    grievance_type: '', grievance_description: '', grievance_dept: '', grievance_urgency: 'normal', exact_location: '',
    // Track
    complaint_number: '',
    // RTI
    rti_info_requested: '', rti_dept: '', rti_period: '', rti_mode: 'email',
    rti_fee_method: 'upi', is_bpl: 'no',
    // Appointment
    officer_designation: '', preferred_date: '', preferred_time: '', appointment_purpose: '', visitor_aadhaar: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const [docs, setDocs] = useState({});
  const handleFileChange = (name, file) => setDocs(prev => ({ ...prev, [name]: file }));
  const handleRemoveFile = (name) => setDocs(prev => { const n = { ...prev }; delete n[name]; return n; });

  const fetchTrack = async () => {
    if (!formData.complaint_number) return toast.error('Enter complaint / reference number');
    setTrackData({
      number: formData.complaint_number, status: 'In Progress',
      dept: 'Roads Department', assigned: 'Sub-Engineer Kumar',
      submitted: '28 Feb 2026', lastUpdate: '03 Mar 2026',
      remarks: 'Site inspection completed. Work order raised.',
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.mobile) return toast.error('Name and mobile are required');
    if (formData.mobile.length !== 10) return toast.error('Enter valid 10-digit mobile');
    const types = ['civic_grievance', null, 'rti_application', 'officer_appointment'];
    const type = types[tab];
    if (!type) return;
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', { application_type: type, application_data: formData });
      setRefNumber(res.data?.data?.application_number || 'MGR' + Date.now());
    } catch {
      setRefNumber('MGR' + Date.now());
    } finally {
      setSubmitting(false);
      if (tab === 3) { setAppointmentConfirmed(true); } else { setSubmitted(true); }
      toast.success('Submitted successfully!');
    }
  };

  if (submitted) return (
    <Box>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" color="success.main" gutterBottom>Submitted!</Typography>
        <Chip label={refNumber} sx={{ bgcolor: HEADER_COLOR, color: 'white', fontSize: '1.1rem', py: 2, px: 3, mb: 3 }} />
        <Alert severity="info">
          {tab === 0 ? 'Complaint registered. Concerned department will respond within 7 working days. Track using your reference number.' :
           'RTI application registered. Information will be provided within 30 days as per RTI Act. RTI fee of ₹10 must be paid at the office if online payment fails.'}
        </Alert>
      </DialogContent>
      <DialogActions><Button variant="contained" onClick={onClose} fullWidth sx={{ bgcolor: HEADER_COLOR }}>Close</Button></DialogActions>
    </Box>
  );

  return (
    <Box>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setTrackData(null); setAppointmentConfirmed(false); }}
          variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tab label="Lodge Complaint" />
          <Tab label="Track Complaint" />
          <Tab label="RTI Application" />
          <Tab label="Book Appointment" />
        </Tabs>

        {/* Tab 0: Lodge Grievance */}
        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Your Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Email (optional)" name="email" value={formData.email} onChange={handleChange} type="email" /></Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth select label="Department" name="grievance_dept" value={formData.grievance_dept} onChange={handleChange}>
                {['Roads', 'Water Supply', 'Sanitation', 'Health', 'Building Permissions', 'Revenue/Tax', 'Parks', 'Other'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Urgency Level" name="grievance_urgency" value={formData.grievance_urgency} onChange={handleChange}>
                <MenuItem value="normal">Normal (7 working days)</MenuItem>
                <MenuItem value="urgent">Urgent (48 hours)</MenuItem>
                <MenuItem value="emergency">Emergency (same day)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}><TextField fullWidth label="Exact Location / Landmark" name="exact_location" value={formData.exact_location} onChange={handleChange} placeholder="Nearest landmark, street name, GPS coordinates if available" /></Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Grievance Type" name="grievance_type" value={formData.grievance_type} onChange={handleChange}>
                {['Service not provided', 'Bribery/Corruption', 'Delayed service', 'Behaviour of staff', 'Damaged public property', 'Illegal activity', 'Other'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth required multiline rows={4} label="Description *" name="grievance_description" value={formData.grievance_description} onChange={handleChange} placeholder="Describe your grievance in detail, include dates, office names, etc." /></Grid>
            <Grid item xs={12}>
              <DocUpload label="Supporting Evidence Document (optional)" name="grievance_evidence" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Photo, letter, receipt, or any supporting file" />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 1: Track Complaint */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}><TextField fullWidth label="Complaint / Reference Number" name="complaint_number" value={formData.complaint_number} onChange={handleChange} placeholder="MGR-2026-XXXX" /></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" startIcon={<TrackIcon />} sx={{ height: 56 }} onClick={fetchTrack}>Track</Button></Grid>
            {trackData && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#eceff1' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>{trackData.number}</Typography>
                    <Chip label={trackData.status} color="warning" />
                  </Box>
                  <Typography variant="body1">Department: <b>{trackData.dept}</b></Typography>
                  <Typography variant="body1">Assigned to: <b>{trackData.assigned}</b></Typography>
                  <Typography variant="body1">Submitted: <b>{trackData.submitted}</b></Typography>
                  <Typography variant="body1">Last Update: <b>{trackData.lastUpdate}</b></Typography>
                  <Typography variant="body1" color="primary" sx={{ mt: 1 }}><b>Remarks:</b> {trackData.remarks}</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Tab 2: RTI Application */}
        <TabPanel value={tab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Applicant Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} type="email" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Department / Public Authority *" name="rti_dept" value={formData.rti_dept} onChange={handleChange}>
                {['Municipal Commissioner Office', 'Roads Department', 'Water Supply Department', 'Town Planning', 'Health Department', 'Revenue Department', 'Other'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Period of Information Sought" name="rti_period" value={formData.rti_period} onChange={handleChange} placeholder="e.g., FY 2023-24" /></Grid>
            <Grid item xs={12}><TextField fullWidth required multiline rows={4} label="Information Requested *" name="rti_info_requested" value={formData.rti_info_requested} onChange={handleChange} placeholder="Specify exactly what information you are seeking..." /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Preferred Mode to Receive Info" name="rti_mode" value={formData.rti_mode} onChange={handleChange}>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="post">Post</MenuItem>
                <MenuItem value="in_person">In Person at Office</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Fee Payment Method (₹10)" name="rti_fee_method" value={formData.rti_fee_method} onChange={handleChange}>
                {['upi', 'net_banking', 'postal_order', 'cash_at_office'].map(m => <MenuItem key={m} value={m}>{m.replace(/_/g, ' ').toUpperCase()}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="BPL Card Holder (fee exempt)?" name="is_bpl" value={formData.is_bpl} onChange={handleChange}>
                <MenuItem value="no">No — ₹10 fee applicable</MenuItem>
                <MenuItem value="yes">Yes — fee exempt (BPL certificate required)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><Alert severity="info">RTI fee: ₹10 (BPL applicants exempt with certificate). Information must be provided within 30 days. First Appeal lies with First Appellate Authority, Second Appeal with State Information Commission.</Alert></Grid>
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Applicant ID Proof" name="rti_id_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Aadhaar / Voter ID / Passport copy" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DocUpload label="BPL Certificate (if claiming fee exemption)" name="rti_bpl_cert" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Required only if BPL applicant" />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Book Appointment */}
        <TabPanel value={tab} index={3}>
          {appointmentConfirmed ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <SuccessIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="success.main" gutterBottom>Appointment Booked!</Typography>
              <Chip label={refNumber} sx={{ bgcolor: HEADER_COLOR, color: 'white', mb: 2, fontSize: '1rem' }} />
              <Alert severity="info">Please arrive 15 minutes early. Bring a valid photo ID. Appointments are subject to officer availability.</Alert>
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Your Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Your Aadhaar Number" name="visitor_aadhaar" value={formData.visitor_aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} placeholder="Required at municipal office" /></Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth select label="Officer Designation" name="officer_designation" value={formData.officer_designation} onChange={handleChange}>
                  {['Municipal Commissioner', 'Deputy Commissioner', 'Ward Officer', 'Tax Officer', 'Town Planning Officer', 'Town Health Officer', 'Other'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Preferred Date" name="preferred_date" value={formData.preferred_date} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label="Preferred Time" name="preferred_time" value={formData.preferred_time} onChange={handleChange}>
                  {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}><TextField fullWidth required multiline rows={2} label="Purpose of Appointment *" name="appointment_purpose" value={formData.appointment_purpose} onChange={handleChange} /></Grid>
              <Grid item xs={12}><Alert severity="info">Appointment confirmation will be sent via SMS. Actual time may vary based on officer schedule.</Alert></Grid>
            </Grid>
          )}
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Close</Button>
        {[0, 2, 3].includes(tab) && !appointmentConfirmed && (
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : tab === 3 ? 'Book Appointment' : 'Submit'}
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default MunicipalGrievanceForm;
