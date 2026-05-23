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
import ExamScoresPage from './components/ExamScoresPage';
import ServiceTestPage from './components/ServiceTestPage';
import { authService } from './services/AuthService';
import { notifyService } from './services/NotifyService';
import './App.css';

// component that protects pages from unauthorized users
const ProtectedRoute = ({ user, requiredRole, children }) => {
  // if no user is logged in, send to login page
  if (!user) return <Navigate to="/login" replace />;
  // if page requires a role and user has another role, send to their respective dashboard
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  }
  // if user is authorized, render the page
  return children;
};

function App() {
  // load current user from localStorage when app first starts
  const [user, setUser] = useState(() => authService.getCurrentUser());

  // called after successful login
  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  // logout user from service and React state
  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    // show logout notification
    notifyService.notifyInfo('You have been logged out.');
  };

  // decide where user should be redirected by default
  const defaultRoute = user
    ? (user.role === 'teacher' ? '/teacher' : '/student')
    : '/login';

  return (
    <HashRouter>
      <div className="App">
        {/* show navbar only when user is logged in */}
        {user && <Navbar user={user} onLogout={handleLogout} />}

        <main>
          <Routes>
            {/* login page */}
            <Route
              path="/login"
              element={user ? <Navigate to={defaultRoute} replace /> : <LoginPage onLogin={handleLogin} />}
            />
            {/* registration page */}
            <Route
              path="/register"
              element={user ? <Navigate to={defaultRoute} replace /> : <RegisterPage />}
            />
            {/* teacher dashboard */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute user={user} requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            {/* student portal */}
            <Route
              path="/student"
              element={
                <ProtectedRoute user={user} requiredRole="student">
                  <StudentPortal />
                </ProtectedRoute>
              }
            />
            {/* page for student to take an exam */}
            <Route
              path="/exam/:examId"
              element={
                <ProtectedRoute user={user} requiredRole="student">
                  <TakeExam />
                </ProtectedRoute>
              }
            />
            {/* page for teacher to create a new exam */}
            <Route
              path="/exam/new"
              element={
                <ProtectedRoute user={user} requiredRole="teacher">
                  <CreateExamPage />
                </ProtectedRoute>
              }
            />
            {/* page for teacher to edit an existing exam */}
            <Route
              path="/exam/edit/:examId"
              element={
                <ProtectedRoute user={user} requiredRole="teacher">
                  <EditExamPage />
                </ProtectedRoute>
              }
            />
            {/* page for teacher to view scores and grade submissions for an exam */}
            <Route
              path="/exam/:examId/scores"
              element={
                <ProtectedRoute user={user} requiredRole="teacher">
                  <ExamScoresPage />
                </ProtectedRoute>
              }
            />
            {/* public debug/service test page */}
            <Route
              path="/test-services"
              element={<ServiceTestPage />}
            />
            {/* redirect unknown URLs to default route */}
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
