import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import TeacherDashboard from './components/TeacherDashboard';
import StudentPortal from './components/StudentPortal';
import TakeExam from './components/TakeExam';
import EditExamPage from './components/EditExamPage';
import CreateExamPage from './components/CreateExamPage';
import ServiceTestPage from './components/ServiceTestPage';
import { authService } from './services/AuthService';
import { notifyService } from './services/NotifyService';
import './App.css';

const ProtectedRoute = ({ user, requiredRole, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(() => authService.getCurrentUser());

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    notifyService.notifyInfo('You have been logged out.');
  };

  const defaultRoute = user
    ? (user.role === 'teacher' ? '/teacher' : '/student')
    : '/login';

  return (
    <HashRouter>
      <div className="App">
        {user && <Navbar user={user} onLogout={handleLogout} />}

        <main>
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to={defaultRoute} replace /> : <LoginPage onLogin={handleLogin} />}
            />
            <Route
              path="/register"
              element={user ? <Navigate to={defaultRoute} replace /> : <RegisterPage />}
            />
            <Route
              path="/teacher"
              element={
                <ProtectedRoute user={user} requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student"
              element={
                <ProtectedRoute user={user} requiredRole="student">
                  <StudentPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam/:examId"
              element={
                <ProtectedRoute user={user} requiredRole="student">
                  <TakeExam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam/new"
              element={
                <ProtectedRoute user={user} requiredRole="teacher">
                  <CreateExamPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam/edit/:examId"
              element={
                <ProtectedRoute user={user} requiredRole="teacher">
                  <EditExamPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-services"
              element={<ServiceTestPage />}
            />
            <Route path="/" element={<Navigate to={defaultRoute} replace />} />
            <Route path="*" element={<Navigate to={defaultRoute} replace />} />
          </Routes>
        </main>

        <footer className="mt-5 py-4 border-top text-center text-muted">
          <p>&copy; 2026 E-Test System | Mock Backend Version</p>
        </footer>
      </div>
    </HashRouter>
  );
}

export default App;
