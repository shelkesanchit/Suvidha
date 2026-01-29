import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Power as PowerIcon,
  TouchApp as TouchIcon,
} from '@mui/icons-material';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <AppBar position="static" elevation={0} sx={{ background: 'transparent' }}>
        <Toolbar>
          <PowerIcon sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            SUVIDHA
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <PowerIcon sx={{ fontSize: 100, color: 'white', mb: 3 }} />
          <Typography variant="h2" gutterBottom sx={{ color: 'white', fontWeight: 700 }}>
            SUVIDHA 2026
          </Typography>
          <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.9)', mb: 4, fontWeight: 300 }}>
            Smart Urban Virtual Interactive Digital Helpdesk Assistant
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 6 }}>
            Electricity Department - Self-Service Kiosk System
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Card 
              className="touch-card"
              sx={{ 
                maxWidth: 500,
                width: '100%',
                transition: 'transform 0.3s',
                '&:hover': { transform: 'translateY(-8px)' },
                cursor: 'pointer'
              }}
              onClick={() => navigate('/kiosk')}
            >
              <CardContent sx={{ p: 5, textAlign: 'center' }}>
                <TouchIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                <Typography variant="h4" gutterBottom fontWeight={600}>
                  Kiosk Services
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Access all electricity department services in one place. 
                  {isAuthenticated ? ' Continue to explore services.' : ' Login or register to get started.'}
                </Typography>
                <Button 
                  variant="contained" 
                  size="large"
                  fullWidth 
                  sx={{ py: 1.5, fontSize: '1.1rem' }}
                  onClick={() => navigate(isAuthenticated ? '/kiosk' : '/login')}
                >
                  {isAuthenticated ? 'Go to Kiosk' : 'Login / Register'}
                </Button>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ mt: 8, p: 4, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
            <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
              Services Available
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {[
                'New Connection',
                'Bill Payment',
                'Complaint Registration',
                'Load Change',
                'Meter Reading',
                'Solar Rooftop',
                'Name Transfer',
                'Payment History',
                'Application Tracking',
              ].map((service) => (
                <Grid item xs={6} sm={4} md={3} key={service}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    ✓ {service}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Container>

      <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', color: 'white', py: 3, mt: 8 }}>
        <Container>
          <Typography variant="body2" align="center">
            © 2026 C-DAC. All rights reserved. | Smart City 2.0 Initiative
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
