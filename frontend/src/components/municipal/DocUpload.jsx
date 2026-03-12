import React from 'react';
import { Box, Typography, Button, Chip, IconButton, Paper } from '@mui/material';
import { CloudUpload as UploadIcon, Close as CloseIcon, CheckCircle as CheckIcon } from '@mui/icons-material';

/**
 * Reusable document / photo upload field for municipal forms.
 * Props:
 *   label        – field label text
 *   name         – key used in the docs state object
 *   required     – shows asterisk if true
 *   docs         – the shared docs state object { [name]: File }
 *   onFileChange – (name, File) => void
 *   onRemove     – (name) => void
 *   accept       – accepted MIME/extension string (default: pdf + images)
 *   hint         – optional helper text shown below label
 */
const DocUpload = ({
  label,
  name,
  required = false,
  docs = {},
  onFileChange,
  onRemove,
  accept = '.pdf,.jpg,.jpeg,.png',
  hint,
}) => {
  const file = docs[name];
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderStyle: 'dashed',
        borderColor: file ? 'success.main' : 'grey.400',
        bgcolor: file ? '#f1f8e9' : '#fafafa',
        borderRadius: 1,
        transition: 'all 0.2s',
      }}
    >
      <Typography
        variant="caption"
        color={file ? 'success.main' : 'text.secondary'}
        display="block"
        fontWeight={600}
        gutterBottom
      >
        {label}
        {required && <span style={{ color: '#d32f2f' }}> *</span>}
      </Typography>

      {hint && !file && (
        <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 0.5 }}>
          {hint}
        </Typography>
      )}

      {file ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <CheckIcon fontSize="small" color="success" />
          <Chip
            label={file.name.length > 32 ? file.name.substring(0, 29) + '…' : file.name}
            size="small"
            color="success"
            variant="outlined"
          />
          <IconButton
            size="small"
            onClick={() => onRemove(name)}
            sx={{ color: 'error.main' }}
            title="Remove file"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            component="label"
            startIcon={<UploadIcon />}
            size="small"
            variant="outlined"
            sx={{ textTransform: 'none', fontSize: '0.78rem' }}
          >
            Choose File
            <input
              type="file"
              hidden
              accept={accept}
              onChange={(e) => {
                if (e.target.files?.[0]) onFileChange(name, e.target.files[0]);
              }}
            />
          </Button>
          <Typography variant="caption" color="text.disabled">
            PDF / JPG / PNG
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DocUpload;
