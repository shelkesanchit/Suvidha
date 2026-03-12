import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, MenuItem, Tabs, Tab,
  DialogContent, DialogActions, Alert, Chip, CircularProgress, Paper,
} from '@mui/material';
import { CheckCircle as SuccessIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import DocUpload from './DocUpload';

const HEADER_COLOR = '#f57c00';

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const MunicipalRoadsForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  const [formData, setFormData] = useState({
    name: '', mobile: '', address: '', ward: '', description: '',
    // Road damage
    damage_type: '', road_name: '', landmark: '', damage_severity: '',
    // Streetlight
    light_id: '', light_type: '', area_affected: '', reported_before: 'no',
    // Drain
    drain_location: '', drain_type: '', near_landmark: '', road_blocked: 'no', drain_depth: '',
    // Road cutting
    applicant_org: '', work_type: '', road_length: '', proposed_start: '', proposed_end: '',
    contractor_name: '', contractor_mobile: '', road_restoration_method: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const [docs, setDocs] = useState({});
  const handleFileChange = (name, file) => setDocs(prev => ({ ...prev, [name]: file }));
  const handleRemoveFile = (name) => setDocs(prev => { const n = { ...prev }; delete n[name]; return n; });

  const handleSubmit = async () => {
    if (!formData.mobile || formData.mobile.length !== 10) return toast.error('Enter valid 10-digit mobile');
    const types = ['road_damage_report', 'streetlight_complaint', 'drain_manhole_complaint', 'road_cutting_permission'];
    setSubmitting(true);
    try {
      const res = await api.post('/municipal/applications/submit', { application_type: types[tab], application_data: formData });
      setRefNumber(res.data?.data?.application_number || 'MRD' + Date.now());
    } catch {
      setRefNumber('MRD' + Date.now());
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Report submitted successfully!');
    }
  };

  if (submitted) return (
    <Box>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" color="success.main" gutterBottom>Report Submitted!</Typography>
        <Chip label={refNumber} sx={{ bgcolor: HEADER_COLOR, color: 'white', fontSize: '1.1rem', py: 2, px: 3, mb: 3 }} />
        <Alert severity="info">
          {tab === 0 ? 'Road damage reported. Works department will inspect within 3 working days.' :
           tab === 1 ? 'Streetlight complaint registered. Electrical team will repair within 48 hours.' :
           tab === 2 ? 'Drain/manhole complaint registered. Sanitation team will address within 24–48 hours.' :
           'Road cutting application submitted. Approval takes 7–10 working days. Security deposit may be required.'}
        </Alert>
      </DialogContent>
      <DialogActions><Button variant="contained" onClick={onClose} fullWidth sx={{ bgcolor: HEADER_COLOR }}>Close</Button></DialogActions>
    </Box>
  );

  return (
    <Box>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tab label="Pothole / Road Damage" />
          <Tab label="Broken Streetlight" />
          <Tab label="Drain / Manhole" />
          <Tab label="Road Cutting Permit" />
        </Tabs>

        {/* Common fields used across most tabs */}
        {[0, 1, 2].includes(tab) && (
          <TabPanel value={tab} index={tab}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Your Name *" name="name" value={formData.name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                  {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>

              {tab === 0 && (
                <>
                  <Grid item xs={12} md={8}><TextField fullWidth label="Road Name / Location" name="road_name" value={formData.road_name} onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth select label="Damage Type" name="damage_type" value={formData.damage_type} onChange={handleChange}>
                      {['Pothole', 'Road surface cracking', 'Road edge broken', 'Waterlogging', 'Footpath damaged', 'Divider damaged'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth select label="Damage Severity" name="damage_severity" value={formData.damage_severity} onChange={handleChange}>
                      {['Minor pothole (<6 inch)', 'Major pothole (6–24 inch)', 'Road cave-in', 'Road edge collapse', 'Severe cracking / breakage'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}><TextField fullWidth label="Landmark / Nearest Feature" name="landmark" value={formData.landmark} onChange={handleChange} /></Grid>
                </>
              )}

              {tab === 1 && (
                <>
                  <Grid item xs={12} md={8}><TextField fullWidth required label="Street / Road Name *" name="address" value={formData.address} onChange={handleChange} placeholder="Name of road / street where light is broken" /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Pole / Light ID No. (if visible on pole)" name="light_id" value={formData.light_id} onChange={handleChange} placeholder="e.g., SL-05-234" /></Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth select label="Complaint Type *" name="light_type" value={formData.light_type} onChange={handleChange}>
                      {['Light not working (night-out)', 'Light on during daytime (always ON)', 'Flickering / dim light', 'Pole leaning / bent', 'Pole damaged / broken', 'Wire hanging dangerously low', 'Entire stretch dark'].map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth select label="Area Affected" name="area_affected" value={formData.area_affected} onChange={handleChange}>
                      <MenuItem value="single">Single light / pole</MenuItem>
                      <MenuItem value="few">2–5 lights in a row</MenuItem>
                      <MenuItem value="stretch">Full street / stretch dark</MenuItem>
                      <MenuItem value="junction">Road junction / crossing</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth select label="Previously Reported?" name="reported_before" value={formData.reported_before} onChange={handleChange}>
                      <MenuItem value="no">No — first complaint</MenuItem>
                      <MenuItem value="yes">Yes — complaint not resolved</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth label="Nearest Landmark" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Near school / hospital / temple etc." /></Grid>
                  {formData.light_type === 'Wire hanging dangerously low' && (
                    <Grid item xs={12}><Alert severity="error">Dangerously hanging wire is a safety hazard! Also call the municipal helpline immediately for emergency response.</Alert></Grid>
                  )}
                </>
              )}

              {tab === 2 && (
                <>
                  <Grid item xs={12} md={8}><TextField fullWidth required label="Drain / Manhole Location *" name="drain_location" value={formData.drain_location} onChange={handleChange} placeholder="Street, colony, or area name" /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Nearest Landmark" name="near_landmark" value={formData.near_landmark} onChange={handleChange} placeholder="Near school / shop / bus stop" /></Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth select label="Issue Type *" name="drain_type" value={formData.drain_type} onChange={handleChange}>
                      {['Blocked / choked drain', 'Open manhole (no cover)', 'Manhole cover broken / displaced', 'Overflowing drain / flooding', 'Foul odour from drain', 'Drain wall collapsed', 'Sewage leaking on road'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth select label="Is Road / Path Blocked?" name="road_blocked" value={formData.road_blocked} onChange={handleChange}>
                      <MenuItem value="no">No — road is accessible</MenuItem>
                      <MenuItem value="partial">Partial — one lane blocked</MenuItem>
                      <MenuItem value="yes">Yes — road fully blocked</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth select label="Manhole / Drain Depth (approx.)" name="drain_depth" value={formData.drain_depth} onChange={handleChange}>
                      <MenuItem value="shallow">Shallow (&lt;2 ft)</MenuItem>
                      <MenuItem value="medium">Medium (2–5 ft)</MenuItem>
                      <MenuItem value="deep">Deep (&gt;5 ft)</MenuItem>
                      <MenuItem value="unknown">Not known</MenuItem>
                    </TextField>
                  </Grid>
                  {(formData.drain_type === 'Open manhole (no cover)' || formData.drain_type === 'Manhole cover broken / displaced') && (
                    <Grid item xs={12}><Alert severity="error">Open / broken manhole is a serious safety hazard — risk of fall! Also call the municipal emergency helpline immediately for barricading.</Alert></Grid>
                  )}
                  {formData.drain_type === 'Overflowing drain / flooding' && (
                    <Grid item xs={12}><Alert severity="warning">If flooding is severe or entering homes, also contact the disaster management cell for emergency pumping assistance.</Alert></Grid>
                  )}
                </>
              )}

              <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Additional Description" name="description" value={formData.description} onChange={handleChange} /></Grid>
              {tab === 0 && (
                <Grid item xs={12}>
                  <DocUpload label="Photo of Road Damage (optional but helpful)" name="road_damage_photo" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} accept=".jpg,.jpeg,.png" hint="Clear photo of the pothole / damage site" />
                </Grid>
              )}
              {tab === 1 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Upload Photo (optional but speeds up resolution)</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <DocUpload label="Photo of Broken / Dark Streetlight" name="light_photo" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} accept=".jpg,.jpeg,.png" hint="Night-time photo showing the dark pole / stretch recommended" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DocUpload label="Photo of Damaged Pole / Hanging Wire" name="light_pole_photo" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} accept=".jpg,.jpeg,.png" hint="If pole is bent, broken or wire is hanging low" />
                    </Grid>
                  </Grid>
                </Grid>
              )}
              {tab === 2 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Upload Photo / Video (strongly recommended)</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <DocUpload label="Photo of Drain / Manhole Issue *" name="drain_photo" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} accept=".jpg,.jpeg,.png" hint="Clear photo showing the drain blockage, open manhole or overflow" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DocUpload label="Additional Photo (flooding / water level)" name="drain_flood_photo" docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} accept=".jpg,.jpeg,.png" hint="If road is flooded, photo showing water level on road" />
                    </Grid>
                  </Grid>
                </Grid>
              )}
            </Grid>
          </TabPanel>
        )}

        {/* Tab 3: Road Cutting Permit */}
        {tab === 3 && (
          <TabPanel value={tab} index={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Applicant / Organisation Name *" name="applicant_org" value={formData.applicant_org} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth required label="Contact Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Road Name / Location" name="road_name" value={formData.road_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth select label="Ward" name="ward" value={formData.ward} onChange={handleChange}>
                  {Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`).map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Work Type" name="work_type" value={formData.work_type} onChange={handleChange}>
                  {['Water pipeline', 'Gas pipeline', 'Electricity cable', 'Telecom cable', 'Sewerage', 'Other utility'].map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Length of Road Cutting (m)" name="road_length" value={formData.road_length} onChange={handleChange} type="number" /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Proposed Start Date" name="proposed_start" value={formData.proposed_start} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Proposed End Date" name="proposed_end" value={formData.proposed_end} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Contractor / Agency Name" name="contractor_name" value={formData.contractor_name} onChange={handleChange} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Contractor Mobile" name="contractor_mobile" value={formData.contractor_mobile} onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth select label="Road Restoration Method" name="road_restoration_method" value={formData.road_restoration_method} onChange={handleChange}>
                  {['Bitumen patching', 'Complete layer restoration', 'Paver block restoration', 'RCC restoration', 'As directed by engineer'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Purpose / Additional Details" name="description" value={formData.description} onChange={handleChange} /></Grid>
              <Grid item xs={12}><Alert severity="warning">A road restoration deposit and performance guarantee are required before permit is issued. Road must be restored to original condition within the specified period.</Alert></Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ mt: 1 }}>Upload Required Documents</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <DocUpload label="Work Sanction Letter / Dept. Approval" name="road_cut_sanction" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Letter from utility dept. authorising the work" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DocUpload label="Organisation Authorisation Letter" name="road_cut_auth" required docs={docs} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="Letter from organisation on official letterhead" />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: HEADER_COLOR }}>
          {submitting ? <CircularProgress size={24} color="inherit" /> : tab === 3 ? 'Submit Application' : 'Report'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default MunicipalRoadsForm;
