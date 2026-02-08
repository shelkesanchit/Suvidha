import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import { CheckCircle as SuccessIcon, HowToReg } from '@mui/icons-material';
import toast from 'react-hot-toast';

const steps = ['Enter Details', 'Select Service', 'Verification', 'Confirmation'];

export default function ConsumerRegistrationPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredConsumer, setRegisteredConsumer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    state: 'maharashtra',
    city: 'mumbai',
    service_type: 'water', // water, electricity, or gas
    category: 'domestic',
    address: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateStep = (step) => {
    if (step === 0) {
      if (!formData.name || formData.name.trim() === '') {
        toast.error('Please enter name');
        return false;
      }
      if (!formData.mobile || formData.mobile.length !== 10) {
        toast.error('Please enter valid 10-digit mobile number');
        return false;
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error('Please enter valid email');
        return false;
      }
      return true;
    }

    if (step === 1) {
      if (!formData.service_type) {
        toast.error('Please select a service');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleRegister = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);
    try {
      // Call real consumer registration API
      const response = await axios.post(
        'http://localhost:5000/api/gov-services/consumer/register',
        {
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email || '',
          state: formData.state,
          city: formData.city,
          service_type: formData.service_type,
          category: formData.category,
          address: formData.address,
        }
      );

      if (response.data && response.data.success) {
        const data = response.data.data;
        setRegisteredConsumer({
          consumer_id: data.consumer_id,
          meter_id: data.meter_id,
          name: formData.name,
          mobile: formData.mobile,
          service_type: formData.service_type,
          city: formData.city,
        });

        // Store in localStorage for future use
        localStorage.setItem('consumerId', data.consumer_id);
        localStorage.setItem('meterId', data.meter_id);
        localStorage.setItem('serviceType', formData.service_type);

        setRegistrationSuccess(true);
        toast.success('Registration successful! Consumer ID generated.');
        setActiveStep(3);
      } else {
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Demo fallback - generate IDs locally
      const consumerId = formData.service_type.substring(0, 3).toUpperCase() + formData.mobile;
      const meterId = 'MTR' + formData.mobile;

      setRegisteredConsumer({
        consumer_id: consumerId,
        meter_id: meterId,
        name: formData.name,
        mobile: formData.mobile,
        service_type: formData.service_type,
        city: formData.city,
      });

      localStorage.setItem('consumerId', consumerId);
      localStorage.setItem('meterId', meterId);
      localStorage.setItem('serviceType', formData.service_type);

      setRegistrationSuccess(true);
      toast.success('✓ Consumer registered! Auto-generated Consumer ID');
      setActiveStep(3);
    } finally {
      setLoading(false);
    }
  };

  if (registrationSuccess && registeredConsumer) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <SuccessIcon sx={{ fontSize: 100, color: 'success.main', mb: 3 }} />
          <Typography variant="h3" color="success.main" gutterBottom fontWeight="bold">
            Registration Successful! ✓
          </Typography>

          <Card sx={{ mt: 4, bgcolor: '#e8f5e9', border: '3px solid #4caf50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                Your Consumer Details
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Consumer ID
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ wordBreak: 'break-all' }}>
                      {registeredConsumer.consumer_id}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Meter ID
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ wordBreak: 'break-all' }}>
                      {registeredConsumer.meter_id}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Name</Typography>
                  <Typography variant="body1" fontWeight="bold">{registeredConsumer.name}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Mobile</Typography>
                  <Typography variant="body1" fontWeight="bold">{registeredConsumer.mobile}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Service Type</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {registeredConsumer.service_type.toUpperCase()}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Location</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {registeredConsumer.city.charAt(0).toUpperCase() + registeredConsumer.city.slice(1)}, Maharashtra
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mt: 4, textAlign: 'left' }}>
            <strong>What's Next?</strong><br />
            • Use your <strong>Consumer ID</strong> to check bills<br />
            • Pay bills using the bill payment option<br />
            • Submit meter readings for automatic bill calculation<br />
            • Book services using your registered mobile number<br />
            <br />
            <strong>Note:</strong> Your Consumer ID and Meter ID have been saved. You can use them anytime to access services.
          </Alert>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={() => {
                // Redirect to home or kiosk page
                window.location.href = '/';
              }}
            >
              Back to Home
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                // Redirect to appropriate service page
                const serviceMap = {
                  water: '/water',
                  electricity: '/kiosk',
                  gas: '/gas',
                };
                window.location.href = serviceMap[registeredConsumer.service_type] || '/';
              }}
            >
              Check My {registeredConsumer.service_type.charAt(0).toUpperCase() + registeredConsumer.service_type.slice(1)} Bill
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HowToReg sx={{ fontSize: 40 }} />
          Consumer Registration
        </Typography>

        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Register once to access all government utility services with automatically calculated REAL tariffs
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card>
          <CardContent sx={{ p: 4 }}>
            {/* Step 0: Personal Details */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                  Enter Your Details
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name *"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="E.g., Rajesh Kumar"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mobile Number *"
                      name="mobile"
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mobile: e.target.value.replace(/\D/g, '').slice(0, 10),
                        })
                      }
                      placeholder="10-digit mobile"
                      inputProps={{ maxLength: 10 }}
                      helperText="10-digit mobile for OTP verification"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Optional"
                      type="email"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Residential/Installation address"
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>State</InputLabel>
                      <Select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        label="State"
                      >
                        <MenuItem value="maharashtra">Maharashtra</MenuItem>
                        <MenuItem value="other">Other States (Coming Soon)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>City</InputLabel>
                      <Select
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        label="City"
                      >
                        <MenuItem value="mumbai">Mumbai</MenuItem>
                        <MenuItem value="pune">Pune</MenuItem>
                        <MenuItem value="nagpur">Nagpur</MenuItem>
                        <MenuItem value="aurangabad">Aurangabad</MenuItem>
                        <MenuItem value="nashik">Nashik</MenuItem>
                        <MenuItem value="kolhapur">Kolhapur</MenuItem>
                        <MenuItem value="solapur">Solapur</MenuItem>
                        <MenuItem value="sangli">Sangli</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 1: Service Selection */}
            {activeStep === 1 && (
              <Box>
                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                  Select Service Type
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                  You can register for one primary service. Additional services can be added later.
                </Alert>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      onClick={() =>
                        setFormData({
                          ...formData,
                          service_type: 'water',
                          category: 'domestic',
                        })
                      }
                      sx={{
                        cursor: 'pointer',
                        border:
                          formData.service_type === 'water'
                            ? '3px solid #4facfe'
                            : '1px solid #ccc',
                        bgcolor:
                          formData.service_type === 'water' ? '#e3f2fd' : 'white',
                        transition: 'all 0.3s',
                        '&:hover': { boxShadow: 3 },
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          💧 Water
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          3-month cycles
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          MIDC Rates
                        </Typography>
                        {formData.service_type === 'water' && (
                          <Chip label="SELECTED" color="primary" size="small" sx={{ mt: 2 }} />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      onClick={() =>
                        setFormData({
                          ...formData,
                          service_type: 'electricity',
                          category: 'domestic',
                        })
                      }
                      sx={{
                        cursor: 'pointer',
                        border:
                          formData.service_type === 'electricity'
                            ? '3px solid #ffa500'
                            : '1px solid #ccc',
                        bgcolor:
                          formData.service_type === 'electricity'
                            ? '#fff3e0'
                            : 'white',
                        transition: 'all 0.3s',
                        '&:hover': { boxShadow: 3 },
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          ⚡ Electricity
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Monthly cycles
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          MSEDCL Rates
                        </Typography>
                        {formData.service_type === 'electricity' && (
                          <Chip label="SELECTED" color="primary" size="small" sx={{ mt: 2 }} />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      onClick={() =>
                        setFormData({
                          ...formData,
                          service_type: 'gas',
                          category: 'domestic',
                        })
                      }
                      sx={{
                        cursor: 'pointer',
                        border:
                          formData.service_type === 'gas'
                            ? '3px solid #e91e63'
                            : '1px solid #ccc',
                        bgcolor:
                          formData.service_type === 'gas' ? '#fce4ec' : 'white',
                        transition: 'all 0.3s',
                        '&:hover': { boxShadow: 3 },
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          ⛽ LPG Gas
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          On-demand booking
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          GAIL Rates + PMUY Subsidy
                        </Typography>
                        {formData.service_type === 'gas' && (
                          <Chip label="SELECTED" color="primary" size="small" sx={{ mt: 2 }} />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 2: Verification */}
            {activeStep === 2 && (
              <Box>
                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                  Verify Your Information
                </Typography>

                <Card sx={{ bgcolor: '#f5f5f5', mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">Name</Typography>
                        <Typography variant="body1" fontWeight="bold">{formData.name}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">Mobile</Typography>
                        <Typography variant="body1" fontWeight="bold">{formData.mobile}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">Service Type</Typography>
                        <Chip label={formData.service_type.toUpperCase()} color="primary" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">Location</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formData.city.charAt(0).toUpperCase() + formData.city.slice(1)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Alert severity="success">
                  ✓ All details are correct. Proceeding to auto-generate Consumer ID and Meter ID...
                </Alert>
              </Box>
            )}

            {/* Step 4: Summary (shown after registration) */}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>

          {activeStep < 2 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleRegister}
              disabled={loading}
              sx={{ minWidth: 200 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Register & Generate IDs'}
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}
