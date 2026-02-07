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
} from '@mui/material';
import {
  Water as WaterIcon,
  Receipt as BillIcon,
  Report as ComplaintIcon,
  Description as TrackIcon,
  ArrowBack as BackIcon,
  AddCircle as NewConnectionIcon,
} from '@mui/icons-material';
import { Toaster } from 'react-hot-toast';

// Water Form Components
import WaterNewConnectionForm from '../components/water/WaterNewConnectionForm';
import WaterBillPaymentForm from '../components/water/WaterBillPaymentForm';
import WaterComplaintForm from '../components/water/WaterComplaintForm';
import WaterTrackingForm from '../components/water/WaterTrackingForm';

const WaterServicesPage = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);

  const services = [
    {
      id: 'water_connection',
      title: 'New Water Connection',
      description: 'Apply for new water supply connection',
      icon: NewConnectionIcon,
      color: '#0288d1',
    },
    {
      id: 'water_bill',
      title: 'Water Bill',
      description: 'View and pay water bills',
      icon: BillIcon,
      color: '#2e7d32',
    },
    {
      id: 'water_complaint',
      title: 'Water Complaint',
      description: 'Report water supply issues',
      icon: ComplaintIcon,
      color: '#d32f2f',
    },
    {
      id: 'track_water',
      title: 'Track Request',
      description: 'Check status of your water requests',
      icon: TrackIcon,
      color: '#f57c00',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
        <Toolbar>
          <Button
            startIcon={<BackIcon />}
            color="inherit"
            onClick={() => navigate('/municipal')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <WaterIcon sx={{ mr: 2, fontSize: 30 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Water Services
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ mb: 4, fontWeight: 'bold', color: '#333' }}
          >
            Select Water Service
          </Typography>

          <Grid container spacing={3} justifyContent="center">
          {services.map((service, index) => (
            <Grid item xs={12} sm={6} md={3} key={service.id}>
              <Fade in timeout={500 + index * 100}>
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
                  <CardActionArea
                    onClick={() => setSelectedService(service.id)}
                    sx={{ height: '100%' }}
                  >
                    <CardContent
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        p: 3,
                      }}
                    >
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
        </Container>
      </Box>

      {/* Service Dialogs */}
      {/* New Water Connection Dialog */}
      <Dialog
        open={selectedService === 'water_connection'}
        onClose={() => setSelectedService(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <WaterNewConnectionForm onClose={() => setSelectedService(null)} />
      </Dialog>

      {/* Bill Payment Dialog */}
      <Dialog
        open={selectedService === 'water_bill'}
        onClose={() => setSelectedService(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <WaterBillPaymentForm onClose={() => setSelectedService(null)} />
      </Dialog>

      {/* Complaint Dialog */}
      <Dialog
        open={selectedService === 'water_complaint'}
        onClose={() => setSelectedService(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <WaterComplaintForm onClose={() => setSelectedService(null)} />
      </Dialog>

      {/* Track Request Dialog */}
      <Dialog
        open={selectedService === 'track_water'}
        onClose={() => setSelectedService(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <WaterTrackingForm onClose={() => setSelectedService(null)} />
      </Dialog>

      <Toaster position="top-center" />
    </Box>
  );
};

export default WaterServicesPage;
