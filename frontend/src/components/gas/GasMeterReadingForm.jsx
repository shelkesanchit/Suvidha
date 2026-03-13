import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { CheckCircle as SuccessIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { buildDocumentPayload, validateFile } from './formUtils';
import DocUpload from '../municipal/DocUpload';

const GasMeterReadingForm = ({ onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState('');
  const [meterPhoto, setMeterPhoto] = useState(null);
  const docs = { meter_photo: meterPhoto };
  const [formData, setFormData] = useState({
    consumer_number: '',
    mobile: '',
    meter_number: '',
    previous_reading: '',
    current_reading: '',
    reading_date: '',
    reading_unit: 'SCM',
    reader_name: '',
    notes: '',
  });

  const onMeterPhoto = (file) => {
    if (!file) return;
    const error = validateFile(file, 5);
    if (error) return toast.error(error);
    setMeterPhoto(file);
    toast.success(`${file.name} selected`);
  };

  const handleSubmit = async () => {
    if (!formData.consumer_number || !formData.mobile || !formData.current_reading || !formData.reading_date) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error('Enter valid 10-digit mobile number');
      return;
    }

    if (formData.previous_reading && Number(formData.current_reading) < Number(formData.previous_reading)) {
      toast.error('Current reading cannot be less than previous reading');
      return;
    }

    try {
      setSubmitting(true);
      const documents = meterPhoto ? await buildDocumentPayload({ meter_photo: meterPhoto }) : [];
      const response = await api.post('/gas/applications/submit', {
        application_type: 'conversion',
        application_data: {
          service: 'meter_reading_submission',
          ...formData,
        },
        documents,
        additional_info: {
          source: 'meter_reading_form',
          meter_photo_name: meterPhoto?.name || null,
        },
      });

      const appNo = response?.data?.data?.application_number;
      setReference(appNo || 'Generated');
      setSubmitted(true);
      toast.success('Meter reading submitted');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to submit meter reading');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Box>
        <DialogTitle sx={{ px: 3, py: 2, bgcolor: '#f3e8ff', borderBottom: '1px solid #dfc6ff', pb: 0 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#5b21b6' }}>Submission Complete</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3, pb: 2, textAlign: 'center' }}>
          <SuccessIcon sx={{ fontSize: 74, color: 'success.main', mb: 1.5 }} />
          <Typography variant="h6" gutterBottom>Meter reading submitted</Typography>
          <Chip label={reference} color="primary" sx={{ px: 2, py: 2.5, fontSize: '1rem', mb: 2 }} />
          <Alert severity="info" sx={{ textAlign: 'left' }}>Track this request with the reference number.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button fullWidth variant="contained" onClick={onClose}>Close</Button>
        </DialogActions>
      </Box>
    );
  }

  return (
    <Box>
      <DialogTitle sx={{ px: 3, py: 2, bgcolor: '#f3e8ff', borderBottom: '1px solid #dfc6ff', pb: 0 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#5b21b6' }}>Submit Gas Meter Reading</Typography>
        <Typography variant="body2" sx={{ mt: 0.75, color: '#5f3a9f', fontWeight: 500 }}>
          Required details only
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 4, px: 3, pb: 2, minHeight: 520 }}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="Consumer Number *" value={formData.consumer_number} onChange={(e) => setFormData((p) => ({ ...p, consumer_number: e.target.value.toUpperCase() }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="Mobile Number *" value={formData.mobile} onChange={(e) => setFormData((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Meter Number" value={formData.meter_number} onChange={(e) => setFormData((p) => ({ ...p, meter_number: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="date" required InputLabelProps={{ shrink: true }} label="Reading Date *" value={formData.reading_date} onChange={(e) => setFormData((p) => ({ ...p, reading_date: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" label="Previous Reading" value={formData.previous_reading} onChange={(e) => setFormData((p) => ({ ...p, previous_reading: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required type="number" label="Current Reading (SCM) *" value={formData.current_reading} onChange={(e) => setFormData((p) => ({ ...p, current_reading: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth select label="Reading Unit" value={formData.reading_unit} onChange={(e) => setFormData((p) => ({ ...p, reading_unit: e.target.value }))}>
              <MenuItem value="SCM">SCM</MenuItem>
              <MenuItem value="SM3">SM3</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Reader Name" value={formData.reader_name} onChange={(e) => setFormData((p) => ({ ...p, reader_name: e.target.value }))} />
          </Grid>
          <Grid item xs={12}><DocUpload label="Meter Photo" name="meter_photo" docs={docs} onFileChange={(n, f) => onMeterPhoto(f)} onRemove={() => setMeterPhoto(null)} hint="Capture clear meter reading image" enableQr /></Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={3} label="Notes" value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <CircularProgress size={22} color="inherit" /> : 'Submit'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default GasMeterReadingForm;
