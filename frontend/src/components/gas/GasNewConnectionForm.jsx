import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Chip,
  CircularProgress,
} from '@mui/material';
import { CheckCircle as SuccessIcon, CloudUpload, CameraAlt, LocalFireDepartment, Propane } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';

// =============================================================================
// GAS NEW CONNECTION FORM - Supports both PNG and LPG
// =============================================================================
// PNG Flow (Piped Natural Gas):
//   Step 1: Select Provider (Mahanagar Gas, Gujarat Gas, IGL, etc.)
//   Step 2: Property Details (Type, Ownership)
//   Step 3: KYC Details (Name, Mobile-OTP, Aadhaar, Address)
//   Step 4: Documents Upload
//   Step 5: Review & Submit
//
// LPG Flow (Cylinder Gas):
//   Step 1: Connection Type (Domestic / PMUY / Commercial)
//   Step 2: Provider & Distributor Selection (Indane/Bharat/HP + PIN-based search)
//   Step 3: KYC Details
//   Step 4: Documents Upload
//   Step 5: Review & Submit
// =============================================================================

const pngSteps = ['PNG Provider', 'Property Details', 'KYC Details', 'Documents', 'Review & Submit'];
const lpgSteps = ['Connection Type', 'Provider & Distributor', 'KYC Details', 'Documents', 'Review & Submit'];

// LPG connection types
const lpgConnectionTypes = [
  { value: 'domestic', label: 'Domestic Connection', description: 'Regular LPG connection for household use', icon: '🏠', color: '#1976d2' },
  { value: 'pmuy', label: 'PMUY (Ujjwala Yojana)', description: 'Pradhan Mantri Ujjwala Yojana - subsidized connection for BPL families', icon: '🇮🇳', color: '#ff6b35' },
  { value: 'commercial', label: 'Commercial Connection', description: 'LPG connection for business / commercial establishments', icon: '🏢', color: '#7b1fa2' },
];

// LPG Providers (OMCs)
const lpgProviders = [
  { value: 'indane', label: 'Indane Gas', company: 'Indian Oil Corporation', color: '#e65100', logo: '🔶' },
  { value: 'bharat', label: 'Bharat Gas', company: 'Bharat Petroleum', color: '#1565c0', logo: '🔷' },
  { value: 'hp', label: 'HP Gas', company: 'Hindustan Petroleum', color: '#2e7d32', logo: '🟩' },
];

// PNG Providers (varies by city)
const pngProviders = [
  { value: 'mgl', label: 'Mahanagar Gas Limited', area: 'Mumbai, Thane, Navi Mumbai', color: '#1565c0' },
  { value: 'igl', label: 'Indraprastha Gas Limited', area: 'Delhi NCR', color: '#e65100' },
  { value: 'adani', label: 'Adani Total Gas', area: 'Multiple cities', color: '#2e7d32' },
  { value: 'gujgas', label: 'Gujarat Gas Limited', area: 'Gujarat', color: '#7b1fa2' },
  { value: 'other', label: 'Other Provider', area: 'Enter manually', color: '#616161' },
];

// Property types for PNG (must match database ENUM: domestic, commercial, industrial, institutional)
const propertyTypes = [
  { value: 'domestic', label: 'Residential (House / Apartment / Flat)' },
  { value: 'commercial', label: 'Commercial Establishment' },
  { value: 'industrial', label: 'Industrial Premises' },
  { value: 'institutional', label: 'Institutional (School, Hospital, etc.)' },
];

