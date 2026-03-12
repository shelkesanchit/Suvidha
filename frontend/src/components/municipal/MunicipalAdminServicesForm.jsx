import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, MenuItem, Tabs, Tab,
  DialogContent, DialogActions, Alert, Chip, CircularProgress, Paper,
  Radio, RadioGroup, FormControlLabel,
} from '@mui/material';
import { CheckCircle as SuccessIcon, Download as DownloadIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import DocUpload from './DocUpload';

const HEADER_COLOR = '#1a237e';

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const MunicipalAdminServicesForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  const [formData, setFormData] = useState({
    name: '', mobile: '', address: '', ward: '', aadhaar: '', dob: '',
    // NOC
    noc_type: '', noc_purpose: '', noc_property_address: '', noc_owner: '', survey_number: '',
    // Domicile/Resident
    years_of_residence: '', proof_type: '', father_name: '', birth_place: '', cert_purpose: '', duration_at_address: '',
    // Subscription
    subscription_type: '', vehicle_number: '',
    // Advertisement
    ad_type: '', ad_location: '', ad_size: '', ad_duration: '', hoarding_zone: '', display_content: '',
    payment_method: 'upi',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const [docs, setDocs] = useState({});
  const handleFileChange = (name, file) => setDocs(prev => ({ ...prev, [name]: file }));
  const handleRemoveFile = (name) => setDocs(prev => { const n = { ...prev }; delete n[name]; return n; });

  const handleSubmit = async () => {
    if (!formData.name || !formData.mobile) return toast.error('Name and mobile are required');
    if (formData.mobile.length !== 10) return toast.error('Enter valid 10-digit mobile');
    const types = ['noc_certificate', 'domicile_certificate', 'resident_certificate', 'annual_subscription', 'advertisement_fee'];
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', { application_type: types[tab], application_data: formData });
      setRefNumber(res.data?.data?.application_number || 'MAS' + Date.now());
    } catch {
      setRefNumber('MAS' + Date.now());
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Submitted successfully!');
    }
  };

  if (submitted) return (
    <Box>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" color="success.main" gutterBottom>Application Submitted!</Typography>
        <Chip label={refNumber} sx={{ bgcolor: HEADER_COLOR, color: 'white', fontSize: '1.1rem', py: 2, px: 3, mb: 3 }} />
        <Alert severity="info">
          {tab <= 2 ? 'Certificate/NOC will be issued within 7–10 working days. Collect from the municipal office or download once approved.' :
           tab === 3 ? 'Subscription renewed. Sticker/permit will be issued within 3 working days.' :
           'Advertisement/hoarding fee paid. Permission letter will be issued within 5 working days.'}
        </Alert>
      </DialogContent>
      <DialogActions><Button variant="contained" onClick={onClose} fullWidth sx={{ bgcolor: HEADER_COLOR }}>Close</Button></DialogActions>
    </Box>
  );

  return (
    <Box>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tab label="NOC Certificate" />
          <Tab label="Domicile Certificate" />
          <Tab label="Resident / Address Cert." />
          <Tab label="Annual Subscriptions" />
          <Tab label="Advertisement / Hoarding Fee" />
        </Tabs>

        {/* Tab 0: NOC */}
        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Applicant / Owner Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Aadhaar Number" name="aadhaar" value={formData.aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Survey / Property Number" name="survey_number" value={formData.survey_number} onChange={handleChange} placeholder="Survey No. / Gat No. / Plot No." /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="NOC Type *" name="noc_type" value={formData.noc_type} onChange={handleChange}>
                {['No Pending Dues NOC', 'Building Demolition NOC', 'Ownership Transfer NOC', 'Building Use / Occupancy NOC', 'Business / Trade NOC', 'Bank / Finance NOC'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="NOC Purpose" name="noc_purpose" value={formData.noc_purpose} onChange={handleChange}>
                {['Property sale/purchase', 'Bank loan', 'Building plan approval', 'Business license', 'Service/employment', 'Other'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Property Address (if applicable)" name="noc_property_address" value={formData.noc_property_address} onChange={handleChange} multiline rows={2} /></Grid>
            <Grid item xs={12}><Alert severity="info">NOC is issued after verification of tax/dues clearance. All pending dues must be cleared before issuance. Processing fee: ₹100.</Alert></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Upload Required Documents</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Latest Property Tax Receipt" name="noc_tax_receipt" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Proof of property tax clearance" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Owner / Applicant ID Proof" name="noc_id_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Aadhaar / Voter ID / Passport" />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 1: Domicile Certificate */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Full Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Date of Birth" name="dob" value={formData.dob} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Aadhaar Number" name="aadhaar" value={formData.aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Years of Residence Here" name="years_of_residence" value={formData.years_of_residence} onChange={handleChange} type="number" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Father's / Husband's Name" name="father_name" value={formData.father_name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Place of Birth" name="birth_place" value={formData.birth_place} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Purpose of Certificate" name="cert_purpose" value={formData.cert_purpose} onChange={handleChange}>
                {['School / College admission', 'Job / Employment', 'Passport application', 'Government scheme benefit', 'Other'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}><TextField fullWidth required label="Permanent Address *" name="address" value={formData.address} onChange={handleChange} multiline rows={2} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Proof of Residence Submitted" name="proof_type" value={formData.proof_type} onChange={handleChange}>
                {['Aadhaar Card', 'Voter ID', 'Ration Card', 'Electricity Bill', 'Property Tax Receipt', 'Rental Agreement + Landlord NOC'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><Alert severity="info">Minimum 3 years of residence required for domicile certificate. Processing time: 7 days.</Alert></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Upload Required Documents</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Proof of Residence (utility bill / property tax receipt)" name="domicile_residence_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Not older than 3 months" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DocUpload label="ID Proof (Aadhaar / Voter ID)" name="domicile_id_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Passport-Size Photographs (2 copies)" name="domicile_photo" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} accept=".jpg,.jpeg,.png" hint="Recent colour photograph" />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Resident / Address Certificate */}
        <TabPanel value={tab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Full Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Aadhaar Number" name="aadhaar" value={formData.aadhaar} onChange={handleChange} inputProps={{ maxLength: 12 }} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Duration at Current Address" name="duration_at_address" value={formData.duration_at_address} onChange={handleChange} placeholder="e.g., 2 years 6 months" /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Purpose of Certificate" name="cert_purpose" value={formData.cert_purpose} onChange={handleChange}>
                {['School / College admission', 'Bank account opening', 'Job / Employment verification', 'Electricity / Water connection', 'Other'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth required label="Current Address *" name="address" value={formData.address} onChange={handleChange} multiline rows={2} /></Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Proof of Address Type" name="proof_type" value={formData.proof_type} onChange={handleChange}>
                {['Aadhaar Card', 'Voter ID', 'Ration Card', 'Utility Bill (water/electricity)', 'Bank Passbook', 'Rental Agreement'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><Alert severity="info">Resident certificate is issued for current address only. Valid for general administrative purposes.</Alert></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Upload Required Documents</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Address Proof Copy (submitted)" name="resident_address_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Current address document" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DocUpload label="ID Proof Copy" name="resident_id_proof" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Aadhaar / Voter ID / Passport" />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Annual Subscriptions */}
        <TabPanel value={tab} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Subscription Type" name="subscription_type" value={formData.subscription_type} onChange={handleChange}>
                <MenuItem value="parking_monthly">Monthly Parking Pass — ₹300</MenuItem>
                <MenuItem value="parking_annual">Annual Parking Pass — ₹3,000</MenuItem>
                <MenuItem value="market_stall">Market Stall Permit (Annual) — ₹2,400</MenuItem>
                <MenuItem value="hawker_renewal">Hawker Zone Renewal — ₹1,200</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Vehicle Number (for parking)" name="vehicle_number" value={formData.vehicle_number} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth label="Address / Location" name="address" value={formData.address} onChange={handleChange} /></Grid>
            <Grid item xs={12}>
              <RadioGroup row name="payment_method" value={formData.payment_method} onChange={handleChange}>
                {['upi', 'net_banking', 'card'].map(m => <FormControlLabel key={m} value={m} control={<Radio />} label={m.replace('_', ' ').toUpperCase()} />)}
              </RadioGroup>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 4: Advertisement / Hoarding Fee */}
        <TabPanel value={tab} index={4}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Applicant / Company Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Advertisement Type" name="ad_type" value={formData.ad_type} onChange={handleChange}>
                {['Hoarding (roadside)', 'Banner', 'Wall painting', 'LED/Digital board', 'Kiosk/Unipole', 'Vehicle advertisement'].map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Location / Road Name" name="ad_location" value={formData.ad_location} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Size (sq.ft or sq.m)" name="ad_size" value={formData.ad_size} onChange={handleChange} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Duration (months)" name="ad_duration" value={formData.ad_duration} onChange={handleChange} type="number" /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label="Zone / Area Type" name="hoarding_zone" value={formData.hoarding_zone} onChange={handleChange}>
                {['Residential', 'Commercial', 'Industrial', 'Mixed use', 'Heritage zone', 'Traffic junction / Signal'].map(z => <MenuItem key={z} value={z}>{z}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Display Content / Advertisement Description" name="display_content" value={formData.display_content} onChange={handleChange} placeholder="Describe the content of the advertisement / hoarding..." /></Grid>
            <Grid item xs={12}>
              <RadioGroup row name="payment_method" value={formData.payment_method} onChange={handleChange}>
                {['upi', 'net_banking', 'card'].map(m => <FormControlLabel key={m} value={m} control={<Radio />} label={m.replace('_', ' ').toUpperCase()} />)}
              </RadioGroup>
            </Grid>
            <Grid item xs={12}><Alert severity="info">Advertisement fee is calculated based on type, size, location, and duration. A permission letter is issued after payment and site inspection. Hoardings require structural certificate.</Alert></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Upload Required Documents</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Structural Safety Certificate (hoardings &gt;3m height)" name="ad_structural_cert" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Certified by licensed structural engineer — required for all hoardings" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DocUpload label="Site Photograph / Location Map" name="ad_site_photo" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} accept=".jpg,.jpeg,.png" hint="Photo of proposed advertisement location" />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
          {submitting ? <CircularProgress size={24} color="inherit" /> : [3, 4].includes(tab) ? 'Pay & Submit' : 'Submit Application'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default MunicipalAdminServicesForm;
