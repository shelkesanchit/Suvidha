import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  AppBar,
  Toolbar,
  Button,
  Fade,
  Dialog,
  Chip,
} from '@mui/material';
import {
  LocalFireDepartment as GasIcon,
  PropaneTank as CylinderIcon,
  ReceiptLong as BillIcon,
  ArrowBack as BackIcon,
  Report as ComplaintIcon,
  TrackChanges as TrackIcon,
  Phone as PhoneIcon,
  Assessment as PipelineIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Toaster } from 'react-hot-toast';
import {
  GasNewConnectionForm,
  GasBillPaymentForm,
  GasComplaintForm,
  GasTrackingForm,
  GasCylinderBookingForm,
} from '../components/gas';

// PNG Services (Piped Natural Gas)
const pngServices = [
  {
    id: 'png_new_connection',
    title: 'Apply for New PNG Connection',
    description: 'Apply for piped natural gas connection for your property',
    icon: AddIcon,
    color: '#1976d2',
  },
  {
    id: 'png_bill',
    title: 'Pay PNG Bill',
    description: 'View and pay your PNG gas bill online',
    icon: BillIcon,
    color: '#2e7d32',
  },
  {
    id: 'png_complaint',
    title: 'Register PNG Complaint',
    description: 'Report pipeline, meter, or service issues',
    icon: ComplaintIcon,
    color: '#d32f2f',
  },
  {
    id: 'png_track',
    title: 'Track Application / Complaint',
    description: 'Check status of your PNG application or complaint',
    icon: TrackIcon,
    color: '#0288d1',
  },
];

// LPG Services (Liquefied Petroleum Gas)
const lpgServices = [
  {
    id: 'lpg_new_connection',
    title: 'Apply for New LPG Connection',
    description: 'Apply for Domestic, PMUY (Ujjwala), or Commercial LPG connection',
    icon: AddIcon,
    color: '#f57c00',
  },
  {
    id: 'lpg_cylinder_booking',
    title: 'Book LPG Cylinder',
    description: 'Book LPG cylinder refill with OTP verification',
    icon: CylinderIcon,
    color: '#e91e63',
  },
  {
    id: 'lpg_bill',
    title: 'Pay LPG Refill / Bill',
    description: 'Pay for your cylinder booking or pending dues',
    icon: BillIcon,
    color: '#2e7d32',
  },
  {
    id: 'lpg_complaint',
    title: 'Register LPG Complaint',
    description: 'Report delivery delay, overcharging, or cylinder issues',
    icon: ComplaintIcon,
    color: '#d32f2f',
  },
  {
    id: 'lpg_track',
    title: 'Track Application / Complaint',
    description: 'Check status of your LPG application or complaint',
    icon: TrackIcon,
    color: '#0288d1',
  },
];

