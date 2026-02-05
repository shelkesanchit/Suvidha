import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  AppBar,
  Toolbar,
  Button,
  Fade,
} from '@mui/material';
import {
  Water as WaterIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';

const MunicipalServicesPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
        <Toolbar>
          <Button
            startIcon={<BackIcon />}
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <WaterIcon sx={{ mr: 2, fontSize: 30 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Municipal Corporation Services
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ mb: 6, fontWeight: 'bold', color: '#333' }}
        >
          Select Service
        </Typography>

        <Fade in timeout={800}>
          <Card
            sx={{
              maxWidth: 500,
              margin: '0 auto',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-12px)',
                boxShadow: 8,
              },
            }}
          >
            <CardActionArea
              onClick={() => navigate('/municipal/water')}
              sx={{ height: '100%' }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 6,
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    boxShadow: '0 10px 30px rgba(79, 172, 254, 0.4)',
                  }}
                >
                  <WaterIcon sx={{ fontSize: 60, color: 'white' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: '#0288d1' }}>
                  Water Services
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Water connections, bill payments, and services
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
};

export default MunicipalServicesPage;
