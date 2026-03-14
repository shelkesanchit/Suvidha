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
  InputAdornment,
} from '@mui/material';
import {
  AdminPanelSettings,
  ElectricBolt,
  LocalFireDepartment,
  Water,
  ArrowBack,
  AccountBalance,
  Visibility,
  VisibilityOff,
  Lock,
  Person,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const deptConfig = {
  electricity: {
    title: 'Electricity Department',
    icon: ElectricBolt,
    color: '#1976d2',
    gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
    usernameType: 'email',
    usernameLabel: 'Email Address',
    defaultCred: 'admin@electricity.gov.in / Admin@123',
  },
  gas: {
    title: 'Gas Department',
    icon: LocalFireDepartment,
    color: '#ff6b35',
    gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
    usernameType: 'text',
    usernameLabel: 'Username',
    defaultCred: 'gas_admin / GasAdmin@123',
  },
  water: {
    title: 'Water Department',
    icon: Water,
    color: '#0288d1',
    gradient: 'linear-gradient(135deg, #0288d1 0%, #4fc3f7 100%)',
    usernameType: 'email',
    usernameLabel: 'Email Address',
    defaultCred: 'water.admin@municipal.gov / WaterAdmin@123',
  },
  municipal: {
    title: 'Municipal Corporation',
    icon: AccountBalance,
    color: '#2e7d32',
    gradient: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
    usernameType: 'email',
    usernameLabel: 'Email Address',
    defaultCred: 'municipal.admin@municipal.gov / MuniAdmin@123',
  },
};

const LoginPage = ({ department = 'electricity' }) => {
  const { login, isAuthenticated, department: authDepartment } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authDepartment === department) {
      navigate(`/${department}`, { replace: true });
    }
  }, [isAuthenticated, authDepartment, department, navigate]);

  const config = deptConfig[department];
  const Icon = config.icon;

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const credentials = department === 'gas'
        ? { username: data.username, password: data.password }
        : { email: data.username, password: data.password };
      await login(credentials, department);
    } catch (_) {
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
        py: 3,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top color accent */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: config.gradient,
            }}
          />

          {/* Back button */}
          <IconButton
            onClick={() => navigate('/')}
            size="small"
            sx={{ color: 'text.secondary', mb: 1 }}
          >
            <ArrowBack fontSize="small" />
          </IconButton>

          {/* Avatar + Title */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              sx={{
                mx: 'auto',
                mb: 2,
                width: 64,
                height: 64,
                background: config.gradient,
                boxShadow: `0 8px 24px ${config.color}40`,
              }}
            >
              <Icon sx={{ fontSize: 34, color: 'white' }} />
            </Avatar>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              SUVIDHA Admin
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {config.title}
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              label={config.usernameLabel}
              type={config.usernameType}
              autoComplete={config.usernameType === 'email' ? 'email' : 'username'}
              autoFocus
              error={!!errors.username}
              helperText={errors.username?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              {...register('username', {
                required: `${config.usernameLabel} is required`,
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
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
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
                py: 1.4,
                background: config.gradient,
                '&:hover': { background: config.gradient, filter: 'brightness(1.08)' },
                '&:disabled': { opacity: 0.7 },
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>

            <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, mb: 0.5 }}>
                Default Credentials
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                {config.defaultCred}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
