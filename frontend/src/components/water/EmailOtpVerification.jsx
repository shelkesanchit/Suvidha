import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/**
 * EmailOtpVerification — reusable dialog for email OTP verification for water services.
 *
 * Props:
 *  open           {boolean}   — whether the dialog is open
 *  onClose        {function}  — called when user cancels
 *  onVerified     {function}  — called with (email) when OTP is verified
 *  initialEmail   {string}    — pre-fill the email field (optional)
 *  title          {string}    — dialog title (optional)
 */
const EmailOtpVerification = ({ open, onClose, onVerified, initialEmail = '', title = 'Verify Your Email' }) => {
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'verified'
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0); // resend cooldown

  // Sync initialEmail when it changes (e.g. form prefills email)
  useEffect(() => {
    if (open && initialEmail && step === 'email') {
      setEmail(initialEmail);
    }
  }, [open, initialEmail]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep('email');
      setOtp('');
      setError('');
      setCountdown(0);
    }
  }, [open]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/water/otp/send', { email });
      setStep('otp');
      setCountdown(60);
      toast.success('OTP sent! Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/water/otp/verify', { email, otp });
      setStep('verified');
      toast.success('Email verified successfully!');
      // Short delay so user sees the verified screen, then close
      setTimeout(() => {
        onVerified(email);
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp('');
    setError('');
    setLoading(true);
    try {
      await api.post('/water/otp/send', { email });
      setCountdown(60);
      toast.success('New OTP sent!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <Box sx={{ background: 'linear-gradient(135deg, #0288d1, #039be5)', px: 3, py: 2.5 }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
          Verify your email to submit application & receive receipt
        </Typography>
      </Box>

      <DialogContent sx={{ pt: 3, pb: 1 }}>
        {step === 'email' && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <EmailIcon sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography variant="body1" fontWeight={600}>
                Enter your email address
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              An OTP will be sent to this email. The receipt will also be delivered here after submission.
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              autoFocus
            />
          </Box>
        )}

        {step === 'otp' && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <LockIcon sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography variant="body1" fontWeight={600}>
                Enter OTP
              </Typography>
            </Box>
            <Alert severity="success" icon={<EmailIcon />} sx={{ mb: 2 }}>
              OTP sent to <strong>{email}</strong>
            </Alert>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              fullWidth
              label="6-Digit OTP"
              value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
              inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: 28, letterSpacing: 8, fontWeight: 700 } }}
              autoFocus
              placeholder="• • • • • •"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                sx={{ textTransform: 'none' }}
              >
                Resend OTP {countdown > 0 ? `(${countdown}s)` : ''}
              </Button>
              <Button
                size="small"
                onClick={() => { setStep('email'); setError(''); setOtp(''); }}
                disabled={loading}
                sx={{ textTransform: 'none', color: 'text.secondary' }}
              >
                Change Email
              </Button>
            </Box>
          </Box>
        )}

        {step === 'verified' && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" fontWeight={700} color="success.main">
              Email Verified!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Submitting your application...
            </Typography>
          </Box>
        )}
      </DialogContent>

      {step !== 'verified' && (
        <>
          <Divider sx={{ mx: 2 }} />
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={onClose} disabled={loading} color="inherit">
              Cancel
            </Button>
            {step === 'email' && (
              <Button
                variant="contained"
                onClick={handleSendOtp}
                disabled={loading}
                endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardIcon />}
                sx={{ bgcolor: '#0288d1', '&:hover': { bgcolor: '#0277bd' } }}
              >
                Send OTP
              </Button>
            )}
            {step === 'otp' && (
              <Button
                variant="contained"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                sx={{ bgcolor: '#0288d1', '&:hover': { bgcolor: '#0277bd' } }}
              >
                Verify & Submit
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default EmailOtpVerification;
