import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogActions,
  Box, Typography, TextField, Button,
  CircularProgress, Alert, InputAdornment, Divider,
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
 * EmailOtpVerification — Municipal department email OTP verification dialog.
 *
 * Props:
 *  open           {boolean}
 *  onClose        {function}
 *  onVerified     {function}  — called with (email) when OTP is verified
 *  initialEmail   {string}
 *  title          {string}
 */
const EmailOtpVerification = ({
  open, onClose, onVerified,
  initialEmail = '',
  title = 'Verify Your Email',
}) => {
  const [step, setStep]           = useState('email'); // 'email' | 'otp' | 'verified'
  const [email, setEmail]         = useState(initialEmail);
  const [otp, setOtp]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (open && initialEmail && step === 'email') setEmail(initialEmail);
  }, [open, initialEmail]);

  useEffect(() => {
    if (!open) { setStep('email'); setOtp(''); setError(''); setCountdown(0); }
  }, [open]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/municipal/otp/send', { email });
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
      await api.post('/municipal/otp/verify', { email, otp });
      setStep('verified');
      toast.success('Email verified successfully!');
      setTimeout(() => { onVerified(email); }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp(''); setError(''); setLoading(true);
    try {
      await api.post('/municipal/otp/send', { email });
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
      {/* ── Header ── */}
      <Box sx={{ background: 'linear-gradient(135deg, #2e7d32, #388e3c)', px: 3, py: 2.5 }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
          Verify your email to submit application &amp; receive receipt
        </Typography>
      </Box>

      <DialogContent sx={{ pt: 3, pb: 1 }}>
        {/* ── Step 1: Enter Email ── */}
        {step === 'email' && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <EmailIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
              <Typography variant="body1" fontWeight={600}>Enter your email address</Typography>
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

        {/* ── Step 2: Enter OTP ── */}
        {step === 'otp' && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <LockIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
              <Typography variant="body1" fontWeight={600}>Enter OTP</Typography>
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

        {/* ── Step 3: Verified ── */}
        {step === 'verified' && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" fontWeight={700} color="success.main">Email Verified!</Typography>
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
            <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
            {step === 'email' && (
              <Button
                variant="contained"
                onClick={handleSendOtp}
                disabled={loading}
                endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardIcon />}
                sx={{ background: '#2e7d32', '&:hover': { background: '#1b5e20' } }}
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
                sx={{ background: '#2e7d32', '&:hover': { background: '#1b5e20' } }}
              >
                Verify &amp; Submit
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default EmailOtpVerification;
