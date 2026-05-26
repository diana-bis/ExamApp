import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { submissionService } from '../api/SubmissionService';
import { authService } from '../services/AuthService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

const HEADER_GRADIENT = 'linear-gradient(135deg, #1a237e 0%, #4527a0 50%, #6a1b9a 100%)';
const SIDEBAR_ACTIVE = 'linear-gradient(135deg, #4527a0, #6a1b9a)';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('exams'); // 'exams' | 'studentResults'
  const [exams, setExams] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [submissionCounts, setSubmissionCounts] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // currently selected exam for details screen
  // null = dashboard mode
  const [selectedExam, setSelectedExam] = useState(null);
  const [searchText, setSearchText] = useState('');

  // filter exams based on search text matching title or id (case-insensitive)
  const filteredExams = exams.filter(exam => {
    const s = searchText.toLowerCase();
    return (exam.title || '').toLowerCase().includes(s) || (exam.id || '').toLowerCase().includes(s);
  });

  // runs once when component mounts, loads all exams, submissions and users
  useEffect(() => {
    Promise.all([
      examService.getAllExams(),
      submissionService.getAllSubmissions(),
      authService.getUsers(),
    ])
      .then(([examsData, allSubs, userList]) => {
        // on success, save data to state and turn off loading
        setExams(examsData);
        setAllSubmissions(allSubs);
        setUsers(userList);
        const counts = {};
        allSubs.forEach(s => { counts[s.examId] = (counts[s.examId] || 0) + 1; });
        setSubmissionCounts(counts);
        setLoading(false);
      })
      .catch(err => { loggerService.error('TeacherDashboard › load:', err); setLoading(false); });
  }, []);

  // toggle exam status between 'draft' and 'published'
  const handleToggleStatus = async (exam) => {
    const newStatus = exam.status === 'published' ? 'draft' : 'published';
    // update status in backend
    await examService.updateExam(exam.id, { status: newStatus });
    // update status in React state
    setExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: newStatus } : e));
    notifyService.notifySuccess(`"${exam.title}" is now ${newStatus}.`);
    loggerService.log('TeacherDashboard › status changed:', exam.id, '→', newStatus);
  };

  // delete exam after confirming with user - this action cannot be undone
  const handleDelete = async (exam) => {
    if (!window.confirm(`Delete "${exam.title}"? This cannot be undone.`)) return;
    await examService.deleteExam(exam.id);
    setExams(prev => prev.filter(e => e.id !== exam.id));
    notifyService.notifySuccess(`"${exam.title}" deleted.`);
    loggerService.log('TeacherDashboard › deleted exam:', exam.id);
  };

  // ── Sidebar ────────────────────────────────────────────────────────────────

  const navItem = (targetView, icon, label, badge = null) => {
    const active = view === targetView && !selectedExam;
    return (
      <button
        className="btn btn-sm text-start w-100 d-flex align-items-center gap-2"
        style={{
          background: active ? SIDEBAR_ACTIVE : 'transparent',
          color: active ? '#fff' : '#555',
          border: active ? 'none' : '1px solid #dee2e6',
          borderRadius: 8,
          transition: 'all 0.15s ease',
          fontWeight: active ? 600 : 400,
        }}
        onClick={() => { setView(targetView); setSelectedExam(null); }}
      >
        <i className={`bi ${icon}`}></i>
        <span className="flex-grow-1">{label}</span>
        {badge !== null && (
          <span className="badge rounded-pill"
            style={{ background: active ? 'rgba(255,255,255,0.25)' : '#6a1b9a', color: '#fff', fontSize: '0.7rem' }}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  // ── Detail view ────────────────────────────────────────────────────────────
  // if an exam is selected, show details screen instead of dashboard

  const renderDetailView = () => {
    // empty array if no questions exist
    const questions = selectedExam.questions || [];
    return (
      <div>
        <button className="btn btn-sm mb-3 d-flex align-items-center gap-1"
          style={{ background: '#f3e5f5', color: '#4527a0', border: 'none', borderRadius: 8 }}
          onClick={() => setSelectedExam(null)}>
          <i className="bi bi-arrow-left"></i> Back
        </button>
        <h5 className="fw-bold mb-1" style={{ color: '#4527a0' }}>{selectedExam.title}</h5>
        <div className="d-flex gap-3 mb-4 text-muted small flex-wrap">
          <span><strong>ID:</strong> {selectedExam.id}</span>
          <span><i className="bi bi-clock me-1"></i>{selectedExam.timeLimit} min</span>
          <span><i className="bi bi-award me-1"></i>Pass at {selectedExam.passingGrade}%</span>
        </div>
        {/* questions section */}
        <p className="fw-semibold mb-2">Questions ({questions.length}):</p>
        <div className="d-flex flex-column gap-2">
          {questions.map((q, index) => (
            <div key={q.id || index} className="rounded-3 bg-white shadow-sm p-3"
              style={{ borderLeft: `4px solid ${q.type === 'MULTIPLE_CHOICE' ? '#6a1b9a' : '#9575cd'}` }}>
              <div className="d-flex justify-content-between align-items-start">
                <h6 className="mb-1">Q{index + 1}: {q.text}</h6>
                <span className="badge ms-2" style={{ background: q.type === 'MULTIPLE_CHOICE' ? SIDEBAR_ACTIVE : '#607d8b' }}>
                  {q.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Open Ended'}
                </span>
              </div>
              {q.type === 'MULTIPLE_CHOICE' && q.options && (
                <ul className="mb-0 mt-1 small">
                  {q.options.map((option, i) => (
                    <li key={i} className={option === q.correctAnswer ? 'fw-semibold text-success' : 'text-muted'}>
                      {option}{option === q.correctAnswer ? ' ✓' : ''}
                    </li>
                  ))}
                </ul>
              )}
              {q.type === 'OPEN_ENDED' && (
                <p className="mb-0 text-muted small mt-1">Manual grading required</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Exams list view ─────────────────────────────────────────────────────────

  const renderExamsView = () => (
    <div>
      <style>{`
        .exam-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .exam-card:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(74,39,160,0.13) !important; }
      `}</style>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by title or ID"
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        style={{ background: '#f8f5ff', border: '1px solid #d1c4e9' }}
      />
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: '#6a1b9a' }}></div>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-inbox" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
          <p className="mt-2">No exams found.</p>
        </div>
      ) : (
        <div className="row g-3">
          {filteredExams.map(exam => (
            <div key={exam.id} className="col-md-6">
              <div className="exam-card card h-100 border-0 shadow-sm position-relative"
                style={{ borderTop: `3px solid ${exam.status === 'published' ? '#6a1b9a' : '#b0bec5'}` }}>
                <button
                  className="btn btn-link text-danger p-0 position-absolute"
                  style={{ top: '0.6rem', right: '0.6rem', lineHeight: 1 }}
                  title="Delete exam"
                  onClick={() => handleDelete(exam)}
                >
                  <i className="bi bi-trash3" style={{ fontSize: '1.1rem' }}></i>
                </button>
                <div className="card-body pe-5">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <p className="text-muted small mb-0">ID: {exam.id}</p>
                    <span className="badge rounded-pill"
                      style={{ background: exam.status === 'published' ? '#e8f5e9' : '#f5f5f5', color: exam.status === 'published' ? '#2e7d32' : '#757575', border: `1px solid ${exam.status === 'published' ? '#a5d6a7' : '#e0e0e0'}` }}>
                      {exam.status === 'published' ? '● Published' : '● Draft'}
                    </span>
                  </div>
                  <h6 className="fw-bold mb-2" style={{ color: '#1a237e' }}>{exam.title}</h6>
                  <div className="d-flex gap-3 text-muted small mb-3 flex-wrap">
                    <span>Questions: <strong>{(exam.questions || []).length}</strong></span>
                    <span>Time: <strong>{exam.timeLimit} min</strong></span>
                    <span>Pass: <strong>{exam.passingGrade}%</strong></span>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      className="btn btn-sm"
                      style={{ background: exam.status === 'published' ? '#f3e5f5' : SIDEBAR_ACTIVE, color: exam.status === 'published' ? '#6a1b9a' : '#fff', border: exam.status === 'published' ? '1px solid #ce93d8' : 'none', borderRadius: 6 }}
                      onClick={() => handleToggleStatus(exam)}
                    >
                      {exam.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 6 }} onClick={() => setSelectedExam(exam)}>
                      View Details
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 6 }} onClick={() => navigate(`/exam/${exam.id}/scores`)}>
                      Submissions ({submissionCounts[exam.id] || 0})
                    </button>
                    <button className="btn btn-sm btn-outline-warning" style={{ borderRadius: 6 }} onClick={() => navigate(`/exam/edit/${exam.id}`)}>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Student results view ────────────────────────────────────────────────────

  const renderStudentResultsView = () => {
    if (loading) return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: '#6a1b9a' }}></div>
      </div>
    );
    if (allSubmissions.length === 0) return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-inbox" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
        <p className="mt-2">No submissions yet.</p>
      </div>
    );

    return (
      <div className="table-responsive">
        <table className="table table-hover align-middle" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f3e5f5' }}>
              <th className="py-2 px-3" style={{ color: '#4527a0', borderBottom: '2px solid #ce93d8' }}>Student</th>
              <th className="py-2 px-3" style={{ color: '#4527a0', borderBottom: '2px solid #ce93d8' }}>Exam</th>
              <th className="py-2 px-3" style={{ color: '#4527a0', borderBottom: '2px solid #ce93d8' }}>Grade</th>
              <th className="py-2 px-3" style={{ color: '#4527a0', borderBottom: '2px solid #ce93d8' }}>Result</th>
              <th className="py-2 px-3" style={{ color: '#4527a0', borderBottom: '2px solid #ce93d8' }}>Published</th>
              <th className="py-2 px-3" style={{ color: '#4527a0', borderBottom: '2px solid #ce93d8' }}>Submitted</th>
              <th className="py-2 px-3" style={{ color: '#4527a0', borderBottom: '2px solid #ce93d8' }}></th>
            </tr>
          </thead>
          <tbody>
            {allSubmissions.map(sub => {
              const student = users.find(u => u.id === sub.studentId);
              const exam = exams.find(e => e.id === sub.examId);
              const passed = exam ? (sub.grade ?? 0) >= exam.passingGrade : false;
              return (
                <tr key={sub.id} style={{ transition: 'background 0.12s' }}>
                  <td className="px-3 small fw-semibold">{student ? `${student.name} (@${student.username})` : sub.studentId}</td>
                  <td className="px-3 small">{exam ? exam.title : sub.examId}</td>
                  <td className="px-3"><strong style={{ color: passed ? '#2e7d32' : '#c62828' }}>{sub.grade ?? '—'}%</strong></td>
                  <td className="px-3">
                    <span className={`badge ${passed ? 'bg-success' : 'bg-danger'}`}>
                      {passed ? 'Pass' : 'Fail'}
                    </span>
                  </td>
                  <td className="px-3">
                    <small className={sub.resultsPublished ? 'text-success' : 'text-warning'}>
                      {sub.resultsPublished ? '● Published' : '● Pending'}
                    </small>
                  </td>
                  <td className="px-3 text-muted small">
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-3">
                    {exam && (
                      <button
                        className="btn btn-sm py-0 px-2"
                        style={{ background: SIDEBAR_ACTIVE, color: '#fff', border: 'none', borderRadius: 6 }}
                        onClick={() => navigate(`/exam/${exam.id}/scores`)}
                      >
                        Grade
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ── Main dashboard ─────────────────────────────────────────────────────────

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow-lg border-0 overflow-hidden">

        {/* Header */}
        <div className="py-3 px-4 text-white" style={{ background: HEADER_GRADIENT }}>
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center"
              style={{ width: 46, height: 46, flexShrink: 0 }}>
              <i className="bi bi-person-workspace text-white" style={{ fontSize: '1.4rem' }}></i>
            </div>
            <div>
              <h5 className="mb-0 fw-bold">Teacher Dashboard</h5>
              <small className="opacity-75">Manage your exams and review student results</small>
            </div>
          </div>
        </div>

        <div className="d-flex" style={{ minHeight: '70vh' }}>

          {/* Sidebar */}
          <div className="border-end d-flex flex-column p-3 gap-2"
            style={{ width: 200, minWidth: 200, background: '#faf5ff' }}>
            {navItem('exams', 'bi-journal-text', 'Exams')}
            {navItem('studentResults', 'bi-people', 'Student Results', allSubmissions.length || null)}
            <hr className="my-1" />
            <button
              className="btn btn-sm text-start text-white fw-semibold"
              style={{ background: 'linear-gradient(135deg, #2e7d32, #43a047)', border: 'none', borderRadius: 8 }}
              onClick={() => navigate('/exam/new')}
            >
              <i className="bi bi-plus-lg me-2"></i>New Exam
            </button>
          </div>

          {/* Main content */}
          <div className="flex-grow-1 p-4 overflow-auto" style={{ background: '#fdfaff' }}>
            {selectedExam
              ? renderDetailView()
              : view === 'studentResults'
                ? renderStudentResultsView()
                : renderExamsView()
            }
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
