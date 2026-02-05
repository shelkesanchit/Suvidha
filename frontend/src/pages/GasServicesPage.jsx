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
} from '@mui/material';
import {
  LocalFireDepartment as GasIcon,
  PropaneTank as CylinderIcon,
  ReceiptLong as BillIcon,
  Build as ServiceIcon,
  Payment as PaymentIcon,
  Assessment as MeterIcon,
  ArrowBack as BackIcon,
  Report as ComplaintIcon,
  Description as TrackIcon,
} from '@mui/icons-material';

const GasServicesPage = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);

  const services = [
    {
      id: 'new_gas_connection',
      title: 'New Gas Connection',
      description: 'Apply for new PNG/LPG connection',
      icon: GasIcon,
      color: '#f57c00',
    },
    {
      id: 'cylinder_booking',
      title: 'Book Cylinder',
      description: 'Book LPG cylinder online',
      icon: CylinderIcon,
      color: '#e91e63',
    },
    {
      id: 'gas_bill',
      title: 'View Gas Bill',
      description: 'Check and pay gas bills',
      icon: BillIcon,
      color: '#2e7d32',
    },
    {
      id: 'gas_payment',
      title: 'Make Payment',
      description: 'Pay gas bills instantly',
      icon: PaymentIcon,
      color: '#1976d2',
    },
    {
      id: 'gas_complaint',
      title: 'Register Complaint',
      description: 'Report gas leakage or service issues',
      icon: ComplaintIcon,
      color: '#d32f2f',
    },
    {
      id: 'gas_meter',
      title: 'Meter Reading',
      description: 'Submit gas meter reading',
      icon: MeterIcon,
      color: '#7b1fa2',
    },
    {
      id: 'gas_service',
      title: 'Service Request',
      description: 'Request maintenance or repair',
      icon: ServiceIcon,
      color: '#0288d1',
    },
    {
      id: 'track_gas',
      title: 'Track Request',
      description: 'Check status of your requests',
      icon: TrackIcon,
      color: '#f57c00',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <Toolbar>
          <Button
            startIcon={<BackIcon />}
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <GasIcon sx={{ mr: 2, fontSize: 30 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Gas Distribution Services
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ mb: 4, fontWeight: 'bold', color: '#333' }}
        >
          Select Service
        </Typography>

        <Grid container spacing={3}>
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

        {/* Coming Soon Message */}
        {selectedService && (
          <Box
            sx={{
              mt: 4,
              p: 4,
              bgcolor: 'white',
              borderRadius: 2,
              textAlign: 'center',
              boxShadow: 3,
            }}
          >
            <Typography variant="h5" color="primary" gutterBottom>
              🚧 Service Under Development
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This service will be available soon. Thank you for your patience!
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setSelectedService(null)}
              sx={{ mt: 2 }}
            >
              Back to Services
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default GasServicesPage;
