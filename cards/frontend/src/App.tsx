import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import './App.css';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/landing" />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>

        {/*/!* protected routes, put any pages that require login here*!/*/}
        {/*<Route path="/floridex" element={*/}
        {/*    <ProtectedRoute><Floridex /></ProtectedRoute>*/}
        {/*} />*/}
        {/*/!* protected routes *!/*/}
        {/*<Route path="/log-bird" element={*/}
        {/*    <ProtectedRoute><LogBird /></ProtectedRoute>*/}
        {/*} />*/}
    </BrowserRouter>
  );
}

export default App;
