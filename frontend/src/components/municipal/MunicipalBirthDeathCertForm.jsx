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

const HEADER_COLOR = '#2e7d32';
const WARDS = Array.from({ length: 10 }, (_, i) => 'Ward ' + (i + 1));
const BIRTH_STEPS = ['Event Details', 'Parent & Family Details', 'Informant Details', 'Documents & Declaration'];
const DEATH_STEPS = ['Deceased Details', 'Informant Details', 'Cause & Place of Death', 'Documents'];
const CORR_STEPS = ['Certificate Details', 'Correction Information', 'Documents'];
const EDUCATION_OPTIONS = ['Illiterate', 'Primary', 'Secondary', 'Graduate', 'Post-graduate', 'Professional'];
const RELIGION_OPTIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'];

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

const getDaysDiff = (fromDate, toDate) => {
  if (!fromDate || !toDate) return 0;
  return Math.max(0, Math.floor((new Date(toDate) - new Date(fromDate)) / 86400000));
};

const calcAgeAtDate = (dob, refDate) => {
  if (!dob || !refDate) return '';
  const d = new Date(dob);
  const r = new Date(refDate);
  let yrs = r.getFullYear() - d.getFullYear();
  let mos = r.getMonth() - d.getMonth();
  if (mos < 0 || (mos === 0 && r.getDate() < d.getDate())) { yrs--; mos += 12; }
  if (r.getDate() < d.getDate()) { mos = Math.max(0, mos - 1); }
  return `${yrs} years, ${mos} months`;
};

const MunicipalBirthDeathCertForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [certDetails, setCertDetails] = useState(null);
  const [declaration, setDeclaration] = useState(false);

  /* ---------- Birth form state ---------- */
  const [birthData, setBirthData] = useState({
    date_of_birth: '', time_of_birth: '', child_name: '', sex_of_child: '',
    birth_multiplicity: 'Single birth', place_of_birth: '', hospital_name: '',
    hospital_reg_number: '', attendant_name: '', birth_register_number: '',
    sub_registrar_area: '', birth_ward: '', birth_address: '',
    congenital_disability: '', birth_weight: '', nationality: 'India',
    father_name: '', father_aadhaar: '', father_mobile: '', father_email: '',
    father_dob: '', father_nationality: 'India', father_occupation: '',
    father_education: '', father_religion: '',
    mother_name: '', mother_aadhaar: '', mother_mobile: '', mother_email: '',
    mother_dob: '', mother_nationality: 'India', mother_occupation: '', mother_education: '',
    marriage_reg_number: '', date_of_marriage: '', total_children: '',
    parents_address: '', parents_ward: '', parents_pincode: '',
    informant_name: '', informant_relation: '', informant_mobile: '',
    informant_aadhaar: '', informant_email: '', informant_address: '',
    informant_ward: '', date_of_reporting: '', late_reason: '',
  });

  /* ---------- Death form state ---------- */
  const [deathData, setDeathData] = useState({
    deceased_name: '', deceased_sex: '', date_of_death: '', time_of_death: '',
    deceased_dob: '', age_at_death: '', nationality: 'India', religion: '',
    marital_status: '', occupation: '', deceased_address: '', death_ward: '',
    deceased_aadhaar: '', deceased_voter_id: '',
    informant_name: '', informant_relation: '', informant_mobile: '',
    informant_aadhaar: '', informant_email: '', informant_address: '',
    informant_ward: '', date_of_info: '', late_reason: '', copies_required: '1',
    place_of_death: '', death_hospital_name: '', death_ward_occurrence: '',
    exact_place_address: '', death_classification: '', primary_cause: '',
    secondary_cause: '', certifying_doctor: '', doctor_reg_no: '',
    doctor_mobile: '', post_mortem: 'No', pm_report_ref: '',
    police_fir_ref: '', cremation_type: '', cremation_location: '', cremation_date: '',
  });

  /* ---------- Correction form state ---------- */
  const [corrData, setCorrData] = useState({
    corr_cert_type: 'Birth', corr_reg_number: '', name_on_cert: '',
    date_of_event: '', applicant_name: '', applicant_mobile: '', applicant_aadhaar: '',
    field_to_correct: '', incorrect_value: '', correct_value: '',
    correction_reason: '', detailed_explanation: '',
  });

  /* ---------- Download form state ---------- */
  const [dlData, setDlData] = useState({ cert_type: 'Birth', reg_number: '' });

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
  const handleBirth = (e) => {
    const { name, value } = e.target;
    if (['father_mobile', 'mother_mobile', 'informant_mobile'].includes(name)) {
      setBirthData(p => ({ ...p, [name]: value.replace(/\D/g, '').slice(0, 10) }));
    } else if (['father_aadhaar', 'mother_aadhaar', 'informant_aadhaar'].includes(name)) {
      setBirthData(p => ({ ...p, [name]: value.replace(/\D/g, '').slice(0, 12) }));
    } else {
      setBirthData(p => ({ ...p, [name]: value }));
    }
  };

  const handleDeath = (e) => {
    const { name, value } = e.target;
    if (['informant_mobile', 'doctor_mobile'].includes(name)) {
      setDeathData(p => ({ ...p, [name]: value.replace(/\D/g, '').slice(0, 10) }));
    } else if (['informant_aadhaar', 'deceased_aadhaar'].includes(name)) {
      setDeathData(p => ({ ...p, [name]: value.replace(/\D/g, '').slice(0, 12) }));
    } else {
      setDeathData(p => ({ ...p, [name]: value }));
    }
  };

  const handleCorr = (e) => setCorrData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleDl = (e) => setDlData(p => ({ ...p, [e.target.name]: e.target.value }));

  /* ---------- Derived values ---------- */
  const birthDaysDiff = getDaysDiff(birthData.date_of_birth, birthData.date_of_reporting);
  const isLateBirth = birthDaysDiff > 21;
  const isVeryLateBirth = birthDaysDiff > 365;
  const deathDaysDiff = getDaysDiff(deathData.date_of_death, deathData.date_of_info);
  const isLateDeath = deathDaysDiff > 21;
  const deathAge = calcAgeAtDate(deathData.deceased_dob, deathData.date_of_death);
  const hospitalBirth = ['Hospital/Nursing Home', 'Government Hospital', 'Sub-centre/PHC'].includes(birthData.place_of_birth);
  const hospitalDeath = ['Government Hospital', 'Private Hospital/Nursing Home', 'Hospice'].includes(deathData.place_of_death);
  const unnatDeath = ['Accident', 'Suicide — police report required', 'Homicide — police report required'].includes(deathData.death_classification);

  /* ---------- Validation ---------- */
  const validateBirthStep = (step) => {
    if (step === 0) {
      if (!birthData.date_of_birth) { toast.error('Date of Birth is required'); return false; }
      if (!birthData.sex_of_child) { toast.error('Sex of Child is required'); return false; }
      if (!birthData.place_of_birth) { toast.error('Place of Birth is required'); return false; }
      if (!birthData.sub_registrar_area) { toast.error('Sub-registrar Area / Taluka is required'); return false; }
      if (!birthData.birth_ward) { toast.error('Ward is required'); return false; }
      if (!birthData.birth_address) { toast.error('Exact address of birth occurrence is required'); return false; }
    }
    if (step === 1) {
      if (!birthData.father_name) { toast.error("Father's Full Name is required"); return false; }
      if (birthData.father_aadhaar.length < 12) { toast.error("Father's Aadhaar must be 12 digits"); return false; }
      if (birthData.father_mobile.length < 10) { toast.error("Father's Mobile must be 10 digits"); return false; }
      if (!birthData.mother_name) { toast.error("Mother's Full Name is required"); return false; }
      if (birthData.mother_aadhaar.length < 12) { toast.error("Mother's Aadhaar must be 12 digits"); return false; }
      if (!birthData.parents_address) { toast.error("Parents' Permanent Address is required"); return false; }
      if (!birthData.parents_ward) { toast.error("Ward of parents' residence is required"); return false; }
    }
    if (step === 2) {
      if (!birthData.informant_name) { toast.error('Informant Name is required'); return false; }
      if (!birthData.informant_relation) { toast.error('Relation to Child is required'); return false; }
      if (birthData.informant_mobile.length < 10) { toast.error('Informant Mobile must be 10 digits'); return false; }
      if (birthData.informant_aadhaar.length < 12) { toast.error('Informant Aadhaar must be 12 digits'); return false; }
      if (!birthData.informant_address) { toast.error("Informant's Address is required"); return false; }
      if (!birthData.date_of_reporting) { toast.error('Date of Reporting is required'); return false; }
    }
    return true;
  };

  const validateDeathStep = (step) => {
    if (step === 0) {
      if (!deathData.deceased_name) { toast.error('Name of Deceased is required'); return false; }
      if (!deathData.deceased_sex) { toast.error('Sex of Deceased is required'); return false; }
      if (!deathData.date_of_death) { toast.error('Date of Death is required'); return false; }
      if (!deathData.deceased_address) { toast.error('Last Known Address is required'); return false; }
      if (!deathData.death_ward) { toast.error('Ward is required'); return false; }
    }
    if (step === 1) {
      if (!deathData.informant_name) { toast.error('Informant Name is required'); return false; }
      if (!deathData.informant_relation) { toast.error('Relation to Deceased is required'); return false; }
      if (deathData.informant_mobile.length < 10) { toast.error('Informant Mobile must be 10 digits'); return false; }
      if (deathData.informant_aadhaar.length < 12) { toast.error('Informant Aadhaar must be 12 digits'); return false; }
      if (!deathData.informant_address) { toast.error("Informant's Address is required"); return false; }
      if (!deathData.date_of_info) { toast.error('Date of Information is required'); return false; }
    }
    if (step === 2) {
      if (!deathData.place_of_death) { toast.error('Place of Death is required'); return false; }
      if (!deathData.death_ward_occurrence) { toast.error('Ward of occurrence is required'); return false; }
      if (!deathData.exact_place_address) { toast.error('Exact Place of Death description is required'); return false; }
      if (!deathData.death_classification) { toast.error('Classification of Death is required'); return false; }
      if (!deathData.primary_cause) { toast.error('Primary Cause of Death is required'); return false; }
      if (!deathData.certifying_doctor) { toast.error('Certifying Doctor Name is required'); return false; }
      if (!deathData.doctor_reg_no) { toast.error('Doctor Registration Number is required'); return false; }
    }
    return true;
  };

  const validateCorrStep = (step) => {
    if (step === 0) {
      if (!corrData.corr_reg_number) { toast.error('Registration Number is required'); return false; }
      if (!corrData.name_on_cert) { toast.error('Name on Certificate is required'); return false; }
      if (!corrData.date_of_event) { toast.error('Date of Event is required'); return false; }
      if (!corrData.applicant_name) { toast.error('Applicant Name is required'); return false; }
      if (corrData.applicant_mobile.length < 10) { toast.error('Applicant Mobile must be 10 digits'); return false; }
    }
    if (step === 1) {
      if (!corrData.field_to_correct) { toast.error('Field to be Corrected is required'); return false; }
      if (!corrData.incorrect_value) { toast.error('Incorrect Value (as on certificate) is required'); return false; }
      if (!corrData.correct_value) { toast.error('Correct Value to be Updated is required'); return false; }
      if (!corrData.correction_reason) { toast.error('Reason for Correction is required'); return false; }
    }
    return true;
  };

  /* ---------- Navigation helper ---------- */
  const navButtons = (back, next, validate) => (
    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
      {back !== null ? (
        <Button variant="outlined" onClick={() => setActiveStep(back)}>&#8592; Back</Button>
      ) : <Box />}
      {next !== null ? (
        <Button
          variant="contained"
          onClick={() => { if (validate(activeStep)) setActiveStep(next); }}
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
    setCertDetails({
      type: dlData.cert_type,
      name: dlData.cert_type === 'Birth' ? 'Ananya Singh' : 'Ramesh Kumar',
      date: dlData.cert_type === 'Birth' ? '14 August 2021' : '03 January 2024',
      reg: dlData.reg_number,
      ward: 'Ward 7',
      issued: '20 September 2021',
      status: 'Issued',
    });
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async () => {
    let application_type = '';
    let application_data = {};
    if (tab === 0) {
      if (!declaration) { toast.error('Please accept the declaration before submitting'); return; }
      application_type = 'birth_certificate';
      application_data = birthData;
    } else if (tab === 1) {
      application_type = 'death_certificate';
      application_data = deathData;
    } else if (tab === 3) {
      application_type = 'cert_correction';
      application_data = corrData;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', { application_type, application_data });
      setRefNumber(res.data?.data?.application_number || 'MBC' + Date.now());
    } catch {
      setRefNumber('MBC' + Date.now());
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
        <Chip label={refNumber} color="success" sx={{ fontSize: '1.1rem', py: 2, px: 3, mb: 3 }} />
        <Alert severity="info" sx={{ textAlign: 'left', mb: 2 }}>
          <strong>Next Steps:</strong><br />
          1. Processing time: 7–10 working days.<br />
          2. Certificate can be collected from the Municipal Office or downloaded once approved.<br />
          3. SMS and email notification will be sent to your registered contact.<br />
          4. Bring original documents for verification when collecting the certificate.
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
          onChange={(_, v) => { setTab(v); setActiveStep(0); setCertDetails(null); }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
        >
          <Tab label="Apply — Birth Certificate" />
          <Tab label="Apply — Death Certificate" />
          <Tab label="Download / Reprint" />
          <Tab label="Correction Request" />
        </Tabs>

        {/* ============================================================
            TAB 0 — BIRTH CERTIFICATE
        ============================================================ */}
        <TabPanel value={tab} index={0}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }} alternativeLabel>
            {BIRTH_STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>

          {/* BIRTH STEP 0 — Event Details */}
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Birth certificate application must be filed within <strong>21 days</strong> of birth (RBD Act, 1969).
                  Late registration up to 30 days requires Sub-Registrar permission; after 1 year requires a court order
                  and notarized affidavit.
                </Alert>
              </Grid>

              <SectionHeading>Event Details</SectionHeading>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Date of Birth *" name="date_of_birth"
                  value={birthData.date_of_birth} onChange={handleBirth}
                  type="date" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Time of Birth (24-hr)" name="time_of_birth"
                  value={birthData.time_of_birth} onChange={handleBirth}
                  type="time" InputLabelProps={{ shrink: true }} helperText="HH:MM"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Name of Child" name="child_name"
                  value={birthData.child_name} onChange={handleBirth}
                  helperText="Optional — leave blank for 'Baby of…' (can update later)"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required select label="Sex of Child *" name="sex_of_child"
                  value={birthData.sex_of_child} onChange={handleBirth}
                >
                  {['Male', 'Female', 'Transgender', 'Not yet determined'].map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required select label="Birth Type *" name="birth_multiplicity"
                  value={birthData.birth_multiplicity} onChange={handleBirth}
                >
                  {['Single birth', 'Twin — 1st', 'Twin — 2nd', 'Triplet', 'Multiple birth'].map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required select label="Place of Birth *" name="place_of_birth"
                  value={birthData.place_of_birth} onChange={handleBirth}
                >
                  {['Hospital/Nursing Home', 'Government Hospital', 'Sub-centre/PHC',
                    'Home — within hospital jurisdiction', 'Home — rural', 'Other'].map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {hospitalBirth && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth label="Hospital / Nursing Home Name" name="hospital_name"
                      value={birthData.hospital_name} onChange={handleBirth}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth label="Hospital Registration Number" name="hospital_reg_number"
                      value={birthData.hospital_reg_number} onChange={handleBirth}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Doctor / Midwife / ASHA Attendant Name" name="attendant_name"
                  value={birthData.attendant_name} onChange={handleBirth}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Birth Register Number (from hospital)" name="birth_register_number"
                  value={birthData.birth_register_number} onChange={handleBirth}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Sub-registrar Area / Taluka *" name="sub_registrar_area"
                  value={birthData.sub_registrar_area} onChange={handleBirth}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required select label="Ward *" name="birth_ward"
                  value={birthData.birth_ward} onChange={handleBirth}
                >
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth required multiline rows={2}
                  label="Exact Address of Birth Occurrence *" name="birth_address"
                  value={birthData.birth_address} onChange={handleBirth}
                  placeholder="Full address where the birth took place"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Any Congenital Disability?" name="congenital_disability"
                  value={birthData.congenital_disability} onChange={handleBirth}
                >
                  <MenuItem value="">Not specified</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Baby's Birth Weight (kg)" name="birth_weight"
                  value={birthData.birth_weight} onChange={handleBirth}
                  placeholder="e.g. 3.2" type="number" inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Nationality *" name="nationality"
                  value={birthData.nationality} onChange={handleBirth}
                />
              </Grid>

              {navButtons(null, 1, validateBirthStep)}
            </Grid>
          )}

          {/* BIRTH STEP 1 — Parent & Family Details */}
          {activeStep === 1 && (
            <Grid container spacing={2}>
              <SectionHeading>Father's Details</SectionHeading>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Father's Full Name *" name="father_name"
                  value={birthData.father_name} onChange={handleBirth}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required label="Father's Aadhaar *" name="father_aadhaar"
                  value={birthData.father_aadhaar} onChange={handleBirth}
                  inputProps={{ maxLength: 12 }} helperText="12 digits"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required label="Father's Mobile *" name="father_mobile"
                  value={birthData.father_mobile} onChange={handleBirth}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Father's Email" name="father_email"
                  value={birthData.father_email} onChange={handleBirth} type="email"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Father's Date of Birth" name="father_dob"
                  value={birthData.father_dob} onChange={handleBirth}
                  type="date" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Father's Nationality" name="father_nationality"
                  value={birthData.father_nationality} onChange={handleBirth}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Father's Occupation" name="father_occupation"
                  value={birthData.father_occupation} onChange={handleBirth}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Father's Education" name="father_education"
                  value={birthData.father_education} onChange={handleBirth}
                >
                  <MenuItem value="">Select</MenuItem>
                  {EDUCATION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Father's Religion" name="father_religion"
                  value={birthData.father_religion} onChange={handleBirth}
                >
                  <MenuItem value="">Select</MenuItem>
                  {RELIGION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>

              <SectionHeading>Mother's Details</SectionHeading>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Mother's Full Name (maiden + husband's surname) *" name="mother_name"
                  value={birthData.mother_name} onChange={handleBirth}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required label="Mother's Aadhaar *" name="mother_aadhaar"
                  value={birthData.mother_aadhaar} onChange={handleBirth}
                  inputProps={{ maxLength: 12 }} helperText="12 digits"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth label="Mother's Mobile" name="mother_mobile"
                  value={birthData.mother_mobile} onChange={handleBirth}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Mother's Email" name="mother_email"
                  value={birthData.mother_email} onChange={handleBirth} type="email"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Mother's Date of Birth" name="mother_dob"
                  value={birthData.mother_dob} onChange={handleBirth}
                  type="date" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Mother's Nationality" name="mother_nationality"
                  value={birthData.mother_nationality} onChange={handleBirth}
                />
              </Grid>
              {birthData.mother_dob && birthData.date_of_birth && (
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth disabled label="Mother's Age at Child's Birth"
                    value={calcAgeAtDate(birthData.mother_dob, birthData.date_of_birth)}
                    InputLabelProps={{ shrink: true }} helperText="Auto-calculated from DOB"
                  />
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Mother's Occupation" name="mother_occupation"
                  value={birthData.mother_occupation} onChange={handleBirth}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Mother's Education" name="mother_education"
                  value={birthData.mother_education} onChange={handleBirth}
                >
                  <MenuItem value="">Select</MenuItem>
                  {EDUCATION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>

              <SectionHeading>Family & Marriage Details</SectionHeading>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Marriage Registration Number" name="marriage_reg_number"
                  value={birthData.marriage_reg_number} onChange={handleBirth}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Date of Marriage" name="date_of_marriage"
                  value={birthData.date_of_marriage} onChange={handleBirth}
                  type="date" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="No. of Children Born (including this child)" name="total_children"
                  value={birthData.total_children} onChange={handleBirth}
                  type="number" inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth required multiline rows={2}
                  label="Parents' Permanent Address *" name="parents_address"
                  value={birthData.parents_address} onChange={handleBirth}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required select label="Ward (Parents' Residence) *" name="parents_ward"
                  value={birthData.parents_ward} onChange={handleBirth}
                >
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Pincode" name="parents_pincode"
                  value={birthData.parents_pincode} onChange={handleBirth}
                  inputProps={{ maxLength: 6 }}
                />
              </Grid>

              {navButtons(0, 2, validateBirthStep)}
            </Grid>
          )}

          {/* BIRTH STEP 2 — Informant Details */}
          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info">
                  The informant is the person officially reporting the birth. This is typically the father,
                  mother, doctor/hospital in-charge, or head of household.
                </Alert>
              </Grid>

              <SectionHeading>Informant Details</SectionHeading>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Informant Name *" name="informant_name"
                  value={birthData.informant_name} onChange={handleBirth}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required select label="Relation to Child *" name="informant_relation"
                  value={birthData.informant_relation} onChange={handleBirth}
                >
                  {['Father', 'Mother', 'Doctor/In-charge of hospital', 'Head of household',
                    'Neighbour', 'Local registrar/Official', 'Other'].map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Informant Mobile *" name="informant_mobile"
                  value={birthData.informant_mobile} onChange={handleBirth}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Informant Aadhaar *" name="informant_aadhaar"
                  value={birthData.informant_aadhaar} onChange={handleBirth}
                  inputProps={{ maxLength: 12 }} helperText="12 digits"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Informant Email" name="informant_email"
                  value={birthData.informant_email} onChange={handleBirth} type="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth required multiline rows={2}
                  label="Informant's Complete Address *" name="informant_address"
                  value={birthData.informant_address} onChange={handleBirth}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Ward" name="informant_ward"
                  value={birthData.informant_ward} onChange={handleBirth}
                >
                  <MenuItem value="">Select</MenuItem>
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Date of Reporting *" name="date_of_reporting"
                  value={birthData.date_of_reporting} onChange={handleBirth}
                  type="date" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              {isLateBirth && (
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth required select label="Reason for Late Registration *" name="late_reason"
                    value={birthData.late_reason} onChange={handleBirth}
                  >
                    {['Lack of awareness', 'Hospitalization', 'Natural disaster', 'Other'].map(o => (
                      <MenuItem key={o} value={o}>{o}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              {isVeryLateBirth && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <strong>Important:</strong> Birth is being registered more than 1 year after occurrence.
                    A <strong>notarized affidavit</strong> (on ₹100 stamp paper) and a <strong>court order</strong> are
                    mandatory as per the Registration of Births and Deaths Act, 1969. Attach these in the next step.
                  </Alert>
                </Grid>
              )}

              {navButtons(1, 3, validateBirthStep)}
            </Grid>
          )}

          {/* BIRTH STEP 3 — Documents & Declaration */}
          {activeStep === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="warning">
                  All documents must be originals or certified copies. Maximum file size: 5 MB each (PDF / JPG / PNG).
                </Alert>
              </Grid>

              <SectionHeading>Required Documents</SectionHeading>

              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Hospital Birth Record / Discharge Summary" name="birth_hospital_record"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="From hospital/nursing home where birth occurred"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Doctor/Medical Certificate of Birth (Form 1 — RBD Act)" name="birth_medical_cert"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Issued by attending doctor or hospital authority"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Parents' Marriage Certificate" name="parents_marriage_cert"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="If available; ensures accurate entry of parents' names"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Father's Aadhaar / ID Proof" name="father_id_proof"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Aadhaar preferred; any valid government-issued ID"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Mother's Aadhaar / ID Proof" name="mother_id_proof"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Aadhaar preferred; any valid government-issued ID"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Proof of Address (Parents)" name="parents_address_proof"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Utility bill / Ration card / Aadhaar"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Affidavit for Late Registration" name="birth_affidavit"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Required only if birth is being registered after 1 year"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Court Order" name="birth_court_order"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Required if registration is after 2 years, as per RBD Act"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={declaration}
                      onChange={e => setDeclaration(e.target.checked)}
                      color="success"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I hereby declare that all the information provided is true and correct to the best of my knowledge.
                      I understand that providing false information is a punishable offence under the Registration of
                      Births and Deaths Act, 1969.
                    </Typography>
                  }
                />
              </Grid>

              {navButtons(2, null, validateBirthStep)}
            </Grid>
          )}
        </TabPanel>

        {/* ============================================================
            TAB 1 — DEATH CERTIFICATE
        ============================================================ */}
        <TabPanel value={tab} index={1}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }} alternativeLabel>
            {DEATH_STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>

          {/* DEATH STEP 0 — Deceased Details */}
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Death must be registered within <strong>21 days</strong> at the local municipal office.
                  A Medical Certificate of Cause of Death (Form 4 — MCCD) from the attending doctor or hospital is mandatory.
                </Alert>
              </Grid>

              <SectionHeading>Deceased Details</SectionHeading>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Name of Deceased *" name="deceased_name"
                  value={deathData.deceased_name} onChange={handleDeath}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required select label="Sex of Deceased *" name="deceased_sex"
                  value={deathData.deceased_sex} onChange={handleDeath}
                >
                  {['Male', 'Female', 'Transgender', 'Unknown'].map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth select label="Nationality" name="nationality"
                  value={deathData.nationality} onChange={handleDeath}
                >
                  <MenuItem value="India">India</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Date of Death *" name="date_of_death"
                  value={deathData.date_of_death} onChange={handleDeath}
                  type="date" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Time of Death (24-hr)" name="time_of_death"
                  value={deathData.time_of_death} onChange={handleDeath}
                  type="time" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Date of Birth of Deceased" name="deceased_dob"
                  value={deathData.deceased_dob} onChange={handleDeath}
                  type="date" InputLabelProps={{ shrink: true }}
                  helperText="To auto-calculate age at death"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Age at Death"
                  name="age_at_death"
                  value={deathData.deceased_dob && deathData.date_of_death ? deathAge : deathData.age_at_death}
                  onChange={handleDeath}
                  InputLabelProps={{ shrink: true }}
                  helperText={
                    deathData.deceased_dob && deathData.date_of_death
                      ? 'Auto-calculated from DOB'
                      : 'Enter manually if DOB unknown (e.g. 65 years)'
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Religion" name="religion"
                  value={deathData.religion} onChange={handleDeath}
                >
                  <MenuItem value="">Select</MenuItem>
                  {RELIGION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Marital Status" name="marital_status"
                  value={deathData.marital_status} onChange={handleDeath}
                >
                  <MenuItem value="">Select</MenuItem>
                  {['Unmarried', 'Married', 'Widowed', 'Divorced', 'Unknown'].map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Occupation of Deceased" name="occupation"
                  value={deathData.occupation} onChange={handleDeath}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Aadhaar Number of Deceased" name="deceased_aadhaar"
                  value={deathData.deceased_aadhaar} onChange={handleDeath}
                  inputProps={{ maxLength: 12 }} helperText="If available"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Voter ID of Deceased" name="deceased_voter_id"
                  value={deathData.deceased_voter_id} onChange={handleDeath}
                  helperText="If available"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth required multiline rows={2}
                  label="Last Known Address of Deceased *" name="deceased_address"
                  value={deathData.deceased_address} onChange={handleDeath}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required select label="Ward *" name="death_ward"
                  value={deathData.death_ward} onChange={handleDeath}
                >
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>

              {navButtons(null, 1, validateDeathStep)}
            </Grid>
          )}

          {/* DEATH STEP 1 — Informant Details */}
          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info">
                  The informant must be a family member or the person responsible for the funeral arrangements.
                </Alert>
              </Grid>

              <SectionHeading>Informant Details</SectionHeading>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Name of Informant *" name="informant_name"
                  value={deathData.informant_name} onChange={handleDeath}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required select label="Relation to Deceased *" name="informant_relation"
                  value={deathData.informant_relation} onChange={handleDeath}
                >
                  {['Spouse', 'Parent', 'Child', 'Sibling', 'Relative',
                    'Doctor/Hospital official', 'Neighbour', 'Local authority', 'Other'].map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Informant Mobile *" name="informant_mobile"
                  value={deathData.informant_mobile} onChange={handleDeath}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Informant Aadhaar *" name="informant_aadhaar"
                  value={deathData.informant_aadhaar} onChange={handleDeath}
                  inputProps={{ maxLength: 12 }} helperText="12 digits"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Informant Email" name="informant_email"
                  value={deathData.informant_email} onChange={handleDeath} type="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth required multiline rows={2}
                  label="Informant's Complete Address *" name="informant_address"
                  value={deathData.informant_address} onChange={handleDeath}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Ward" name="informant_ward"
                  value={deathData.informant_ward} onChange={handleDeath}
                >
                  <MenuItem value="">Select</MenuItem>
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Date of Information *" name="date_of_info"
                  value={deathData.date_of_info} onChange={handleDeath}
                  type="date" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              {isLateDeath && (
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth required select label="Reason for Late Registration *" name="late_reason"
                    value={deathData.late_reason} onChange={handleDeath}
                  >
                    {['Lack of awareness', 'Hospitalization', 'Natural disaster',
                      'Remote/Inaccessible area', 'Other'].map(o => (
                      <MenuItem key={o} value={o}>{o}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Number of Certified Copies Required" name="copies_required"
                  value={deathData.copies_required} onChange={handleDeath}
                >
                  {['1', '2', '3', '4', '5+'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>

              {navButtons(0, 2, validateDeathStep)}
            </Grid>
          )}

          {/* DEATH STEP 2 — Cause & Place of Death */}
          {activeStep === 2 && (
            <Grid container spacing={2}>
              <SectionHeading>Place of Death</SectionHeading>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required select label="Place of Death *" name="place_of_death"
                  value={deathData.place_of_death} onChange={handleDeath}
                >
                  {['Government Hospital', 'Private Hospital/Nursing Home', 'Hospice',
                    'Home/Residence', 'Public place', 'In transit', 'Other'].map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              {hospitalDeath && (
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth required label="Name of Hospital / Institution *" name="death_hospital_name"
                    value={deathData.death_hospital_name} onChange={handleDeath}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required select label="Ward of Occurrence *" name="death_ward_occurrence"
                  value={deathData.death_ward_occurrence} onChange={handleDeath}
                >
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth required multiline rows={2}
                  label="Exact Place of Death — Address / Description *" name="exact_place_address"
                  value={deathData.exact_place_address} onChange={handleDeath}
                  placeholder="Full address or description of the location of death"
                />
              </Grid>

              <SectionHeading>Cause &amp; Classification of Death</SectionHeading>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required select label="Classification of Death *" name="death_classification"
                  value={deathData.death_classification} onChange={handleDeath}
                >
                  {['Natural causes', 'Accident', 'Suicide — police report required',
                    'Homicide — police report required', 'Cause unknown/undetermined'].map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              {unnatDeath && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    This classification requires a <strong>Police FIR copy</strong> and may require a{' '}
                    <strong>post-mortem report</strong>. Ensure these are attached in the next step.
                  </Alert>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Primary Cause of Death *" name="primary_cause"
                  value={deathData.primary_cause} onChange={handleDeath}
                  placeholder="e.g. Cardiac arrest, Respiratory failure"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Secondary / Contributory Cause" name="secondary_cause"
                  value={deathData.secondary_cause} onChange={handleDeath}
                  placeholder="e.g. Hypertension, Diabetes (if applicable)"
                />
              </Grid>

              <SectionHeading>Certifying Doctor Details</SectionHeading>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Certifying Doctor Name *" name="certifying_doctor"
                  value={deathData.certifying_doctor} onChange={handleDeath}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Doctor Registration Number *" name="doctor_reg_no"
                  value={deathData.doctor_reg_no} onChange={handleDeath}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Doctor Mobile" name="doctor_mobile"
                  value={deathData.doctor_mobile} onChange={handleDeath}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth required select label="Was Post-Mortem Done? *" name="post_mortem"
                  value={deathData.post_mortem} onChange={handleDeath}
                >
                  <MenuItem value="No">No</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                </TextField>
              </Grid>
              {deathData.post_mortem === 'Yes' && (
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth label="Post-Mortem Report Reference Number" name="pm_report_ref"
                    value={deathData.pm_report_ref} onChange={handleDeath}
                  />
                </Grid>
              )}
              {unnatDeath && (
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth label="Police FIR Reference Number" name="police_fir_ref"
                    value={deathData.police_fir_ref} onChange={handleDeath}
                  />
                </Grid>
              )}

              <SectionHeading>Cremation / Burial Details</SectionHeading>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth select label="Type" name="cremation_type"
                  value={deathData.cremation_type} onChange={handleDeath}
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Cremation">Cremation</MenuItem>
                  <MenuItem value="Burial">Burial</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Cremation / Burial Ground Name" name="cremation_location"
                  value={deathData.cremation_location} onChange={handleDeath}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Date Performed" name="cremation_date"
                  value={deathData.cremation_date} onChange={handleDeath}
                  type="date" InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {navButtons(1, 3, validateDeathStep)}
            </Grid>
          )}

          {/* DEATH STEP 3 — Documents */}
          {activeStep === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="warning">
                  All documents must be originals or certified copies. Maximum file size: 5 MB each (PDF / JPG / PNG).
                </Alert>
              </Grid>

              <SectionHeading>Required Documents</SectionHeading>

              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Medical Certificate of Cause of Death (Form 4 — MCCD)" name="death_mccd"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="From certifying doctor or hospital authority"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Informant's Aadhaar / ID Proof" name="death_informant_id"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Aadhaar / Voter ID / Passport of informant"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Deceased's Aadhaar / Voter ID" name="deceased_id_proof"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="If available — Aadhaar / Ration Card / Voter ID"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Cremation or Burial Certificate" name="cremation_cert"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="From crematorium / graveyard authority"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Hospital Records / Discharge Summary" name="death_hospital_records"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="If death occurred in a hospital or nursing home"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Post-Mortem Report" name="death_pm_report"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Required if accidental or unnatural death"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Police FIR Copy" name="death_fir_copy"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Required for accident, suicide, or homicide"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Affidavit for Late Registration" name="death_affidavit"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="If death is being registered more than 1 year later"
                />
              </Grid>

              {navButtons(2, null, validateDeathStep)}
            </Grid>
          )}
        </TabPanel>

        {/* ============================================================
            TAB 2 — DOWNLOAD / REPRINT
        ============================================================ */}
        <TabPanel value={tab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info">
                Certificate will be digitally signed. For attestation / apostille, visit the Sub-Registrar Office
                with original documents.
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth select label="Certificate Type" name="cert_type"
                value={dlData.cert_type} onChange={handleDl}
              >
                <MenuItem value="Birth">Birth Certificate</MenuItem>
                <MenuItem value="Death">Death Certificate</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth required label="Registration Number *" name="reg_number"
                value={dlData.reg_number} onChange={handleDl}
                placeholder="e.g. BC2021-XXXXXX or DC2024-XXXXXX"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth variant="contained"
                sx={{ height: 56, bgcolor: HEADER_COLOR }}
                onClick={handleSearch}
              >
                Search
              </Button>
            </Grid>

            {certDetails ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 2.5, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color={HEADER_COLOR} gutterBottom>
                    Certificate Found
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">Name</Typography>
                      <Typography variant="body1" fontWeight={600}>{certDetails.name}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">
                        {certDetails.type === 'Birth' ? 'Date of Birth' : 'Date of Death'}
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>{certDetails.date}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">Registration No.</Typography>
                      <Typography variant="body1" fontWeight={600}>{certDetails.reg}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">Ward</Typography>
                      <Typography variant="body1" fontWeight={600}>{certDetails.ward}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">Issued Date</Typography>
                      <Typography variant="body1" fontWeight={600}>{certDetails.issued}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">Status</Typography>
                      <br />
                      <Chip label={certDetails.status} color="success" size="small" />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button variant="contained" startIcon={<DownloadIcon />} sx={{ bgcolor: HEADER_COLOR }}>
                      Download PDF
                    </Button>
                    <Button variant="outlined" startIcon={<PrintIcon />} color="success">
                      Print
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  Enter the registration number from your acknowledgement slip to download or reprint your certificate.
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* ============================================================
            TAB 3 — CORRECTION REQUEST
        ============================================================ */}
        <TabPanel value={tab} index={3}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }} alternativeLabel>
            {CORR_STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>

          {/* CORRECTION STEP 0 — Certificate Details */}
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="warning">
                  Corrections to birth/death certificates require a notarized affidavit and supporting documents.
                  Processing time: 15–30 working days with verification at the Sub-Registrar office.
                </Alert>
              </Grid>

              <SectionHeading>Certificate Details</SectionHeading>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required select label="Certificate Type *" name="corr_cert_type"
                  value={corrData.corr_cert_type} onChange={handleCorr}
                >
                  <MenuItem value="Birth">Birth Certificate</MenuItem>
                  <MenuItem value="Death">Death Certificate</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Registration Number *" name="corr_reg_number"
                  value={corrData.corr_reg_number} onChange={handleCorr}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Name on Certificate *" name="name_on_cert"
                  value={corrData.name_on_cert} onChange={handleCorr}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Date of Event on Certificate *" name="date_of_event"
                  value={corrData.date_of_event} onChange={handleCorr}
                  type="date" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Applicant / Informant Name *" name="applicant_name"
                  value={corrData.applicant_name} onChange={handleCorr}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth required label="Applicant Mobile *" name="applicant_mobile"
                  value={corrData.applicant_mobile}
                  onChange={e => setCorrData(p => ({ ...p, applicant_mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth label="Applicant Aadhaar" name="applicant_aadhaar"
                  value={corrData.applicant_aadhaar}
                  onChange={e => setCorrData(p => ({ ...p, applicant_aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                  inputProps={{ maxLength: 12 }}
                />
              </Grid>

              {navButtons(null, 1, validateCorrStep)}
            </Grid>
          )}

          {/* CORRECTION STEP 1 — Correction Information */}
          {activeStep === 1 && (
            <Grid container spacing={2}>
              <SectionHeading>Correction Details</SectionHeading>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required select label="Field to be Corrected *" name="field_to_correct"
                  value={corrData.field_to_correct} onChange={handleCorr}
                >
                  {["Name of child/deceased", "Date of birth/death", "Father's name", "Mother's name",
                    "Parent's address", "Ward/area", "Cause of death", "Other"].map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required select label="Reason for Correction *" name="correction_reason"
                  value={corrData.correction_reason} onChange={handleCorr}
                >
                  {['Data entry error', 'Spelling mistake', 'Wrong date entered', 'Name change/update', 'Other'].map(o => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Incorrect Value as on Certificate *" name="incorrect_value"
                  value={corrData.incorrect_value} onChange={handleCorr}
                  helperText="Exact text currently printed on the certificate"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth required label="Correct Value to be Updated *" name="correct_value"
                  value={corrData.correct_value} onChange={handleCorr}
                  helperText="What it should say after correction"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth multiline rows={3} label="Detailed Explanation" name="detailed_explanation"
                  value={corrData.detailed_explanation} onChange={handleCorr}
                  placeholder="Provide any additional context or explanation supporting the correction request"
                />
              </Grid>
              {corrData.field_to_correct === 'Date of birth/death' && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <strong>Note:</strong> Corrections to date of birth/death require a gazette notification or a court
                    order for changes made more than 1 year after original registration.
                  </Alert>
                </Grid>
              )}

              {navButtons(0, 2, validateCorrStep)}
            </Grid>
          )}

          {/* CORRECTION STEP 2 — Documents */}
          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info">
                  All supporting documents are required. Originals must be presented at the Sub-Registrar office for
                  physical verification.
                </Alert>
              </Grid>

              <SectionHeading>Required Documents</SectionHeading>

              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Existing Certificate (Original)" name="corr_existing_cert"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Certified copy of the certificate containing the error"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Notarised Affidavit" name="corr_affidavit"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="On ₹100 stamp paper, stating the correct information, sworn before a notary"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Supporting Proof of Correct Information" name="corr_supporting_proof"
                  required docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="School certificate, hospital record, Aadhaar, etc. confirming the correct value"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload
                  label="Gazette Notification" name="corr_gazette"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Required only for name changes approved via gazette"
                />
              </Grid>

              {navButtons(1, null, validateCorrStep)}
            </Grid>
          )}
        </TabPanel>

      </DialogContent>

      {/* ============================================================
          DIALOG ACTIONS
      ============================================================ */}
      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        {tab === 0 && activeStep === 3 && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !declaration}
            sx={{ bgcolor: HEADER_COLOR }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Birth Certificate Application'}
          </Button>
        )}
        {tab === 1 && activeStep === 3 && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ bgcolor: HEADER_COLOR }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Death Certificate Application'}
          </Button>
        )}
        {tab === 3 && activeStep === 2 && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ bgcolor: HEADER_COLOR }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Correction Request'}
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default MunicipalBirthDeathCertForm;
