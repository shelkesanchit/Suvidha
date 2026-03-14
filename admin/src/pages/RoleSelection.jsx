import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardActionArea,
  Grid,
  Paper,
  Chip,
} from '@mui/material';
import {
  ElectricBolt,
  LocalFireDepartment,
  Water,
  AccountBalance,
  ArrowForward,
} from '@mui/icons-material';

const departments = [
  {
    id: 'electricity',
    title: 'Electricity',
    subtitle: 'Department',
    description: 'Manage connections, bills, meter readings and complaints',
    icon: ElectricBolt,
    color: '#1976d2',
    gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
    path: '/electricity/login',
    badge: 'Power',
  },
  {
    id: 'gas',
    title: 'Gas',
    subtitle: 'Department',
    description: 'Manage gas connections, cylinder bookings, and services',
    icon: LocalFireDepartment,
    color: '#ff6b35',
    gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
    path: '/gas/login',
    badge: 'Distribution',
  },
  {
    id: 'water',
    title: 'Water',
    subtitle: 'Department',
    description: 'Manage water connections, bills, and supply services',
    icon: Water,
    color: '#0288d1',
    gradient: 'linear-gradient(135deg, #0288d1 0%, #4fc3f7 100%)',
    path: '/water/login',
    badge: 'Supply',
  },
  {
    id: 'municipal',
    title: 'Municipal',
    subtitle: 'Corporation',
    description: 'Manage applications, complaints, licenses and certificates',
    icon: AccountBalance,
    color: '#2e7d32',
    gradient: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
    path: '/municipal/login',
    badge: 'Civic',
  },
];

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 3, md: 5 },
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: 'white',
              mb: 1.5,
              fontSize: { xs: '1.8rem', sm: '2.4rem', md: '2.8rem' },
              letterSpacing: '-1px',
            }}
          >
            SUVIDHA Admin Portal
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 400, fontSize: { xs: '0.95rem', md: '1.1rem' } }}
          >
            Unified Municipal Services Management System
          </Typography>
        </Box>

        {/* Department Cards */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: 4,
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', mb: 3, display: 'block', textAlign: 'center' }}
          >
            Select Your Department
          </Typography>

          <Grid container spacing={{ xs: 2, md: 3 }}>
            {departments.map((dept) => {
              const Icon = dept.icon;
              return (
                <Grid item xs={12} sm={6} key={dept.id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.1)',
                      bgcolor: 'rgba(255,255,255,0.06)',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 12px 40px ${dept.color}30`,
                        border: `1px solid ${dept.color}60`,
                        bgcolor: 'rgba(255,255,255,0.09)',
                      },
                    }}
                  >
                    <CardActionArea onClick={() => navigate(dept.path)} sx={{ p: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
                        {/* Color stripe */}
                        <Box
                          sx={{
                            width: 6,
                            background: dept.gradient,
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ p: { xs: 2, md: 2.5 }, flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                background: `${dept.color}20`,
                                border: `1px solid ${dept.color}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Icon sx={{ color: dept.color, fontSize: 26 }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1 }}>
                                  {dept.title}
                                </Typography>
                                <Chip
                                  label={dept.badge}
                                  size="small"
                                  sx={{
                                    bgcolor: `${dept.color}25`,
                                    color: dept.color,
                                    fontWeight: 600,
                                    fontSize: '0.65rem',
                                    height: 18,
                                    border: `1px solid ${dept.color}40`,
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 1 }}>
                                {dept.subtitle}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                                {dept.description}
                              </Typography>
                            </Box>
                            <ArrowForward sx={{ color: dept.color, fontSize: 18, mt: 0.5, opacity: 0.7 }} />
                          </Box>
                        </Box>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block', textAlign: 'center', mt: 3 }}>
          Authorized personnel only — all access is logged
        </Typography>
      </Container>
    </Box>
  );
};

export default RoleSelection;
