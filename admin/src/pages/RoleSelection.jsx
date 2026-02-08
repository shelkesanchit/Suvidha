import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Paper,
} from '@mui/material';
import {
  ElectricBolt,
  LocalFireDepartment,
  Water,
} from '@mui/icons-material';

const RoleSelection = () => {
  const navigate = useNavigate();

  const departments = [
    {
      id: 'electricity',
      title: 'Electricity Department',
      description: 'Manage electricity connections, bills, and complaints',
      icon: <ElectricBolt sx={{ fontSize: 80 }} />,
      color: '#1976d2',
      path: '/electricity/login',
    },
    {
      id: 'gas',
      title: 'Gas Department',
      description: 'Manage gas connections, cylinder bookings, and services',
      icon: <LocalFireDepartment sx={{ fontSize: 80 }} />,
      color: '#ff6f00',
      path: '/gas/login',
    },
    {
      id: 'water',
      title: 'Water Department',
      description: 'Manage water connections, bills, and supply services',
      icon: <Water sx={{ fontSize: 80 }} />,
      color: '#0288d1',
      path: '/water/login',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <Typography
            variant="h3"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            SUVIDHA Admin Portal
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            gutterBottom
            sx={{ mb: 5 }}
          >
            Select Your Department
          </Typography>

          <Grid container spacing={4}>
            {departments.map((dept) => (
              <Grid item xs={12} md={4} key={dept.id}>
                <Card
                  elevation={4}
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 8,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(dept.path)}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      p: 3,
                    }}
                  >
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${dept.color}15, ${dept.color}30)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        color: dept.color,
                      }}
                    >
                      {dept.icon}
                    </Box>
                    <CardContent sx={{ textAlign: 'center', p: 0 }}>
                      <Typography
                        variant="h5"
                        component="div"
                        gutterBottom
                        sx={{
                          fontWeight: 'bold',
                          color: dept.color,
                        }}
                      >
                        {dept.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {dept.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Unified Municipal Services Management System
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RoleSelection;
