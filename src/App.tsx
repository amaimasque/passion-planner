import React, { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Budget from './pages/budget/Budget';
import Settings from './pages/settings/Settings';
import Suppliers from './pages/suppliers/Suppliers';
import Payments from './pages/payments/Payments';
import Guests from './pages/guests/Guests';
import WeddingDetails from './pages/wedding-details/WeddingDetails';
import Processional from './pages/processional/Processional';
import Checklist from './pages/checklist/Checklist';
import Seating from './pages/seating/Seating';
import Media from './pages/media/Media';
import RsvpPage from './pages/rsvp/RsvpPage';
import Landing from './pages/landing/Landing';

function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <PrivateRoute>
      <AppLayout>{children}</AppLayout>
    </PrivateRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
          <Route path="/budget"    element={<PrivateLayout><Budget /></PrivateLayout>} />
          <Route path="/suppliers" element={<PrivateLayout><Suppliers /></PrivateLayout>} />
          <Route path="/payments"  element={<PrivateLayout><Payments /></PrivateLayout>} />
          <Route path="/guests"    element={<PrivateLayout><Guests /></PrivateLayout>} />
          <Route path="/wedding"        element={<PrivateLayout><WeddingDetails /></PrivateLayout>} />
          <Route path="/processional"   element={<PrivateLayout><Processional /></PrivateLayout>} />
          <Route path="/seating"        element={<PrivateLayout><Seating /></PrivateLayout>} />
          <Route path="/checklist"      element={<PrivateLayout><Checklist /></PrivateLayout>} />
          <Route path="/media"          element={<PrivateLayout><Media /></PrivateLayout>} />
          <Route path="/settings"  element={<PrivateLayout><Settings /></PrivateLayout>} />
          <Route path="/rsvp/:token" element={<RsvpPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
