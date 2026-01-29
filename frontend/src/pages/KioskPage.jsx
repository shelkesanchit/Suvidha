import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Button,
  Dialog,
} from '@mui/material';
import {
  Power as PowerIcon,
  ElectricBolt as BoltIcon,
  Payment as PaymentIcon,
  Report as ReportIcon,
  Build as BuildIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  WbSunny as SolarIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Speed as SpeedIcon,
  AccountBalance as AccountIcon,
  ElectricMeter as MeterIcon,
} from '@mui/icons-material';

// Import service components
import NewConnectionForm from '../components/kiosk/NewConnectionForm';
import BillPaymentForm from '../components/kiosk/BillPaymentForm';
import ComplaintForm from '../components/kiosk/ComplaintForm';
import TrackingForm from '../components/kiosk/TrackingForm';
import BillCalculator from '../components/kiosk/BillCalculator';
import LoadChangeForm from '../components/kiosk/LoadChangeForm';
import NameChangeForm from '../components/kiosk/NameChangeForm';
import MeterReadingForm from '../components/kiosk/MeterReadingForm';
import SolarRooftopForm from '../components/kiosk/SolarRooftopForm';
import ReconnectionForm from '../components/kiosk/ReconnectionForm';
import CategoryChangeForm from '../components/kiosk/CategoryChangeForm';
import PrepaidRechargeForm from '../components/kiosk/PrepaidRechargeForm';

const services = [
  {
    id: 'new_connection',
    title: 'New Connection',
    description: 'Apply for new electricity connection',
    icon: BoltIcon,
    color: '#1976d2',
    component: NewConnectionForm,
  },
  {
    id: 'bill_payment',
    title: 'Pay Bill',
    description: 'View and pay electricity bills',
    icon: PaymentIcon,
    color: '#2e7d32',
    component: BillPaymentForm,
  },
  {
    id: 'complaint',
    title: 'Register Complaint',
    description: 'Report power issues or service problems',
    icon: ReportIcon,
    color: '#d32f2f',
    component: ComplaintForm,
  },
  {
    id: 'track',
    title: 'Track Application',
    description: 'Check status of your application or complaint',
    icon: DescriptionIcon,
    color: '#f57c00',
    component: TrackingForm,
  },
  {
    id: 'load_change',
    title: 'Change of Load',
    description: 'Request to modify sanctioned load',
    icon: SpeedIcon,
    color: '#7b1fa2',
    component: LoadChangeForm,
  },
  {
    id: 'name_change',
    title: 'Change of Name',
    description: 'Transfer connection to new owner',
    icon: PersonIcon,
    color: '#0288d1',
    component: NameChangeForm,
  },
  {
    id: 'meter_reading',
    title: 'Submit Reading',
    description: 'Submit your meter reading online',
    icon: MeterIcon,
    color: '#5d4037',
    component: MeterReadingForm,
  },
  {
    id: 'bill_calculator',
    title: 'Bill Calculator',
    description: 'Estimate your electricity bill',
    icon: AccountIcon,
    color: '#00796b',
    component: BillCalculator,
  },
  {
    id: 'solar',
    title: 'Solar Rooftop',
    description: 'Apply for solar rooftop installation',
    icon: SolarIcon,
    color: '#f9a825',
    component: SolarRooftopForm,
  },
  {
    id: 'reconnection',
    title: 'Reconnection',
    description: 'Request to restore power supply',
    icon: PowerIcon,
    color: '#c62828',
    component: ReconnectionForm,
  },
  {
    id: 'category_change',
    title: 'Category Change',
    description: 'Switch between consumer categories',
    icon: CategoryIcon,
    color: '#6a1b9a',
    component: CategoryChangeForm,
  },
  {
    id: 'prepaid_recharge',
    title: 'Prepaid Recharge',
    description: 'Recharge your prepaid meter',
    icon: PaymentIcon,
    color: '#00838f',
    component: PrepaidRechargeForm,
  },
];

const KioskPage = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleServiceClick = (service) => {
    if (service.component) {
      setSelectedService(service);
      setDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedService(null);
  };

  const ServiceComponent = selectedService?.component;

  return (
    <Box className="kiosk-container">
      <AppBar position="static" className="kiosk-header">
        <Toolbar>
          <PowerIcon sx={{ mr: 2, fontSize: 40 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight={700}>
              SUVIDHA KIOSK
            </Typography>
            <Typography variant="subtitle1">
              Electricity Department - Self Service Portal
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
          >
            Home
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" className="kiosk-content">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Welcome to SUVIDHA
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Touch any service card below to get started
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={service.id}>
                <Card
                  className="service-card touch-card"
                  onClick={() => handleServiceClick(service)}
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    '&:hover': {
                      borderColor: service.color,
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minHeight: 220,
                    }}
                  >
                    <Icon
                      className="service-icon"
                      sx={{ color: service.color, fontSize: 60, mb: 2 }}
                    />
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      {service.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {service.description}
                    </Typography>
                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          bgcolor: service.color,
                          '&:hover': {
                            bgcolor: service.color,
                            opacity: 0.9,
                          },
                        }}
                      >
                        Open
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Box sx={{ mt: 6, p: 3, bgcolor: 'info.lighter', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            ℹ️ Instructions
          </Typography>
          <Typography variant="body2">
            • Touch any service card to access the service<br />
            • Follow the on-screen instructions to complete your transaction<br />
            • You can track your applications using the reference number provided<br />
            • For assistance, please contact: 1912 (24/7 Helpline)
          </Typography>
        </Box>
      </Container>

      {/* Service Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, minHeight: '60vh' },
        }}
      >
        {ServiceComponent && <ServiceComponent onClose={handleCloseDialog} />}
      </Dialog>
    </Box>
  );
};

export default KioskPage;
