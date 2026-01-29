import React from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
} from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (error) {
      // Error handled in AuthContext
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={10} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 60, height: 60 }}>
              <AdminPanelSettings sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography component="h1" variant="h4" fontWeight="bold">
              SUVIDHA Admin Panel
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Electricity Department Management System
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              autoComplete="email"
              autoFocus
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
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
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              Sign In to Admin Panel
            </Button>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                <strong>Admin Access Only</strong>
                <br />
                For customer portal, please visit the main website
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
