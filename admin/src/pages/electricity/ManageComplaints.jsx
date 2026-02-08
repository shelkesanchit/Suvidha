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
  CircularProgress,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import api from '../../utils/electricity/api';
import toast from 'react-hot-toast';

const ManageComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionData, setActionData] = useState({ status: '', resolution_notes: '' });

  useEffect(() => {
    fetchComplaints();
  }, [filterStatus]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? `?status=${filterStatus}` : '';
      console.log('Fetching complaints from:', `/admin/complaints${params}`);
      const response = await api.get(`/admin/complaints${params}`);
      console.log('Received complaints:', response.data);
      setComplaints(response.data);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (complaint) => {
    setSelectedComplaint(complaint);
    setActionData({ 
      status: complaint.status, 
      resolution_notes: complaint.resolution_notes || '' 
    });
    setDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    try {
      await api.put(`/admin/complaints/${selectedComplaint.id}`, actionData);
      toast.success('Complaint updated successfully');
      setDialogOpen(false);
      fetchComplaints();
    } catch (error) {
      toast.error('Failed to update complaint');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'error',
      assigned: 'warning',
      in_progress: 'info',
      resolved: 'success',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      critical: 'error',
    };
    return colors[priority] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Manage Complaints
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and resolve customer complaints
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
          <MenuItem value="open">Open</MenuItem>
          <MenuItem value="assigned">Assigned</MenuItem>
          <MenuItem value="in_progress">In Progress</MenuItem>
          <MenuItem value="resolved">Resolved</MenuItem>
        </TextField>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 300, gap: 2 }}>
          <CircularProgress size={50} />
          <Typography variant="h6" color="text.secondary">Loading complaints...</Typography>
        </Box>
      ) : complaints.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No complaints found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filterStatus ? 'Try changing the filter criteria' : 'Customer complaints will appear here'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {complaints.map((complaint) => (
          <Grid item xs={12} key={complaint.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <div>
                    <Typography variant="h6">
                      {complaint.complaint_type.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {complaint.complaint_number} | Consumer: {complaint.consumer_number}
                    </Typography>
                  </div>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={complaint.priority.toUpperCase()}
                      color={getPriorityColor(complaint.priority)}
                      size="small"
                    />
                    <Chip
                      label={complaint.status.replace(/_/g, ' ').toUpperCase()}
                      color={getStatusColor(complaint.status)}
                    />
                  </Box>
                </Box>

                <Typography variant="body2" paragraph>
                  {complaint.description}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Customer</Typography>
                    <Typography variant="body1">{complaint.full_name}</Typography>
                    <Typography variant="body2">{complaint.phone}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Submitted</Typography>
                    <Typography variant="body1">
                      {new Date(complaint.submitted_at).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>

                {complaint.resolution_notes && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight={600}>Resolution:</Typography>
                    <Typography variant="body2">{complaint.resolution_notes}</Typography>
                  </Box>
                )}

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedComplaint(complaint);
                      setDetailsOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="contained"
                    color={complaint.status === 'open' ? 'error' : 'primary'}
                    onClick={() => handleOpenDialog(complaint)}
                  >
                    {complaint.status === 'open' ? 'Assign & Resolve' : 'Update Status'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Complaint Status</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Status"
            value={actionData.status}
            onChange={(e) => setActionData({ ...actionData, status: e.target.value })}
            sx={{ mt: 2, mb: 3 }}
          >
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="assigned">Assigned</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Resolution Notes"
            value={actionData.resolution_notes}
            onChange={(e) => setActionData({ ...actionData, resolution_notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateStatus}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" fontWeight={600}>
            Complaint Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedComplaint && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Complaint Number</Typography>
                  <Typography variant="h6">{selectedComplaint.complaint_number}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography variant="h6">
                    {selectedComplaint.complaint_type.replace(/_/g, ' ').toUpperCase()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Priority</Typography>
                  <Chip
                    label={selectedComplaint.priority.toUpperCase()}
                    color={getPriorityColor(selectedComplaint.priority)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedComplaint.status.replace(/_/g, ' ').toUpperCase()}
                    color={getStatusColor(selectedComplaint.status)}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>Description</Typography>
              <Typography variant="body1" paragraph>
                {selectedComplaint.description}
              </Typography>

              {selectedComplaint.location && (
                <>
                  <Typography variant="h6" gutterBottom>Location</Typography>
                  <Typography variant="body1" paragraph>
                    {selectedComplaint.location}
                  </Typography>
                </>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>Customer Information</Typography>
              <Typography variant="body1">
                <strong>Name:</strong> {selectedComplaint.full_name || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Phone:</strong> {selectedComplaint.phone || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Consumer Number:</strong> {selectedComplaint.consumer_number || 'N/A'}
              </Typography>

              {selectedComplaint.stage_history && selectedComplaint.stage_history.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>Status History</Typography>
                  <Stepper orientation="vertical" sx={{ mt: 2 }}>
                    {selectedComplaint.stage_history.map((stage, index) => (
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageComplaints;
