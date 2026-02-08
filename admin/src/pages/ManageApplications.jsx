import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  CheckCircle,
  Visibility,
  CloudUpload,
  Description as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as DocIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ManageApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionData, setActionData] = useState({ status: '', remarks: '', current_stage: '' });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? `?application_status=${filterStatus}` : '';
      console.log('Fetching applications from:', `/admin/applications${params}`);
      const response = await api.get(`/admin/applications${params}`);
      console.log('Received applications:', response.data);
      // Handle both old array format and new {success, data} format
      const appData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setApplications(appData);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (app) => {
    setSelectedApp(app);
    setActionData({
      application_status: app.application_status || app.status,
      remarks: app.remarks || ''
    });
    setDialogOpen(true);
  };

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setDetailsOpen(true);
  };

  const handleUpdateStatus = async () => {
    try {
      console.log('Updating application with data:', actionData);
      await api.put(`/admin/applications/${selectedApp.id}`, actionData);
      toast.success('Application updated successfully');
      setDialogOpen(false);
      fetchApplications();
    } catch (error) {
      console.error('Update error:', error.response?.data);
      toast.error(error.response?.data?.errors?.[0]?.msg || error.response?.data?.error || 'Failed to update application');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'info',
      document_verification: 'info',
      site_inspection: 'warning',
      approval_pending: 'warning',
      approved: 'success',
      rejected: 'error',
      work_in_progress: 'warning',
      completed: 'success',
    };
    return colors[status] || 'default';
  };

  const stageOptions = [
    { value: 'Application Submitted', label: 'Application Submitted' },
    { value: 'Document Verification', label: 'Document Verification' },
    { value: 'Site Inspection Scheduled', label: 'Site Inspection Scheduled' },
    { value: 'Approval Pending', label: 'Approval Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Work in Progress', label: 'Work in Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setUploadFiles(files);
  };

  const handleUploadDocuments = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      uploadFiles.forEach((file) => {
        formData.append('documents', file);
      });

      await api.post(`/admin/applications/${selectedApp.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Documents uploaded successfully');
      setUploadFiles([]);
      fetchApplications();
      setDetailsOpen(false);
      setTimeout(() => {
        const app = applications.find(a => a.id === selectedApp.id);
        if (app) handleViewDetails(app);
      }, 500);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon color="primary" />;
    if (ext === 'pdf') return <PdfIcon color="error" />;
    return <DocIcon color="action" />;
  };

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setDocumentDialogOpen(true);
  };

  const handleDownloadDocument = (doc) => {
    const link = document.createElement('a');
    link.href = doc.url || `data:${doc.type};base64,${doc.data}`;
    link.download = doc.name || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Manage Applications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and process customer applications
          </Typography>
        </div>
        <TextField
          select
          size="small"
          label="Filter by Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="submitted">Submitted</MenuItem>
          <MenuItem value="document_verification">Document Verification</MenuItem>
          <MenuItem value="site_inspection">Site Inspection</MenuItem>
          <MenuItem value="approval_pending">Approval Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="work_in_progress">Work in Progress</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
        </TextField>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 300, gap: 2 }}>
          <CircularProgress size={50} />
          <Typography variant="h6" color="text.secondary">Loading applications...</Typography>
        </Box>
      ) : applications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No applications found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filterStatus ? 'Try changing the filter criteria' : 'New applications will appear here when submitted from the kiosk'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {applications.map((app) => (
            <Grid item xs={12} key={app.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <div>
                      <Typography variant="h6">
                        {app.application_type.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {app.application_number}
                      </Typography>
                    </div>
                    <Chip
                      label={(app.application_status || app.status).replace(/_/g, ' ').toUpperCase()}
                      color={getStatusColor(app.application_status || app.status)}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Applicant</Typography>
                      <Typography variant="body1">{app.applicant_name || app.full_name || 'N/A'}</Typography>
                      <Typography variant="body2">{app.email || 'N/A'}</Typography>
                      <Typography variant="body2">{app.mobile || app.phone || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Submitted</Typography>
                      <Typography variant="body1">
                        {new Date(app.submitted_at).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>

                  {app.remarks && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight={600}>Remarks:</Typography>
                      <Typography variant="body2">{app.remarks}</Typography>
                    </Box>
                  )}

                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetails(app)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => handleOpenDialog(app)}
                    >
                      Update Status
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle component="div" sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Update Application Status</Typography>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedApp && (
            <>
              {/* Application Info Header */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Application Number</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedApp.application_number}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Applicant</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedApp.full_name || selectedApp.application_data?.full_name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Application Type</Typography>
                    <Typography variant="body2">{selectedApp.application_type?.replace(/_/g, ' ').toUpperCase()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Current Status</Typography>
                    <Chip
                      label={selectedApp.status?.replace(/_/g, ' ').toUpperCase()}
                      size="small"
                      color={getStatusColor(selectedApp.status)}
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Divider sx={{ mb: 3 }} />

              {/* Status Selection */}
              <TextField
                fullWidth
                select
                label="New Status *"
                value={actionData.application_status}
                onChange={(e) => setActionData({ ...actionData, application_status: e.target.value })}
                sx={{ mb: 3 }}
                helperText="Select the new status for this application"
              >
                <MenuItem value="submitted">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="S" size="small" color="info" sx={{ width: 24, height: 24 }} />
                    Submitted
                  </Box>
                </MenuItem>
                <MenuItem value="document_verification">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="DV" size="small" color="warning" sx={{ width: 24, height: 24 }} />
                    Document Verification
                  </Box>
                </MenuItem>
                <MenuItem value="site_inspection">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="SI" size="small" color="secondary" sx={{ width: 24, height: 24 }} />
                    Site Inspection
                  </Box>
                </MenuItem>
                <MenuItem value="approval_pending">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="AP" size="small" color="warning" sx={{ width: 24, height: 24 }} />
                    Approval Pending
                  </Box>
                </MenuItem>
                <MenuItem value="approved">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="✓" size="small" color="success" sx={{ width: 24, height: 24 }} />
                    Approved
                  </Box>
                </MenuItem>
                <MenuItem value="work_in_progress">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="WP" size="small" color="primary" sx={{ width: 24, height: 24 }} />
                    Work in Progress
                  </Box>
                </MenuItem>
                <MenuItem value="completed">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="✓✓" size="small" color="success" sx={{ width: 24, height: 24 }} />
                    Completed
                  </Box>
                </MenuItem>
                <MenuItem value="rejected">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="✗" size="small" color="error" sx={{ width: 24, height: 24 }} />
                    Rejected
                  </Box>
                </MenuItem>
              </TextField>

              {/* Remarks */}
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Remarks / Notes"
                value={actionData.remarks}
                onChange={(e) => setActionData({ ...actionData, remarks: e.target.value })}
                placeholder="Enter any remarks, notes, or reasons for status change..."
                helperText="These remarks will be visible to the applicant"
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdateStatus} color="primary">
            Update Application
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle component="div">
          <Typography variant="h5" fontWeight={600}>
            Application Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedApp && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Application Number</Typography>
                  <Typography variant="h6">{selectedApp.application_number}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography variant="h6">
                    {selectedApp.application_type.replace(/_/g, ' ').toUpperCase()}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>Applicant Information</Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Full Name</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedApp.application_data?.full_name || selectedApp.applicant_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Father's/Husband's Name</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedApp.application_data?.father_husband_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.date_of_birth || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Gender</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.gender?.toUpperCase() || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Identity Type</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.identity_type?.toUpperCase() || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Identity Number</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.identity_number || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Mobile</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedApp.application_data?.mobile || selectedApp.mobile || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Alternate Mobile</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.alternate_mobile || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.email || selectedApp.email || 'N/A'}</Typography>
                  </Grid>
                  {selectedApp.application_data?.pan_number && (
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">PAN Number</Typography>
                      <Typography variant="body1">{selectedApp.application_data?.pan_number}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>Premises Information</Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Premises Address</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedApp.application_data?.premises_address || selectedApp.address || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Plot/House No.</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.plot_number || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Landmark</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.landmark || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">City/Village</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.city || selectedApp.city || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">District</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.district || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">State</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.state || selectedApp.state || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Pincode</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.pincode || selectedApp.pincode || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Khata/Survey No.</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.khata_number || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Ownership Type</Typography>
                    <Chip
                      label={selectedApp.application_data?.ownership_type?.toUpperCase() || 'N/A'}
                      size="small"
                      color={selectedApp.application_data?.ownership_type === 'owned' ? 'success' : 'warning'}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Built-up Area</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.built_up_area ? `${selectedApp.application_data.built_up_area} Sq.Ft` : 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>Connection Details</Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Connection Category</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedApp.application_data?.category || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Purpose of Connection</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedApp.application_data?.purpose?.replace(/_/g, ' ')?.toUpperCase() || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Load Type</Typography>
                    <Chip
                      label={selectedApp.application_data?.load_type === 'single_phase' ? 'Single Phase' : 'Three Phase'}
                      size="small"
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Required Load</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedApp.application_data?.required_load ? `${selectedApp.application_data.required_load} KW` : 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Supply Voltage</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.supply_voltage || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Phases</Typography>
                    <Typography variant="body1">{selectedApp.application_data?.phases || 'N/A'} Phase</Typography>
                  </Grid>
                  {selectedApp.application_data?.connected_load && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Connected Load</Typography>
                      <Typography variant="body1">{selectedApp.application_data.connected_load} KW</Typography>
                    </Grid>
                  )}
                  {selectedApp.application_data?.existing_consumer_number && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Existing Consumer Number</Typography>
                      <Typography variant="body1">{selectedApp.application_data.existing_consumer_number}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {selectedApp.stage_history && selectedApp.stage_history.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>Stage History</Typography>
                  <Stepper orientation="vertical" sx={{ mt: 2 }}>
                    {selectedApp.stage_history.map((stage, index) => (
                      <Step key={index} active completed>
                        <StepLabel icon={<CheckCircle color="success" />}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {stage.stage}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(stage.timestamp).toLocaleString()}
                          </Typography>
                          {stage.remarks && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {stage.remarks}
                            </Typography>
                          )}
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </>
              )}

              {/* Documents Section */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>Documents</Typography>

              {selectedApp.documents && selectedApp.documents.length > 0 ? (
                <List>
                  {selectedApp.documents.map((doc, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                      }}
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            edge="end"
                            onClick={() => handleViewDocument(doc)}
                            size="small"
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDownloadDocument(doc)}
                            size="small"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemIcon>
                        {getFileIcon(doc.name)}
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.name || `Document ${index + 1}`}
                        secondary={doc.type || 'Document'}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No documents available
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog
        open={documentDialogOpen}
        onClose={() => setDocumentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Document Preview</Typography>
          <IconButton onClick={() => setDocumentDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                {selectedDocument.name || 'Document'}
              </Typography>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                {selectedDocument.type?.startsWith('image/') ? (
                  <img
                    src={selectedDocument.url || `data:${selectedDocument.type};base64,${selectedDocument.data}`}
                    alt={selectedDocument.name}
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                  />
                ) : selectedDocument.type === 'application/pdf' ? (
                  <iframe
                    src={selectedDocument.url || `data:application/pdf;base64,${selectedDocument.data}`}
                    style={{ width: '100%', height: '70vh', border: 'none' }}
                    title={selectedDocument.name}
                  />
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <FileIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Preview not available for this file type
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadDocument(selectedDocument)}
                      sx={{ mt: 2 }}
                    >
                      Download File
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleDownloadDocument(selectedDocument)}
          >
            Download
          </Button>
          <Button onClick={() => setDocumentDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageApplications;
