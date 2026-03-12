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
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Download as DownloadIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const safetyGuidelines = [
  {
    title: 'Gas Leak Safety Guide',
    filename: 'gas-leak-safety.pdf',
    description: 'What to do if you smell gas at home — step-by-step emergency response',
    icon: '🚨',
    size: '2.1 MB',
  },
  {
    title: 'Installation Safety Manual',
    filename: 'installation-safety.pdf',
    description: 'Safe practices for gas appliances and equipment installation',
    icon: '🔧',
    size: '3.5 MB',
  },
  {
    title: 'LPG Cylinder Safety Handbook',
    filename: 'lpg-cylinder-safety.pdf',
    description: 'Safe handling, storage, and usage of LPG cylinders',
    icon: '⛽',
    size: '1.8 MB',
  },
  {
    title: 'PNG Piped Gas Safety Guide',
    filename: 'png-safety.pdf',
    description: 'Safety guidelines for piped natural gas consumers',
    icon: '🏠',
    size: '2.4 MB',
  },
  {
    title: 'Emergency Response Guide',
    filename: 'emergency-response.pdf',
    description: 'Emergency procedures for all gas-related incidents',
    icon: '🚒',
    size: '1.2 MB',
  },
];

const distributionAreas = [
  {
    area: 'Zone A – City Center',
    company: 'Mahanagar Gas Ltd.',
    phone: '1906',
    email: 'zonea@mgl.co.in',
    coverage: 'Wards 1–10',
  },
  {
    area: 'Zone B – North District',
    company: 'Gujarat Gas Ltd.',
    phone: '1906',
    email: 'zoneb@gujgas.co.in',
    coverage: 'Wards 11–20',
  },
  {
    area: 'Zone C – South District',
    company: 'IGL Ltd.',
    phone: '1906',
    email: 'zonec@igl.co.in',
    coverage: 'Wards 21–30',
  },
  {
    area: 'Zone D – East District',
    company: 'Adani Total Gas',
    phone: '1906',
    email: 'zoned@adani.com',
    coverage: 'Wards 31–40',
  },
  {
    area: 'Zone E – West District',
    company: 'Torrent Gas',
    phone: '1906',
    email: 'zonee@torrent.com',
    coverage: 'Wards 41–50',
  },
];

const inspectionTypes = [
  { value: 'routine', label: 'Routine Safety Inspection' },
  { value: 'pre_installation', label: 'Pre-installation Check' },
  { value: 'post_repair', label: 'Post-repair Verification' },
  { value: 'annual', label: 'Annual Mandatory Inspection' },
];

const timeSlots = [
  { value: 'morning', label: 'Morning (9 AM – 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM – 3 PM)' },
  { value: 'evening', label: 'Evening (3 PM – 6 PM)' },
];

