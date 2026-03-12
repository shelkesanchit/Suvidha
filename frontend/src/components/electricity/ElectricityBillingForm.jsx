import React, { useState } from 'react';
import { Box, Tabs, Tab, Divider } from '@mui/material';
import BillPaymentForm from './BillPaymentForm';
import PrepaidRechargeForm from './PrepaidRechargeForm';
import BillCalculator from './BillCalculator';

const tabs = [
  { label: 'Pay Electricity Bill', Component: BillPaymentForm },
  { label: 'Prepaid Meter Recharge', Component: PrepaidRechargeForm },
  { label: 'Bill Calculator', Component: BillCalculator },
];

const ElectricityBillingForm = ({ onClose }) => {
  const [tab, setTab] = useState(0);
  const { Component } = tabs[tab];

  return (
    <Box>
      <Box sx={{ bgcolor: '#1565c0' }}>
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

export default ElectricityBillingForm;