const GasServicesPage = () => {
  const navigate = useNavigate();
  const [gasType, setGasType] = useState(null); // null, 'png', 'lpg'
  const [selectedService, setSelectedService] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleGasTypeSelect = (type) => {
    setGasType(type);
  };

  const handleServiceClick = (serviceId) => {
    setSelectedService(serviceId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedService(null);
  };

  const handleBack = () => {
    if (gasType) {
      setGasType(null);
    } else {
      navigate('/');
    }
  };

  const renderFormComponent = () => {
    switch (selectedService) {
      case 'png_new_connection':
        return <GasNewConnectionForm onClose={handleCloseDialog} gasType="png" />;
      case 'lpg_new_connection':
        return <GasNewConnectionForm onClose={handleCloseDialog} gasType="lpg" />;
      case 'lpg_cylinder_booking':
        return <GasCylinderBookingForm onClose={handleCloseDialog} />;
      case 'png_bill':
      case 'lpg_bill':
        return <GasBillPaymentForm onClose={handleCloseDialog} gasType={gasType} />;
      case 'png_complaint':
        return <GasComplaintForm onClose={handleCloseDialog} gasType="png" />;
      case 'lpg_complaint':
        return <GasComplaintForm onClose={handleCloseDialog} gasType="lpg" />;
      case 'png_track':
      case 'lpg_track':
        return <GasTrackingForm onClose={handleCloseDialog} gasType={gasType} />;
      default:
        return null;
    }
  };

  const currentServices = gasType === 'png' ? pngServices : gasType === 'lpg' ? lpgServices : [];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Toaster position="top-center" />
      
      {/* Header */}
      <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)' }}>
        <Toolbar>
          <Button
            startIcon={<BackIcon />}
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <GasIcon sx={{ mr: 2, fontSize: 30 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Gas Distribution Services
            {gasType && (
              <Chip 
                label={gasType.toUpperCase()} 
                sx={{ ml: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
              />
            )}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Emergency Banner */}
        <Box
          sx={{
            bgcolor: '#d32f2f',
            color: 'white',
            p: 3,
            borderRadius: 2,
            mb: 4,
            textAlign: 'center',
            border: '3px solid #b71c1c',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <PhoneIcon sx={{ fontSize: 32 }} />
            <Typography variant="h5" fontWeight="bold">
              GAS LEAK EMERGENCY?
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" sx={{ my: 1, letterSpacing: 2 }}>
            CALL 1906 IMMEDIATELY
          </Typography>
          <Typography variant="body1">
            Do NOT use electrical switches or open flames. Open windows and evacuate.
          </Typography>
        </Box>

        {/* Gas Type Selection Screen */}
        {!gasType && (
          <>
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ mb: 4, fontWeight: 'bold', color: '#333' }}
            >
              Select Gas Service Type
            </Typography>

            <Grid container spacing={4} justifyContent="center">
              {/* PNG Card */}
              <Grid item xs={12} sm={6} md={5}>
                <Fade in timeout={500}>
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'all 0.3s ease',
                      border: '3px solid #1976d2',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: 8,
                      },
                    }}
                  >
                    <CardActionArea onClick={() => handleGasTypeSelect('png')} sx={{ height: '100%' }}>
                      <CardContent sx={{ textAlign: 'center', p: 4 }}>
                        <Box
                          sx={{
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            bgcolor: '#e3f2fd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 3,
                          }}
                        >
                          <PipelineIcon sx={{ fontSize: 60, color: '#1976d2' }} />
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color="#1976d2" gutterBottom>
                          PNG Services
                        </Typography>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Piped Natural Gas
                        </Typography>
                        <Box sx={{ mt: 2, textAlign: 'left' }}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>• New PNG Connection</Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>• Pay PNG Bill</Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>• Register Complaint</Typography>
                          <Typography variant="body2">• Track Application</Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Fade>
              </Grid>

              {/* LPG Card */}
              <Grid item xs={12} sm={6} md={5}>
                <Fade in timeout={700}>
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'all 0.3s ease',
                      border: '3px solid #f57c00',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: 8,
                      },
                    }}
                  >
                    <CardActionArea onClick={() => handleGasTypeSelect('lpg')} sx={{ height: '100%' }}>
                      <CardContent sx={{ textAlign: 'center', p: 4 }}>
                        <Box
                          sx={{
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            bgcolor: '#fff3e0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 3,
                          }}
                        >
                          <CylinderIcon sx={{ fontSize: 60, color: '#f57c00' }} />
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color="#f57c00" gutterBottom>
                          LPG Services
                        </Typography>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Liquefied Petroleum Gas
                        </Typography>
                        <Box sx={{ mt: 2, textAlign: 'left' }}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>• New LPG Connection</Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>• Book LPG Cylinder</Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>• Pay LPG Bill</Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>• Register Complaint</Typography>
                          <Typography variant="body2">• Track Application</Typography>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                          <Chip label="Indane" size="small" sx={{ m: 0.3 }} />
                          <Chip label="Bharat Gas" size="small" sx={{ m: 0.3 }} />
                          <Chip label="HP Gas" size="small" sx={{ m: 0.3 }} />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Fade>
              </Grid>
            </Grid>
          </>
        )}

        {/* Service Selection Screen */}
        {gasType && (
          <>
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ mb: 4, fontWeight: 'bold', color: '#333' }}
            >
              {gasType === 'png' ? 'PNG Services' : 'LPG Services'}
            </Typography>

            <Grid container spacing={3}>
              {currentServices.map((service, index) => (
                <Grid item xs={12} sm={6} md={4} key={service.id}>
                  <Fade in timeout={300 + index * 100}>
                    <Card
                      sx={{
                        height: '100%',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: 6,
                        },
                      }}
                    >
                      <CardActionArea onClick={() => handleServiceClick(service.id)} sx={{ height: '100%' }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 3 }}>
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: '50%',
                              bgcolor: `${service.color}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mb: 2,
                            }}
                          >
                            <service.icon sx={{ fontSize: 40, color: service.color }} />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {service.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
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

        {/* Info Section */}
        <Box sx={{ mt: 6, p: 4, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
            About Gas Distribution Services
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="#1976d2">
                PNG (Piped Natural Gas)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Continuous gas supply through pipelines<br />
                • Metered billing based on consumption<br />
                • Available in select areas of the city<br />
                • More economical for regular usage<br />
                • No storage hassle
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="#f57c00">
                LPG (Liquefied Petroleum Gas)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Cylinder-based gas supply<br />
                • Available everywhere in India<br />
                • Providers: Indane, Bharat Gas, HP Gas<br />
                • PMUY (Ujjwala) for eligible beneficiaries<br />
                • Online booking and home delivery
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Contact Info */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Helpline: 1906 | Email: gas@suvidha.gov.in | Office Hours: 9 AM - 6 PM
          </Typography>
        </Box>
      </Container>

      {/* Service Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {renderFormComponent()}
      </Dialog>
    </Box>
  );
};

export default GasServicesPage;
