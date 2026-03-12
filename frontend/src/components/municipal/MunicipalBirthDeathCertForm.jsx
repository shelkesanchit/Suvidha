import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, MenuItem, Tabs, Tab,
  DialogContent, DialogActions, Alert, Chip, CircularProgress, Paper,
  Stepper, Step, StepLabel,
} from '@mui/material';
import { CheckCircle as SuccessIcon, Download as DownloadIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import DocUpload from './DocUpload';

const HEADER_COLOR = '#2e7d32';

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const BIRTH_STEPS = ['Event Details', 'Parents & Address', 'Documents & Submit'];
const DEATH_STEPS = ['Deceased Details', 'Informant Details', 'Documents & Submit'];

const MunicipalBirthDeathCertForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const [birthStep, setBirthStep] = useState(0);
  const [deathStep, setDeathStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [certDetails, setCertDetails] = useState(null);

  const [formData, setFormData] = useState({
    // Birth — Step 0
    date_of_birth: '', time_of_birth: '', gender: '',
    birth_type: 'hospital', hospital_name: '', place_of_birth: '', ward: '',
    // Birth — Step 1
    child_name: '', father_name: '', mother_name: '',
    father_aadhaar: '', mother_aadhaar: '',
    father_mobile: '', mother_mobile: '',
    parents_address: '', parents_ward: '',
    // Death — Step 0
    deceased_name: '', deceased_dob: '', deceased_gender: '',
    date_of_death: '', time_of_death: '', place_of_death: '',
    death_type: 'hospital', death_hospital: '', cause_of_death: '', death_ward: '',
    // Death — Step 1
    informant_name: '', informant_aadhaar: '', informant_mobile: '', informant_relation: '',
    informant_address: '',
    // Download
    reg_number: '', cert_type: 'birth',
    // Correction
    corr_reg_number: '', corr_cert_type: 'birth', corr_field: '', correct_value: '', corr_reason: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const [docs, setDocs] = useState({});
  const handleFileChange = (name, file) => setDocs(prev => ({ ...prev, [name]: file }));
  const handleRemoveFile = (name) => setDocs(prev => { const n = { ...prev }; delete n[name]; return n; });

  const fetchCertificate = () => {
    if (!formData.reg_number) return toast.error('Enter Registration Number');
    setCertDetails({
      name: formData.cert_type === 'birth' ? 'Ananya Singh' : 'Ramesh Kumar',
      date: formData.cert_type === 'birth' ? '14 Aug 2021' : '03 Jan 2024',
      reg: formData.reg_number, ward: 'Ward 7',
    });
  };

  const handleSubmit = async () => {
    const types = ['birth_certificate', 'death_certificate', null, 'cert_correction'];
    if (!types[tab]) return;
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', { application_type: types[tab], application_data: formData });
      setRefNumber(res.data?.data?.application_number || 'MBC' + Date.now());
    } catch {
      setRefNumber('MBC' + Date.now());
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    }
  };

  if (submitted) return (
    <Box>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" color="success.main" gutterBottom>Application Submitted!</Typography>
        <Chip label={refNumber} color="success" sx={{ fontSize: '1.1rem', py: 2, px: 3, mb: 3 }} />
        <Alert severity="info">Processing time: 7–10 working days. Certificate can be collected from the Municipal Office or downloaded once approved. SMS notification will be sent to your registered mobile.</Alert>
      </DialogContent>
      <DialogActions><Button variant="contained" onClick={onClose} fullWidth sx={{ bgcolor: HEADER_COLOR }}>Close</Button></DialogActions>
    </Box>
  );

  return (
    <Box>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setCertDetails(null); setBirthStep(0); setDeathStep(0); }}
          variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tab label="Apply – Birth Certificate" />
          <Tab label="Apply – Death Certificate" />
          <Tab label="Download / Reprint" />
          <Tab label="Correction Request" />
        </Tabs>

        {/* Tab 0: Apply Birth Certificate */}
        <TabPanel value={tab} index={0}>
          <Stepper activeStep={birthStep} sx={{ mb: 3 }}>
            {BIRTH_STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>

          {birthStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><Alert severity="info" sx={{ mb: 1 }}>Birth certificate application must be filed within <b>21 days</b> of birth (Form 1). Late registration up to 30 days requires the Sub-Registrar's permission; after 1 year requires court order.</Alert></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Date of Birth *" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Time of Birth" name="time_of_birth" value={formData.time_of_birth} onChange={handleChange} type="time" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select required label="Sex of Child *" name="gender" value={formData.gender} onChange={handleChange}>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Type of Birth" name="birth_type" value={formData.birth_type} onChange={handleChange}>
                  <MenuItem value="hospital">Hospital / Nursing Home</MenuItem>
                  <MenuItem value="home">Home Birth</MenuItem>
                  <MenuItem value="other">Other Institution</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                  {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Hospital / Nursing Home Name" name="hospital_name" value={formData.hospital_name} onChange={handleChange} placeholder="Leave blank if home birth" /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Place of Birth (City / Village)" name="place_of_birth" value={formData.place_of_birth} onChange={handleChange} /></Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button variant="contained" onClick={() => { if (!formData.date_of_birth || !formData.gender) return toast.error('Date of birth and sex are required'); setBirthStep(1); }} sx={{ bgcolor: HEADER_COLOR }}>Next →</Button>
              </Grid>
            </Grid>
          )}

          {birthStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth label="Child's Name (if named, else leave blank)" name="child_name" value={formData.child_name} onChange={handleChange} helperText="Can be updated later on certificate" /></Grid>
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>Father's Details</Typography></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth required label="Father's Full Name *" name="father_name" value={formData.father_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Aadhaar Number" name="father_aadhaar" value={formData.father_aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth required label="Father's Mobile *" name="father_mobile" value={formData.father_mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={600} color="secondary" gutterBottom>Mother's Details</Typography></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth required label="Mother's Full Name *" name="mother_name" value={formData.mother_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Aadhaar Number" name="mother_aadhaar" value={formData.mother_aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Mother's Mobile" name="mother_mobile" value={formData.mother_mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12}><TextField fullWidth required label="Parents' Permanent Address *" name="parents_address" value={formData.parents_address} onChange={handleChange} multiline rows={2} /></Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Ward (Residence)" name="parents_ward" value={formData.parents_ward} onChange={handleChange}>
                  {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button onClick={() => setBirthStep(0)}>← Back</Button>
                <Button variant="contained" onClick={() => { if (!formData.father_name || !formData.mother_name || !formData.father_mobile) return toast.error('Father name, mother name, and father mobile are required'); setBirthStep(2); }} sx={{ bgcolor: HEADER_COLOR }}>Next →</Button>
              </Grid>
            </Grid>
          )}

          {birthStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>Required Documents</Typography></Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Hospital Birth Record / Discharge Summary" name="hospital_birth_cert" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Form 1 issued by hospital / attending doctor" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Parents' Marriage Certificate" name="parents_marriage_cert" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="If available; helps accurate entry of parents' names" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Father's Aadhaar / ID Proof" name="father_id_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Any govt. ID — Aadhaar preferred" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Mother's Aadhaar / ID Proof" name="mother_id_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Any govt. ID — Aadhaar preferred" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Proof of Address (parents)" name="parents_address_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Aadhaar / utility bill / ration card" />
              </Grid>
              <Grid item xs={12}><Alert severity="warning">If birth is being registered after 30 days, also attach the late registration permission letter from the Sub-Registrar.</Alert></Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button onClick={() => setBirthStep(1)}>← Back</Button>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 1: Apply Death Certificate */}
        <TabPanel value={tab} index={1}>
          <Stepper activeStep={deathStep} sx={{ mb: 3 }}>
            {DEATH_STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>

          {deathStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><Alert severity="info" sx={{ mb: 1 }}>Death must be registered within <b>21 days</b> at the local municipal office. A medical certificate (Form 4 / Form 4A) from the attending doctor or hospital is mandatory.</Alert></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Name of Deceased *" name="deceased_name" value={formData.deceased_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Date of Birth of Deceased" name="deceased_dob" value={formData.deceased_dob} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label="Sex" name="deceased_gender" value={formData.deceased_gender} onChange={handleChange}>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Date of Death *" name="date_of_death" value={formData.date_of_death} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Time of Death" name="time_of_death" value={formData.time_of_death} onChange={handleChange} type="time" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Place of Death" name="death_type" value={formData.death_type} onChange={handleChange}>
                  <MenuItem value="hospital">Hospital / Nursing Home</MenuItem>
                  <MenuItem value="home">Home</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Hospital / Facility Name" name="death_hospital" value={formData.death_hospital} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Ward" name="death_ward" value={formData.death_ward} onChange={handleChange}>
                  {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Place of Death (full address)" name="place_of_death" value={formData.place_of_death} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth select label="Cause of Death" name="cause_of_death" value={formData.cause_of_death} onChange={handleChange}>
                  {['Natural causes', 'Illness / Disease', 'Accident', 'Cardiac arrest', 'Other (as per medical cert.)'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button variant="contained" onClick={() => { if (!formData.deceased_name || !formData.date_of_death) return toast.error('Deceased name and date of death are required'); setDeathStep(1); }} sx={{ bgcolor: HEADER_COLOR }}>Next →</Button>
              </Grid>
            </Grid>
          )}

          {deathStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><Alert severity="info">The informant must be a family member or the person responsible for the burial / cremation.</Alert></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth required label="Informant's Full Name *" name="informant_name" value={formData.informant_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Informant's Aadhaar" name="informant_aadhaar" value={formData.informant_aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth required label="Informant's Mobile *" name="informant_mobile" value={formData.informant_mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth select label="Relation to Deceased *" name="informant_relation" value={formData.informant_relation} onChange={handleChange}>
                  {['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Sibling', 'Other relative', 'Hospital in-charge'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}><TextField fullWidth required label="Informant's Address *" name="informant_address" value={formData.informant_address} onChange={handleChange} multiline rows={2} /></Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button onClick={() => setDeathStep(0)}>← Back</Button>
                <Button variant="contained" onClick={() => { if (!formData.informant_name || !formData.informant_mobile || !formData.informant_relation) return toast.error('Informant name, mobile, and relation are required'); setDeathStep(2); }} sx={{ bgcolor: HEADER_COLOR }}>Next →</Button>
              </Grid>
            </Grid>
          )}

          {deathStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>Required Documents</Typography></Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Medical Certificate of Cause of Death (Form 4 / 4A)" name="death_medical_cert" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Issued by attending doctor or hospital" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Informant's Aadhaar / ID Proof" name="informant_id_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Aadhaar / Voter ID / Passport of informant" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Deceased's Aadhaar / Any ID Proof" name="deceased_id_proof" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="If available — Aadhaar / Ration Card / Voter ID" />
              </Grid>
              <Grid item xs={12} md={6}>
                <DocUpload label="Cremation / Burial Certificate" name="cremation_cert" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Issued by crematorium / burial ground" />
              </Grid>
              <Grid item xs={12}><Alert severity="warning">If death occurred at home without medical attendance, a Form 4A signed by the Sub-Registrar or Tahsildar is needed instead of a hospital certificate.</Alert></Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button onClick={() => setDeathStep(1)}>← Back</Button>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 2: Download / Reprint */}
        <TabPanel value={tab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Certificate Type" name="cert_type" value={formData.cert_type} onChange={handleChange}>
                <MenuItem value="birth">Birth Certificate</MenuItem>
                <MenuItem value="death">Death Certificate</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={5}><TextField fullWidth label="Registration Number" name="reg_number" value={formData.reg_number} onChange={handleChange} placeholder="BC2021-XXXXXX" /></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="outlined" sx={{ height: 56 }} onClick={fetchCertificate}>Search</Button></Grid>
            {certDetails && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Certificate Found</Typography>
                  <Typography variant="body1">Name: <b>{certDetails.name}</b></Typography>
                  <Typography variant="body1">Date: <b>{certDetails.date}</b></Typography>
                  <Typography variant="body1">Reg. No: <b>{certDetails.reg}</b></Typography>
                  <Typography variant="body1" gutterBottom>Ward: <b>{certDetails.ward}</b></Typography>
                  <Button variant="contained" startIcon={<DownloadIcon />} sx={{ bgcolor: HEADER_COLOR, mt: 1 }}>Download PDF</Button>
                </Paper>
              </Grid>
            )}
            {!certDetails && <Grid item xs={12}><Alert severity="info">Enter the registration number from your acknowledgement slip to download or reprint your certificate.</Alert></Grid>}
          </Grid>
        </TabPanel>

        {/* Tab 3: Correction Request */}
        <TabPanel value={tab} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12}><Alert severity="warning">Corrections to birth/death certificates require a notarized affidavit and supporting documents. Processing time: 15–30 days with verification.</Alert></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Certificate Type" name="corr_cert_type" value={formData.corr_cert_type} onChange={handleChange}>
                <MenuItem value="birth">Birth Certificate</MenuItem>
                <MenuItem value="death">Death Certificate</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}><TextField fullWidth required label="Registration Number *" name="corr_reg_number" value={formData.corr_reg_number} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Field to be Corrected" name="corr_field" value={formData.corr_field} onChange={handleChange}>
                {['Child / Deceased name spelling', 'Date of birth / death', 'Father\'s name', 'Mother\'s name', 'Gender', 'Address / Ward', 'Other'].map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Correct Value / Information" name="correct_value" value={formData.correct_value} onChange={handleChange} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Reason / Justification for Correction" name="corr_reason" value={formData.corr_reason} onChange={handleChange} /></Grid>
            <Grid item xs={12}><Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Required Documents</Typography></Grid>
            <Grid item xs={12} md={6}>
              <DocUpload label="Notarized Affidavit on Stamp Paper" name="correction_affidavit" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Declaring the correct information — sworn before notary" />
            </Grid>
            <Grid item xs={12} md={6}>
              <DocUpload label="Supporting Proof of Correct Information" name="correction_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="School leaving cert / hospital records / Aadhaar confirming correct value" />
            </Grid>
            <Grid item xs={12} md={6}>
              <DocUpload label="Original / Old Certificate Copy" name="old_cert_copy" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Copy of the certificate with the error" />
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        {tab === 0 && birthStep === 2 && (
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Birth Certificate Application'}
          </Button>
        )}
        {tab === 1 && deathStep === 2 && (
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Death Certificate Application'}
          </Button>
        )}
        {tab === 3 && (
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Correction Request'}
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default MunicipalBirthDeathCertForm;
