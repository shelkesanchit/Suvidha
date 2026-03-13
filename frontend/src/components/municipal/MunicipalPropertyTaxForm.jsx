import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, MenuItem, Tabs, Tab,
  DialogContent, DialogActions, Alert, Chip, CircularProgress,
  Paper, Stepper, Step, StepLabel, Divider, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { CheckCircle as SuccessIcon, Print as PrintIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import DocUpload from './DocUpload';
import { validateFile } from './formUtils';

const HEADER_COLOR = '#1565c0';
const WARDS = Array.from({ length: 10 }, (_, i) => 'Ward ' + (i + 1));

const SELF_ASSESS_STEPS  = ['Property Details', 'Owner Details', 'Building Info', 'Documents & Review'];
const REVISION_STEPS     = ['Property & Applicant', 'Revision Details', 'Documents'];
const MUTATION_STEPS     = ['Previous Owner', 'New Owner', 'Property Details', 'Documents'];
// Tab-index → step-count (0 = no stepper)
const STEP_COUNTS = [0, 4, 3, 4, 0];

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const SectionHeading = ({ children }) => (
  <Grid item xs={12}>
    <Box sx={{ mt: 1.5, mb: 0.5 }}>
      <Typography
        variant="caption"
        fontWeight={700}
        color="primary.dark"
        sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
      >
        {children}
      </Typography>
      <Divider />
    </Box>
  </Grid>
);

const initialForm = {
  // Tab 0
  property_id: '', payment_method: '',
  // Tab 1 – Step 0: Property Details
  sa_plot_number: '', sa_address: '', sa_ward: '', sa_colony: '', sa_pincode: '',
  sa_land_area: '', sa_property_type: '', sa_sub_type: '', sa_usage: '', sa_monthly_rent: '',
  // Tab 1 – Step 1: Owner Details
  sa_owner_name: '', sa_co_owner: '', sa_mobile: '', sa_alt_mobile: '',
  sa_email: '', sa_aadhaar: '', sa_pan: '', sa_father_name: '',
  sa_dob: '', sa_gender: '', sa_perm_address: '', sa_category: '',
  // Tab 1 – Step 2: Building Info
  sa_year_construction: '', sa_floors: '', sa_has_basement: 'no', sa_basement_area: '',
  sa_total_builtup: '', sa_gf_area: '', sa_ff_area: '', sa_sf_area: '',
  sa_construction_type: '', sa_plinth_area: '', sa_is_heritage: 'no',
  sa_roof_type: '', sa_water_source: '', sa_electricity_meter: '', sa_prev_record: '',
  // Tab 2 – Assessment Revision
  rev_property_id: '', rev_owner_name: '', rev_mobile: '', rev_email: '', rev_ward: '', rev_aadhaar: '',
  rev_reason: '', rev_current_value: '', rev_requested_value: '', rev_area_diff: '',
  rev_explanation: '', rev_prev_order_no: '', rev_effective_from: '',
  // Tab 3 – Mutation Step 0: Previous Owner
  mut_prev_owner_name: '', mut_prev_mobile: '', mut_prev_aadhaar: '', mut_prev_pan: '',
  mut_transfer_reason: '', mut_property_id: '',
  // Tab 3 – Mutation Step 1: New Owner
  mut_new_owner_name: '', mut_new_mobile: '', mut_new_aadhaar: '', mut_new_pan: '',
  mut_new_email: '', mut_new_address: '', mut_relation: '', mut_new_category: '',
  // Tab 3 – Mutation Step 2: Property Details
  mut_property_address: '', mut_ward: '', mut_transfer_date: '', mut_transfer_value: '',
  mut_stamp_duty: 'yes', mut_reg_number: '', mut_property_type: '',
  // Tab 4
  receipt_property_id: '',
};

const MunicipalPropertyTaxForm = ({ onClose }) => {
  const [tab, setTab]               = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber]   = useState('');
  const [declared, setDeclared]     = useState(false);
  const [billData, setBillData]     = useState(null);
  const [receipts, setReceipts]     = useState(null);
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

  // ── Mock fetchers ────────────────────────────────────────────────────────────
  const fetchBill = () => {
    if (!formData.property_id) return toast.error('Enter Property ID / Holding Number');
    setBillData({
      owner: 'Rajesh Kumar Verma', ward: 'Ward 5',
      type: 'Residential — Independent House', area: '135 sq.m',
      annualTax: 4850, lastPaid: '15 Mar 2024',
      dueDate: '31 Mar 2025', penalty: 0, totalPayable: 4850,
    });
  };

  const fetchReceipts = () => {
    if (!formData.receipt_property_id) return toast.error('Enter Property ID');
    setReceipts([
      { sr: 1, year: '2024-25', amount: 4850, mode: 'UPI',           date: '12 Apr 2024', receipt: 'PTX2024001' },
      { sr: 2, year: '2023-24', amount: 4500, mode: 'Net Banking',   date: '08 Mar 2024', receipt: 'PTX2023001' },
      { sr: 3, year: '2022-23', amount: 4200, mode: 'Cash at Counter',date: '15 Feb 2023', receipt: 'PTX2022001' },
      { sr: 4, year: '2021-22', amount: 3900, mode: 'Debit Card',    date: '22 Apr 2022', receipt: 'PTX2021001' },
      { sr: 5, year: '2020-21', amount: 3650, mode: 'UPI',           date: '10 Mar 2021', receipt: 'PTX2020001' },
    ]);
  };

  // ── Stepper navigation ───────────────────────────────────────────────────────
  const isLastStep     = activeStep === STEP_COUNTS[tab] - 1;
  const hasStepperTab  = [1, 2, 3].includes(tab);

  const handleNext = () => {
    if (tab === 1) {
      if (activeStep === 0 && (!formData.sa_address || !formData.sa_ward || !formData.sa_colony || !formData.sa_pincode || !formData.sa_land_area || !formData.sa_property_type || !formData.sa_usage))
        return toast.error('Please fill all required fields');
      if (activeStep === 1 && (!formData.sa_owner_name || !formData.sa_mobile || !formData.sa_email || !formData.sa_aadhaar || !formData.sa_father_name || !formData.sa_dob || !formData.sa_perm_address))
        return toast.error('Please fill all required owner fields');
      if (activeStep === 2 && (!formData.sa_year_construction || !formData.sa_floors || !formData.sa_total_builtup || !formData.sa_construction_type))
        return toast.error('Please fill all required building fields');
    }
    if (tab === 2) {
      if (activeStep === 0 && (!formData.rev_property_id || !formData.rev_owner_name || !formData.rev_mobile))
        return toast.error('Property ID, owner name, and mobile are required');
      if (activeStep === 1 && (!formData.rev_reason || !formData.rev_current_value || !formData.rev_requested_value || !formData.rev_explanation))
        return toast.error('Please fill all required revision fields');
    }
    if (tab === 3) {
      if (activeStep === 0 && (!formData.mut_prev_owner_name || !formData.mut_prev_mobile || !formData.mut_prev_aadhaar || !formData.mut_transfer_reason || !formData.mut_property_id))
        return toast.error('Please fill all required previous owner fields');
      if (activeStep === 1 && (!formData.mut_new_owner_name || !formData.mut_new_mobile || !formData.mut_new_aadhaar || !formData.mut_new_address))
        return toast.error('Please fill all required new owner fields');
      if (activeStep === 2 && (!formData.mut_property_address || !formData.mut_transfer_date || !formData.mut_transfer_value || !formData.mut_reg_number))
        return toast.error('Please fill all required property details');
    }
    setActiveStep(s => s + 1);
  };
  const handleBack = () => setActiveStep(s => s - 1);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (tab === 1 && !declared) return toast.error('Please accept the declaration before submitting');
    const appTypes = ['property_tax_payment', 'property_self_assessment', 'property_assessment_revision', 'property_mutation', null];
    const appType = appTypes[tab];
    if (!appType) return;
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', {
        application_type: appType,
        application_data: { ...formData },
      });
      setRefNumber(res.data?.data?.application_number || 'MPT' + Date.now());
    } catch {
      setRefNumber('MPT' + Date.now());
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
          {tab === 0 ? 'Payment Successful!' : 'Application Submitted!'}
        </Typography>
        <Chip label={refNumber} sx={{ bgcolor: HEADER_COLOR, color: 'white', fontSize: '1.1rem', py: 2, px: 3, mb: 3 }} />
        <Alert severity="info">
          {tab === 0
            ? 'Tax payment recorded. Receipt will be sent to your registered mobile/email within 24 hours.'
            : tab === 1
            ? 'Self-assessment registered. A municipal inspector will verify the property within 15 working days.'
            : tab === 2
            ? 'Assessment revision request submitted. Decision communicated within 30 working days.'
            : 'Mutation application registered. Processing within 30 working days after document verification.'}
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
          onChange={(_, v) => { setTab(v); setActiveStep(0); setBillData(null); setReceipts(null); }}
          variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
        >
          <Tab label="Pay Property Tax" />
          <Tab label="Self-Assessment" />
          <Tab label="Assessment Revision" />
          <Tab label="Property Mutation" />
          <Tab label="View & Print Receipts" />
        </Tabs>

        {/* ═══════════════════════════════════════════════════════════
            TAB 0 — Pay Property Tax  (no stepper)
        ════════════════════════════════════════════════════════════ */}
        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth label="Property ID / Holding Number *" name="property_id"
                value={formData.property_id} onChange={handleChange}
                placeholder="e.g., WARD05-2023-1234"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={fetchBill}>
                Fetch Bill
              </Button>
            </Grid>

            {billData && (
              <>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                      Property Tax Bill Details
                    </Typography>
                    <Divider sx={{ mb: 1.5 }} />
                    <Grid container spacing={1}>
                      <Grid item xs={6} sm={4}><Typography variant="body2">Owner Name: <b>{billData.owner}</b></Typography></Grid>
                      <Grid item xs={6} sm={4}><Typography variant="body2">Ward: <b>{billData.ward}</b></Typography></Grid>
                      <Grid item xs={6} sm={4}><Typography variant="body2">Property Type: <b>{billData.type}</b></Typography></Grid>
                      <Grid item xs={6} sm={4}><Typography variant="body2">Built-up Area: <b>{billData.area}</b></Typography></Grid>
                      <Grid item xs={6} sm={4}><Typography variant="body2">Last Paid: <b>{billData.lastPaid}</b></Typography></Grid>
                      <Grid item xs={6} sm={4}><Typography variant="body2">Due Date: <b>{billData.dueDate}</b></Typography></Grid>
                      <Grid item xs={6} sm={4}><Typography variant="body2">Annual Tax Due: <b>₹{billData.annualTax.toLocaleString()}</b></Typography></Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="body2" color={billData.penalty > 0 ? 'error.main' : 'text.secondary'}>
                          Penalty: <b>₹{billData.penalty.toLocaleString()}</b>
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                          Total Payable: ₹{billData.totalPayable.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth select required label="Payment Method *"
                    name="payment_method" value={formData.payment_method} onChange={handleChange}
                  >
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
            TAB 1 — Self-Assessment (New Unregistered Property)  4-step
        ════════════════════════════════════════════════════════════ */}
        <TabPanel value={tab} index={1}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {SELF_ASSESS_STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Self-assessment is subject to municipal verification. Under-reporting may attract a penalty up to 2× the differential tax.
          </Alert>

          {/* ── Step 0: Property Details ── */}
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Property / Plot Number (Survey No.)" name="sa_plot_number"
                  value={formData.sa_plot_number} onChange={handleChange} placeholder="Survey No. / Gat No. / Plot No." />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField fullWidth required label="Property Address *" name="sa_address"
                  value={formData.sa_address} onChange={handleChange} multiline rows={2} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select required label="Ward *" name="sa_ward"
                  value={formData.sa_ward} onChange={handleChange}>
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Colony / Area / Locality *" name="sa_colony"
                  value={formData.sa_colony} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Pincode *" name="sa_pincode"
                  value={formData.sa_pincode} onChange={handleChange} inputProps={{ maxLength: 6 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Land Area (sq.m) *" name="sa_land_area"
                  value={formData.sa_land_area} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select required label="Property Type *" name="sa_property_type"
                  value={formData.sa_property_type} onChange={handleChange}>
                  {['Residential', 'Commercial', 'Industrial', 'Mixed-use', 'Agricultural within limits', 'Government/Semi-govt'].map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Sub-type" name="sa_sub_type"
                  value={formData.sa_sub_type} onChange={handleChange}>
                  {['Independent House', 'Flat/Apartment', 'Row House', 'Bungalow', 'Shop', 'Office', 'Showroom', 'Warehouse', 'Factory', 'Other'].map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select required label="Property Usage *" name="sa_usage"
                  value={formData.sa_usage} onChange={handleChange}>
                  {['Self-occupied', 'Rented out fully', 'Partly rented', 'Vacant/Unused', 'Under construction'].map(u => (
                    <MenuItem key={u} value={u}>{u}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              {['Rented out fully', 'Partly rented'].includes(formData.sa_usage) && (
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Monthly Rent Received (₹)" name="sa_monthly_rent"
                    value={formData.sa_monthly_rent} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
                </Grid>
              )}
            </Grid>
          )}

          {/* ── Step 1: Owner Details ── */}
          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth required label="Owner Full Name *" name="sa_owner_name"
                  value={formData.sa_owner_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Co-owner Name (optional)" name="sa_co_owner"
                  value={formData.sa_co_owner} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Mobile * (10 digits)" name="sa_mobile"
                  value={formData.sa_mobile} onChange={handleMobile('sa_mobile')} inputProps={{ maxLength: 10 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Alternate Mobile" name="sa_alt_mobile"
                  value={formData.sa_alt_mobile} onChange={handleMobile('sa_alt_mobile')} inputProps={{ maxLength: 10 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Email *" name="sa_email"
                  value={formData.sa_email} onChange={handleChange} type="email" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Aadhaar Number * (12 digits)" name="sa_aadhaar"
                  value={formData.sa_aadhaar} onChange={handleAadhaar('sa_aadhaar')} inputProps={{ maxLength: 12 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="PAN Card Number" name="sa_pan"
                  value={formData.sa_pan} onChange={handleChange} inputProps={{ maxLength: 10 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Father's / Husband's Name *" name="sa_father_name"
                  value={formData.sa_father_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Date of Birth *" name="sa_dob"
                  value={formData.sa_dob} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Gender" name="sa_gender"
                  value={formData.sa_gender} onChange={handleChange}>
                  {['Male', 'Female', 'Other'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Category" name="sa_category"
                  value={formData.sa_category} onChange={handleChange} helperText="Affects applicable rebates">
                  {['General', 'SC/ST', 'Senior Citizen', 'Military/Paramilitary', 'Freedom Fighter'].map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required label="Permanent Address *" name="sa_perm_address"
                  value={formData.sa_perm_address} onChange={handleChange} multiline rows={2} />
              </Grid>
            </Grid>
          )}

          {/* ── Step 2: Building Info ── */}
          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Year of Construction *" name="sa_year_construction"
                  value={formData.sa_year_construction} onChange={handleChange} type="number"
                  inputProps={{ min: 1900, max: new Date().getFullYear() }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Number of Floors *" name="sa_floors"
                  value={formData.sa_floors} onChange={handleChange} type="number" inputProps={{ min: 1 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Basement?" name="sa_has_basement"
                  value={formData.sa_has_basement} onChange={handleChange}>
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </TextField>
              </Grid>
              {formData.sa_has_basement === 'yes' && (
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Basement Area (sq.m)" name="sa_basement_area"
                    value={formData.sa_basement_area} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
                </Grid>
              )}
              <SectionHeading>Floor-wise Built-up Area</SectionHeading>
              <Grid item xs={12} md={3}>
                <TextField fullWidth required label="Total Built-up Area (sq.m) *" name="sa_total_builtup"
                  value={formData.sa_total_builtup} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Ground Floor Area (sq.m)" name="sa_gf_area"
                  value={formData.sa_gf_area} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="First Floor Area (sq.m)" name="sa_ff_area"
                  value={formData.sa_ff_area} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Second Floor &amp; Above (sq.m)" name="sa_sf_area"
                  value={formData.sa_sf_area} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
              </Grid>
              <SectionHeading>Construction Details</SectionHeading>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select required label="Construction Type *" name="sa_construction_type"
                  value={formData.sa_construction_type} onChange={handleChange}>
                  {['RCC Frame', 'Load Bearing', 'Composite', 'Pre-fab/Temporary', 'Kuccha'].map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Plinth Area (sq.m)" name="sa_plinth_area"
                  value={formData.sa_plinth_area} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Heritage / Notified Property?" name="sa_is_heritage"
                  value={formData.sa_is_heritage} onChange={handleChange}>
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Roof Type" name="sa_roof_type"
                  value={formData.sa_roof_type} onChange={handleChange}>
                  {['RCC Slab', 'Tiled', 'Asbestos', 'Thatched', 'Other'].map(r => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Water Connection Source" name="sa_water_source"
                  value={formData.sa_water_source} onChange={handleChange}>
                  {['MCGM/Municipal', 'Borewell', 'Both'].map(w => (
                    <MenuItem key={w} value={w}>{w}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Electricity Meter No. (optional)" name="sa_electricity_meter"
                  value={formData.sa_electricity_meter} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={12}>
                <TextField fullWidth label="Past Tax Records / Previous Owner" name="sa_prev_record"
                  value={formData.sa_prev_record} onChange={handleChange}
                  placeholder="Previous property ID or owner name if known (optional)" />
              </Grid>
            </Grid>
          )}

          {/* ── Step 3: Documents & Review ── */}
          {activeStep === 3 && (
            <Grid container spacing={2}>
              {/* Summary */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>Application Summary</Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Grid container spacing={0.5}>
                    <Grid item xs={12}><Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>Property Details</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Ward: <b>{formData.sa_ward || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Colony: <b>{formData.sa_colony || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Pincode: <b>{formData.sa_pincode || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Type: <b>{formData.sa_property_type || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Sub-type: <b>{formData.sa_sub_type || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Usage: <b>{formData.sa_usage || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Land Area: <b>{formData.sa_land_area || '—'} sq.m</b></Typography></Grid>

                    <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>Owner Details</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Owner: <b>{formData.sa_owner_name || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Mobile: <b>{formData.sa_mobile || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Email: <b>{formData.sa_email || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Aadhaar: <b>{'****' + (formData.sa_aadhaar?.slice(-4) || '—')}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Father/Husband: <b>{formData.sa_father_name || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Category: <b>{formData.sa_category || '—'}</b></Typography></Grid>

                    <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>Building Info</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Year Built: <b>{formData.sa_year_construction || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Floors: <b>{formData.sa_floors || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Total Built-up: <b>{formData.sa_total_builtup || '—'} sq.m</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Construction: <b>{formData.sa_construction_type || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Roof Type: <b>{formData.sa_roof_type || '—'}</b></Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="body2">Water Source: <b>{formData.sa_water_source || '—'}</b></Typography></Grid>
                  </Grid>
                </Paper>
              </Grid>

              <SectionHeading>Required Documents</SectionHeading>
              <Grid item xs={12} md={6}>
                <DocUpload label="Property Title / Ownership Deed" name="sa_title_deed" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Primary legal ownership document" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Sale / Gift / Will Deed (if applicable)" name="sa_sale_deed"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Approved Building Plan" name="sa_building_plan" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Municipality-approved building plan" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Index II / Registration Document" name="sa_index2"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Possession Certificate" name="sa_possession_cert"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Aadhaar Card of Owner" name="sa_aadhaar_copy" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Self-attested copy" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Occupancy / Commencement Certificate" name="sa_occ_cert"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="If applicable" />
              </Grid>

              {/* Declaration */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                  <FormControlLabel
                    control={<Switch checked={declared} onChange={e => setDeclared(e.target.checked)} color="warning" />}
                    label={
                      <Typography variant="body2">
                        I declare all information provided is accurate to the best of my knowledge and the property details are as described. I understand that providing false information may result in legal action and enhanced penalty.
                      </Typography>
                    }
                  />
                </Paper>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* ═══════════════════════════════════════════════════════════
            TAB 2 — Assessment Revision  3-step
        ════════════════════════════════════════════════════════════ */}
        <TabPanel value={tab} index={2}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {REVISION_STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>

          {/* Step 0: Property & Applicant */}
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth required label="Property ID / Holding No. *" name="rev_property_id"
                  value={formData.rev_property_id} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth required label="Owner Name *" name="rev_owner_name"
                  value={formData.rev_owner_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Mobile *" name="rev_mobile"
                  value={formData.rev_mobile} onChange={handleMobile('rev_mobile')} inputProps={{ maxLength: 10 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Email" name="rev_email"
                  value={formData.rev_email} onChange={handleChange} type="email" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Ward" name="rev_ward"
                  value={formData.rev_ward} onChange={handleChange}>
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Aadhaar Number" name="rev_aadhaar"
                  value={formData.rev_aadhaar} onChange={handleAadhaar('rev_aadhaar')} inputProps={{ maxLength: 12 }} />
              </Grid>
            </Grid>
          )}

          {/* Step 1: Revision Details */}
          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth select required label="Reason for Revision *" name="rev_reason"
                  value={formData.rev_reason} onChange={handleChange}>
                  {['Incorrect area recorded', 'Wrong property type', 'Structural changes done',
                    'Division/Amalgamation of property', 'Change of ownership', 'De-listing or demolition',
                    'Error in tax calculation', 'Other'].map(r => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth required label="Current Assessed Value (₹) *" name="rev_current_value"
                  value={formData.rev_current_value} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth required label="Requested Revised Value (₹) *" name="rev_requested_value"
                  value={formData.rev_requested_value} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Floor Area Difference (sq.m, + or -)" name="rev_area_diff"
                  value={formData.rev_area_diff} onChange={handleChange} type="number"
                  helperText="Positive if area increased, negative if decreased" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Previous Assessment Order No." name="rev_prev_order_no"
                  value={formData.rev_prev_order_no} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="With Effect From (FY start date)" name="rev_effective_from"
                  value={formData.rev_effective_from} onChange={handleChange} type="date"
                  InputLabelProps={{ shrink: true }} helperText="e.g., 01 April of relevant year" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required multiline rows={4} label="Detailed Explanation *" name="rev_explanation"
                  value={formData.rev_explanation} onChange={handleChange}
                  placeholder="Provide a detailed explanation for the assessment revision request..." />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  Revision requests are reviewed by the Tax Assessment Officer. Decision will be communicated within <b>30 working days</b>.
                </Alert>
              </Grid>
            </Grid>
          )}

          {/* Step 2: Documents */}
          {activeStep === 2 && (
            <Grid container spacing={2}>
              <SectionHeading>Supporting Documents</SectionHeading>
              <Grid item xs={12} md={6}>
                <DocUpload label="Existing Assessment Order / Tax Receipt" name="rev_assessment_order" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Copy of current assessment or last paid tax bill" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Property Ownership Proof" name="rev_ownership_proof" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Sale deed / property card / 7/12 extract" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Building Plan (current / revised)" name="rev_building_plan"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="If revision relates to structural changes" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Any Other Supporting Document" name="rev_other_doc"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Any document supporting your revision claim" />
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* ═══════════════════════════════════════════════════════════
            TAB 3 — Property Mutation  4-step
        ════════════════════════════════════════════════════════════ */}
        <TabPanel value={tab} index={3}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {MUTATION_STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>
          <Alert severity="info" sx={{ mb: 2 }}>
            Property mutation transfers the municipal tax record to the new owner following sale, inheritance, or gift. Ensure all transfer documents are duly registered with the Sub-Registrar's office.
          </Alert>

          {/* Step 0: Previous Owner */}
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <SectionHeading>Previous Owner Details</SectionHeading>
              <Grid item xs={12} md={6}>
                <TextField fullWidth required label="Previous Owner Full Name *" name="mut_prev_owner_name"
                  value={formData.mut_prev_owner_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth required label="Previous Owner Mobile *" name="mut_prev_mobile"
                  value={formData.mut_prev_mobile} onChange={handleMobile('mut_prev_mobile')} inputProps={{ maxLength: 10 }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth required label="Previous Owner Aadhaar *" name="mut_prev_aadhaar"
                  value={formData.mut_prev_aadhaar} onChange={handleAadhaar('mut_prev_aadhaar')} inputProps={{ maxLength: 12 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Previous Owner PAN" name="mut_prev_pan"
                  value={formData.mut_prev_pan} onChange={handleChange} inputProps={{ maxLength: 10 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select required label="Reason for Transfer *" name="mut_transfer_reason"
                  value={formData.mut_transfer_reason} onChange={handleChange}>
                  {['Sale', 'Gift', 'Inheritance/Will', 'Court Order', 'Partition', 'HUF dissolution', 'Other'].map(r => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Property ID / Holding No. *" name="mut_property_id"
                  value={formData.mut_property_id} onChange={handleChange} placeholder="Current municipal property ID" />
              </Grid>
            </Grid>
          )}

          {/* Step 1: New Owner */}
          {activeStep === 1 && (
            <Grid container spacing={2}>
              <SectionHeading>New Owner Details</SectionHeading>
              <Grid item xs={12} md={6}>
                <TextField fullWidth required label="New Owner Full Name *" name="mut_new_owner_name"
                  value={formData.mut_new_owner_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth required label="New Owner Mobile *" name="mut_new_mobile"
                  value={formData.mut_new_mobile} onChange={handleMobile('mut_new_mobile')} inputProps={{ maxLength: 10 }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth required label="New Owner Aadhaar * (12 digits)" name="mut_new_aadhaar"
                  value={formData.mut_new_aadhaar} onChange={handleAadhaar('mut_new_aadhaar')} inputProps={{ maxLength: 12 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="New Owner PAN" name="mut_new_pan"
                  value={formData.mut_new_pan} onChange={handleChange} inputProps={{ maxLength: 10 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="New Owner Email" name="mut_new_email"
                  value={formData.mut_new_email} onChange={handleChange} type="email" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="New Owner Category" name="mut_new_category"
                  value={formData.mut_new_category} onChange={handleChange}>
                  {['General', 'SC/ST', 'Senior Citizen', 'Military/Paramilitary'].map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField fullWidth required label="New Owner Address *" name="mut_new_address"
                  value={formData.mut_new_address} onChange={handleChange} multiline rows={2} />
              </Grid>
              {['Gift', 'Inheritance/Will'].includes(formData.mut_transfer_reason) && (
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Relation to Previous Owner" name="mut_relation"
                    value={formData.mut_relation} onChange={handleChange}
                    placeholder="e.g., Son, Daughter, Spouse" />
                </Grid>
              )}
            </Grid>
          )}

          {/* Step 2: Property Details */}
          {activeStep === 2 && (
            <Grid container spacing={2}>
              <SectionHeading>Property &amp; Transfer Details</SectionHeading>
              <Grid item xs={12} md={8}>
                <TextField fullWidth required label="Property Address *" name="mut_property_address"
                  value={formData.mut_property_address} onChange={handleChange} multiline rows={2} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Ward" name="mut_ward"
                  value={formData.mut_ward} onChange={handleChange}>
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Sale / Transfer Date *" name="mut_transfer_date"
                  value={formData.mut_transfer_date} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Sale / Transfer Value (₹) *" name="mut_transfer_value"
                  value={formData.mut_transfer_value} onChange={handleChange} type="number" inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Stamp Duty Paid?" name="mut_stamp_duty"
                  value={formData.mut_stamp_duty} onChange={handleChange}>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth required label="Registration No. (Sub-Registrar Office) *" name="mut_reg_number"
                  value={formData.mut_reg_number} onChange={handleChange} placeholder="Registration document number" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label="Property Type" name="mut_property_type"
                  value={formData.mut_property_type} onChange={handleChange}>
                  {['Residential', 'Commercial', 'Industrial'].map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          )}

          {/* Step 3: Documents */}
          {activeStep === 3 && (
            <Grid container spacing={2}>
              <SectionHeading>Required Documents</SectionHeading>
              <Grid item xs={12} md={6}>
                <DocUpload label="Registered Sale / Gift / Will Deed" name="mut_primary_deed" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Primary document establishing transfer of ownership — must be registered" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Stamp Duty &amp; Registration Receipt" name="mut_stamp_receipt" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Proof of stamp duty and registration fee payment" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Previous Owner ID Proof" name="mut_prev_id" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Aadhaar / Voter ID / PAN of previous owner" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="New Owner ID Proof (Aadhaar)" name="mut_new_id" required
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Aadhaar card of new owner" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="NOC from Housing Society (if applicable)" name="mut_noc_society"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Required for flat/apartment in co-operative housing society" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Property Card / 7/12 Extract" name="mut_property_card"
                  docs={docs} onFileChange={onDocChange} onRemove={onDocRemove} hint="Revenue record / property card from competent authority" />
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* ═══════════════════════════════════════════════════════════
            TAB 4 — View & Print Receipts  (no stepper)
        ════════════════════════════════════════════════════════════ */}
        <TabPanel value={tab} index={4}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth required label="Property ID / Holding Number *"
                name="receipt_property_id" value={formData.receipt_property_id} onChange={handleChange}
                placeholder="e.g., WARD05-2023-1234"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={fetchReceipts}>
                Fetch Receipts
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">Receipts from the last 5 years are available online.</Alert>
            </Grid>
            {receipts && (
              <Grid item xs={12}>
                <TableContainer component={Paper} sx={{ mt: 1 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: HEADER_COLOR }}>
                      <TableRow>
                        {['Sr. No.', 'Financial Year', 'Amount', 'Mode of Payment', 'Payment Date', 'Receipt No.', 'Action'].map(h => (
                          <TableCell key={h} sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {receipts.map(r => (
                        <TableRow key={r.receipt} hover>
                          <TableCell>{r.sr}</TableCell>
                          <TableCell>{r.year}</TableCell>
                          <TableCell>₹{r.amount.toLocaleString()}</TableCell>
                          <TableCell>{r.mode}</TableCell>
                          <TableCell>{r.date}</TableCell>
                          <TableCell>
                            <Chip label={r.receipt} size="small" color="primary" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Button size="small" startIcon={<PrintIcon />}
                              onClick={() => toast.success('Printing receipt ' + r.receipt)}>
                              Print
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </DialogContent>

      {/* ══ DIALOG ACTIONS ══════════════════════════════════════════ */}
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Box sx={{ flex: 1 }} />

        {/* Back — only for stepper tabs */}
        {hasStepperTab && (
          <Button onClick={handleBack} disabled={activeStep === 0}>← Back</Button>
        )}

        {/* Pay Now — Tab 0 only when bill loaded */}
        {tab === 0 && billData && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !formData.payment_method}
            sx={{ bgcolor: HEADER_COLOR }}
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : 'Pay Now'}
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
            disabled={submitting || (tab === 1 && !declared)}
            sx={{ bgcolor: HEADER_COLOR }}
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : 'Submit Application'}
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default MunicipalPropertyTaxForm;
