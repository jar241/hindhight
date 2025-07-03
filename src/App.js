// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './App.css'; // 전역 스타일
import LandingPage from './LandingPage';
import Dashboard from './dashboard'; // 우리가 만든 대시보드를 불러옵니다.
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Navigate to="/dashboard/nke" replace />} />
          <Route path="/dashboard/:ticker" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
