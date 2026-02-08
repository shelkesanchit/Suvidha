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
  FormLabel,
  Chip,
  CircularProgress,
} from '@mui/material';
import { CheckCircle as SuccessIcon, CloudUpload } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const steps = ['Applicant Details', 'Property Details', 'Connection Details', 'Documents', 'Review & Submit'];

// As per Indian Municipal Standards
const applicantCategories = [
  { value: 'individual', label: 'Individual / व्यक्तिगत' },
  { value: 'housing_society', label: 'Co-operative Housing Society / सहकारी आवास समिति' },
  { value: 'firm', label: 'Firm / Partnership' },
  { value: 'private_company', label: 'Private Ltd Company' },
  { value: 'trust', label: 'Trust / न्यास' },
  { value: 'government', label: 'Government Department' },
];

const propertyTypes = [
  { value: 'residential', label: 'Residential / आवासीय' },
  { value: 'commercial', label: 'Commercial / व्यावसायिक' },
  { value: 'industrial', label: 'Industrial / औद्योगिक' },
  { value: 'institutional', label: 'Institutional (School, Hospital) / संस्थागत' },
  { value: 'construction', label: 'Construction Site / निर्माण स्थल' },
];

const connectionPurposes = [
  { value: 'drinking', label: 'Drinking / Domestic Use' },
  { value: 'construction', label: 'Construction' },
  { value: 'gardening', label: 'Gardening' },
  { value: 'industrial', label: 'Industrial Process' },
];

const connectionTypes = [
  { value: 'permanent', label: 'Permanent / स्थायी' },
  { value: 'temporary', label: 'Temporary / अस्थायी' },
];

const pipeSizes = [
  { value: '15mm', label: '15mm (½") - Domestic' },
  { value: '20mm', label: '20mm (¾") - Domestic' },
  { value: '25mm', label: '25mm (1") - Domestic Large' },
  { value: '40mm', label: '40mm - Commercial' },
  { value: '50mm', label: '50mm - Bulk/Commercial' },
];

const ownershipTypes = [
  { value: 'owner', label: 'Owner / मालिक' },
  { value: 'tenant', label: 'Tenant / किरायेदार' },
  { value: 'leaseholder', label: 'Leaseholder / पट्टाधारी' },
];

const wards = [
  { value: '1', label: 'Ward 1' },
  { value: '2', label: 'Ward 2' },
  { value: '3', label: 'Ward 3' },
  { value: '4', label: 'Ward 4' },
  { value: '5', label: 'Ward 5' },
  { value: '6', label: 'Ward 6' },
  { value: '7', label: 'Ward 7' },
  { value: '8', label: 'Ward 8' },
];

