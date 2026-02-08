import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Pages
import LandingPage from './pages/LandingPage';
import KioskPage from './pages/KioskPage';
import GasServicesPage from './pages/GasServicesPage';
import MunicipalServicesPage from './pages/MunicipalServicesPage';
import WaterServicesPage from './pages/WaterServicesPage';
import ConsumerRegistrationPage from './pages/ConsumerRegistrationPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<ConsumerRegistrationPage />} />
      <Route path="/electricity" element={<KioskPage />} />
      <Route path="/kiosk" element={<KioskPage />} />
      <Route path="/gas" element={<GasServicesPage />} />
      <Route path="/water" element={<WaterServicesPage />} />
      <Route path="/municipal" element={<MunicipalServicesPage />} />
      <Route path="/municipal/water" element={<WaterServicesPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