const GasSafetyInfoForm = ({ onClose, gasType = 'png' }) => {
  const isPNG = gasType === 'png';
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- Book Inspection (Tab 0) ---
  const [inspectionSubmitted, setInspectionSubmitted] = useState(false);
  const [inspectionRef, setInspectionRef] = useState('');
  const [inspectionForm, setInspectionForm] = useState({
    consumer_number: '',
    contact_name: '',
    mobile: '',
    address: '',
    property_type: 'residential',
    preferred_date: '',
    preferred_time: 'morning',
    inspection_type: 'routine',
  });

  // --- Safety Alerts (Tab 2) ---
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [alertForm, setAlertForm] = useState({
    name: '',
    mobile: '',
    email: '',
    pincode: '',
    alert_gas_leak: true,
    alert_supply_interruption: true,
    alert_billing: false,
    alert_safety_tips: false,
    alert_promotions: false,
  });

  // --- Distributor Search (Tab 3) ---
  const [areaSearch, setAreaSearch] = useState('');

  const filteredAreas = distributionAreas.filter(
    (a) =>
      a.area.toLowerCase().includes(areaSearch.toLowerCase()) ||
      a.company.toLowerCase().includes(areaSearch.toLowerCase()) ||
      a.coverage.toLowerCase().includes(areaSearch.toLowerCase())
  );

  const handleInspectionChange = (e) => {
    setInspectionForm({ ...inspectionForm, [e.target.name]: e.target.value });
  };

  const handleAlertChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAlertForm({ ...alertForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handleInspectionSubmit = async () => {
    if (!inspectionForm.consumer_number) { toast.error('Please enter consumer number'); return; }
    if (!inspectionForm.contact_name) { toast.error('Please enter your name'); return; }
    if (!inspectionForm.mobile || inspectionForm.mobile.length !== 10) {
      toast.error('Please enter valid 10-digit mobile number');
      return;
    }
    if (!inspectionForm.preferred_date) { toast.error('Please select preferred date'); return; }

    setLoading(true);
    try {
      // Simulate API call — replace with real endpoint when available
      await new Promise((r) => setTimeout(r, 1000));
      const ref = 'INS' + Date.now().toString().slice(-8);
      setInspectionRef(ref);
      setInspectionSubmitted(true);
      toast.success('Safety inspection booked successfully!');
    } catch {
      toast.error('Failed to book inspection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAlertSubmit = async () => {
    if (!alertForm.name) { toast.error('Please enter your name'); return; }
    if (!alertForm.mobile || alertForm.mobile.length !== 10) {
      toast.error('Please enter valid 10-digit mobile number');
      return;
    }
    if (!alertForm.alert_gas_leak && !alertForm.alert_supply_interruption && !alertForm.alert_billing && !alertForm.alert_safety_tips && !alertForm.alert_promotions) {
      toast.error('Please select at least one alert type');
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setAlertSubmitted(true);
      toast.success('Safety alerts registered successfully!');
    } catch {
      toast.error('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (guide) => {
    toast.success(`Downloading: ${guide.title}`);
    // In production, trigger actual file download from backend
    const link = document.createElement('a');
    link.href = `/uploads/guides/${guide.filename}`;
    link.download = guide.filename;
    link.click();
  };

  const minDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

  return (
    <Box>
      <DialogTitle sx={{ bgcolor: '#c62828', color: 'white', pb: 0 }}>
        <Typography variant="h5" fontWeight={600}>
          🛡️ Safety &amp; Information
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Gas safety services and distribution information
        </Typography>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mt: 1,
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' },
            '& .Mui-selected': { color: 'white' },
            '& .MuiTabs-indicator': { bgcolor: 'white' },
          }}
        >
          <Tab label="📅 Book Inspection" />
          <Tab label="📄 Guidelines" />
          <Tab label="🔔 Safety Alerts" />
          <Tab label="📍 Find Distributor" />
        </Tabs>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>

        {/* ── Tab 0: Book Pipeline Safety Inspection ─────────────────────── */}
        {tab === 0 && (
          inspectionSubmitted ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" color="success.main" gutterBottom>
                Inspection Booked!
              </Typography>
              <Typography variant="h6" gutterBottom>Reference Number:</Typography>
              <Chip
                label={inspectionRef}
                color="error"
                sx={{ fontSize: '1.3rem', py: 2.5, px: 3, mb: 3 }}
              />
              <Alert severity="info" sx={{ textAlign: 'left' }}>
                <Typography variant="body2">
                  • Our certified technician will visit on your preferred date<br />
                  • You will receive an SMS confirmation within 24 hours<br />
                  • Ensure someone is home between 9 AM – 6 PM<br />
                  • This inspection is <strong>FREE</strong> for all registered consumers
                </Typography>
              </Alert>
            </Box>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                Schedule a <strong>FREE</strong> pipeline safety inspection by our certified gas safety technicians.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Consumer Number"
                    name="consumer_number"
                    value={inspectionForm.consumer_number}
                    onChange={handleInspectionChange}
                    placeholder={isPNG ? 'PNG2024XXXXXX' : 'GC2024XXXXXX'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Contact Name"
                    name="contact_name"
                    value={inspectionForm.contact_name}
                    onChange={handleInspectionChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Mobile Number"
                    name="mobile"
                    value={inspectionForm.mobile}
                    onChange={(e) =>
                      setInspectionForm({
                        ...inspectionForm,
                        mobile: e.target.value.replace(/\D/g, '').slice(0, 10),
                      })
                    }
                    inputProps={{ maxLength: 10 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Property Type"
                    name="property_type"
                    value={inspectionForm.property_type}
                    onChange={handleInspectionChange}
                  >
                    <MenuItem value="residential">Residential</MenuItem>
                    <MenuItem value="commercial">Commercial</MenuItem>
                    <MenuItem value="industrial">Industrial</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Address for Inspection"
                    name="address"
                    value={inspectionForm.address}
                    onChange={handleInspectionChange}
                    multiline
                    rows={2}
                    placeholder="House/flat number, street, landmark, city"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Preferred Date"
                    name="preferred_date"
                    type="date"
                    value={inspectionForm.preferred_date}
                    onChange={handleInspectionChange}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: minDate }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Preferred Time Slot"
                    name="preferred_time"
                    value={inspectionForm.preferred_time}
                    onChange={handleInspectionChange}
                  >
                    {timeSlots.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Inspection Type"
                    name="inspection_type"
                    value={inspectionForm.inspection_type}
                    onChange={handleInspectionChange}
                  >
                    {inspectionTypes.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </>
          )
        )}

        {/* ── Tab 1: Download Safety Guidelines ──────────────────────────── */}
        {tab === 1 && (
          <>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography fontWeight="bold">
                Always read safety guidelines before using gas appliances
              </Typography>
            </Alert>
            <Grid container spacing={2}>
              {safetyGuidelines.map((guide) => (
                <Grid item xs={12} key={guide.filename}>
                  <Card variant="outlined" sx={{ '&:hover': { boxShadow: 3 } }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography fontSize="2.5rem">{guide.icon}</Typography>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {guide.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {guide.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          PDF • {guide.size}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(guide)}
                        size="small"
                      >
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Alert severity="error" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Emergency Numbers:</strong><br />
                Gas Leak Helpline: <strong>1906</strong> (24x7)<br />
                Fire Department: <strong>101</strong> &nbsp;|&nbsp; Police: <strong>100</strong>
              </Typography>
            </Alert>
          </>
        )}

        {/* ── Tab 2: Register for Safety Alerts/SMS ──────────────────────── */}
        {tab === 2 && (
          alertSubmitted ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" color="success.main" gutterBottom>
                Alerts Registered!
              </Typography>
              <Alert severity="success" sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant="body2">
                  • Safety alerts will be sent to <strong>{alertForm.mobile}</strong><br />
                  • SMS confirmation sent to your mobile<br />
                  • To unsubscribe anytime, reply <strong>STOP</strong> to any alert SMS
                </Typography>
              </Alert>
            </Box>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                Register to receive instant SMS/email alerts about gas safety incidents, supply interruptions,
                and important notices in your area.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Full Name"
                    name="name"
                    value={alertForm.name}
                    onChange={handleAlertChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Mobile Number"
                    name="mobile"
                    value={alertForm.mobile}
                    onChange={(e) =>
                      setAlertForm({
                        ...alertForm,
                        mobile: e.target.value.replace(/\D/g, '').slice(0, 10),
                      })
                    }
                    inputProps={{ maxLength: 10 }}
                    helperText="SMS alerts will be sent to this number"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address (optional)"
                    name="email"
                    type="email"
                    value={alertForm.email}
                    onChange={handleAlertChange}
                    helperText="For email alerts (optional)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="PIN Code"
                    name="pincode"
                    value={alertForm.pincode}
                    onChange={(e) =>
                      setAlertForm({
                        ...alertForm,
                        pincode: e.target.value.replace(/\D/g, '').slice(0, 6),
                      })
                    }
                    inputProps={{ maxLength: 6 }}
                    helperText="Receive area-specific alerts"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Select Alert Types
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="alert_gas_leak"
                          checked={alertForm.alert_gas_leak}
                          onChange={handleAlertChange}
                          color="error"
                        />
                      }
                      label="🚨 Gas Leak Warnings (Recommended)"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="alert_supply_interruption"
                          checked={alertForm.alert_supply_interruption}
                          onChange={handleAlertChange}
                          color="warning"
                        />
                      }
                      label="⚠️ Supply Interruption Alerts"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="alert_billing"
                          checked={alertForm.alert_billing}
                          onChange={handleAlertChange}
                        />
                      }
                      label="💰 Billing &amp; Payment Reminders"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="alert_safety_tips"
                          checked={alertForm.alert_safety_tips}
                          onChange={handleAlertChange}
                        />
                      }
                      label="🛡️ Monthly Safety Tips"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="alert_promotions"
                          checked={alertForm.alert_promotions}
                          onChange={handleAlertChange}
                        />
                      }
                      label="📢 Government Schemes &amp; Promotions"
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </>
          )
        )}

        {/* ── Tab 3: Know Your Distribution Area / Contact ────────────────── */}
        {tab === 3 && (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              Find your gas distributor, service zone, and contact information.
            </Alert>
            <TextField
              fullWidth
              label="Search by Area / Company / Ward"
              value={areaSearch}
              onChange={(e) => setAreaSearch(e.target.value)}
              sx={{ mb: 3 }}
              placeholder="e.g., Zone A, Ward 5, Gujarat Gas"
            />
            {filteredAreas.length === 0 ? (
              <Alert severity="warning">No areas found matching your search</Alert>
            ) : (
              <Grid container spacing={2}>
                {filteredAreas.map((area) => (
                  <Grid item xs={12} sm={6} key={area.area}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary">
                          {area.area}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          {area.company}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Coverage: {area.coverage}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon fontSize="small" color="error" />
                            <Typography variant="body2">{area.phone}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon fontSize="small" color="primary" />
                            <Typography variant="body2">{area.email}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            <Paper sx={{ mt: 3, p: 2, bgcolor: '#ffebee', border: '1px solid #ef9a9a' }}>
              <Typography variant="subtitle1" fontWeight="bold" color="error" gutterBottom>
                🚨 Emergency Contacts
              </Typography>
              <Typography variant="body2">
                Gas Leak Emergency: <strong>1906</strong> (24x7)
              </Typography>
              <Typography variant="body2">
                National Gas Helpline: <strong>1800-180-1906</strong> (Toll Free)
              </Typography>
              <Typography variant="body2">
                Email: <strong>gas@suvidha.gov.in</strong>
              </Typography>
            </Paper>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        {tab === 0 && !inspectionSubmitted && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleInspectionSubmit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Book Inspection'}
            </Button>
          </>
        )}
        {tab === 2 && !alertSubmitted && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleAlertSubmit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Register for Alerts'}
            </Button>
          </>
        )}
        {(tab === 1 || tab === 3 || inspectionSubmitted || alertSubmitted) && (
          <Button variant="contained" color="error" onClick={onClose}>
            Close
          </Button>
        )}
      </DialogActions>
    </Box>
  );
};

export default GasSafetyInfoForm;