const GasNewConnectionForm = ({ onClose, gasType = 'lpg' }) => {
  const isPNG = gasType === 'png';
  const steps = isPNG ? pngSteps : lpgSteps;
  
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [distributors, setDistributors] = useState([]);
  const [loadingDistributors, setLoadingDistributors] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [formData, setFormData] = useState({
    // Common fields
    applicant_name: '',
    mobile: '',
    otp: '',
    aadhaar_number: '',
    address: '',
    
    // PNG specific
    png_provider: '',
    png_provider_other: '',
    property_type: '',
    ownership_type: 'owned', // owned, rented
    
    // LPG specific
    connection_type: '',
    lpg_provider: '', // indane, bharat, hp
    pin_code: '',
    distributor_id: '',
    distributor_name: '',
    bank_account_last4: '',
    business_name: '',
    gst_number: '',
    trade_license: '',
    contact_number: '',
    cylinder_type: 'commercial_19kg',
    
    // Documents
    photo: null,
    aadhaar_doc: null,
    property_doc: null,
    ownership_doc: null,
    fire_noc_doc: null,
    agreed_to_terms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error('File size should not exceed 5MB'); return; }
      setFormData({ ...formData, [fieldName]: file });
      toast.success(`${file.name} uploaded`);
    }
  };

  // OTP Functions
  const handleSendOTP = async () => {
    if (formData.mobile.length !== 10) { toast.error('Enter valid 10-digit mobile number'); return; }
    try {
      // Simulate OTP send (in production, call API)
      toast.success(`OTP sent to ${formData.mobile}`);
      setOtpSent(true);
    } catch {
      toast.error('Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (formData.otp.length !== 6) { toast.error('Enter valid 6-digit OTP'); return; }
    try {
      // Simulate OTP verification (in production, call API)
      if (formData.otp === '123456') { // Demo OTP
        toast.success('Mobile verified successfully!');
        setOtpVerified(true);
      } else {
        toast.error('Invalid OTP. Demo OTP: 123456');
      }
    } catch {
      toast.error('Failed to verify OTP');
    }
  };

  const handlePinCodeSearch = async () => {
    if (formData.pin_code.length !== 6) { toast.error('Enter valid 6-digit PIN code'); return; }
    if (!formData.lpg_provider) { toast.error('Please select LPG provider first'); return; }
    
    setLoadingDistributors(true);
    try {
      const providerLabel = lpgProviders.find(p => p.value === formData.lpg_provider)?.label || 'Gas';
      const sampleDistributors = [
        { id: `${formData.lpg_provider.toUpperCase()}-D001`, name: `${providerLabel} - Main Branch`, area: `Area near ${formData.pin_code}` },
        { id: `${formData.lpg_provider.toUpperCase()}-D002`, name: `${providerLabel} - City Center`, area: `Area near ${formData.pin_code}` },
        { id: `${formData.lpg_provider.toUpperCase()}-D003`, name: `${providerLabel} - South Branch`, area: `Area near ${formData.pin_code}` },
      ];
      setDistributors(sampleDistributors);
      toast.success(`${sampleDistributors.length} ${providerLabel} distributors found`);
    } catch { toast.error('Failed to fetch distributors'); }
    finally { setLoadingDistributors(false); }
  };

  const validateStep = () => {
    // PNG Flow Validation
    if (isPNG) {
      switch (activeStep) {
        case 0: // PNG Provider
          if (!formData.png_provider) { toast.error('Please select a PNG provider'); return false; }
          if (formData.png_provider === 'other' && !formData.png_provider_other) { toast.error('Please enter provider name'); return false; }
          return true;
        case 1: // Property Details
          if (!formData.property_type) { toast.error('Please select property type'); return false; }
          return true;
        case 2: // KYC
          if (!formData.applicant_name) { toast.error('Please enter applicant name'); return false; }
          if (!formData.mobile || formData.mobile.length !== 10) { toast.error('Enter valid 10-digit mobile number'); return false; }
          if (!otpVerified) { toast.error('Please verify your mobile number with OTP'); return false; }
          if (!formData.aadhaar_number || formData.aadhaar_number.length !== 12) { toast.error('Enter valid 12-digit Aadhaar number'); return false; }
          if (!formData.address) { toast.error('Please enter installation address'); return false; }
          return true;
        case 3: // Documents
          if (!formData.aadhaar_doc) { toast.error('Please upload Aadhaar card'); return false; }
          if (formData.ownership_type === 'rented' && !formData.ownership_doc) { toast.error('Please upload NOC/Rent agreement'); return false; }
          return true;
        case 4: // Review
          if (!formData.agreed_to_terms) { toast.error('Please accept the declaration'); return false; }
          return true;
        default: return true;
      }
    }
    
    // LPG Flow Validation
    switch (activeStep) {
      case 0: // Connection Type
        if (!formData.connection_type) { toast.error('Please select a connection type'); return false; }
        return true;
      case 1: // Provider & Distributor
        if (!formData.lpg_provider) { toast.error('Please select an LPG provider'); return false; }
        if (!formData.pin_code || formData.pin_code.length !== 6) { toast.error('Enter valid 6-digit PIN code'); return false; }
        if (!formData.distributor_id) { toast.error('Please select a distributor'); return false; }
        return true;
      case 2: // KYC
        if (formData.connection_type === 'commercial') {
          if (!formData.business_name || !formData.contact_number || !formData.address) { toast.error('Please fill all mandatory fields'); return false; }
          if (formData.contact_number.length !== 10) { toast.error('Enter valid 10-digit contact number'); return false; }
          if (!formData.gst_number && !formData.trade_license) { toast.error('GST Number or Trade License is required'); return false; }
        } else {
          if (!formData.aadhaar_number || !formData.mobile || !formData.applicant_name || !formData.address) { toast.error('Please fill all mandatory fields'); return false; }
          if (formData.aadhaar_number.length !== 12) { toast.error('Enter valid 12-digit Aadhaar number'); return false; }
          if (formData.mobile.length !== 10) { toast.error('Enter valid 10-digit mobile number'); return false; }
        }
        return true;
      case 3: // Documents
        if (!formData.aadhaar_doc) { toast.error('Please upload ID proof document'); return false; }
        return true;
      case 4: // Review
        if (!formData.agreed_to_terms) { toast.error('Please accept the declaration'); return false; }
        return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (activeStep === steps.length - 1) handleSubmit();
      else setActiveStep((prev) => prev + 1);
    }
  };
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      let application_data;
      
      if (isPNG) {
        // PNG Application Data
        application_data = {
          gas_type: 'png',
          png_provider: formData.png_provider === 'other' ? formData.png_provider_other : formData.png_provider,
          png_provider_name: formData.png_provider === 'other' 
            ? formData.png_provider_other 
            : pngProviders.find(p => p.value === formData.png_provider)?.label,
          property_type: formData.property_type,
          ownership_type: formData.ownership_type,
          applicant_name: formData.applicant_name,
          full_name: formData.applicant_name,
          mobile: formData.mobile,
          aadhaar_number: formData.aadhaar_number,
          address: formData.address,
        };
      } else {
        // LPG Application Data
        application_data = {
          gas_type: 'lpg',
          connection_type: formData.connection_type,
          lpg_provider: formData.lpg_provider,
          lpg_provider_name: lpgProviders.find(p => p.value === formData.lpg_provider)?.label,
          pin_code: formData.pin_code,
          distributor_id: formData.distributor_id,
          distributor_name: formData.distributor_name,
          aadhaar_number: formData.aadhaar_number,
          mobile: formData.mobile || formData.contact_number,
          applicant_name: formData.applicant_name || formData.business_name,
          full_name: formData.applicant_name || formData.business_name,
          address: formData.address,
          bank_account_last4: formData.bank_account_last4,
          business_name: formData.business_name,
          gst_number: formData.gst_number,
          trade_license: formData.trade_license,
          cylinder_type: formData.connection_type === 'commercial' ? formData.cylinder_type : 'domestic_14.2kg',
          property_type: formData.connection_type === 'commercial' ? 'commercial' : 'domestic',
        };
      }
      
      const response = await api.post('/gas/applications/submit', { application_type: 'new_connection', application_data });
      if (response.data?.data?.application_number) {
        const appNumber = response.data.data.application_number;
        setApplicationNumber(appNumber);
        
        // Upload documents after application is submitted
        const documentsToUpload = [
          { file: formData.aadhaar_doc, type: 'aadhaar_doc' },
          { file: formData.property_doc, type: 'property_doc' },
          { file: formData.ownership_doc, type: 'ownership_doc' },
          { file: formData.photo, type: 'photo' },
          { file: formData.fire_noc_doc, type: 'fire_noc_doc' },
        ].filter(doc => doc.file);

        if (documentsToUpload.length > 0) {
          try {
            for (const doc of documentsToUpload) {
              const formDataUpload = new FormData();
              formDataUpload.append('document', doc.file);
              formDataUpload.append('application_number', appNumber);
              formDataUpload.append('documentType', doc.type);
              
              await api.post('/gas/applications/upload-document', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
            }
            toast.success('Documents uploaded successfully!');
          } catch (docError) {
            console.error('Document upload error:', docError);
            toast.error('Application submitted but document upload failed. Please upload documents later.');
          }
        }
        
        setSubmitted(true);
        toast.success('Application submitted successfully!');
      } else { throw new Error('Failed to get application number'); }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <Box>
        <DialogTitle sx={{ bgcolor: isPNG ? '#1565c0' : '#f57c00', color: 'white' }}>
          <Typography component="span" variant="body1" fontWeight={600}>
            {isPNG ? '🔵 PNG Connection Application' : '🔥 LPG Connection Application'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" color="success.main" gutterBottom>Application Submitted!</Typography>
          <Typography variant="h6" gutterBottom>Application Number:</Typography>
          <Chip label={applicationNumber} color={isPNG ? 'primary' : 'warning'} sx={{ fontSize: '1.5rem', py: 3, px: 4, mb: 3 }} />
          <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
            <Typography variant="body2">
              • Save your application number for tracking<br />
              • Document verification: 3-5 working days<br />
              {isPNG ? (
                <>
                  • Site survey will be scheduled<br />
                  • PNG pipeline connection within 15-30 days<br />
                </>
              ) : (
                <>
                  • Application forwarded to OMC for processing<br />
                  • De-duplication & eligibility checks done by authority<br />
                </>
              )}
              • SMS updates on: {formData.mobile || formData.contact_number}
            </Typography>
          </Alert>
          <Alert severity="warning" sx={{ mt: 2, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Note:</strong> This kiosk captures basic details only. Final verification
              {isPNG ? ' and connection approval are handled by the PNG provider.' : ', subsidy eligibility, and connection approval are handled by the OMC.'}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose} fullWidth color={isPNG ? 'primary' : 'warning'}>Close</Button>
        </DialogActions>
      </Box>
    );
  }

  const renderStepContent = () => {
    // =========================================================================
    // PNG FLOW
    // =========================================================================
    if (isPNG) {
      switch (activeStep) {
        case 0: // PNG Provider Selection
          return (
            <Box>
              <Typography variant="h6" gutterBottom>Select PNG Provider</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose your area's PNG (Piped Natural Gas) provider
              </Typography>
              {pngProviders.map((provider) => (
                <Box key={provider.value} sx={{
                  border: '2px solid', borderColor: formData.png_provider === provider.value ? 'primary.main' : 'grey.300',
                  borderRadius: 2, p: 2.5, mb: 2, cursor: 'pointer',
                  bgcolor: formData.png_provider === provider.value ? '#e3f2fd' : 'white',
                  transition: 'all 0.2s', '&:hover': { borderColor: 'primary.light' },
                }} onClick={() => setFormData({ ...formData, png_provider: provider.value })}>
                  <FormControlLabel value={provider.value}
                    control={<Radio checked={formData.png_provider === provider.value} color="primary" />}
                    label={<Box>
                      <Typography fontWeight="bold" fontSize="1.1rem">{provider.label}</Typography>
                      <Typography variant="body2" color="text.secondary">{provider.area}</Typography>
                    </Box>}
                  />
                </Box>
              ))}
              {formData.png_provider === 'other' && (
                <TextField fullWidth label="Enter Provider Name" name="png_provider_other"
                  value={formData.png_provider_other} onChange={handleChange} sx={{ mt: 2 }} />
              )}
            </Box>
          );
        
        case 1: // Property Details
          return (
            <Box>
              <Typography variant="h6" gutterBottom>Property Details</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Provide details about the property where PNG connection is required
              </Typography>
              
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Property Type *</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {propertyTypes.map((type) => (
                  <Grid item xs={6} key={type.value}>
                    <Box sx={{
                      border: '2px solid', borderColor: formData.property_type === type.value ? 'primary.main' : 'grey.300',
                      borderRadius: 2, p: 2, cursor: 'pointer', textAlign: 'center',
                      bgcolor: formData.property_type === type.value ? '#e3f2fd' : 'white',
                      '&:hover': { borderColor: 'primary.light' },
                    }} onClick={() => setFormData({ ...formData, property_type: type.value })}>
                      <Radio checked={formData.property_type === type.value} color="primary" />
                      <Typography variant="body2">{type.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Ownership Status</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{
                  border: '2px solid', borderColor: formData.ownership_type === 'owned' ? 'primary.main' : 'grey.300',
                  borderRadius: 2, p: 2, flex: 1, cursor: 'pointer', textAlign: 'center',
                  bgcolor: formData.ownership_type === 'owned' ? '#e3f2fd' : 'white',
                }} onClick={() => setFormData({ ...formData, ownership_type: 'owned' })}>
                  <Radio checked={formData.ownership_type === 'owned'} color="primary" />
                  <Typography>Owned Property</Typography>
                </Box>
                <Box sx={{
                  border: '2px solid', borderColor: formData.ownership_type === 'rented' ? 'primary.main' : 'grey.300',
                  borderRadius: 2, p: 2, flex: 1, cursor: 'pointer', textAlign: 'center',
                  bgcolor: formData.ownership_type === 'rented' ? '#e3f2fd' : 'white',
                }} onClick={() => setFormData({ ...formData, ownership_type: 'rented' })}>
                  <Radio checked={formData.ownership_type === 'rented'} color="primary" />
                  <Typography>Rented Property</Typography>
                </Box>
              </Box>
              {formData.ownership_type === 'rented' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  landlord's NOC or Rent Agreement will be required in the documents section.
                </Alert>
              )}
            </Box>
          );
        
        case 2: // PNG KYC
          return (
            <Box>
              <Typography variant="h6" gutterBottom>Applicant Details</Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Mobile verification via OTP is mandatory. Demo OTP: <strong>123456</strong>
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth required label="Applicant Name / आवेदक का नाम" name="applicant_name"
                    value={formData.applicant_name} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label="Mobile Number" name="mobile"
                    value={formData.mobile} onChange={handleChange}
                    inputProps={{ maxLength: 10 }} disabled={otpVerified}
                    helperText={otpVerified ? '✓ Verified' : 'OTP will be sent'} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  {!otpSent ? (
                    <Button fullWidth variant="contained" color="primary" onClick={handleSendOTP}
                      disabled={formData.mobile.length !== 10} sx={{ height: '56px' }}>
                      Send OTP
                    </Button>
                  ) : !otpVerified ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField fullWidth label="Enter OTP" name="otp"
                        value={formData.otp} onChange={handleChange}
                        inputProps={{ maxLength: 6 }} />
                      <Button variant="contained" color="primary" onClick={handleVerifyOTP}>Verify</Button>
                    </Box>
                  ) : (
                    <Alert severity="success">Mobile Verified ✓</Alert>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label="Aadhaar Number / आधार नंबर" name="aadhaar_number"
                    value={formData.aadhaar_number} onChange={handleChange}
                    inputProps={{ maxLength: 12 }} helperText="12-digit Aadhaar number" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth required label="Installation Address / पता" name="address"
                    value={formData.address} onChange={handleChange} multiline rows={3}
                    helperText="Complete address where PNG connection is required" />
                </Grid>
              </Grid>
            </Box>
          );
        
        case 3: // PNG Documents
          return (
            <Box>
              <Typography variant="h6" gutterBottom>Upload Documents</Typography>
              <Alert severity="info" sx={{ mb: 3 }}>Upload clear scanned copies or photos. Max file size: 5MB each.</Alert>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                    <CloudUpload sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
                    <Typography variant="subtitle1" gutterBottom>Aadhaar Card *</Typography>
                    <input accept="image/*,.pdf" type="file" id="aadhaar-upload" hidden onChange={(e) => handleFileChange(e, 'aadhaar_doc')} />
                    <label htmlFor="aadhaar-upload">
                      <Button variant="outlined" component="span" color="primary">
                        {formData.aadhaar_doc ? formData.aadhaar_doc.name : 'Choose File'}
                      </Button>
                    </label>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                    <CloudUpload sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
                    <Typography variant="subtitle1" gutterBottom>Property Ownership Proof</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      {formData.ownership_type === 'rented' ? 'NOC from landlord / Rent Agreement *' : 'Property document (optional)'}
                    </Typography>
                    <input accept="image/*,.pdf" type="file" id="ownership-upload" hidden onChange={(e) => handleFileChange(e, 'ownership_doc')} />
                    <label htmlFor="ownership-upload">
                      <Button variant="outlined" component="span" color="primary">
                        {formData.ownership_doc ? formData.ownership_doc.name : 'Choose File'}
                      </Button>
                    </label>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                    <CameraAlt sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
                    <Typography variant="subtitle1" gutterBottom>Applicant Photo</Typography>
                    <input accept="image/*" type="file" id="photo-capture" hidden capture="user" onChange={(e) => handleFileChange(e, 'photo')} />
                    <label htmlFor="photo-capture">
                      <Button variant="outlined" component="span" color="primary">
                        {formData.photo ? formData.photo.name : 'Capture Photo'}
                      </Button>
                    </label>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          );
        
        case 4: // PNG Review
          return (
            <Box>
              <Typography variant="h6" gutterBottom>Review Your Application</Typography>
              <Box sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 2, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>PNG Provider</Typography>
                <Typography>
                  {formData.png_provider === 'other' ? formData.png_provider_other : pngProviders.find(p => p.value === formData.png_provider)?.label}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Property Details</Typography>
                <Typography>{propertyTypes.find(t => t.value === formData.property_type)?.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.ownership_type === 'owned' ? 'Owned Property' : 'Rented Property'}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Applicant Name</Typography><Typography fontWeight="bold">{formData.applicant_name}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Mobile</Typography><Typography fontWeight="bold">{formData.mobile} ✓</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Aadhaar</Typography><Typography fontWeight="bold">XXXX-XXXX-{formData.aadhaar_number.slice(-4)}</Typography></Grid>
                <Grid item xs={12}><Typography variant="body2" color="text.secondary">Installation Address</Typography><Typography fontWeight="bold">{formData.address}</Typography></Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2"><strong>Next Steps:</strong></Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
                  <li>Document verification by PNG provider</li>
                  <li>Site survey scheduling</li>
                  <li>Pipeline installation</li>
                  <li>Safety inspection & meter installation</li>
                </Typography>
              </Alert>
              <FormControlLabel
                control={<Radio checked={formData.agreed_to_terms} onChange={(e) => setFormData({ ...formData, agreed_to_terms: e.target.checked })} color="primary" />}
                label="I declare that all information provided is true and correct. I understand that false information may result in rejection."
              />
            </Box>
          );
        
        default: return null;
      }
    }
    
    // =========================================================================
    // LPG FLOW
    // =========================================================================
    switch (activeStep) {
      case 0: // Connection Type
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Select Connection Type</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose the type of LPG connection you want to apply for
            </Typography>
            {lpgConnectionTypes.map((type) => (
              <Box key={type.value} sx={{
                border: '2px solid', borderColor: formData.connection_type === type.value ? type.color : 'grey.300',
                borderRadius: 2, p: 2.5, mb: 2, cursor: 'pointer',
                bgcolor: formData.connection_type === type.value ? `${type.color}10` : 'white',
                transition: 'all 0.2s', '&:hover': { borderColor: type.color },
              }} onClick={() => setFormData({ ...formData, connection_type: type.value })}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography fontSize="2.5rem">{type.icon}</Typography>
                  <Box>
                    <FormControlLabel value={type.value}
                      control={<Radio checked={formData.connection_type === type.value} color="warning" />}
                      label={<Box>
                        <Typography fontWeight="bold" fontSize="1.1rem">{type.label}</Typography>
                        <Typography variant="body2" color="text.secondary">{type.description}</Typography>
                      </Box>}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        );

      case 1: // Provider & Distributor Selection
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Select LPG Provider (OMC)</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose your preferred LPG provider
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {lpgProviders.map((provider) => (
                <Grid item xs={4} key={provider.value}>
                  <Box sx={{
                    border: '3px solid', borderColor: formData.lpg_provider === provider.value ? provider.color : 'grey.300',
                    borderRadius: 2, p: 2, cursor: 'pointer', textAlign: 'center',
                    bgcolor: formData.lpg_provider === provider.value ? `${provider.color}15` : 'white',
                    transition: 'all 0.2s', '&:hover': { borderColor: provider.color },
                  }} onClick={() => { setFormData({ ...formData, lpg_provider: provider.value }); setDistributors([]); }}>
                    <Typography fontSize="2rem" sx={{ mb: 1 }}>{provider.logo}</Typography>
                    <Typography fontWeight="bold">{provider.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{provider.company}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            
            {formData.lpg_provider && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Find Distributor</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter your PIN code to find nearby {lpgProviders.find(p => p.value === formData.lpg_provider)?.label} distributors
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={8}>
                    <TextField fullWidth label="PIN Code / पिन कोड" name="pin_code"
                      value={formData.pin_code} onChange={handleChange}
                      inputProps={{ maxLength: 6 }} placeholder="e.g., 422001" />
                  </Grid>
                  <Grid item xs={4}>
                    <Button fullWidth variant="contained" color="warning" onClick={handlePinCodeSearch}
                      disabled={loadingDistributors} sx={{ height: '100%' }}>
                      {loadingDistributors ? <CircularProgress size={24} /> : 'Search'}
                    </Button>
                  </Grid>
                </Grid>
                {distributors.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Available Distributors</Typography>
                    {distributors.map((dist) => (
                      <Box key={dist.id} sx={{
                        border: '2px solid', borderColor: formData.distributor_id === dist.id ? 'warning.main' : 'grey.300',
                        borderRadius: 2, p: 2, mb: 1.5, cursor: 'pointer',
                        bgcolor: formData.distributor_id === dist.id ? '#fff3e0' : 'white',
                        '&:hover': { borderColor: 'warning.light' },
                      }} onClick={() => setFormData({ ...formData, distributor_id: dist.id, distributor_name: dist.name })}>
                        <FormControlLabel value={dist.id}
                          control={<Radio checked={formData.distributor_id === dist.id} color="warning" />}
                          label={<Box>
                            <Typography fontWeight="bold">{dist.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{dist.area}</Typography>
                          </Box>}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        );

      case 2: // KYC
        if (formData.connection_type === 'commercial') {
          return (
            <Box>
              <Typography variant="h6" gutterBottom>Business / Commercial Details</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Fire NOC upload is optional. Validation happens later by the authority.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth required label="Business Name / व्यापार का नाम" name="business_name"
                    value={formData.business_name} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="GST Number" name="gst_number"
                    value={formData.gst_number} onChange={handleChange} helperText="GST or Trade License required" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Shop Act / Trade License Number" name="trade_license"
                    value={formData.trade_license} onChange={handleChange} helperText="GST or Trade License required" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth required label="Business Address / पता" name="address"
                    value={formData.address} onChange={handleChange} multiline rows={2} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label="Contact Number" name="contact_number"
                    value={formData.contact_number} onChange={handleChange} inputProps={{ maxLength: 10 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Cylinder Type" name="cylinder_type"
                    value={formData.cylinder_type} onChange={handleChange}>
                    <MenuItem value="commercial_19kg">19 kg Commercial</MenuItem>
                    <MenuItem value="commercial_47.5kg">47.5 kg Commercial</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          );
        }
        // Domestic / PMUY
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {formData.connection_type === 'pmuy' ? 'PMUY (Ujjwala) - Applicant KYC' : 'Domestic - Applicant KYC'}
            </Typography>
            {formData.connection_type === 'pmuy' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>PMUY Note:</strong> Income eligibility, BPL verification, and subsidy checks
                are handled by the OMC backend. The kiosk collects basic KYC only.
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Aadhaar Number / आधार नंबर (Mandatory)" name="aadhaar_number"
                  value={formData.aadhaar_number} onChange={handleChange}
                  inputProps={{ maxLength: 12 }} helperText="12-digit Aadhaar is mandatory" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Mobile Number (OTP-based)" name="mobile"
                  value={formData.mobile} onChange={handleChange}
                  inputProps={{ maxLength: 10 }} helperText="OTP will be sent for verification" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required label="Applicant Name / आवेदक का नाम" name="applicant_name"
                  value={formData.applicant_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required label="Delivery Address / डिलीवरी पता" name="address"
                  value={formData.address} onChange={handleChange} multiline rows={2}
                  helperText="Address where cylinder will be delivered" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Bank Account (Last 4 digits only)" name="bank_account_last4"
                  value={formData.bank_account_last4} onChange={handleChange}
                  inputProps={{ maxLength: 4 }} helperText="For subsidy transfer verification" />
              </Grid>
            </Grid>
          </Box>
        );

      case 3: // Documents
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Upload Documents & Photo</Typography>
            <Alert severity="info" sx={{ mb: 3 }}>Upload clear scanned copies or photos. Max file size: 5MB each.</Alert>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                  <CloudUpload sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    {formData.connection_type === 'commercial' ? 'Business Registration / GST Certificate *' : 'Aadhaar Card *'}
                  </Typography>
                  <input accept="image/*,.pdf" type="file" id="aadhaar-upload" hidden onChange={(e) => handleFileChange(e, 'aadhaar_doc')} />
                  <label htmlFor="aadhaar-upload">
                    <Button variant="outlined" component="span" color="warning">
                      {formData.aadhaar_doc ? formData.aadhaar_doc.name : 'Choose File'}
                    </Button>
                  </label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                  <CloudUpload sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>Address Proof (Optional)</Typography>
                  <input accept="image/*,.pdf" type="file" id="property-upload" hidden onChange={(e) => handleFileChange(e, 'property_doc')} />
                  <label htmlFor="property-upload">
                    <Button variant="outlined" component="span" color="warning">
                      {formData.property_doc ? formData.property_doc.name : 'Choose File'}
                    </Button>
                  </label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                  <CameraAlt sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>Applicant Photo (Kiosk Camera)</Typography>
                  <input accept="image/*" type="file" id="photo-capture" hidden capture="user" onChange={(e) => handleFileChange(e, 'photo')} />
                  <label htmlFor="photo-capture">
                    <Button variant="outlined" component="span" color="warning">
                      {formData.photo ? formData.photo.name : 'Capture Photo'}
                    </Button>
                  </label>
                </Box>
              </Grid>
              {formData.connection_type === 'commercial' && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                    <CloudUpload sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
                    <Typography variant="subtitle1" gutterBottom>Fire NOC (Optional)</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Upload if available. Validation happens later.
                    </Typography>
                    <input accept="image/*,.pdf" type="file" id="firenoc-upload" hidden onChange={(e) => handleFileChange(e, 'fire_noc_doc')} />
                    <label htmlFor="firenoc-upload">
                      <Button variant="outlined" component="span" color="warning">
                        {formData.fire_noc_doc ? formData.fire_noc_doc.name : 'Choose File'}
                      </Button>
                    </label>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 4: // Review
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review Your Application</Typography>
            <Box sx={{ bgcolor: '#fff3e0', p: 2, borderRadius: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Connection Type</Typography>
              <Typography>
                {lpgConnectionTypes.find(t => t.value === formData.connection_type)?.icon}{' '}
                {lpgConnectionTypes.find(t => t.value === formData.connection_type)?.label}
              </Typography>
            </Box>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>LPG Provider</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography fontSize="1.5rem">{lpgProviders.find(p => p.value === formData.lpg_provider)?.logo}</Typography>
                <Box>
                  <Typography fontWeight="bold">{lpgProviders.find(p => p.value === formData.lpg_provider)?.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{lpgProviders.find(p => p.value === formData.lpg_provider)?.company}</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Distributor</Typography>
              <Typography>{formData.distributor_name}</Typography>
              <Typography variant="body2" color="text.secondary">PIN: {formData.pin_code}</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              {formData.connection_type === 'commercial' ? (
                <>
                  <Grid item xs={6}><Typography variant="body2" color="text.secondary">Business Name</Typography><Typography fontWeight="bold">{formData.business_name}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2" color="text.secondary">Contact</Typography><Typography fontWeight="bold">{formData.contact_number}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2" color="text.secondary">GST / License</Typography><Typography fontWeight="bold">{formData.gst_number || formData.trade_license}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2" color="text.secondary">Cylinder Type</Typography><Typography fontWeight="bold">{formData.cylinder_type}</Typography></Grid>
                </>
              ) : (
                <>
                  <Grid item xs={6}><Typography variant="body2" color="text.secondary">Applicant Name</Typography><Typography fontWeight="bold">{formData.applicant_name}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2" color="text.secondary">Mobile</Typography><Typography fontWeight="bold">{formData.mobile}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2" color="text.secondary">Aadhaar</Typography><Typography fontWeight="bold">XXXX-XXXX-{formData.aadhaar_number.slice(-4)}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2" color="text.secondary">Bank (Last 4)</Typography><Typography fontWeight="bold">{formData.bank_account_last4 || 'N/A'}</Typography></Grid>
                </>
              )}
              <Grid item xs={12}><Typography variant="body2" color="text.secondary">Address</Typography><Typography fontWeight="bold">{formData.address}</Typography></Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2"><strong>Important:</strong> The following will be verified by {lpgProviders.find(p => p.value === formData.lpg_provider)?.label} (OMC):</Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
                <li>Aadhaar de-duplication check</li>
                <li>Subsidy eligibility (PAHAL / DBTL)</li>
                {formData.connection_type === 'pmuy' && <li>BPL / income eligibility check</li>}
                <li>Family mapping verification</li>
                <li>Connection limit check</li>
              </Typography>
            </Alert>
            <FormControlLabel
              control={<Radio checked={formData.agreed_to_terms} onChange={(e) => setFormData({ ...formData, agreed_to_terms: e.target.checked })} color="warning" />}
              label="I declare that all information provided is true and correct. I understand that false information may result in rejection."
            />
          </Box>
        );
      default: return null;
    }
  };

  return (
    <Box>
      <DialogTitle sx={{ bgcolor: isPNG ? '#1565c0' : '#f57c00', color: 'white' }}>
        <Typography component="span" variant="body1" fontWeight={600}>
          {isPNG ? '🔵 Apply for PNG Connection' : '🔥 Apply for LPG Connection'}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {isPNG ? 'Piped Natural Gas for your home' : 'Domestic | PMUY (Ujjwala) | Commercial'}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
          {steps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
        </Stepper>
        {renderStepContent()}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        {activeStep > 0 && <Button onClick={handleBack} disabled={submitting}>Back</Button>}
        <Button variant="contained" onClick={handleNext} disabled={submitting} color={isPNG ? 'primary' : 'warning'}>
          {submitting ? <CircularProgress size={24} color="inherit" /> : activeStep === steps.length - 1 ? 'Submit Application' : 'Next'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default GasNewConnectionForm;
