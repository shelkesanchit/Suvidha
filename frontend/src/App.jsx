import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import HomePage from './pages/HomePage';
import KioskPage from './pages/KioskPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/kiosk" replace />} />
      <Route path="/kiosk" element={<KioskPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
