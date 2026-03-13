import React, { useState } from 'react';
import {
  Box, Grid, TextField, Select, MenuItem, Button, Tabs, Tab,
  Stepper, Step, StepLabel, Alert, Chip, CircularProgress,
  Paper, Divider, Typography, DialogContent, DialogActions,
  DialogTitle, Switch, FormControlLabel, InputLabel, FormControl,
} from '@mui/material';
import DocUpload from './DocUpload';
import { validateFile } from './formUtils';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const HEADER_COLOR = '#e65100';
const HOVER_COLOR  = '#bf360c';
const WARDS        = Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`);

const POT_STEPS   = ['Your Details',    'Damage Information',   'Photos & Submit'];
const LIGHT_STEPS = ['Reporter Info',   'Streetlight Details',  'Photos & Submit'];
const DRAIN_STEPS = ['Reporter Info',   'Drain Details',        'Photos & Submit'];
const CUT_STEPS   = ['Applicant Info',  'Work Details',         'Documents',       'Review'];

const getTodayPlus = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};
const datePlusOne = (iso) => {
  if (!iso) return getTodayPlus(1);
  const d = new Date(iso);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};
const daysBetween = (a, b) => {
  if (!a || !b) return '';
  const diff = new Date(b) - new Date(a);
  const days = Math.ceil(diff / 86400000);
  return days > 0 ? `${days} days` : '';
};

export default function MunicipalRoadsForm({ onClose }) {
  const [activeTab,  setActiveTab]  = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  /* ── Pothole / Road Damage ─────────────────────────────────────── */
  const [potData, setPotData] = useState({
    fullName: '', mobile: '', email: '', address: '', ward: '', aadhaar: '',
    roadName: '', gpsCoords: '', nearestLandmark: '', wardIncident: '',
    damageType: '', damageSeverity: '', approxSize: '', roadClassification: '',
    daysDamageNoticed: '', trafficImpact: '', accidentOccurred: '',
    accidentDescription: '', additionalDetails: '',
  });
  const [potDocs,       setPotDocs]       = useState({});
  const [potSubmitting, setPotSubmitting] = useState(false);
  const [potSubmitted,  setPotSubmitted]  = useState(false);
  const [potRef,        setPotRef]        = useState('');

  /* ── Streetlight Complaint ─────────────────────────────────────── */
  const [lightData, setLightData] = useState({
    fullName: '', mobile: '', email: '', ward: '', address: '',
    streetName: '', poleId: '', wardIncident: '', nearestLandmark: '',
    complaintType: '', numNonWorking: '', areaAffected: '',
    timeNoticed: '', daysPersisting: '', safetyHazard: '', additionalDescription: '',
  });
  const [lightDocs,       setLightDocs]       = useState({});
  const [lightSubmitting, setLightSubmitting] = useState(false);
  const [lightSubmitted,  setLightSubmitted]  = useState(false);
  const [lightRef,        setLightRef]        = useState('');

  /* ── Drain / Manhole Issue ─────────────────────────────────────── */
  const [drainData, setDrainData] = useState({
    fullName: '', mobile: '', email: '', address: '', ward: '',
    drainLocation: '', wardIncident: '', nearestLandmark: '',
    issueType: '', roadPathBlocked: '', waterStagnationDepth: '',
    manholeStatus: '', riskToPublic: '', riskDescription: '',
    durationOfIssue: '', additionalDescription: '',
  });
  const [drainDocs,       setDrainDocs]       = useState({});
  const [drainSubmitting, setDrainSubmitting] = useState(false);
  const [drainSubmitted,  setDrainSubmitted]  = useState(false);
  const [drainRef,        setDrainRef]        = useState('');

  /* ── Road Cutting Permit ───────────────────────────────────────── */
  const [cutData, setCutData] = useState({
    orgName: '', orgType: '', contactPerson: '', contactMobile: '',
    officialEmail: '', aadhaarPan: '', registeredAddress: '', ward: '',
    roadName: '', wardCutting: '', startPoint: '', endPoint: '',
    gpsCoords: '', workType: '', cutLength: '', cutWidth: '', cutDepth: '',
    proposedStart: '', proposedEnd: '',
    contractorName: '', contractorMobile: '', contractorLicense: '',
    roadRestoration: '', workDescription: '',
  });
  const [cutDocs,        setCutDocs]        = useState({});
  const [cutDeclaration, setCutDeclaration] = useState(false);
  const [cutSubmitting,  setCutSubmitting]  = useState(false);
  const [cutSubmitted,   setCutSubmitted]   = useState(false);
  const [cutRef,         setCutRef]         = useState('');

  /* ── Tab switch ────────────────────────────────────────────────── */
  const handleTabChange = (_, val) => { setActiveTab(val); setActiveStep(0); };

  /* ── Field updaters ────────────────────────────────────────────── */
  const updPot = (f) => (e) => {
    let v = e.target.value;
    if (f === 'mobile')  v = v.replace(/\D/g, '').slice(0, 10);
    if (f === 'aadhaar') v = v.replace(/\D/g, '').slice(0, 12);
    setPotData(p => ({ ...p, [f]: v }));
  };
  const updLight = (f) => (e) => {
    let v = e.target.value;
    if (f === 'mobile') v = v.replace(/\D/g, '').slice(0, 10);
    setLightData(p => ({ ...p, [f]: v }));
  };
  const updDrain = (f) => (e) => {
    let v = e.target.value;
    if (f === 'mobile') v = v.replace(/\D/g, '').slice(0, 10);
    setDrainData(p => ({ ...p, [f]: v }));
  };
  const updCut = (f) => (e) => {
    let v = e.target.value;
    if (f === 'contactMobile' || f === 'contractorMobile') v = v.replace(/\D/g, '').slice(0, 10);
    setCutData(p => ({ ...p, [f]: v }));
  };

  /* ── Doc handlers ──────────────────────────────────────────────── */
  const mkDocHandler = (setter) => (name, file) => {
    if (!file) return;
    const err = validateFile(file, 5);
    if (err) { toast.error(err); return; }
    setter(p => ({ ...p, [name]: file }));
    toast.success(`${file.name} selected`);
  };
  const mkRemoveHandler = (setter) => (name) =>
    setter(p => { const n = { ...p }; delete n[name]; return n; });

  const handlePotDoc   = mkDocHandler(setPotDocs);
  const removePotDoc   = mkRemoveHandler(setPotDocs);
  const handleLightDoc = mkDocHandler(setLightDocs);
  const removeLightDoc = mkRemoveHandler(setLightDocs);
  const handleDrainDoc = mkDocHandler(setDrainDocs);
  const removeDrainDoc = mkRemoveHandler(setDrainDocs);
  const handleCutDoc   = mkDocHandler(setCutDocs);
  const removeCutDoc   = mkRemoveHandler(setCutDocs);

  /* ── Validation ────────────────────────────────────────────────── */
  const validateStep = () => {
    if (activeTab === 0) {
      if (activeStep === 0) {
        if (!potData.fullName.trim())      { toast.error('Full Name is required');              return false; }
        if (potData.mobile.length < 10)    { toast.error('Valid 10-digit mobile required');      return false; }
        if (!potData.ward)                 { toast.error('Ward is required');                    return false; }
      }
      if (activeStep === 1) {
        if (!potData.roadName.trim())      { toast.error('Road Name / Location is required');    return false; }
        if (!potData.nearestLandmark.trim()){ toast.error('Nearest Landmark is required');       return false; }
        if (!potData.damageType)           { toast.error('Damage Type is required');             return false; }
        if (!potData.damageSeverity)       { toast.error('Damage Severity is required');         return false; }
      }
      if (activeStep === 2) {
        if (!potDocs['road_damage_photo']) { toast.error('Photo of Road Damage is required');    return false; }
      }
    }
    if (activeTab === 1) {
      if (activeStep === 0) {
        if (!lightData.fullName.trim())    { toast.error('Full Name is required');               return false; }
        if (lightData.mobile.length < 10)  { toast.error('Valid 10-digit mobile required');      return false; }
        if (!lightData.ward)               { toast.error('Ward is required');                    return false; }
      }
      if (activeStep === 1) {
        if (!lightData.streetName.trim())  { toast.error('Street / Road Name is required');      return false; }
        if (!lightData.nearestLandmark.trim()){ toast.error('Nearest Landmark is required');     return false; }
        if (!lightData.complaintType)      { toast.error('Complaint Type is required');          return false; }
      }
      if (activeStep === 2) {
        if (!lightDocs['light_photo'])     { toast.error('Photo of Broken/Dark Streetlight is required'); return false; }
      }
    }
    if (activeTab === 2) {
      if (activeStep === 0) {
        if (!drainData.fullName.trim())    { toast.error('Full Name is required');               return false; }
        if (drainData.mobile.length < 10)  { toast.error('Valid 10-digit mobile required');      return false; }
        if (!drainData.ward)               { toast.error('Ward is required');                    return false; }
      }
      if (activeStep === 1) {
        if (!drainData.drainLocation.trim()){ toast.error('Drain/Manhole Location is required'); return false; }
        if (!drainData.nearestLandmark.trim()){ toast.error('Nearest Landmark is required');     return false; }
        if (!drainData.issueType)          { toast.error('Issue Type is required');              return false; }
      }
      if (activeStep === 2) {
        if (!drainDocs['drain_photo'])     { toast.error('Photo of Drain/Manhole Issue is required'); return false; }
      }
    }
    if (activeTab === 3) {
      if (activeStep === 0) {
        if (!cutData.orgName.trim())       { toast.error('Organisation/Applicant Name is required'); return false; }
        if (!cutData.contactPerson.trim()) { toast.error('Contact Person Name is required');     return false; }
        if (cutData.contactMobile.length < 10){ toast.error('Valid contact mobile required');    return false; }
        if (!cutData.officialEmail.trim()) { toast.error('Official Email is required');          return false; }
        if (!cutData.registeredAddress.trim()){ toast.error('Registered Address is required');  return false; }
        if (!cutData.ward)                 { toast.error('Ward is required');                    return false; }
      }
      if (activeStep === 1) {
        if (!cutData.roadName.trim())      { toast.error('Road Name to be Cut is required');     return false; }
        if (!cutData.wardCutting)          { toast.error('Ward of Cutting Location is required'); return false; }
        if (!cutData.workType)             { toast.error('Work Type is required');               return false; }
        if (!cutData.cutLength)            { toast.error('Length of Road to Cut is required');   return false; }
        if (!cutData.cutWidth)             { toast.error('Width of Cut is required');            return false; }
        if (!cutData.cutDepth)             { toast.error('Depth of Cut is required');            return false; }
        if (!cutData.proposedStart)        { toast.error('Proposed Start Date is required');     return false; }
        if (!cutData.proposedEnd)          { toast.error('Proposed End Date is required');       return false; }
        if (!cutData.contractorName.trim()){ toast.error('Contractor/Agency Name is required');  return false; }
        if (!cutData.roadRestoration)      { toast.error('Road Restoration Commitment is required'); return false; }
        if (!cutData.workDescription.trim()){ toast.error('Work Description is required');      return false; }
      }
      if (activeStep === 2) {
        if (!cutDocs['sanction_letter'])   { toast.error('Work Sanction Letter is required');    return false; }
        if (!cutDocs['site_plan'])         { toast.error('Site Location Plan / Drawing is required'); return false; }
      }
      if (activeStep === 3) {
        if (!cutDeclaration)               { toast.error('Please accept the declaration to proceed'); return false; }
      }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setActiveStep(s => s + 1); };
  const handleBack = () => setActiveStep(s => s - 1);

  /* ── Submit handlers ───────────────────────────────────────────── */
  const mkSubmit = (type, data, docs, setSub, setRef, setSubmitted) => async () => {
    if (!validateStep()) return;
    setSub(true);
    try {
      const res = await api.post('/municipal/applications/submit', {
        application_type: type,
        application_data: data,
        documents: docs,
      });
      setRef(res.data?.reference_number || `${type.slice(0, 3).toUpperCase()}-${Date.now()}`);
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSub(false);
    }
  };

  const handlePotSubmit   = mkSubmit('road_damage_report',       potData,   potDocs,   setPotSubmitting,   setPotRef,   setPotSubmitted);
  const handleLightSubmit = mkSubmit('streetlight_complaint',    lightData, lightDocs, setLightSubmitting, setLightRef, setLightSubmitted);
  const handleDrainSubmit = mkSubmit('drain_manhole_complaint',  drainData, drainDocs, setDrainSubmitting, setDrainRef, setDrainSubmitted);
  const handleCutSubmit   = mkSubmit('road_cutting_permit',      cutData,   cutDocs,   setCutSubmitting,   setCutRef,   setCutSubmitted);

  const handleSubmit = () => {
    if (activeTab === 0)      handlePotSubmit();
    else if (activeTab === 1) handleLightSubmit();
    else if (activeTab === 2) handleDrainSubmit();
    else if (activeTab === 3) handleCutSubmit();
  };

  /* ── Success screen helper ─────────────────────────────────────── */
  const SuccessScreen = ({ refNo, message }) => (
    <Box textAlign="center" py={5}>
      <Typography variant="h6" fontWeight={700} gutterBottom>Submitted Successfully!</Typography>
      <Chip label={`Reference: ${refNo}`} color="success" sx={{ fontSize: 15, py: 2.5, px: 1, mb: 2 }} />
      <Typography color="text.secondary" mt={1}>{message}</Typography>
    </Box>
  );

  /* ── Step renders ──────────────────────────────────────────────── */

  /* Tab 0: Pothole / Road Damage */
  const renderPotStep = () => {
    if (potSubmitted)
      return <SuccessScreen refNo={potRef} message="Roads department will inspect within 3 working days." />;

    if (activeStep === 0) return (
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Full Name *" value={potData.fullName} onChange={updPot('fullName')} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Mobile *" value={potData.mobile} onChange={updPot('mobile')} inputProps={{ maxLength: 10 }} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={potData.email} onChange={updPot('email')} type="email" /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Aadhaar Number" value={potData.aadhaar} onChange={updPot('aadhaar')} inputProps={{ maxLength: 12 }} /></Grid>
        <Grid item xs={12}><TextField fullWidth label="Address / Area" value={potData.address} onChange={updPot('address')} multiline rows={2} /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Ward *</InputLabel>
            <Select value={potData.ward} label="Ward *" onChange={updPot('ward')}>
              {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    );

    if (activeStep === 1) return (
      <Grid container spacing={2.5}>
        <Grid item xs={12}>
          <TextField fullWidth label="Road Name / Location *" value={potData.roadName} onChange={updPot('roadName')} placeholder="Name of road/street with nearest landmark" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="GPS Coordinates" value={potData.gpsCoords} onChange={updPot('gpsCoords')} placeholder="Lat, Long if available" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Nearest Landmark *" value={potData.nearestLandmark} onChange={updPot('nearestLandmark')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Ward of Incident *</InputLabel>
            <Select value={potData.wardIncident} label="Ward of Incident *" onChange={updPot('wardIncident')}>
              {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Damage Type *</InputLabel>
            <Select value={potData.damageType} label="Damage Type *" onChange={updPot('damageType')}>
              {['Pothole', 'Road Crack', 'Damaged Footpath', 'Missing Speed Breaker',
                'Waterlogged Road', 'Road Cave-in', 'Missing Road Marking', 'Damaged Divider', 'Other']
                .map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Damage Severity *</InputLabel>
            <Select value={potData.damageSeverity} label="Damage Severity *" onChange={updPot('damageSeverity')}>
              <MenuItem value="Minor">Minor — surface cracks</MenuItem>
              <MenuItem value="Moderate">Moderate — shallow pothole</MenuItem>
              <MenuItem value="Serious">Serious — deep pothole &gt;15cm</MenuItem>
              <MenuItem value="Severe">Severe — large crater blocking lane</MenuItem>
              <MenuItem value="Dangerous">Dangerous — safety hazard, road collapse risk</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Approximate Size of Damage" value={potData.approxSize} onChange={updPot('approxSize')} placeholder='e.g., "2m x 1m, 30cm deep"' />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Road Classification</InputLabel>
            <Select value={potData.roadClassification} label="Road Classification" onChange={updPot('roadClassification')}>
              {['Main Road/Highway', 'Arterial Road', 'Internal Road/Lane', 'Service Road', 'Footpath Only']
                .map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Days Since Damage Noticed" value={potData.daysDamageNoticed} onChange={updPot('daysDamageNoticed')} type="number" inputProps={{ min: 0 }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Traffic Impact</InputLabel>
            <Select value={potData.trafficImpact} label="Traffic Impact" onChange={updPot('trafficImpact')}>
              {['No impact', 'Partial lane blocked', 'One lane blocked', 'Both lanes difficult', 'Road impassable']
                .map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Accident Occurred Due to This?</InputLabel>
            <Select value={potData.accidentOccurred} label="Accident Occurred Due to This?" onChange={updPot('accidentOccurred')}>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {potData.accidentOccurred === 'Yes' && (
          <Grid item xs={12}>
            <TextField fullWidth label="Accident Description" value={potData.accidentDescription} onChange={updPot('accidentDescription')} multiline rows={2} />
          </Grid>
        )}
        <Grid item xs={12}>
          <TextField fullWidth label="Additional Details" value={potData.additionalDetails} onChange={updPot('additionalDetails')} multiline rows={3} />
        </Grid>
      </Grid>
    );

    if (activeStep === 2) return (
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <DocUpload
            label="Photo of Road Damage *" name="road_damage_photo" required
            hint="Clear photo showing the extent of damage"
            docs={potDocs} onFileChange={handlePotDoc} onRemove={removePotDoc}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocUpload
            label="Additional Photo" name="road_damage_photo2"
            hint="Multiple angles or wider view"
            docs={potDocs} onFileChange={handlePotDoc} onRemove={removePotDoc}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocUpload
            label="Measurement / Scale Reference Photo" name="road_damage_scale"
            hint="Coin or ruler next to damage for scale"
            docs={potDocs} onFileChange={handlePotDoc} onRemove={removePotDoc}
          />
        </Grid>
      </Grid>
    );
    return null;
  };

  /* Tab 1: Streetlight Complaint */
  const renderLightStep = () => {
    if (lightSubmitted)
      return <SuccessScreen refNo={lightRef} message="Electrical team will repair within 48 hours." />;

    if (activeStep === 0) return (
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Full Name *" value={lightData.fullName} onChange={updLight('fullName')} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Mobile *" value={lightData.mobile} onChange={updLight('mobile')} inputProps={{ maxLength: 10 }} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={lightData.email} onChange={updLight('email')} type="email" /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Ward *</InputLabel>
            <Select value={lightData.ward} label="Ward *" onChange={updLight('ward')}>
              {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}><TextField fullWidth label="Address / Area" value={lightData.address} onChange={updLight('address')} multiline rows={2} /></Grid>
      </Grid>
    );

    if (activeStep === 1) return (
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Street / Road Name *" value={lightData.streetName} onChange={updLight('streetName')} /></Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Pole / Light ID Number" value={lightData.poleId} onChange={updLight('poleId')} placeholder="Found on pole nameplate, e.g. SL-2024-001" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Ward of Incident *</InputLabel>
            <Select value={lightData.wardIncident} label="Ward of Incident *" onChange={updLight('wardIncident')}>
              {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Nearest Landmark *" value={lightData.nearestLandmark} onChange={updLight('nearestLandmark')} /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Complaint Type *</InputLabel>
            <Select value={lightData.complaintType} label="Complaint Type *" onChange={updLight('complaintType')}>
              {['Light not working', 'Flickering light', 'Damaged light cover',
                'Hanging/snapped wire', 'Broken pole', 'Light on during day',
                'Very dim light', 'Multiple lights down', 'Other']
                .map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth label="Number of Non-working Lights" value={lightData.numNonWorking} onChange={updLight('numNonWorking')} type="number" inputProps={{ min: 1 }} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth label="Days Issue Persisting" value={lightData.daysPersisting} onChange={updLight('daysPersisting')} type="number" inputProps={{ min: 0 }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Area Affected</InputLabel>
            <Select value={lightData.areaAffected} label="Area Affected" onChange={updLight('areaAffected')}>
              {['Single streetlight', '50m stretch', '100m stretch', 'Entire street', 'Multiple streets']
                .map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Time Issue Noticed</InputLabel>
            <Select value={lightData.timeNoticed} label="Time Issue Noticed" onChange={updLight('timeNoticed')}>
              <MenuItem value="Nighttime">Only nighttime</MenuItem>
              <MenuItem value="24hrs">24 hours</MenuItem>
              <MenuItem value="ReportedBefore">Reported previously</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Safety Hazard?</InputLabel>
            <Select value={lightData.safetyHazard} label="Safety Hazard?" onChange={updLight('safetyHazard')}>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Additional Description" value={lightData.additionalDescription} onChange={updLight('additionalDescription')} multiline rows={2} />
        </Grid>
        {lightData.complaintType === 'Hanging/snapped wire' && (
          <Grid item xs={12}>
            <Alert severity="error">
              DANGER: Do not approach hanging/live wires! Contact electricity department immediately at 1912.
            </Alert>
          </Grid>
        )}
      </Grid>
    );

    if (activeStep === 2) return (
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <DocUpload
            label="Photo of Broken/Dark Streetlight *" name="light_photo" required
            hint="Clear photo of the non-working or damaged streetlight"
            docs={lightDocs} onFileChange={handleLightDoc} onRemove={removeLightDoc}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocUpload
            label="Photo of Damaged Pole or Wire" name="light_pole_photo"
            hint="If pole/wire damaged — important for safety assessment"
            docs={lightDocs} onFileChange={handleLightDoc} onRemove={removeLightDoc}
          />
        </Grid>
      </Grid>
    );
    return null;
  };

  /* Tab 2: Drain / Manhole Issue */
  const renderDrainStep = () => {
    if (drainSubmitted)
      return <SuccessScreen refNo={drainRef} message="Sanitation team will address within 24–48 hours." />;

    if (activeStep === 0) return (
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Full Name *" value={drainData.fullName} onChange={updDrain('fullName')} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Mobile *" value={drainData.mobile} onChange={updDrain('mobile')} inputProps={{ maxLength: 10 }} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={drainData.email} onChange={updDrain('email')} type="email" /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Ward *</InputLabel>
            <Select value={drainData.ward} label="Ward *" onChange={updDrain('ward')}>
              {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}><TextField fullWidth label="Address / Area" value={drainData.address} onChange={updDrain('address')} multiline rows={2} /></Grid>
      </Grid>
    );

    if (activeStep === 1) return (
      <Grid container spacing={2.5}>
        <Grid item xs={12}>
          <TextField fullWidth label="Drain/Manhole Location *" value={drainData.drainLocation} onChange={updDrain('drainLocation')} multiline rows={2} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Ward of Incident *</InputLabel>
            <Select value={drainData.wardIncident} label="Ward of Incident *" onChange={updDrain('wardIncident')}>
              {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Nearest Landmark *" value={drainData.nearestLandmark} onChange={updDrain('nearestLandmark')} /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Issue Type *</InputLabel>
            <Select value={drainData.issueType} label="Issue Type *" onChange={updDrain('issueType')}>
              {['Open manhole — no cover', 'Broken/damaged manhole cover', 'Blocked/overflowing drain',
                'Sewage overflow', 'Flooded road due to blocked drain', 'Foul smell from drain',
                'Broken drain wall', 'Manhole cover displaced', 'Other']
                .map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Is Road/Path Blocked?</InputLabel>
            <Select value={drainData.roadPathBlocked} label="Is Road/Path Blocked?" onChange={updDrain('roadPathBlocked')}>
              <MenuItem value="No">No</MenuItem>
              <MenuItem value="Partially">Partially</MenuItem>
              <MenuItem value="YesDifficult">Yes — passage difficult</MenuItem>
              <MenuItem value="YesBlocked">Yes — completely blocked</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Water Stagnation Depth</InputLabel>
            <Select value={drainData.waterStagnationDepth} label="Water Stagnation Depth" onChange={updDrain('waterStagnationDepth')}>
              <MenuItem value="None">No stagnation</MenuItem>
              <MenuItem value="Ankle">Ankle level</MenuItem>
              <MenuItem value="Knee">Knee level</MenuItem>
              <MenuItem value="Waist">Waist level</MenuItem>
              <MenuItem value="VeryDeep">Very deep — dangerous</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Manhole Cover Status</InputLabel>
            <Select value={drainData.manholeStatus} label="Manhole Cover Status" onChange={updDrain('manholeStatus')}>
              {['Cover present', 'Cover absent — open', 'Cover damaged/cracked', 'Cover displaced', 'No cover ever installed']
                .map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Risk to Public?</InputLabel>
            <Select value={drainData.riskToPublic} label="Risk to Public?" onChange={updDrain('riskToPublic')}>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {drainData.riskToPublic === 'Yes' && (
          <Grid item xs={12}>
            <TextField fullWidth label="Risk Description" value={drainData.riskDescription} onChange={updDrain('riskDescription')} multiline rows={2} />
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Duration of Issue</InputLabel>
            <Select value={drainData.durationOfIssue} label="Duration of Issue" onChange={updDrain('durationOfIssue')}>
              {['Just noticed', '1–3 days', '1 week', '2–4 weeks', 'More than a month']
                .map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Additional Description" value={drainData.additionalDescription} onChange={updDrain('additionalDescription')} multiline rows={3} />
        </Grid>
        {drainData.issueType === 'Open manhole — no cover' && (
          <Grid item xs={12}>
            <Alert severity="error">
              SAFETY: Open manhole is a life hazard. Warn nearby pedestrians.
              We will dispatch repair crew within 4 hours.
            </Alert>
          </Grid>
        )}
      </Grid>
    );

    if (activeStep === 2) return (
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <DocUpload
            label="Photo of Drain/Manhole Issue *" name="drain_photo" required
            hint="Clear photo showing the blockage, open manhole or overflow"
            docs={drainDocs} onFileChange={handleDrainDoc} onRemove={removeDrainDoc}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocUpload
            label="Photo of Water Stagnation / Flooding" name="drain_flood_photo"
            hint="If road is flooded, photo showing water level"
            docs={drainDocs} onFileChange={handleDrainDoc} onRemove={removeDrainDoc}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocUpload
            label="Additional Evidence Photo" name="drain_extra_photo"
            hint="Any other supporting photo of the issue"
            docs={drainDocs} onFileChange={handleDrainDoc} onRemove={removeDrainDoc}
          />
        </Grid>
      </Grid>
    );
    return null;
  };

  /* Tab 3: Road Cutting Permit */
  const renderCutStep = () => {
    if (cutSubmitted)
      return <SuccessScreen refNo={cutRef} message="Permit approval takes 7–10 working days. Security deposit may be required." />;

    if (activeStep === 0) return (
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Organisation / Applicant Name *" value={cutData.orgName} onChange={updCut('orgName')} /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Type of Organisation</InputLabel>
            <Select value={cutData.orgType} label="Type of Organisation" onChange={updCut('orgType')}>
              {['Government Department', 'PSU/Public Utility', 'Private Company', 'Individual Contractor', 'NGO', 'Other']
                .map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Contact Person Name *" value={cutData.contactPerson} onChange={updCut('contactPerson')} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Contact Mobile *" value={cutData.contactMobile} onChange={updCut('contactMobile')} inputProps={{ maxLength: 10 }} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Official Email *" value={cutData.officialEmail} onChange={updCut('officialEmail')} type="email" /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Aadhaar / PAN of Contact Person" value={cutData.aadhaarPan} onChange={updCut('aadhaarPan')} /></Grid>
        <Grid item xs={12}><TextField fullWidth label="Registered Address *" value={cutData.registeredAddress} onChange={updCut('registeredAddress')} multiline rows={2} /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Ward *</InputLabel>
            <Select value={cutData.ward} label="Ward *" onChange={updCut('ward')}>
              {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    );

    if (activeStep === 1) return (
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Road Name to be Cut *" value={cutData.roadName} onChange={updCut('roadName')} /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Ward of Cutting Location *</InputLabel>
            <Select value={cutData.wardCutting} label="Ward of Cutting Location *" onChange={updCut('wardCutting')}>
              {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Start Point (Landmark/Junction)" value={cutData.startPoint} onChange={updCut('startPoint')} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="End Point (Landmark/Junction)" value={cutData.endPoint} onChange={updCut('endPoint')} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="GPS Coordinates of Site" value={cutData.gpsCoords} onChange={updCut('gpsCoords')} placeholder="Lat, Long" /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Work Type *</InputLabel>
            <Select value={cutData.workType} label="Work Type *" onChange={updCut('workType')}>
              {['Water Pipeline Laying', 'Sewage Line Work', 'Gas Pipeline', 'Electricity Cable',
                'Telephone/Optical Fibre', 'Storm Water Drain', 'Road Widening', 'Footpath Repair', 'Other']
                .map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}><TextField fullWidth label="Length of Road to Cut (m) *" value={cutData.cutLength} onChange={updCut('cutLength')} type="number" inputProps={{ min: 0.1, step: 0.1 }} /></Grid>
        <Grid item xs={12} sm={4}><TextField fullWidth label="Width of Cut (m) *" value={cutData.cutWidth} onChange={updCut('cutWidth')} type="number" inputProps={{ min: 0.1, step: 0.1 }} /></Grid>
        <Grid item xs={12} sm={4}><TextField fullWidth label="Depth of Cut (m) *" value={cutData.cutDepth} onChange={updCut('cutDepth')} type="number" inputProps={{ min: 0.1, step: 0.1 }} /></Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Proposed Start Date *" type="date" value={cutData.proposedStart} onChange={updCut('proposedStart')} InputLabelProps={{ shrink: true }} inputProps={{ min: getTodayPlus(1) }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Proposed End Date *" type="date" value={cutData.proposedEnd} onChange={updCut('proposedEnd')} InputLabelProps={{ shrink: true }} inputProps={{ min: datePlusOne(cutData.proposedStart) }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Total Duration" value={daysBetween(cutData.proposedStart, cutData.proposedEnd)} InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }} helperText="Auto-calculated" />
        </Grid>
        <Grid item xs={12} sm={4}><TextField fullWidth label="Contractor / Agency Name *" value={cutData.contractorName} onChange={updCut('contractorName')} /></Grid>
        <Grid item xs={12} sm={4}><TextField fullWidth label="Contractor Mobile *" value={cutData.contractorMobile} onChange={updCut('contractorMobile')} inputProps={{ maxLength: 10 }} /></Grid>
        <Grid item xs={12} sm={4}><TextField fullWidth label="Contractor License Number" value={cutData.contractorLicense} onChange={updCut('contractorLicense')} /></Grid>
        <Grid item xs={12} sm={12}>
          <FormControl fullWidth>
            <InputLabel>Road Restoration Commitment *</InputLabel>
            <Select value={cutData.roadRestoration} label="Road Restoration Commitment *" onChange={updCut('roadRestoration')}>
              <MenuItem value="BitumenFull">Full reinstatement with bitumen</MenuItem>
              <MenuItem value="ConcreteFull">Full reinstatement with concrete</MenuItem>
              <MenuItem value="TempThenPerm">Temporary reinstatement then permanent</MenuItem>
              <MenuItem value="Contractor3yr">Contractor responsible for 3 years</MenuItem>
              <MenuItem value="Other">Other — specify</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Work Description *" value={cutData.workDescription} onChange={updCut('workDescription')} multiline rows={3} />
        </Grid>
      </Grid>
    );

    if (activeStep === 2) return (
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <DocUpload
            label="Departmental / Organisation Work Sanction Letter *"
            name="sanction_letter" required
            hint="Letter authorising the road cutting work"
            docs={cutDocs} onFileChange={handleCutDoc} onRemove={removeCutDoc}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocUpload
            label="Site Location Plan / Drawing *"
            name="site_plan" required
            hint="Showing exact stretch to be cut"
            docs={cutDocs} onFileChange={handleCutDoc} onRemove={removeCutDoc}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocUpload
            label="Indemnity Bond / Guarantee Letter"
            name="indemnity_bond"
            docs={cutDocs} onFileChange={handleCutDoc} onRemove={removeCutDoc}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocUpload
            label="Contractor Registration Certificate"
            name="contractor_cert"
            docs={cutDocs} onFileChange={handleCutDoc} onRemove={removeCutDoc}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocUpload
            label="No-Objection from Electricity Dept"
            name="electricity_noc"
            hint="If digging near electrical lines"
            docs={cutDocs} onFileChange={handleCutDoc} onRemove={removeCutDoc}
          />
        </Grid>
      </Grid>
    );

    if (activeStep === 3) return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>Application Summary</Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={1}>
            {[
              ['Organisation',       cutData.orgName],
              ['Contact Person',     cutData.contactPerson],
              ['Contact Mobile',     cutData.contactMobile],
              ['Official Email',     cutData.officialEmail],
              ['Ward',               cutData.ward],
              ['Road to be Cut',     cutData.roadName],
              ['Ward of Cutting',    cutData.wardCutting],
              ['Work Type',          cutData.workType],
              ['Cut Length',         cutData.cutLength ? `${cutData.cutLength} m` : '—'],
              ['Cut Width',          cutData.cutWidth  ? `${cutData.cutWidth} m`  : '—'],
              ['Cut Depth',          cutData.cutDepth  ? `${cutData.cutDepth} m`  : '—'],
              ['Proposed Start',     cutData.proposedStart],
              ['Proposed End',       cutData.proposedEnd],
              ['Duration',           daysBetween(cutData.proposedStart, cutData.proposedEnd)],
              ['Contractor',         cutData.contractorName],
              ['Road Restoration',   cutData.roadRestoration],
            ].map(([label, value]) => (
              <React.Fragment key={label}>
                <Grid item xs={5} sm={4}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
                </Grid>
                <Grid item xs={7} sm={8}>
                  <Typography variant="body2">{value || '—'}</Typography>
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="body2" color="text.secondary" fontWeight={500}>Uploaded Documents</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
            {Object.keys(cutDocs).map(key => (
              <Chip key={key} label={key.replace(/_/g, ' ')} size="small" color="success" variant="outlined" />
            ))}
          </Box>
        </Paper>
        <FormControlLabel
          control={
            <Switch
              checked={cutDeclaration}
              onChange={e => setCutDeclaration(e.target.checked)}
              color="primary"
            />
          }
          label="I declare that the information provided is correct and I accept responsibility for road restoration as committed. I understand that false information may result in rejection of the permit and legal action."
        />
      </Box>
    );
    return null;
  };

  /* ── Derived state ─────────────────────────────────────────────── */
  const getSteps = () => {
    if (activeTab === 0) return POT_STEPS;
    if (activeTab === 1) return LIGHT_STEPS;
    if (activeTab === 2) return DRAIN_STEPS;
    return CUT_STEPS;
  };
  const steps      = getSteps();
  const isLastStep = activeStep === steps.length - 1;
  const submitting =
    activeTab === 0 ? potSubmitting   :
    activeTab === 1 ? lightSubmitting :
    activeTab === 2 ? drainSubmitting : cutSubmitting;
  const isSubmitted =
    activeTab === 0 ? potSubmitted   :
    activeTab === 1 ? lightSubmitted :
    activeTab === 2 ? drainSubmitted : cutSubmitted;

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <Box>
      <DialogTitle sx={{ bgcolor: HEADER_COLOR, color: '#fff', py: 2 }}>
        <Typography variant="h6" fontWeight={700}>Municipal Roads &amp; Infrastructure</Typography>
        <Typography variant="body2" sx={{ opacity: 0.85 }}>
          Report road damage, streetlight issues, drain problems, or apply for road cutting permit
        </Typography>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fafafa' }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Pothole / Road Damage" />
          <Tab label="Streetlight Complaint" />
          <Tab label="Drain / Manhole Issue" />
          <Tab label="Road Cutting Permit" />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 3, minHeight: 440 }}>
        {!isSubmitted && (
          <Stepper activeStep={activeStep} sx={{ mb: 3 }} alternativeLabel>
            {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>
        )}

        {activeTab === 0 && renderPotStep()}
        {activeTab === 1 && renderLightStep()}
        {activeTab === 2 && renderDrainStep()}
        {activeTab === 3 && renderCutStep()}
      </DialogContent>

      {!isSubmitted && (
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleBack} variant="outlined" disabled={activeStep === 0}>Back</Button>
          <Box sx={{ flex: 1 }} />
          {!isLastStep ? (
            <Button
              onClick={handleNext} variant="contained"
              sx={{ bgcolor: HEADER_COLOR, '&:hover': { bgcolor: HOVER_COLOR } }}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit} variant="contained"
              disabled={submitting || (activeTab === 3 && !cutDeclaration)}
              sx={{ bgcolor: HEADER_COLOR, '&:hover': { bgcolor: HOVER_COLOR } }}
            >
              {submitting ? <CircularProgress size={22} color="inherit" /> : 'Submit Application'}
            </Button>
          )}
        </DialogActions>
      )}
    </Box>
  );
}
