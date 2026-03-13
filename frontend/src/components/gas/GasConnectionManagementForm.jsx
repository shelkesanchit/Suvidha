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

const GasConnectionManagementForm = ({ onClose, gasType = 'lpg' }) => {
  const isPNG = gasType === 'png';
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [supportDoc, setSupportDoc] = useState(null);
  const docs = { support_document: supportDoc };

  const [formData, setFormData] = useState({
    service_type: 'transfer',
    consumer_number: '',
    contact_name: '',
    mobile: '',
    email: '',
    reason: '',
    current_address: '',
    requested_address: '',
    preferred_date: '',
    alternate_contact: '',
    remarks: '',
  });

  const serviceTypeMap = {
    transfer: 'transfer',
    reconnection: 'reconnection',
    disconnection: 'disconnection',
  };

  const handleDoc = (file) => {
    if (!file) return;
    const error = validateFile(file, 5);
    if (error) return toast.error(error);
    setSupportDoc(file);
    toast.success(`${file.name} selected`);
  };

  const handleSubmit = async () => {
    if (!formData.consumer_number || !formData.contact_name || !formData.mobile || !formData.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error('Enter valid 10-digit mobile number');
      return;
    }

    try {
      setSubmitting(true);
      const applicationType = serviceTypeMap[formData.service_type] || 'transfer';
      const documents = supportDoc ? await buildDocumentPayload({ support_document: supportDoc }) : [];

      const payload = {
        application_type: applicationType,
        application_data: {
          gas_type: gasType,
          consumer_number: formData.consumer_number,
          contact_name: formData.contact_name,
          mobile: formData.mobile,
          email: formData.email,
          request_type: formData.service_type,
          reason: formData.reason,
          current_address: formData.current_address,
          requested_address: formData.requested_address,
          preferred_date: formData.preferred_date,
          alternate_contact: formData.alternate_contact,
          remarks: formData.remarks,
          description: `${formData.service_type.toUpperCase()} request: ${formData.reason}`,
        },
        documents,
        additional_info: {
          source: 'gas_connection_management',
          gas_type: gasType,
        },
      };

      const response = await api.post('/gas/applications/submit', payload);
      const appNo = response?.data?.data?.application_number;
      if (!appNo) throw new Error('Reference number not generated');

      setReferenceNumber(appNo);
      setSubmitted(true);
      toast.success('Request submitted successfully');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Box>
        <DialogTitle sx={{ px: 3, py: 2, bgcolor: '#eaf2ff', borderBottom: '1px solid #cfe0ff', pb: 0 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#0f4aa6' }}>Request Submitted</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3, pb: 2, textAlign: 'center' }}>
          <SuccessIcon sx={{ fontSize: 74, color: 'success.main', mb: 1.5 }} />
          <Typography variant="h6" gutterBottom>Connection management request registered</Typography>
          <Chip label={referenceNumber} color="primary" sx={{ px: 2, py: 2.5, fontSize: '1rem', mb: 2 }} />
          <Alert severity="info" sx={{ textAlign: 'left' }}>Use this reference in tracking form.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}><Button fullWidth variant="contained" onClick={onClose}>Close</Button></DialogActions>
      </Box>
    );
  }

  return (
    <Box>
      <DialogTitle sx={{ px: 3, py: 2, bgcolor: isPNG ? '#eaf2ff' : '#fff1e6', borderBottom: isPNG ? '1px solid #cfe0ff' : '1px solid #ffd9bf', pb: 0 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: isPNG ? '#0f4aa6' : '#b45309' }}>{isPNG ? 'PNG' : 'LPG'} Connection Management</Typography>
        <Typography variant="body2" sx={{ mt: 0.75, color: isPNG ? '#2a436f' : '#7c3e0a', fontWeight: 500 }}>Transfer, reconnection, and disconnection with supporting details</Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 4, px: 3, pb: 2, minHeight: 560 }}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth required select label="Service Type *" value={formData.service_type} onChange={(e) => setFormData((p) => ({ ...p, service_type: e.target.value }))}><MenuItem value="transfer">Transfer</MenuItem><MenuItem value="reconnection">Reconnection</MenuItem><MenuItem value="disconnection">Disconnection</MenuItem></TextField></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth required label="Consumer Number *" value={formData.consumer_number} onChange={(e) => setFormData((p) => ({ ...p, consumer_number: e.target.value.toUpperCase() }))} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth required label="Contact Name *" value={formData.contact_name} onChange={(e) => setFormData((p) => ({ ...p, contact_name: e.target.value }))} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth required label="Mobile Number *" value={formData.mobile} onChange={(e) => setFormData((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Alternate Contact" value={formData.alternate_contact} onChange={(e) => setFormData((p) => ({ ...p, alternate_contact: e.target.value.replace(/\D/g, '').slice(0, 10) }))} /></Grid>
          <Grid item xs={12}><TextField fullWidth required multiline rows={2} label="Reason *" value={formData.reason} onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth multiline rows={2} label="Current Address" value={formData.current_address} onChange={(e) => setFormData((p) => ({ ...p, current_address: e.target.value }))} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth multiline rows={2} label="Requested/New Address" value={formData.requested_address} onChange={(e) => setFormData((p) => ({ ...p, requested_address: e.target.value }))} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth type="date" InputLabelProps={{ shrink: true }} label="Preferred Processing Date" value={formData.preferred_date} onChange={(e) => setFormData((p) => ({ ...p, preferred_date: e.target.value }))} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Remarks" value={formData.remarks} onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))} /></Grid>
          <Grid item xs={12}><DocUpload label="Supporting Document" name="support_document" docs={docs} onFileChange={(n, f) => handleDoc(f)} onRemove={() => setSupportDoc(null)} hint="Ownership, NOC, or service letter" enableQr /></Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>{submitting ? <CircularProgress size={22} color="inherit" /> : 'Submit Request'}</Button>
      </DialogActions>
    </Box>
  );
};

export default GasConnectionManagementForm;