const WaterNewConnectionForm = ({ onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [formData, setFormData] = useState({
    // Applicant Details (Category I from document)
    applicant_category: 'individual',
    full_name: '',
    father_spouse_name: '',
    aadhaar_number: '',
    mobile: '',
    email: '',
    
    // Property Details (Category II from document)
    property_id: '', // Property Index Number - Most Critical Field
    house_flat_no: '',
    building_name: '',
    ward: '',
    landmark: '',
    property_type: '',
    ownership_status: 'owner',
    
    // Connection Details (Category III from document)
    connection_purpose: 'drinking',
    pipe_size: '15mm',
    connection_type: 'permanent',
    
    // Documents
    aadhaar_doc: null,
    property_doc: null, // Sale Deed / Property Tax Receipt
    
    // Declaration
    agreed_to_terms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should not exceed 5MB');
        return;
      }
      setFormData({ ...formData, [fieldName]: file });
      toast.success(`${file.name} uploaded`);
    }
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0: // Applicant Details
        if (!formData.full_name || !formData.father_spouse_name || !formData.mobile || !formData.aadhaar_number) {
          toast.error('Please fill all mandatory fields');
          return false;
        }
        if (formData.mobile.length !== 10) {
          toast.error('Enter valid 10-digit mobile number');
          return false;
        }
        if (formData.aadhaar_number.length !== 12) {
          toast.error('Enter valid 12-digit Aadhaar number');
          return false;
        }
        return true;
      case 1: // Property Details
        if (!formData.property_id || !formData.house_flat_no || !formData.ward || !formData.property_type) {
          toast.error('Please fill all mandatory fields');
          return false;
        }
        return true;
      case 2: // Connection Details
        if (!formData.connection_purpose || !formData.pipe_size) {
          toast.error('Please select connection details');
          return false;
        }
        return true;
      case 3: // Documents
        if (!formData.aadhaar_doc || !formData.property_doc) {
          toast.error('Please upload mandatory documents');
          return false;
        }
        return true;
      case 4: // Review
        if (!formData.agreed_to_terms) {
          toast.error('Please accept the declaration');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (activeStep === steps.length - 1) {
        handleSubmit();
      } else {
        setActiveStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Prepare the application data
      const application_data = {
        applicant_category: formData.applicant_category,
        full_name: formData.full_name,
        father_spouse_name: formData.father_spouse_name,
        aadhaar_number: formData.aadhaar_number,
        mobile: formData.mobile,
        email: formData.email,
        property_id: formData.property_id,
        house_flat_no: formData.house_flat_no,
        building_name: formData.building_name,
        ward: formData.ward,
        landmark: formData.landmark,
        property_type: formData.property_type,
        ownership_status: formData.ownership_status,
        connection_purpose: formData.connection_purpose,
        pipe_size: formData.pipe_size,
        connection_type: formData.connection_type,
      };
      
      // Submit to API with correct format
      const response = await api.post('/water/applications/submit', {
        application_type: 'new_connection',
        application_data
      });
      
      if (response.data && response.data.data && response.data.data.application_number) {
        setApplicationNumber(response.data.data.application_number);
        setSubmitted(true);
        toast.success('Application submitted successfully!');
      } else {
        throw new Error('Failed to get application number');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Box>
        <DialogTitle sx={{ bgcolor: '#4facfe', color: 'white' }}>
          <Typography variant="h5" fontWeight={600}>
            💧 New Water Connection
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" color="success.main" gutterBottom>
            Application Submitted!
          </Typography>
          <Typography variant="h6" gutterBottom>
            Application Number:
          </Typography>
          <Chip
            label={applicationNumber}
            color="primary"
            sx={{ fontSize: '1.5rem', py: 3, px: 4, mb: 3 }}
          />
          <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
            <Typography variant="body2">
              • Save your application number for tracking<br />
              • Document verification: 3-5 working days<br />
              • Site inspection will be scheduled after verification<br />
              • SMS updates on registered mobile: {formData.mobile}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose} fullWidth>
            Close
          </Button>
        </DialogActions>
      </Box>
    );
  }

  return (
    <Box>
      <DialogTitle sx={{ bgcolor: '#4facfe', color: 'white' }}>
        <Typography variant="h5" fontWeight={600}>
          💧 New Water Connection / नया जल कनेक्शन
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: Applicant Details */}
        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Applicant Information / आवेदक जानकारी
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label="Applicant Category / आवेदक श्रेणी"
                name="applicant_category"
                value={formData.applicant_category}
                onChange={handleChange}
              >
                {applicantCategories.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Full Name (as per Aadhaar) *"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="पूरा नाम"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Father's / Spouse's Name *"
                name="father_spouse_name"
                value={formData.father_spouse_name}
                onChange={handleChange}
                placeholder="पिता/पति का नाम"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Aadhaar Number (UID) *"
                name="aadhaar_number"
                value={formData.aadhaar_number}
                onChange={handleChange}
                placeholder="12-digit Aadhaar"
                inputProps={{ maxLength: 12 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Mobile Number *"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="10-digit mobile"
                inputProps={{ maxLength: 10 }}
                helperText="For OTP validation & SMS alerts"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="For digital billing"
              />
            </Grid>
          </Grid>
        )}

        {/* Step 1: Property Details */}
        {activeStep === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Property Details / संपत्ति विवरण
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Property ID / Index Number *"
                name="property_id"
                value={formData.property_id}
                onChange={handleChange}
                placeholder="E.g., PROP-2024-12345"
                helperText="Links to Property Tax database"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="House / Flat / Shop No. *"
                name="house_flat_no"
                value={formData.house_flat_no}
                onChange={handleChange}
                placeholder="E.g., Flat 401, Shop 5"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Building / Society Name"
                name="building_name"
                value={formData.building_name}
                onChange={handleChange}
                placeholder="For field inspector"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label="Ward *"
                name="ward"
                value={formData.ward}
                onChange={handleChange}
                helperText="Determines jurisdiction"
              >
                {wards.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Landmark"
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="E.g., Near City Hospital"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label="Property Type *"
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                helperText="Determines tariff category"
              >
                {propertyTypes.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel>Ownership Status / स्वामित्व *</FormLabel>
                <RadioGroup
                  row
                  name="ownership_status"
                  value={formData.ownership_status}
                  onChange={handleChange}
                >
                  {ownershipTypes.map((opt) => (
                    <FormControlLabel
                      key={opt.value}
                      value={opt.value}
                      control={<Radio />}
                      label={opt.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {/* Step 2: Connection Details */}
        {activeStep === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Connection Specifications / कनेक्शन विवरण
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label="Connection Purpose *"
                name="connection_purpose"
                value={formData.connection_purpose}
                onChange={handleChange}
              >
                {connectionPurposes.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label="Pipe Size (Ferrule) *"
                name="pipe_size"
                value={formData.pipe_size}
                onChange={handleChange}
                helperText="15-25mm for domestic use"
              >
                {pipeSizes.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label="Connection Type *"
                name="connection_type"
                value={formData.connection_type}
                onChange={handleChange}
              >
                {connectionTypes.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Tariff Information:</strong><br />
                  • Domestic: Lowest rate for household use<br />
                  • Commercial: Higher rate for business premises<br />
                  • Construction: Charged at 2-3x normal rate (temporary)
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        )}

        {/* Step 3: Documents */}
        {activeStep === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Upload Documents / दस्तावेज़ अपलोड करें
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Alert severity="info" sx={{ mb: 2 }}>
                Formats: JPG, PNG, PDF (Max 5MB)
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ border: '2px dashed #4facfe', borderRadius: 2, p: 3, textAlign: 'center' }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Aadhaar Card * (Proof of Identity)
                </Typography>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileChange(e, 'aadhaar_doc')}
                  style={{ display: 'none' }}
                  id="aadhaar-upload"
                />
                <label htmlFor="aadhaar-upload">
                  <Button variant="outlined" component="span" startIcon={<CloudUpload />}>
                    {formData.aadhaar_doc ? formData.aadhaar_doc.name : 'Upload Aadhaar'}
                  </Button>
                </label>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ border: '2px dashed #4facfe', borderRadius: 2, p: 3, textAlign: 'center' }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Property Document * (Ownership Proof)
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                  Sale Deed / Property Tax Receipt / Allotment Letter
                </Typography>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileChange(e, 'property_doc')}
                  style={{ display: 'none' }}
                  id="property-upload"
                />
                <label htmlFor="property-upload">
                  <Button variant="outlined" component="span" startIcon={<CloudUpload />}>
                    {formData.property_doc ? formData.property_doc.name : 'Upload Document'}
                  </Button>
                </label>
              </Box>
            </Grid>
            {formData.ownership_status === 'tenant' && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  As a Tenant, please also obtain NOC from Property Owner
                </Alert>
              </Grid>
            )}
          </Grid>
        )}

        {/* Step 4: Review & Submit */}
        {activeStep === 4 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Review Application
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ bgcolor: '#e3f2fd', p: 3, borderRadius: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Applicant</Typography>
                <Typography>Name: {formData.full_name}</Typography>
                <Typography>Mobile: {formData.mobile}</Typography>
                <Typography>Aadhaar: {formData.aadhaar_number}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ bgcolor: '#fff3e0', p: 3, borderRadius: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Property</Typography>
                <Typography>Property ID: {formData.property_id}</Typography>
                <Typography>Address: {formData.house_flat_no}, {formData.building_name}, Ward {formData.ward}</Typography>
                <Typography>Type: {propertyTypes.find(p => p.value === formData.property_type)?.label}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ bgcolor: '#e8f5e9', p: 3, borderRadius: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Connection</Typography>
                <Typography>Purpose: {connectionPurposes.find(p => p.value === formData.connection_purpose)?.label}</Typography>
                <Typography>Pipe Size: {formData.pipe_size}</Typography>
                <Typography>Type: {connectionTypes.find(c => c.value === formData.connection_type)?.label}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="warning">
                <strong>Estimated Charges:</strong> Application Fee + Security Deposit + Road Cutting (if applicable)
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <input
                    type="checkbox"
                    name="agreed_to_terms"
                    checked={formData.agreed_to_terms}
                    onChange={handleChange}
                    style={{ marginRight: 8, width: 20, height: 20 }}
                  />
                }
                label="I declare that all information is true and correct. I agree to abide by municipal water supply bylaws."
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} variant="outlined" disabled={submitting}>
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={submitting}
          sx={{ bgcolor: '#4facfe', '&:hover': { bgcolor: '#0288d1' } }}
        >
          {submitting ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            activeStep === steps.length - 1 ? 'Submit Application' : 'Next'
          )}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default WaterNewConnectionForm;
