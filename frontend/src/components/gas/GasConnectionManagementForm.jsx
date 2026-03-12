import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  CircularProgress,
  Card,
  CardActionArea,
  CardContent,
  Fade,
} from '@mui/material';
import { CheckCircle as SuccessIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const serviceTypes = [
  {
    id: 'pressure_enhancement',
    title: 'Load / Pressure Enhancement',
    icon: '⚡',
    description: 'Request increase in gas pressure or load capacity for your connection',
    color: '#1976d2',
  },
  {
    id: 'meter_upgrade',
    title: 'Meter Change / Upgrade',
    icon: '🔧',
    description: 'Request meter type change, replacement, or smart meter upgrade',
    color: '#7b1fa2',
  },
  {
    id: 'ownership_transfer',
    title: 'Transfer Connection',
    icon: '🔄',
    description: 'Transfer gas connection to new owner on property or name change',
    color: '#2e7d32',
  },
  {
    id: 'surrender',
    title: 'Surrender / Terminate',
    icon: '❌',
    description: 'Apply to close, surrender, or permanently terminate the gas connection',
    color: '#d32f2f',
  },
];

const meterTypes = [
  { value: 'diaphragm_g4', label: 'Diaphragm Meter G4 (Standard)' },
  { value: 'diaphragm_g6', label: 'Diaphragm Meter G6' },
  { value: 'smart_meter', label: 'Smart Prepaid Meter' },
  { value: 'industrial', label: 'Industrial / Rotary Meter' },
];

const surrenderReasons = [
  { value: 'relocation', label: 'Relocation / Moving Out' },
  { value: 'property_sale', label: 'Property Sale' },
  { value: 'no_longer_needed', label: 'No Longer Required' },
  { value: 'switching_lpg', label: 'Switching to LPG' },
  { value: 'other', label: 'Other Reason' },
];

const GasConnectionManagementForm = ({ onClose, gasType = 'png' }) => {
  const isPNG = gasType === 'png';
  const primaryColor = isPNG ? 'primary' : 'warning';
  const headerColor = isPNG ? '#1565c0' : '#f57c00';

  const [selectedService, setSelectedService] = useState(null);
  const [step, setStep] = useState('select'); // select -> form -> success
  const [loading, setLoading] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');

  const [formData, setFormData] = useState({
    consumer_number: '',
    contact_name: '',
    mobile: '',
    // pressure enhancement
    current_pressure_issue: '',
    required_load: '',
    reason_for_enhancement: '',
    // meter upgrade
    current_meter_type: '',
    requested_meter_type: '',
    meter_serial_number: '',
    // ownership transfer
    new_owner_name: '',
    new_owner_mobile: '',
    new_owner_aadhaar: '',
    transfer_reason: '',
    // surrender
    surrender_reason: '',
    preferred_final_reading_date: '',
    deposit_refund_account: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
    setStep('form');
  };

  const buildDescription = () => {
    switch (selectedService) {
      case 'pressure_enhancement':
        return `Load/Pressure Enhancement Request. Current issue: ${formData.current_pressure_issue}. Required load: ${formData.required_load}. Reason: ${formData.reason_for_enhancement}`;
      case 'meter_upgrade':
        return `Meter Change/Upgrade Request. Current meter: ${formData.current_meter_type}, Serial: ${formData.meter_serial_number}. Requested type: ${formData.requested_meter_type}`;
      case 'ownership_transfer':
        return `Connection Transfer Request. New Owner: ${formData.new_owner_name}, Mobile: ${formData.new_owner_mobile}, Aadhaar (last 4): ${formData.new_owner_aadhaar}. Reason: ${formData.transfer_reason}`;
      case 'surrender':
        return `Connection Surrender/Termination Request. Reason: ${formData.surrender_reason}. Preferred final reading date: ${formData.preferred_final_reading_date}. Deposit refund account: ${formData.deposit_refund_account}`;
      default:
        return 'Connection management service request';
    }
  };

  const handleSubmit = async () => {
    if (!formData.consumer_number) { toast.error('Please enter consumer number'); return; }
    if (!formData.contact_name) { toast.error('Please enter your name'); return; }
    if (!formData.mobile || formData.mobile.length !== 10) { toast.error('Please enter valid 10-digit mobile number'); return; }

    setLoading(true);
    try {
      const response = await api.post('/gas/complaints/submit', {
        complaint_data: {
          gas_type: gasType,
          consumer_number: formData.consumer_number,
          contact_name: formData.contact_name,
          mobile: formData.mobile,
          complaint_category: 'other',
          description: buildDescription(),
          urgency: selectedService === 'surrender' ? 'low' : 'medium',
        },
      });

      if (response.data.success) {
        setReferenceNumber(response.data.data.complaint_number);
        setStep('success');
        toast.success('Request submitted successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceInfo = serviceTypes.find((s) => s.id === selectedService);
  const today = new Date().toISOString().split('T')[0];
  const minDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

  if (step === 'success') {
    return (
      <Box>
        <DialogTitle sx={{ bgcolor: headerColor, color: 'white' }}>
          <Typography variant="h5" fontWeight={600}>Request Submitted</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" color="success.main" gutterBottom>Request Registered!</Typography>
          <Typography variant="h6" gutterBottom>Reference Number:</Typography>
          <Chip
            label={referenceNumber}
            color={primaryColor}
            sx={{ fontSize: '1.4rem', py: 3, px: 4, mb: 3 }}
          />
          <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
            <Typography variant="body2">
              • Save your reference number for follow-up<br />
              • Our team will contact you within 2–3 working days<br />
              • For urgent assistance, call <strong>1906</strong>
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose} fullWidth color={primaryColor}>
            Close
          </Button>
        </DialogActions>
      </Box>
    );
  }

  return (
    <Box>
      <DialogTitle sx={{ bgcolor: headerColor, color: 'white' }}>
        <Typography variant="h5" fontWeight={600}>
          {isPNG ? '🔵 PNG Connection Management' : '🔥 LPG Connection Management'}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>Manage your existing gas connection</Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {/* Step 1: Select service type */}
        {step === 'select' && (
          <>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Select Service Type
            </Typography>
            <Grid container spacing={2}>
              {serviceTypes.map((service, i) => (
                <Grid item xs={12} sm={6} key={service.id}>
                  <Fade in timeout={200 + i * 100}>
                    <Card
                      sx={{
                        border: '2px solid',
                        borderColor: 'grey.200',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: service.color,
                          transform: 'translateY(-3px)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      <CardActionArea onClick={() => handleServiceSelect(service.id)}>
                        <CardContent>
                          <Typography fontSize="2rem" gutterBottom>{service.icon}</Typography>
                          <Typography variant="subtitle1" fontWeight="bold" color={service.color}>
                            {service.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {service.description}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Step 2: Service form */}
        {step === 'form' && selectedServiceInfo && (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography fontWeight="bold">
                {selectedServiceInfo.icon} {selectedServiceInfo.title}
              </Typography>
              <Typography variant="body2">{selectedServiceInfo.description}</Typography>
            </Alert>

            <Grid container spacing={2}>
              {/* Common fields for all services */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Consumer Number"
                  name="consumer_number"
                  value={formData.consumer_number}
                  onChange={handleChange}
                  placeholder={isPNG ? 'PNG2024XXXXXX' : 'GC2024XXXXXX'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Your Full Name"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Mobile Number"
                  name="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  inputProps={{ maxLength: 10 }}
                  placeholder="10-digit mobile number"
                />
              </Grid>

              {/* Pressure Enhancement fields */}
              {selectedService === 'pressure_enhancement' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Describe Current Pressure Issue"
                      name="current_pressure_issue"
                      value={formData.current_pressure_issue}
                      onChange={handleChange}
                      multiline
                      rows={2}
                      placeholder="e.g., Gas pressure is very low during peak morning hours"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Required Load / Capacity (KW or SCM/hr)"
                      name="required_load"
                      value={formData.required_load}
                      onChange={handleChange}
                      placeholder="e.g., 5 KW or 2 SCM/hr"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Reason for Enhancement"
                      name="reason_for_enhancement"
                      value={formData.reason_for_enhancement}
                      onChange={handleChange}
                      placeholder="e.g., Added new commercial kitchen equipment"
                    />
                  </Grid>
                </>
              )}

              {/* Meter Upgrade fields */}
              {selectedService === 'meter_upgrade' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Current Meter Type"
                      name="current_meter_type"
                      value={formData.current_meter_type}
                      onChange={handleChange}
                    >
                      <MenuItem value="">Select current meter type</MenuItem>
                      {meterTypes.map((m) => (
                        <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Requested Meter Type"
                      name="requested_meter_type"
                      value={formData.requested_meter_type}
                      onChange={handleChange}
                    >
                      <MenuItem value="">Select requested meter type</MenuItem>
                      {meterTypes.map((m) => (
                        <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Current Meter Serial Number"
                      name="meter_serial_number"
                      value={formData.meter_serial_number}
                      onChange={handleChange}
                      placeholder="Serial number found on meter plate"
                    />
                  </Grid>
                </>
              )}

              {/* Ownership Transfer fields */}
              {selectedService === 'ownership_transfer' && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      Transfer requires physical verification. Our team will visit within 5 working days. Both parties must be present.
                    </Alert>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="New Owner's Full Name"
                      name="new_owner_name"
                      value={formData.new_owner_name}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="New Owner's Mobile"
                      name="new_owner_mobile"
                      value={formData.new_owner_mobile}
                      onChange={(e) => setFormData({ ...formData, new_owner_mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      inputProps={{ maxLength: 10 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="New Owner's Aadhaar (last 4 digits)"
                      name="new_owner_aadhaar"
                      value={formData.new_owner_aadhaar}
                      onChange={(e) => setFormData({ ...formData, new_owner_aadhaar: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      inputProps={{ maxLength: 4 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Reason for Transfer"
                      name="transfer_reason"
                      value={formData.transfer_reason}
                      onChange={handleChange}
                      placeholder="e.g., Property sale, Death of original holder"
                    />
                  </Grid>
                </>
              )}

              {/* Surrender fields */}
              {selectedService === 'surrender' && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      Surrender process takes 7–10 working days. Security deposit will be refunded after dues clearance and final inspection.
                    </Alert>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Reason for Surrender"
                      name="surrender_reason"
                      value={formData.surrender_reason}
                      onChange={handleChange}
                    >
                      <MenuItem value="">Select reason</MenuItem>
                      {surrenderReasons.map((r) => (
                        <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Preferred Date for Final Meter Reading"
                      name="preferred_final_reading_date"
                      type="date"
                      value={formData.preferred_final_reading_date}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: minDate }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bank Account No. for Deposit Refund"
                      name="deposit_refund_account"
                      value={formData.deposit_refund_account}
                      onChange={handleChange}
                      placeholder="Account number for security deposit refund"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={step === 'form' ? () => setStep('select') : onClose}>
          {step === 'form' ? 'Back' : 'Cancel'}
        </Button>
        {step === 'form' && (
          <Button
            variant="contained"
            color={primaryColor}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default GasConnectionManagementForm;
