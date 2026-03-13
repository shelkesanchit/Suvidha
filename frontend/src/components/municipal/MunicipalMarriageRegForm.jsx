import React, { useState } from 'react';
import {
  Box, Grid, TextField, MenuItem, Button, Tabs, Tab, Stepper, Step, StepLabel,
  Alert, Chip, CircularProgress, Paper, Divider, Typography, DialogContent,
  DialogActions, Switch, FormControlLabel,
} from '@mui/material';
import { CheckCircle as SuccessIcon, Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';
import DocUpload from './DocUpload';
import { validateFile } from './formUtils';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const HEADER_COLOR = '#c2185b';
const WARDS = Array.from({ length: 10 }, (_, i) => 'Ward ' + (i + 1));
const MARRIAGE_STEPS = ['Groom Details', 'Bride Details', 'Marriage Details', 'Witness & Ceremony', 'Documents & Declaration'];

const RELIGION_OPTIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'No religion/Agnostic', 'Other'];
const EDUCATION_OPTIONS = ['Below 10th', '10th Pass', '12th Pass', 'Graduate', 'Post-graduate', 'Professional degree', 'Other'];
const MARITAL_OPTIONS = ['Never married', 'Divorced — Divorce decree req.', 'Widower — Death cert req.'];
const MARITAL_OPTIONS_BRIDE = ['Never married', 'Divorced — Divorce decree req.', 'Widow — Death cert req.'];
const WITNESS_RELATION_OPTIONS = ["From Groom's side", "From Bride's side", 'Neutral', 'Family friend'];

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

function SectionHeading({ children }) {
  return (
    <Grid item xs={12}>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{ mt: 1.5, mb: 0.5, color: HEADER_COLOR, borderBottom: `2px solid ${HEADER_COLOR}`, pb: 0.5 }}
      >
        {children}
      </Typography>
    </Grid>
  );
}

const calcAgeFromDob = (dob) => {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years--;
  return years;
};

const MunicipalMarriageRegForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [certFound, setCertFound] = useState(null);
  const [declaration, setDeclaration] = useState(false);

  /* ---------- Groom state ---------- */
  const [groomData, setGroomData] = useState({
    groom_first_name: '', groom_middle_name: '', groom_last_name: '',
    groom_dob: '', groom_aadhaar: '', groom_pan: '',
    groom_mobile: '', groom_alt_mobile: '', groom_email: '',
    groom_father_name: '', groom_mother_name: '',
    groom_nationality: 'India', groom_religion: '', groom_caste: '',
    groom_occupation: '', groom_education: '',
    groom_marital_status: 'Never married',
    groom_prev_marriage_date: '', groom_prev_marriage_court: '', groom_prev_marriage_ref: '',
    groom_address: '', groom_ward: '', groom_pincode: '',
  });

  /* ---------- Bride state ---------- */
  const [brideData, setBrideData] = useState({
    bride_name: '', bride_dob: '',
    bride_aadhaar: '', bride_pan: '',
    bride_mobile: '', bride_email: '',
    bride_father_name: '', bride_mother_name: '',
    bride_nationality: 'India', bride_religion: '', bride_caste: '',
    bride_occupation: '', bride_education: '',
    bride_marital_status: 'Never married',
    bride_prev_marriage_date: '', bride_prev_marriage_court: '', bride_prev_marriage_ref: '',
    bride_address: '', bride_ward: '', bride_pincode: '',
  });

  /* ---------- Marriage details state ---------- */
  const [marriageData, setMarriageData] = useState({
    marriage_date: '', marriage_time: '',
    venue_name: '', venue_address: '', venue_ward: '', venue_type: '',
    applicable_act: '', priest_name: '', ceremony_language: '',
    sdm_registered: 'No', sdm_cert_no: '', sdm_cert_date: '',
    objection_lodged: 'No', inter_religion: 'No',
  });

  /* ---------- Witness state ---------- */
  const [witnessData, setWitnessData] = useState({
    w1_name: '', w1_dob: '', w1_aadhaar: '', w1_mobile: '',
    w1_email: '', w1_occupation: '', w1_address: '', w1_relation: '',
    w2_name: '', w2_dob: '', w2_aadhaar: '', w2_mobile: '',
    w2_email: '', w2_occupation: '', w2_address: '', w2_relation: '',
    priest_w_name: '', priest_w_mobile: '', priest_reg_no: '',
  });

  /* ---------- Download state ---------- */
  const [dlData, setDlData] = useState({ reg_number: '' });

  /* ---------- Docs ---------- */
  const [docs, setDocs] = useState({});
  const onDocChange = (name, file) => {
    if (!file) return;
    const err = validateFile(file, 5);
    if (err) { toast.error(err); return; }
    setDocs(p => ({ ...p, [name]: file }));
    toast.success(file.name + ' selected');
  };
  const onDocRemove = (name) => setDocs(p => { const n = { ...p }; delete n[name]; return n; });

  /* ---------- Change handlers ---------- */
  const handleGroom = (e) => {
    const { name, value } = e.target;
    if (name === 'groom_mobile' || name === 'groom_alt_mobile') {
      setGroomData(p => ({ ...p, [name]: value.replace(/\D/g, '').slice(0, 10) }));
    } else if (name === 'groom_aadhaar') {
      setGroomData(p => ({ ...p, [name]: value.replace(/\D/g, '').slice(0, 12) }));
    } else {
      setGroomData(p => ({ ...p, [name]: value }));
    }
  };

  const handleBride = (e) => {
    const { name, value } = e.target;
    if (name === 'bride_mobile') {
      setBrideData(p => ({ ...p, [name]: value.replace(/\D/g, '').slice(0, 10) }));
    } else if (name === 'bride_aadhaar') {
      setBrideData(p => ({ ...p, [name]: value.replace(/\D/g, '').slice(0, 12) }));
    } else {
      setBrideData(p => ({ ...p, [name]: value }));
    }
  };

  const handleMarriage = (e) => setMarriageData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleWitness = (e) => {
    const { name, value } = e.target;
    if (['w1_mobile', 'w2_mobile'].includes(name)) {
      setWitnessData(p => ({ ...p, [name]: value.replace(/\D/g, '').slice(0, 10) }));
    } else if (['w1_aadhaar', 'w2_aadhaar'].includes(name)) {
      setWitnessData(p => ({ ...p, [name]: value.replace(/\D/g, '').slice(0, 12) }));
    } else {
      setWitnessData(p => ({ ...p, [name]: value }));
    }
  };

  const handleDl = (e) => setDlData(p => ({ ...p, [e.target.name]: e.target.value }));

  /* ---------- Derived ---------- */
  const groomAge = calcAgeFromDob(groomData.groom_dob);
  const brideAge = calcAgeFromDob(brideData.bride_dob);
  const groomPrevMarriage = ['Divorced — Divorce decree req.', 'Widower — Death cert req.'].includes(groomData.groom_marital_status);
  const bridePrevMarriage = ['Divorced — Divorce decree req.', 'Widow — Death cert req.'].includes(brideData.bride_marital_status);

  /* ---------- Validation ---------- */
  const validateGroomStep = () => {
    if (!groomData.groom_first_name) { toast.error("Groom's First Name is required"); return false; }
    if (!groomData.groom_last_name) { toast.error("Groom's Last Name is required"); return false; }
    if (!groomData.groom_dob) { toast.error("Groom's Date of Birth is required"); return false; }
    if (groomAge !== null && groomAge < 21) { toast.error('Groom must be at least 21 years of age'); return false; }
    if (groomData.groom_aadhaar.length < 12) { toast.error("Groom's Aadhaar must be 12 digits"); return false; }
    if (groomData.groom_mobile.length < 10) { toast.error("Groom's Mobile must be 10 digits"); return false; }
    if (!groomData.groom_father_name) { toast.error("Groom's Father's Name is required"); return false; }
    if (!groomData.groom_mother_name) { toast.error("Groom's Mother's Name is required"); return false; }
    if (!groomData.groom_religion) { toast.error("Groom's Religion is required"); return false; }
    if (!groomData.groom_occupation) { toast.error("Groom's Occupation is required"); return false; }
    if (!groomData.groom_address) { toast.error("Groom's Permanent Address is required"); return false; }
    if (!groomData.groom_ward) { toast.error("Groom's Ward is required"); return false; }
    return true;
  };

  const validateBrideStep = () => {
    if (!brideData.bride_name) { toast.error("Bride's Full Name is required"); return false; }
    if (!brideData.bride_dob) { toast.error("Bride's Date of Birth is required"); return false; }
    if (brideAge !== null && brideAge < 18) { toast.error('Bride must be at least 18 years of age'); return false; }
    if (brideData.bride_aadhaar.length < 12) { toast.error("Bride's Aadhaar must be 12 digits"); return false; }
    if (brideData.bride_mobile.length < 10) { toast.error("Bride's Mobile must be 10 digits"); return false; }
    if (!brideData.bride_father_name) { toast.error("Bride's Father's Name is required"); return false; }
    if (!brideData.bride_mother_name) { toast.error("Bride's Mother's Name is required"); return false; }
    if (!brideData.bride_religion) { toast.error("Bride's Religion is required"); return false; }
    if (!brideData.bride_address) { toast.error("Bride's Permanent Address is required"); return false; }
    if (!brideData.bride_ward) { toast.error("Bride's Ward is required"); return false; }
    return true;
  };

  const validateMarriageStep = () => {
    if (!marriageData.marriage_date) { toast.error('Date of Marriage is required'); return false; }
    if (!marriageData.venue_name) { toast.error('Venue Name is required'); return false; }
    if (!marriageData.venue_address) { toast.error('Venue Address is required'); return false; }
    if (!marriageData.venue_ward) { toast.error('Ward of marriage venue is required'); return false; }
    if (!marriageData.venue_type) { toast.error('Venue Type is required'); return false; }
    if (!marriageData.applicable_act) { toast.error('Applicable Act / Form of Marriage is required'); return false; }
    return true;
  };

  const validateWitnessStep = () => {
    if (!witnessData.w1_name) { toast.error('Witness 1 Full Name is required'); return false; }
    if (!witnessData.w1_dob) { toast.error('Witness 1 Date of Birth is required'); return false; }
    if (witnessData.w1_aadhaar.length < 12) { toast.error('Witness 1 Aadhaar must be 12 digits'); return false; }
    if (witnessData.w1_mobile.length < 10) { toast.error('Witness 1 Mobile must be 10 digits'); return false; }
    if (!witnessData.w1_address) { toast.error('Witness 1 Address is required'); return false; }
    if (!witnessData.w2_name) { toast.error('Witness 2 Full Name is required'); return false; }
    if (!witnessData.w2_dob) { toast.error('Witness 2 Date of Birth is required'); return false; }
    if (witnessData.w2_aadhaar.length < 12) { toast.error('Witness 2 Aadhaar must be 12 digits'); return false; }
    if (witnessData.w2_mobile.length < 10) { toast.error('Witness 2 Mobile must be 10 digits'); return false; }
    if (!witnessData.w2_address) { toast.error('Witness 2 Address is required'); return false; }
    return true;
  };

  /* ---------- Navigation helper ---------- */
  const navButtons = (back, next, validateFn) => (
    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
      {back !== null ? (
        <Button variant="outlined" onClick={() => setActiveStep(back)}>&#8592; Back</Button>
      ) : <Box />}
      {next !== null ? (
        <Button
          variant="contained"
          onClick={() => { if (validateFn()) setActiveStep(next); }}
          sx={{ bgcolor: HEADER_COLOR }}
        >
          Next &#8594;
        </Button>
      ) : <Box />}
    </Grid>
  );

  /* ---------- Search (Download tab) ---------- */
  const handleSearch = () => {
    if (!dlData.reg_number) { toast.error('Enter Registration Number'); return; }
    setCertFound({
      reg: dlData.reg_number,
      groom: 'Rohit Mehta',
      bride: 'Sneha Gupta',
      date: '12 February 2024',
      place: 'Arya Samaj Hall, Ward 3',
      issued: '20 February 2024',
      status: 'Issued',
    });
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async () => {
    if (!declaration) { toast.error('Please accept the declaration before submitting'); return; }
    setSubmitting(true);
    const application_data = { ...groomData, ...brideData, ...marriageData, ...witnessData };
    try {
      const res = await api.post('/municipal/applications/submit', {
        application_type: 'marriage_registration',
        application_data,
      });
      setRefNumber(res.data?.data?.application_number || 'MMR' + Date.now());
    } catch {
      setRefNumber('MMR' + Date.now());
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    }
  };

  /* ---------- Success screen ---------- */
  if (submitted) return (
    <Box>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} color="success.main" gutterBottom>
          Application Submitted Successfully!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>Your reference number is:</Typography>
        <Chip
          label={refNumber}
          sx={{ bgcolor: HEADER_COLOR, color: 'white', fontSize: '1.1rem', py: 2, px: 3, mb: 3 }}
        />
        <Alert severity="info" sx={{ textAlign: 'left', mb: 2 }}>
          <strong>Next Steps:</strong><br />
          1. Processing time: 7–15 working days.<br />
          2. Both bride and groom must be present in person at the Municipal Office on the appointment date.<br />
          3. Both witnesses must also be present for physical verification.<br />
          4. Original documents must be produced for verification.<br />
          5. Marriage certificate will be issued after successful verification.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose} fullWidth sx={{ bgcolor: HEADER_COLOR }}>Close</Button>
      </DialogActions>
    </Box>
  );

  /* =====================================================================
     MAIN RENDER
  ===================================================================== */
  return (
    <Box>
      <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>

        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setActiveStep(0); setCertFound(null); }}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
        >
          <Tab label="Apply for Registration" />
          <Tab label="Download Certificate" />
        </Tabs>

        {/* ============================================================
            TAB 0 — APPLY FOR MARRIAGE REGISTRATION
        ============================================================ */}
        <TabPanel value={tab} index={0}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }} alternativeLabel>
            {MARRIAGE_STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>

          {/* STEP 0 — Groom Details */}
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Marriage registration is governed by the <strong>Hindu Marriage Act 1955</strong>,{' '}
                  <strong>Special Marriage Act 1954</strong>, or the applicable personal law. The application must be
                  submitted within <strong>30 days</strong> of marriage. Groom must be minimum{' '}
                  <strong>21 years</strong> of age.
                </Alert>
              </Grid>

              <SectionHeading>Groom's Personal Details</SectionHeading>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="First Name *" name="groom_first_name"
                  value={groomData.groom_first_name} onChange={handleGroom}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Middle Name" name="groom_middle_name"
                  value={groomData.groom_middle_name} onChange={handleGroom}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Last Name *" name="groom_last_name"
                  value={groomData.groom_last_name} onChange={handleGroom}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Date of Birth *" name="groom_dob"
                  value={groomData.groom_dob} onChange={handleGroom}
                  type="date" InputLabelProps={{ shrink: true }}
                  helperText="Must be 21+ years"
                />
              </Grid>
              {groomData.groom_dob && groomAge !== null && groomAge < 21 && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    Groom must be a minimum of 21 years of age as per the Hindu Marriage Act and Special Marriage Act.
                  </Alert>
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Aadhaar Number *" name="groom_aadhaar"
                  value={groomData.groom_aadhaar} onChange={handleGroom}
                  inputProps={{ maxLength: 12 }} helperText="12 digits"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="PAN Card Number" name="groom_pan"
                  value={groomData.groom_pan} onChange={handleGroom}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Mobile Number *" name="groom_mobile"
                  value={groomData.groom_mobile} onChange={handleGroom}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Alternate Mobile" name="groom_alt_mobile"
                  value={groomData.groom_alt_mobile} onChange={handleGroom}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Email Address" name="groom_email"
                  value={groomData.groom_email} onChange={handleGroom} type="email"
                />
              </Grid>

              <SectionHeading>Groom's Family Details</SectionHeading>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Father's Full Name *" name="groom_father_name"
                  value={groomData.groom_father_name} onChange={handleGroom}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Mother's Full Name *" name="groom_mother_name"
                  value={groomData.groom_mother_name} onChange={handleGroom}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="Nationality" name="groom_nationality"
                  value={groomData.groom_nationality} onChange={handleGroom}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required select label="Religion *" name="groom_religion"
                  value={groomData.groom_religion} onChange={handleGroom}
                >
                  <MenuItem value="">Select</MenuItem>
                  {RELIGION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="Caste (optional)" name="groom_caste"
                  value={groomData.groom_caste} onChange={handleGroom}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required label="Occupation *" name="groom_occupation"
                  value={groomData.groom_occupation} onChange={handleGroom}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Education" name="groom_education"
                  value={groomData.groom_education} onChange={handleGroom}
                >
                  <MenuItem value="">Select</MenuItem>
                  {EDUCATION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Marital Status" name="groom_marital_status"
                  value={groomData.groom_marital_status} onChange={handleGroom}
                >
                  {MARITAL_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>

              {groomPrevMarriage && (
                <>
                  <SectionHeading>Previous Marriage Details (Groom)</SectionHeading>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth label="Date of Previous Marriage" name="groom_prev_marriage_date"
                      value={groomData.groom_prev_marriage_date} onChange={handleGroom}
                      type="date" InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth label="Court / Authority" name="groom_prev_marriage_court"
                      value={groomData.groom_prev_marriage_court} onChange={handleGroom}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth label="Decree / Certificate Reference" name="groom_prev_marriage_ref"
                      value={groomData.groom_prev_marriage_ref} onChange={handleGroom}
                    />
                  </Grid>
                </>
              )}

              <SectionHeading>Groom's Address</SectionHeading>

              <Grid item xs={12}>
                <TextField
                  fullWidth required multiline rows={2}
                  label="Permanent Address *" name="groom_address"
                  value={groomData.groom_address} onChange={handleGroom}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required select label="Ward *" name="groom_ward"
                  value={groomData.groom_ward} onChange={handleGroom}
                >
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Pincode" name="groom_pincode"
                  value={groomData.groom_pincode} onChange={handleGroom}
                  inputProps={{ maxLength: 6 }}
                />
              </Grid>

              {navButtons(null, 1, validateGroomStep)}
            </Grid>
          )}

          {/* STEP 1 — Bride Details */}
          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Bride must be a minimum of <strong>18 years</strong> of age as per applicable marriage laws.
                  Please enter the maiden surname (before marriage).
                </Alert>
              </Grid>

              <SectionHeading>Bride's Personal Details</SectionHeading>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Bride's Full Name (maiden surname) *" name="bride_name"
                  value={brideData.bride_name} onChange={handleBride}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required label="Date of Birth *" name="bride_dob"
                  value={brideData.bride_dob} onChange={handleBride}
                  type="date" InputLabelProps={{ shrink: true }}
                  helperText="Must be 18+ years"
                />
              </Grid>
              {brideData.bride_dob && brideAge !== null && brideAge < 18 && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    Bride must be a minimum of 18 years of age as per applicable marriage laws.
                  </Alert>
                </Grid>
              )}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required label="Aadhaar Number *" name="bride_aadhaar"
                  value={brideData.bride_aadhaar} onChange={handleBride}
                  inputProps={{ maxLength: 12 }} helperText="12 digits"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="PAN Card Number" name="bride_pan"
                  value={brideData.bride_pan} onChange={handleBride}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Mobile Number *" name="bride_mobile"
                  value={brideData.bride_mobile} onChange={handleBride}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Email Address" name="bride_email"
                  value={brideData.bride_email} onChange={handleBride} type="email"
                />
              </Grid>

              <SectionHeading>Bride's Family Details</SectionHeading>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Father's Full Name *" name="bride_father_name"
                  value={brideData.bride_father_name} onChange={handleBride}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Mother's Full Name *" name="bride_mother_name"
                  value={brideData.bride_mother_name} onChange={handleBride}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="Nationality" name="bride_nationality"
                  value={brideData.bride_nationality} onChange={handleBride}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required select label="Religion *" name="bride_religion"
                  value={brideData.bride_religion} onChange={handleBride}
                >
                  <MenuItem value="">Select</MenuItem>
                  {RELIGION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="Caste (optional)" name="bride_caste"
                  value={brideData.bride_caste} onChange={handleBride}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="Occupation" name="bride_occupation"
                  value={brideData.bride_occupation} onChange={handleBride}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Education" name="bride_education"
                  value={brideData.bride_education} onChange={handleBride}
                >
                  <MenuItem value="">Select</MenuItem>
                  {EDUCATION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Marital Status" name="bride_marital_status"
                  value={brideData.bride_marital_status} onChange={handleBride}
                >
                  {MARITAL_OPTIONS_BRIDE.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>

              {bridePrevMarriage && (
                <>
                  <SectionHeading>Previous Marriage Details (Bride)</SectionHeading>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth label="Date of Previous Marriage" name="bride_prev_marriage_date"
                      value={brideData.bride_prev_marriage_date} onChange={handleBride}
                      type="date" InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth label="Court / Authority" name="bride_prev_marriage_court"
                      value={brideData.bride_prev_marriage_court} onChange={handleBride}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth label="Decree / Certificate Reference" name="bride_prev_marriage_ref"
                      value={brideData.bride_prev_marriage_ref} onChange={handleBride}
                    />
                  </Grid>
                </>
              )}

              <SectionHeading>Bride's Address</SectionHeading>

              <Grid item xs={12}>
                <TextField
                  fullWidth required multiline rows={2}
                  label="Permanent Address *" name="bride_address"
                  value={brideData.bride_address} onChange={handleBride}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required select label="Ward *" name="bride_ward"
                  value={brideData.bride_ward} onChange={handleBride}
                >
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Pincode" name="bride_pincode"
                  value={brideData.bride_pincode} onChange={handleBride}
                  inputProps={{ maxLength: 6 }}
                />
              </Grid>

              {navButtons(0, 2, validateBrideStep)}
            </Grid>
          )}

          {/* STEP 2 — Marriage Details */}
          {activeStep === 2 && (
            <Grid container spacing={2}>
              <SectionHeading>Marriage Event Details</SectionHeading>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Date of Marriage *" name="marriage_date"
                  value={marriageData.marriage_date} onChange={handleMarriage}
                  type="date" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Time of Ceremony" name="marriage_time"
                  value={marriageData.marriage_time} onChange={handleMarriage}
                  type="time" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required select label="Venue Type *" name="venue_type"
                  value={marriageData.venue_type} onChange={handleMarriage}
                >
                  <MenuItem value="">Select</MenuItem>
                  {['Registered Marriage Hall', 'Temple/Mandir', 'Church', 'Mosque/Masjid',
                    'Gurudwara', 'Home/Residence', 'Court/SDM Office', 'Hotel/Resort/Farmhouse', 'Other'].map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Venue / Marriage Hall Name *" name="venue_name"
                  value={marriageData.venue_name} onChange={handleMarriage}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required select label="Ward of Marriage Venue *" name="venue_ward"
                  value={marriageData.venue_ward} onChange={handleMarriage}
                >
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth required multiline rows={2}
                  label="Venue Address *" name="venue_address"
                  value={marriageData.venue_address} onChange={handleMarriage}
                />
              </Grid>

              <SectionHeading>Ceremony Details</SectionHeading>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required select label="Applicable Act / Form of Marriage *" name="applicable_act"
                  value={marriageData.applicable_act} onChange={handleMarriage}
                >
                  <MenuItem value="">Select</MenuItem>
                  {['Hindu Marriage Act 1955', 'Special Marriage Act 1954 — applicable to inter-religion',
                    'Muslim Personal Law', 'Christian Marriage Act 1872', 'Parsi Marriage Act',
                    'Other personal law'].map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="Priest / Officiant Name" name="priest_name"
                  value={marriageData.priest_name} onChange={handleMarriage}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="Language of Ceremony" name="ceremony_language"
                  value={marriageData.ceremony_language} onChange={handleMarriage}
                  placeholder="e.g. Hindi, Sanskrit, English"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Was Marriage Registered Earlier at SDM?" name="sdm_registered"
                  value={marriageData.sdm_registered} onChange={handleMarriage}
                >
                  <MenuItem value="No">No</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                </TextField>
              </Grid>
              {marriageData.sdm_registered === 'Yes' && (
                <>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth label="SDM Certificate Number" name="sdm_cert_no"
                      value={marriageData.sdm_cert_no} onChange={handleMarriage}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth label="SDM Certificate Date" name="sdm_cert_date"
                      value={marriageData.sdm_cert_date} onChange={handleMarriage}
                      type="date" InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Any Objection Lodged?" name="objection_lodged"
                  value={marriageData.objection_lodged} onChange={handleMarriage}
                >
                  <MenuItem value="No">No</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Inter-caste / Inter-religious Marriage?" name="inter_religion"
                  value={marriageData.inter_religion} onChange={handleMarriage}
                >
                  <MenuItem value="No">No</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                </TextField>
              </Grid>
              {marriageData.inter_religion === 'Yes' && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    For inter-religious marriages, registration is done under the{' '}
                    <strong>Special Marriage Act 1954</strong>. A 30-day notice period is required.
                    Certificate from the SDM/Magistrate office is required.
                  </Alert>
                </Grid>
              )}

              {navButtons(1, 3, validateMarriageStep)}
            </Grid>
          )}

          {/* STEP 3 — Witness & Ceremony */}
          {activeStep === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Both witnesses must be adults (18+ years). They must be present in person at the Municipal Office
                  on the verification date with original ID documents.
                </Alert>
              </Grid>

              <SectionHeading>Witness 1</SectionHeading>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Full Name *" name="w1_name"
                  value={witnessData.w1_name} onChange={handleWitness}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required label="Date of Birth *" name="w1_dob"
                  value={witnessData.w1_dob} onChange={handleWitness}
                  type="date" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required label="Aadhaar *" name="w1_aadhaar"
                  value={witnessData.w1_aadhaar} onChange={handleWitness}
                  inputProps={{ maxLength: 12 }} helperText="12 digits"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required label="Mobile *" name="w1_mobile"
                  value={witnessData.w1_mobile} onChange={handleWitness}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="Email" name="w1_email"
                  value={witnessData.w1_email} onChange={handleWitness} type="email"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="Occupation" name="w1_occupation"
                  value={witnessData.w1_occupation} onChange={handleWitness}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth select label="Relation to Bride/Groom" name="w1_relation"
                  value={witnessData.w1_relation} onChange={handleWitness}
                >
                  <MenuItem value="">Select</MenuItem>
                  {WITNESS_RELATION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth required multiline rows={2}
                  label="Address *" name="w1_address"
                  value={witnessData.w1_address} onChange={handleWitness}
                />
              </Grid>

              <SectionHeading>Witness 2</SectionHeading>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Full Name *" name="w2_name"
                  value={witnessData.w2_name} onChange={handleWitness}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required label="Date of Birth *" name="w2_dob"
                  value={witnessData.w2_dob} onChange={handleWitness}
                  type="date" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required label="Aadhaar *" name="w2_aadhaar"
                  value={witnessData.w2_aadhaar} onChange={handleWitness}
                  inputProps={{ maxLength: 12 }} helperText="12 digits"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required label="Mobile *" name="w2_mobile"
                  value={witnessData.w2_mobile} onChange={handleWitness}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="Email" name="w2_email"
                  value={witnessData.w2_email} onChange={handleWitness} type="email"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="Occupation" name="w2_occupation"
                  value={witnessData.w2_occupation} onChange={handleWitness}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth select label="Relation to Bride/Groom" name="w2_relation"
                  value={witnessData.w2_relation} onChange={handleWitness}
                >
                  <MenuItem value="">Select</MenuItem>
                  {WITNESS_RELATION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth required multiline rows={2}
                  label="Address *" name="w2_address"
                  value={witnessData.w2_address} onChange={handleWitness}
                />
              </Grid>

              <SectionHeading>Priest / Pandit as 3rd Witness (Optional)</SectionHeading>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Priest / Pandit Name" name="priest_w_name"
                  value={witnessData.priest_w_name} onChange={handleWitness}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Priest Mobile" name="priest_w_mobile"
                  value={witnessData.priest_w_mobile}
                  onChange={e => setWitnessData(p => ({ ...p, priest_w_mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Registration / Pandit Card No." name="priest_reg_no"
                  value={witnessData.priest_reg_no} onChange={handleWitness}
                />
              </Grid>

              {navButtons(2, 4, validateWitnessStep)}
            </Grid>
          )}

          {/* STEP 4 — Documents & Declaration */}
          {activeStep === 4 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="warning">
                  All original documents and photos must be in A4 size. Witnesses must be present in person
                  for verification. Maximum file size: 5 MB each (PDF / JPG / PNG).
                </Alert>
              </Grid>

              <SectionHeading>Age Proof</SectionHeading>

              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Groom's Age Proof" name="groom_age_proof"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Birth certificate or 10th mark sheet / Aadhaar confirming age 21+"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Bride's Age Proof" name="bride_age_proof"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Birth certificate or 10th mark sheet / Aadhaar confirming age 18+"
                />
              </Grid>

              <SectionHeading>Address Proof</SectionHeading>

              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Groom's Address Proof" name="groom_address_proof"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Aadhaar / Voter ID / Passport"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Bride's Address Proof" name="bride_address_proof"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Aadhaar / Voter ID / Passport"
                />
              </Grid>

              <SectionHeading>Ceremony Photographs</SectionHeading>

              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Wedding Ceremony Photograph" name="wedding_photo"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  accept=".jpg,.jpeg,.png"
                  hint="Clear photo showing both bride and groom in wedding attire"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Wedding Invitation Card" name="wedding_invitation"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Showing venue, date, and names of bride and groom"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Groom's Passport-size Photographs (2)" name="groom_photos"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  accept=".jpg,.jpeg,.png"
                  hint="Recent colour photographs on white background"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Bride's Passport-size Photographs (2)" name="bride_photos"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  accept=".jpg,.jpeg,.png"
                  hint="Recent colour photographs on white background"
                />
              </Grid>

              <SectionHeading>Witness Identity Proof</SectionHeading>

              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Witness 1 ID Proof" name="witness1_id"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Aadhaar / Voter ID / Passport"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Witness 2 ID Proof" name="witness2_id"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Aadhaar / Voter ID"
                />
              </Grid>

              <SectionHeading>Additional Documents (if applicable)</SectionHeading>

              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Divorce Decree" name="divorce_decree"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Required if bride or groom is divorced"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Death Certificate of Previous Spouse" name="prev_spouse_death_cert"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Required if either party is a widow/widower"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={declaration}
                      onChange={e => setDeclaration(e.target.checked)}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: HEADER_COLOR }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: HEADER_COLOR } }}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I hereby declare that all information provided is true and correct. Both parties are of legal
                      marriageable age, are single / free to marry, and have given their free and unconditional consent
                      to this marriage. I understand that providing false information is a punishable offence.
                    </Typography>
                  }
                />
              </Grid>

              {navButtons(3, null, () => true)}
            </Grid>
          )}
        </TabPanel>

        {/* ============================================================
            TAB 1 — DOWNLOAD CERTIFICATE
        ============================================================ */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info">
                For apostille / attestation for use abroad, contact the District Collectorate with the original
                marriage certificate.
              </Alert>
            </Grid>
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth required label="Marriage Registration Number *" name="reg_number"
                value={dlData.reg_number} onChange={handleDl}
                placeholder="e.g. MMR-2024-XXXX"
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Button
                fullWidth variant="contained"
                sx={{ height: 56, bgcolor: HEADER_COLOR }}
                onClick={handleSearch}
              >
                Search
              </Button>
            </Grid>

            {certFound ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 2.5, bgcolor: '#fce4ec', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color={HEADER_COLOR} gutterBottom>
                    Certificate Found
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">Groom</Typography>
                      <Typography variant="body1" fontWeight={600}>{certFound.groom}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">Bride</Typography>
                      <Typography variant="body1" fontWeight={600}>{certFound.bride}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">Registration No.</Typography>
                      <Typography variant="body1" fontWeight={600}>{certFound.reg}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">Date of Marriage</Typography>
                      <Typography variant="body1" fontWeight={600}>{certFound.date}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">Place of Marriage</Typography>
                      <Typography variant="body1" fontWeight={600}>{certFound.place}</Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant="caption" color="text.secondary">Issued Date</Typography>
                      <Typography variant="body1" fontWeight={600}>{certFound.issued}</Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant="caption" color="text.secondary">Status</Typography>
                      <br />
                      <Chip label={certFound.status} color="success" size="small" />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button variant="contained" startIcon={<DownloadIcon />} sx={{ bgcolor: HEADER_COLOR }}>
                      Download Certificate (PDF)
                    </Button>
                    <Button variant="outlined" startIcon={<PrintIcon />} sx={{ color: HEADER_COLOR, borderColor: HEADER_COLOR }}>
                      Print
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  Enter the registration number from your acknowledgement slip to download your marriage certificate.
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>

      </DialogContent>

      {/* ============================================================
          DIALOG ACTIONS
      ============================================================ */}
      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        {tab === 0 && activeStep === 4 && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !declaration}
            sx={{ bgcolor: HEADER_COLOR }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Marriage Registration Application'}
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default MunicipalMarriageRegForm;
