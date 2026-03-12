import React, { useState } from 'react';
import { Box, Tabs, Tab, Divider } from '@mui/material';
import LoadChangeForm from './LoadChangeForm';
import NameChangeForm from './NameChangeForm';
import CategoryChangeForm from './CategoryChangeForm';
import ReconnectionForm from './ReconnectionForm';
import MeterReadingForm from './MeterReadingForm';

const tabs = [
  { label: 'Change of Load', Component: LoadChangeForm },
  { label: 'Change of Name / Transfer', Component: NameChangeForm },
  { label: 'Change Tariff Category', Component: CategoryChangeForm },
  { label: 'Reconnection', Component: ReconnectionForm },
  { label: 'Submit Meter Reading', Component: MeterReadingForm },
];

const ElectricityConnectionMgmtForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const { Component } = tabs[tab];

  return (
    <Box>
      <Box sx={{ bgcolor: '#6a1b9a' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: 'white' } }}
          sx={{ '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', '&.Mui-selected': { color: 'white' } } }}
        >
          {tabs.map((t, i) => <Tab key={i} label={t.label} />)}
        </Tabs>
      </Box>
      <Divider />
      <Component onClose={onClose} />
    </Box>
  );
};

export default ElectricityConnectionMgmtForm;
