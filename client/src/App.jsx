import React, { useState } from 'react';
import TeacherDashboard from './TeacherDashboard';
import StudentPortal from './StudentPortal';
import './App.css';

function App() {
  const [role, setRole] = useState('teacher'); // Default role

  // Function to toggle between teacher and student roles
  const toggleRole = () => {
    setRole(prevRole => (prevRole === 'teacher' ? 'student' : 'teacher'));
  };

  return (
    <div className="App">
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4 px-4 shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1 text-primary">E-Test System</span>
          <div className="d-flex align-items-center">
            <span className="me-3 badge bg-secondary text-capitalize">Mode: {role}</span>
            <button
              className={`btn ${role === 'teacher' ? 'btn-outline-dark' : 'btn-outline-primary'}`}
              onClick={toggleRole}
            >
              Switch to {role === 'teacher' ? 'Student' : 'Teacher'} Portal
            </button>
          </div>
        </div>
      </nav>

      <main>
        {role === 'teacher' ? (
          <TeacherDashboard />
        ) : (
          <StudentPortal />
        )}
      </main>

      <footer className="mt-5 py-4 border-top text-center text-muted">
        <p>&copy; 2026 E-Test System | Mock Backend Version</p>
      </footer>
    </div>
  );
}

export default App;
