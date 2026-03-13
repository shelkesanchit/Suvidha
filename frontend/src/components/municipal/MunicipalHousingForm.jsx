import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, MenuItem, Tabs, Tab,
  DialogContent, DialogActions, Alert, Chip, CircularProgress,
  Paper, Stepper, Step, StepLabel, Divider, Switch, FormControlLabel,
} from '@mui/material';
import { CheckCircle as SuccessIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import DocUpload from './DocUpload';
import { validateFile } from './formUtils';

const HEADER_COLOR = '#4527a0';
const WARDS = Array.from({ length: 10 }, (_, i) => 'Ward ' + (i + 1));

const HOUSING_STEPS = [
  'Personal Details', 'Family & Income', 'Current Housing', 'Housing Preference', 'Documents & Declaration',
];
const ENCROACH_STEPS = ['Reporter Info', 'Encroachment Details', 'Evidence Photos'];

// 0 = no stepper (Tab 1: Quarter Rent)
const STEP_COUNTS = [5, 0, 3];

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const SectionHeading = ({ children }) => (
  <Grid item xs={12}>
    <Box sx={{ mt: 1.5, mb: 0.5 }}>
      <Typography variant="caption" fontWeight={700} color="primary.dark"
        sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
        {children}
      </Typography>
      <Divider />
    </Box>
  </Grid>
);

const calcAge = (dob) => {
  if (!dob) return '';
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? String(age) : '';
};

const initialForm = {
  // Tab 0 – Step 0: Personal Details
  ph_full_name: '', ph_father_name: '', ph_spouse_name: '', ph_dob: '',
  ph_gender: '', ph_marital_status: '', ph_religion: '', ph_category: '', ph_sub_caste: '',
  ph_mobile: '', ph_alt_mobile: '', ph_email: '', ph_aadhaar: '',
  ph_voter_id: '', ph_pan: '', ph_perm_address: '', ph_ward: '', ph_pincode: '',
  ph_nationality: 'India',

  // Tab 0 – Step 1: Family & Income
  fam_num_members: '',
  fam_m1_name: '', fam_m1_age: '', fam_m1_relation: '', fam_m1_aadhaar: '',
  fam_m2_name: '', fam_m2_age: '', fam_m2_relation: '', fam_m2_aadhaar: '',
  fam_m3_name: '', fam_m3_age: '', fam_m3_relation: '', fam_m3_aadhaar: '',
  fam_m4_name: '', fam_m4_age: '', fam_m4_relation: '', fam_m4_aadhaar: '',
  fam_monthly_income: '', fam_annual_income: '', fam_income_source: '',
  fam_employer: '', fam_income_cert_authority: '', fam_pays_income_tax: 'no',
  fam_bank_name: '', fam_bank_account: '', fam_ifsc: '',

  // Tab 0 – Step 2: Current Housing
  cur_residence_type: '', cur_rent_pm: '', cur_years_at_address: '', cur_address: '',
  cur_same_as_perm: 'no', cur_num_rooms: '', cur_own_property: 'no', cur_own_property_details: '',
  cur_existing_allotment: 'no', cur_prev_applied: 'no', cur_prev_app_ref: '',

  // Tab 0 – Step 3: Housing Preference
  pref_scheme: '', pref_unit_type: '', pref_floor: '', pref_area_locality: '',
  pref_accessibility: 'no', pref_accessibility_details: '',
  pref_priority_reason: '', pref_priority_details: '',

  // Tab 1 – Quarter Rent
  rent_quarter_number: '', rent_payment_method: '',

  // Tab 2 – Encroachment
  enc_name: '', enc_mobile: '', enc_email: '', enc_aadhaar: '',
  enc_address: '', enc_ward: '', enc_is_affected: 'no',
  enc_location: '', enc_ward_of_enc: '', enc_landmark: '',
  enc_type: '', enc_area: '', enc_since: '',
  enc_encroacher_type: '', enc_prev_reported: 'no', enc_prev_ref: '',
  enc_potential_harm: '',
};

const MunicipalHousingForm = ({ onClose }) => {
  const [tab, setTab]               = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber]   = useState('');
  const [declared, setDeclared]     = useState(false);
  const [quarterBill, setQuarterBill] = useState(null);
  const [formData, setFormData]     = useState(initialForm);
  const [docs, setDocs]             = useState({});

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };
  const handleMobile  = (name) => (e) => setFormData(p => ({ ...p, [name]: e.target.value.replace(/\D/g, '').slice(0, 10) }));
  const handleAadhaar = (name) => (e) => setFormData(p => ({ ...p, [name]: e.target.value.replace(/\D/g, '').slice(0, 12) }));

  const onDocChange = (name, file) => {
    if (!file) return;
    const err = validateFile(file, 5);
    if (err) { toast.error(err); return; }
    setDocs(p => ({ ...p, [name]: file }));
    toast.success(file.name + ' selected');
  };
  const onDocRemove = (name) => setDocs(p => { const n = { ...p }; delete n[name]; return n; });

  const fetchQuarterBill = () => {
    if (!formData.rent_quarter_number) return toast.error('Enter Quarter / Unit Number');
    setQuarterBill({
      allotteeName: 'Rajesh Singh', ward: 'Ward 3', designation: 'Junior Engineer',
      monthlyRent: 1800, pendingMonths: 2, totalDue: 3600,
    });
  };

  // ── Stepper ──────────────────────────────────────────────────────────────────
  const hasStepperTab = [0, 2].includes(tab);
  const isLastStep    = activeStep === STEP_COUNTS[tab] - 1;

  const handleNext = () => {
    if (tab === 0) {
      if (activeStep === 0) {
        if (!formData.ph_full_name || !formData.ph_father_name || !formData.ph_dob ||
            !formData.ph_gender || !formData.ph_marital_status || !formData.ph_category ||
            !formData.ph_mobile || !formData.ph_aadhaar || !formData.ph_perm_address || !formData.ph_ward)
          return toast.error('Please fill all required (*) fields');
      }
      if (activeStep === 1) {
        if (!formData.fam_num_members || !formData.fam_monthly_income || !formData.fam_annual_income || !formData.fam_income_source)
          return toast.error('Family members, income, and income source are required');
      }
      if (activeStep === 2) {
        if (!formData.cur_residence_type || !formData.cur_years_at_address || !formData.cur_address)
          return toast.error('Please fill all required current housing fields');
      }
      if (activeStep === 3) {
        if (!formData.pref_scheme || !formData.pref_unit_type || !formData.pref_priority_reason)
          return toast.error('Scheme, unit type, and priority reason are required');
      }
    }
    if (tab === 2) {
      if (activeStep === 0 && (!formData.enc_name || !formData.enc_mobile || !formData.enc_ward))
        return toast.error('Name, mobile, and ward are required');
      if (activeStep === 1 && (!formData.enc_location || !formData.enc_ward_of_enc || !formData.enc_landmark ||
          !formData.enc_type || !formData.enc_area || !formData.enc_since))
        return toast.error('Please fill all required encroachment details');
    }
    setActiveStep(s => s + 1);
  };
  const handleBack = () => setActiveStep(s => s - 1);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (tab === 0 && !declared) return toast.error('Please accept the declaration before submitting');
    const appTypes = ['housing_allotment', 'municipal_rent_payment', 'encroachment_report'];
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', {
        application_type: appTypes[tab],
        application_data: { ...formData },
      });
      setRefNumber(res.data?.data?.application_number || 'MHU' + Date.now());
    } catch {
      setRefNumber('MHU' + Date.now());
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Submitted successfully!');
    }
  };

  // ── Success Screen ───────────────────────────────────────────────────────────
  if (submitted) return (
    <Box>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" color="success.main" gutterBottom>
          {tab === 1 ? 'Payment Successful!' : 'Application Submitted!'}
        </Typography>
        <Chip label={refNumber} sx={{ bgcolor: HEADER_COLOR, color: 'white', fontSize: '1.1rem', py: 2, px: 3, mb: 3 }} />
        <Alert severity="info">
          {tab === 0
            ? 'Housing application registered. Eligible applications are processed through a lottery/waiting list. You will be notified within 60 working days.'
            : tab === 1
            ? 'Rent payment processed. Receipt will be sent to your registered mobile/email.'
            : 'Encroachment complaint registered. The anti-encroachment cell will inspect the site within 5 working days.'}
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose} fullWidth sx={{ bgcolor: HEADER_COLOR }}>Close</Button>
      </DialogActions>
    </Box>
  );

  // ── Main Render ──────────────────────────────────────────────────────────────
  return (
    <Box>
      <DialogContent>
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setActiveStep(0); setQuarterBill(null); }}
          variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
        >
          <Tab label="Apply for Municipal Housing" />
          <Tab label="Pay Municipal Quarter Rent" />
          <Tab label="Report Encroachment" />
        </Tabs>

        {/* ═══════════════════════════════════════════════════════════
            TAB 0 — Apply for Municipal Housing  5-step
        ════════════════════════════════════════════════════════════ */}
        <TabPanel value={tab} index={0}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }} alternativeLabel>
            {HOUSING_STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>

          {/* ── Step 0: Personal Details ── */}
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField fullWidth required label="Full Name *" name="ph_full_name"
                  value={formData.ph_full_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Father's / Husband's Name *" name="ph_father_name"
                  value={formData.ph_father_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Spouse's Name (if married)" name="ph_spouse_name"
                  value={formData.ph_spouse_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth required label="Date of Birth *" name="ph_dob"
                  value={formData.ph_dob} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth label="Age" name="ph_age"
                  value={calcAge(formData.ph_dob)} InputProps={{ readOnly: true }}
                  helperText="Auto-calculated" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select required label="Gender *" name="ph_gender"
                  value={formData.ph_gender} onChange={handleChange}>
                  {['Male', 'Female', 'Transgender', 'Other'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select required label="Marital Status *" name="ph_marital_status"
                  value={formData.ph_marital_status} onChange={handleChange}>
                  {['Single', 'Married', 'Widowed', 'Divorced'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Religion" name="ph_religion"
                  value={formData.ph_religion} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select required label="Category / Caste *" name="ph_category"
                  value={formData.ph_category} onChange={handleChange}>
                  {['General', 'OBC', 'SC', 'ST', 'Minority', 'Ex-Serviceman', 'Differently-abled'].map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Sub-caste (optional)" name="ph_sub_caste"
                  value={formData.ph_sub_caste} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Mobile *" name="ph_mobile"
                  value={formData.ph_mobile} onChange={handleMobile('ph_mobile')} inputProps={{ maxLength: 10 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Alternate Mobile" name="ph_alt_mobile"
                  value={formData.ph_alt_mobile} onChange={handleMobile('ph_alt_mobile')} inputProps={{ maxLength: 10 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Email" name="ph_email"
                  value={formData.ph_email} onChange={handleChange} type="email" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Aadhaar * (12 digits)" name="ph_aadhaar"
                  value={formData.ph_aadhaar} onChange={handleAadhaar('ph_aadhaar')} inputProps={{ maxLength: 12 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Voter ID Number" name="ph_voter_id"
                  value={formData.ph_voter_id} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="PAN Card" name="ph_pan"
                  value={formData.ph_pan} onChange={handleChange} inputProps={{ maxLength: 10 }} />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField fullWidth required label="Permanent Address *" name="ph_perm_address"
                  value={formData.ph_perm_address} onChange={handleChange} multiline rows={2} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth select required label="Ward *" name="ph_ward"
                  value={formData.ph_ward} onChange={handleChange}>
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth label="Pincode" name="ph_pincode"
                  value={formData.ph_pincode} onChange={handleChange} inputProps={{ maxLength: 6 }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Nationality" name="ph_nationality"
                  value={formData.ph_nationality} onChange={handleChange} />
              </Grid>
            </Grid>
          )}

          {/* ── Step 1: Family & Income ── */}
          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField fullWidth required label="Number of Family Members *" name="fam_num_members"
                  value={formData.fam_num_members} onChange={handleChange} type="number" inputProps={{ min: 1 }} />
              </Grid>

              <SectionHeading>Family Member Details (up to 4)</SectionHeading>
              {[1, 2, 3, 4].map(i => (
                <React.Fragment key={i}>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label={`Member ${i} — Full Name`} name={`fam_m${i}_name`}
                      value={formData[`fam_m${i}_name`]} onChange={handleChange} size="small" />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField fullWidth label="Age" name={`fam_m${i}_age`}
                      value={formData[`fam_m${i}_age`]} onChange={handleChange} type="number" inputProps={{ min: 0 }} size="small" />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth label="Relation" name={`fam_m${i}_relation`}
                      value={formData[`fam_m${i}_relation`]} onChange={handleChange}
                      placeholder="e.g., Son, Daughter, Spouse" size="small" />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth label="Aadhaar" name={`fam_m${i}_aadhaar`}
                      value={formData[`fam_m${i}_aadhaar`]}
                      onChange={handleAadhaar(`fam_m${i}_aadhaar`)} inputProps={{ maxLength: 12 }} size="small" />
                  </Grid>
                </React.Fragment>
              ))}

              <SectionHeading>Income Details</SectionHeading>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Total Monthly Family Income (₹) *" name="fam_monthly_income"
                  value={formData.fam_monthly_income} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Annual Income (₹) *" name="fam_annual_income"
                  value={formData.fam_annual_income} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select required label="Income Source *" name="fam_income_source"
                  value={formData.fam_income_source} onChange={handleChange}>
                  {['Salary — Government', 'Salary — Private', 'Daily Wages', 'Business/Self-employed',
                    'Agriculture', 'Pension', 'Other'].map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              {['Salary — Government', 'Salary — Private'].includes(formData.fam_income_source) && (
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Employer Name" name="fam_employer"
                    value={formData.fam_employer} onChange={handleChange} />
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Income Certificate Issuing Authority" name="fam_income_cert_authority"
                  value={formData.fam_income_cert_authority} onChange={handleChange}
                  placeholder="e.g., Tahsildar, SDM Office" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Do You Pay Income Tax?" name="fam_pays_income_tax"
                  value={formData.fam_pays_income_tax} onChange={handleChange}>
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </TextField>
              </Grid>

              <SectionHeading>Bank Details (for Subsidy / DBT)</SectionHeading>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Bank Name" name="fam_bank_name"
                  value={formData.fam_bank_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField fullWidth label="Bank Account Number" name="fam_bank_account"
                  value={formData.fam_bank_account} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="IFSC Code" name="fam_ifsc"
                  value={formData.fam_ifsc} onChange={handleChange} inputProps={{ maxLength: 11 }} />
              </Grid>
            </Grid>
          )}

          {/* ── Step 2: Current Housing Situation ── */}
          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField fullWidth select required label="Current Residence Type *" name="cur_residence_type"
                  value={formData.cur_residence_type} onChange={handleChange}>
                  {['Rented room/chawl', 'Slum/Jhuggi', 'Company/Employer quarters',
                    'With relatives', 'Homeless/Shelter', 'Other'].map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Current Rent Per Month (₹)" name="cur_rent_pm"
                  value={formData.cur_rent_pm} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Years at Current Address *" name="cur_years_at_address"
                  value={formData.cur_years_at_address} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField fullWidth required label="Current Address *" name="cur_address"
                  value={formData.cur_address} onChange={handleChange} multiline rows={2} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Same as Permanent Address?" name="cur_same_as_perm"
                  value={formData.cur_same_as_perm} onChange={handleChange}>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Number of Rooms in Current Dwelling" name="cur_num_rooms"
                  value={formData.cur_num_rooms} onChange={handleChange} type="number" inputProps={{ min: 1 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select required label="Do You Own Any Other Property? *" name="cur_own_property"
                  value={formData.cur_own_property} onChange={handleChange}>
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </TextField>
              </Grid>
              {formData.cur_own_property === 'yes' && (
                <Grid item xs={12} md={8}>
                  <TextField fullWidth label="Property Details (address, type, area)" name="cur_own_property_details"
                    value={formData.cur_own_property_details} onChange={handleChange} multiline rows={2} />
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Existing Municipal Housing Allotment?" name="cur_existing_allotment"
                  value={formData.cur_existing_allotment} onChange={handleChange}>
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Applied for Municipal Housing Previously?" name="cur_prev_applied"
                  value={formData.cur_prev_applied} onChange={handleChange}>
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </TextField>
              </Grid>
              {formData.cur_prev_applied === 'yes' && (
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Previous Application Reference No." name="cur_prev_app_ref"
                    value={formData.cur_prev_app_ref} onChange={handleChange} />
                </Grid>
              )}
              {(formData.cur_own_property === 'yes' || formData.cur_existing_allotment === 'yes') && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    Applicants who already own a property or hold a municipal housing allotment may not be eligible. Please verify eligibility criteria before submitting.
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}

          {/* ── Step 3: Housing Preference ── */}
          {activeStep === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth select required label="Housing Scheme Preference *" name="pref_scheme"
                  value={formData.pref_scheme} onChange={handleChange}>
                  {['PMAY — Urban', 'Pradhan Mantri Awas Yojana CLSS', 'Municipal Workers Housing Scheme',
                    'EWS Housing Scheme', 'LIG Housing Scheme', 'Staff Quarters Allotment',
                    'Other Government Scheme'].map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select required label="Unit Type Preferred *" name="pref_unit_type"
                  value={formData.pref_unit_type} onChange={handleChange}>
                  {['1 RK', '1 BHK', '2 BHK', 'Dormitory', 'Quarter'].map(u => (
                    <MenuItem key={u} value={u}>{u}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label="Floor Preference" name="pref_floor"
                  value={formData.pref_floor} onChange={handleChange}>
                  {['No preference', 'Ground floor preferred', 'Upper floor', 'Any'].map(f => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Preferred Area / Locality in City" name="pref_area_locality"
                  value={formData.pref_area_locality} onChange={handleChange}
                  placeholder="Preferred location or area" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label="Accessibility Needs?" name="pref_accessibility"
                  value={formData.pref_accessibility} onChange={handleChange}>
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </TextField>
              </Grid>
              {formData.pref_accessibility === 'yes' && (
                <Grid item xs={12} md={9}>
                  <TextField fullWidth label="Accessibility Requirements" name="pref_accessibility_details"
                    value={formData.pref_accessibility_details} onChange={handleChange}
                    placeholder="e.g., wheelchair accessible, ground floor required, ramp access needed" />
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <TextField fullWidth select required label="Priority Reason *" name="pref_priority_reason"
                  value={formData.pref_priority_reason} onChange={handleChange}>
                  {['Slum dweller', 'Below poverty line', 'Municipal employee', 'Disaster/flood affected',
                    'Disabled family member', 'Widow', 'Senior citizen', 'Other'].map(r => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField fullWidth multiline rows={2} label="Priority Details" name="pref_priority_details"
                  value={formData.pref_priority_details} onChange={handleChange}
                  placeholder="Explain the priority reason in detail — supporting information helps your application" />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  Housing allotment is subject to availability, eligibility, and applicable scheme criteria. Priority is given to EWS, SC/ST, and specially-abled categories. A waiting list may apply.
                </Alert>
              </Grid>
            </Grid>
          )}

          {/* ── Step 4: Documents & Declaration ── */}
          {activeStep === 4 && (
            <Grid container spacing={2}>
              <SectionHeading>Required Documents</SectionHeading>
              <Grid item xs={12} md={6}>
                <DocUpload label="Aadhaar Card (Applicant)" name="h_aadhaar_copy" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Self-attested copy" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Passport-size Photograph" name="h_photo" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  accept=".jpg,.jpeg,.png" hint="Recent colour photograph — white or light background" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Income Certificate" name="h_income_cert" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="From Tahsildar / SDM office — certifying annual family income" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Caste Certificate" name="h_caste_cert"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Required for SC / ST / OBC category applicants" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Current Address Proof" name="h_address_proof" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Rent agreement / utility bill / bank statement showing current address" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Birth Certificate / Age Proof" name="h_birth_cert"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Birth certificate or school leaving certificate" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Ration Card" name="h_ration_card"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Affidavit — No Other Property Ownership" name="h_no_property_affidavit" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Notarised on stamp paper — declaring no other property ownership" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Bank Passbook Front Page" name="h_bank_passbook"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="For NEFT/DBT subsidy disbursement — showing account details" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Disability Certificate" name="h_disability_cert"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="If applying under differently-abled quota — issued by competent medical authority" />
              </Grid>

              {/* Declaration */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                  <FormControlLabel
                    control={<Switch checked={declared} onChange={e => setDeclared(e.target.checked)} color="secondary" />}
                    label={
                      <Typography variant="body2">
                        I solemnly declare that all information provided is true and correct. I do not own any other residential property in my name or in the name of any family member. I understand that false declaration will lead to immediate disqualification and may result in legal action.
                      </Typography>
                    }
                  />
                </Paper>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* ═══════════════════════════════════════════════════════════
            TAB 1 — Pay Municipal Quarter Rent  (no stepper)
        ════════════════════════════════════════════════════════════ */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth required label="Quarter / Unit Number *" name="rent_quarter_number"
                value={formData.rent_quarter_number} onChange={handleChange}
                placeholder="e.g., QTR-B-205 or BLK-A-101"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={fetchQuarterBill}>
                Fetch Bill
              </Button>
            </Grid>

            {quarterBill && (
              <>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: '#ede7f6', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="secondary" gutterBottom>
                      Allotment &amp; Rent Details
                    </Typography>
                    <Divider sx={{ mb: 1.5 }} />
                    <Grid container spacing={1}>
                      <Grid item xs={6} sm={4}><Typography variant="body2">Allottee Name: <b>{quarterBill.allotteeName}</b></Typography></Grid>
                      <Grid item xs={6} sm={4}><Typography variant="body2">Ward: <b>{quarterBill.ward}</b></Typography></Grid>
                      <Grid item xs={6} sm={4}><Typography variant="body2">Designation: <b>{quarterBill.designation}</b></Typography></Grid>
                      <Grid item xs={6} sm={4}><Typography variant="body2">Monthly Rent: <b>₹{quarterBill.monthlyRent.toLocaleString()}</b></Typography></Grid>
                      <Grid item xs={6} sm={4}><Typography variant="body2" color="error.main">Pending Months: <b>{quarterBill.pendingMonths}</b></Typography></Grid>
                      <Grid item xs={12}>
                        <Typography variant="h6" color="secondary" sx={{ mt: 1 }}>
                          Total Due: ₹{quarterBill.totalDue.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField fullWidth select required label="Payment Method *" name="rent_payment_method"
                    value={formData.rent_payment_method} onChange={handleChange}>
                    {['UPI', 'Net Banking', 'Debit/Credit Card', 'Cash at Counter'].map(m => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>

        {/* ═══════════════════════════════════════════════════════════
            TAB 2 — Report Encroachment  3-step
        ════════════════════════════════════════════════════════════ */}
        <TabPanel value={tab} index={2}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {ENCROACH_STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Your complaint will be recorded confidentially. The anti-encroachment cell will conduct an independent site inspection.
          </Alert>

          {/* Step 0: Reporter Info */}
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField fullWidth required label="Complainant Name *" name="enc_name"
                  value={formData.enc_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Mobile *" name="enc_mobile"
                  value={formData.enc_mobile} onChange={handleMobile('enc_mobile')} inputProps={{ maxLength: 10 }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Email" name="enc_email"
                  value={formData.enc_email} onChange={handleChange} type="email" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Aadhaar (12 digits)" name="enc_aadhaar"
                  value={formData.enc_aadhaar} onChange={handleAadhaar('enc_aadhaar')} inputProps={{ maxLength: 12 }} />
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField fullWidth label="Complainant Address" name="enc_address"
                  value={formData.enc_address} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select required label="Ward *" name="enc_ward"
                  value={formData.enc_ward} onChange={handleChange}>
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Directly Affected by Encroachment?" name="enc_is_affected"
                  value={formData.enc_is_affected} onChange={handleChange}>
                  <MenuItem value="no">No — reporting as concerned citizen</MenuItem>
                  <MenuItem value="yes">Yes — directly affected</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          )}

          {/* Step 1: Encroachment Details */}
          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField fullWidth required label="Location of Encroachment *" name="enc_location"
                  value={formData.enc_location} onChange={handleChange} multiline rows={2}
                  placeholder="Full address / plot / road / area description (GPS coordinates optional)" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select required label="Ward of Encroachment *" name="enc_ward_of_enc"
                  value={formData.enc_ward_of_enc} onChange={handleChange}>
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Nearest Landmark *" name="enc_landmark"
                  value={formData.enc_landmark} onChange={handleChange}
                  placeholder="Nearest school, temple, bus stop, etc." />
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField fullWidth select required label="Type of Encroachment *" name="enc_type"
                  value={formData.enc_type} onChange={handleChange}>
                  {['Construction on public land', 'Encroachment on footpath', 'Obstruction of road/access',
                    'Illegal structure on drain/naala', 'Occupation of municipal open space',
                    'Encroachment on reserved green/garden land', 'Illegal commercial use of residential plot', 'Other'].map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth required label="Approximate Encroached Area *" name="enc_area"
                  value={formData.enc_area} onChange={handleChange}
                  placeholder="e.g., 50 sq.ft or 10 sq.m" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select required label="Since When Noticed *" name="enc_since"
                  value={formData.enc_since} onChange={handleChange}>
                  {['Just noticed', '1 month', '3–6 months', '1–2 years', 'Many years'].map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Who is the Encroacher?" name="enc_encroacher_type"
                  value={formData.enc_encroacher_type} onChange={handleChange}>
                  {['Neighbour', 'Unknown person', 'Commercial entity', 'Contractor/Builder', 'Other'].map(e => (
                    <MenuItem key={e} value={e}>{e}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Reported Before?" name="enc_prev_reported"
                  value={formData.enc_prev_reported} onChange={handleChange}>
                  <MenuItem value="no">No — first complaint</MenuItem>
                  <MenuItem value="yes">Yes — reported earlier</MenuItem>
                </TextField>
              </Grid>
              {formData.enc_prev_reported === 'yes' && (
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Previous Complaint Reference No." name="enc_prev_ref"
                    value={formData.enc_prev_ref} onChange={handleChange} />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField fullWidth required multiline rows={3} label="Potential Harm / Impact Description *" name="enc_potential_harm"
                  value={formData.enc_potential_harm} onChange={handleChange}
                  placeholder="Describe how this encroachment causes harm — public safety, blocking access, damage to public property, etc." />
              </Grid>
            </Grid>
          )}

          {/* Step 2: Evidence Photos */}
          {activeStep === 2 && (
            <Grid container spacing={2}>
              <SectionHeading>Evidence &amp; Supporting Documents</SectionHeading>
              <Grid item xs={12}>
                <Alert severity="info">
                  Clear photographs are essential for expedient action. Please ensure photos show the encroachment clearly.
                </Alert>
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Photo of Encroachment (Primary)" name="enc_photo1" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  accept=".jpg,.jpeg,.png" hint="Clear photograph showing the encroachment — taken recently" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Additional Photo" name="enc_photo2"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  accept=".jpg,.jpeg,.png" hint="Any additional angle or close-up photograph" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Official Documents / Supporting Evidence" name="enc_docs"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove}
                  hint="Survey maps, old photographs, prior complaint copies, or official notices" />
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </DialogContent>

      {/* ══ DIALOG ACTIONS ══════════════════════════════════════════ */}
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Box sx={{ flex: 1 }} />

        {/* Back — stepper tabs */}
        {hasStepperTab && (
          <Button onClick={handleBack} disabled={activeStep === 0}>← Back</Button>
        )}

        {/* Pay button — Tab 1 (Quarter Rent), only when bill fetched */}
        {tab === 1 && quarterBill && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !formData.rent_payment_method}
            sx={{ bgcolor: HEADER_COLOR }}
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : 'Pay Rent'}
          </Button>
        )}

        {/* Next — stepper tabs, not last step */}
        {hasStepperTab && !isLastStep && (
          <Button variant="contained" onClick={handleNext} sx={{ bgcolor: HEADER_COLOR }}>
            Next →
          </Button>
        )}

        {/* Submit — stepper tabs, last step */}
        {hasStepperTab && isLastStep && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || (tab === 0 && !declared)}
            sx={{ bgcolor: HEADER_COLOR }}
          >
            {submitting
              ? <CircularProgress size={22} color="inherit" />
              : tab === 0 ? 'Submit Application' : 'Submit Complaint'}
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default MunicipalHousingForm;
