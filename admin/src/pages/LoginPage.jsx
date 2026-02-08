import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  IconButton,
} from '@mui/material';
import { AdminPanelSettings, ElectricBolt, LocalFireDepartment, Water, ArrowBack } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ department = 'electricity' }) => {
  const { login, isAuthenticated, department: authDepartment } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated with correct department
  useEffect(() => {
    if (isAuthenticated && authDepartment === department) {
      navigate(`/${department}`, { replace: true });
    }
  }, [isAuthenticated, authDepartment, department, navigate]);

  const deptConfig = {
    electricity: {
      title: 'Electricity Department',
      icon: <ElectricBolt sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fields: { username: 'Email Address', password: 'Password' },
      usernameType: 'email',
    },
    gas: {
      title: 'Gas Department',
      icon: <LocalFireDepartment sx={{ fontSize: 40 }} />,
      color: '#ff6f00',
      gradient: 'linear-gradient(135deg, #ff6f00 0%, #ff8f00 100%)',
      fields: { username: 'Username', password: 'Password' },
      usernameType: 'text',
    },
    water: {
      title: 'Water Department',
      icon: <Water sx={{ fontSize: 40 }} />,
      color: '#0288d1',
      gradient: 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)',
      fields: { username: 'Username', password: 'Password' },
      usernameType: 'text',
    },
  };

  const config = deptConfig[department];

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const credentials = department === 'electricity' 
        ? { email: data.username, password: data.password }
        : { username: data.username, password: data.password };
      
      await login(credentials, department);
      // Navigation will be handled by useEffect after state updates
    } catch (error) {
      // Error handled in AuthContext
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: config.gradient,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={10} sx={{ p: 4, position: 'relative' }}>
          <IconButton
            onClick={() => navigate('/')}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
            }}
          >
            <ArrowBack />
          </IconButton>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, mt: 2 }}>
            <Avatar sx={{ m: 1, bgcolor: config.color, width: 60, height: 60 }}>
              {config.icon}
            </Avatar>
            <Typography component="h1" variant="h4" fontWeight="bold">
              SUVIDHA Admin
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
              {config.title}
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label={config.fields.username}
              type={config.usernameType}
              autoComplete={config.usernameType === 'email' ? 'email' : 'username'}
              autoFocus
              error={!!errors.username}
              helperText={errors.username?.message}
              {...register('username', {
                required: `${config.fields.username} is required`,
                ...(config.usernameType === 'email' && {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                }),
              })}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label={config.fields.password}
              type="password"
              id="password"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                bgcolor: config.color,
                '&:hover': {
                  bgcolor: config.color,
                  opacity: 0.9,
                },
              }}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Default Credentials:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {department === 'electricity' && 'admin@electricity.gov.in / Admin@123'}
                {department === 'gas' && 'gas_admin / GasAdmin@123'}
                {department === 'water' && 'water_admin / WaterAdmin@123'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
