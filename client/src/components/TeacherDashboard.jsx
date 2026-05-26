import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { submissionService } from '../api/SubmissionService';
import { authService } from '../services/AuthService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

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

  const navItem = (targetView, icon, label) => (
    <button
      className={`btn btn-sm text-start w-100 ${view === targetView && !selectedExam ? 'btn-primary' : 'btn-outline-secondary'}`}
      onClick={() => { setView(targetView); setSelectedExam(null); }}
    >
      <i className={`bi ${icon} me-2`}></i>{label}
    </button>
  );

  // ── Detail view ────────────────────────────────────────────────────────────
  // if an exam is selected, show details screen instead of dashboard

  const renderDetailView = () => {
    // empty array if no questions exist
    const questions = selectedExam.questions || [];
    return (
      <div>
        <button className="btn btn-outline-secondary btn-sm mb-3" onClick={() => setSelectedExam(null)}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
        <h5 className="fw-semibold mb-3">{selectedExam.title}</h5>
        <div className="d-flex gap-4 mb-3 text-muted small">
          <span><strong>ID:</strong> {selectedExam.id}</span>
          <span><strong>Time limit:</strong> {selectedExam.timeLimit} min</span>
          <span><strong>Passing grade:</strong> {selectedExam.passingGrade}%</span>
        </div>
        {/* questions section */}
        <p className="fw-semibold mb-2">Questions ({questions.length}):</p>
        <div className="list-group">
          {questions.map((q, index) => (
            <div key={q.id || index} className="list-group-item">
              <div className="d-flex justify-content-between align-items-start">
                <h6 className="mb-1">Q{index + 1}: {q.text}</h6>
                <span className={`badge ${q.type === 'MULTIPLE_CHOICE' ? 'bg-primary' : 'bg-secondary'} ms-2`}>
                  {q.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Open Ended'}
                </span>
              </div>
              {q.type === 'MULTIPLE_CHOICE' && q.options && (
                <ul className="mb-1 mt-1">
                  {q.options.map((option, i) => (
                    <li key={i} className={option === q.correctAnswer ? 'fw-semibold text-success' : ''}>
                      {option}{option === q.correctAnswer ? ' ✓' : ''}
                    </li>
                  ))}
                </ul>
              )}
              {q.type === 'OPEN_ENDED' && (
                <p className="mb-0 text-muted small">Manual grading required</p>
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
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by title or ID"
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
      />
      {loading ? (
        <p className="text-muted">Loading exams...</p>
      ) : filteredExams.length === 0 ? (
        <p className="text-muted">No exams found.</p>
      ) : (
        <div className="row g-3">
          {filteredExams.map(exam => (
            <div key={exam.id} className="col-md-6">
              <div className="card h-100 position-relative">
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
                    <span className={`badge ${exam.status === 'published' ? 'bg-success' : 'bg-secondary'}`}>
                      {exam.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <h6 className="fw-semibold mb-2">{exam.title}</h6>
                  <div className="d-flex gap-3 text-muted small mb-3">
                    <span>Questions: <strong>{(exam.questions || []).length}</strong></span>
                    <span>Time: <strong>{exam.timeLimit} min</strong></span>
                    <span>Pass: <strong>{exam.passingGrade}%</strong></span>
                    <span>Submissions: <strong>{submissionCounts[exam.id] || 0}</strong></span>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      className={`btn btn-sm ${exam.status === 'published' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => handleToggleStatus(exam)}
                    >
                      {exam.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="btn btn-outline-info btn-sm" onClick={() => setSelectedExam(exam)}>
                      View Details
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(`/exam/${exam.id}/scores`)}>
                      Submissions ({submissionCounts[exam.id] || 0})
                    </button>
                    <button className="btn btn-outline-warning btn-sm" onClick={() => navigate(`/exam/edit/${exam.id}`)}>
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
    if (loading) return <p className="text-muted">Loading...</p>;
    if (allSubmissions.length === 0) return <p className="text-muted">No submissions yet.</p>;

    return (
      <table className="table table-bordered table-sm table-hover">
        <thead className="table-light">
          <tr>
            <th>Student</th>
            <th>Exam</th>
            <th>Grade</th>
            <th>Result</th>
            <th>Published</th>
            <th>Submitted</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {allSubmissions.map(sub => {
            const student = users.find(u => u.id === sub.studentId);
            const exam = exams.find(e => e.id === sub.examId);
            const passed = exam ? (sub.grade ?? 0) >= exam.passingGrade : false;
            return (
              <tr key={sub.id}>
                <td>{student ? `${student.name} (@${student.username})` : sub.studentId}</td>
                <td>{exam ? exam.title : sub.examId}</td>
                <td><strong>{sub.grade ?? '—'}%</strong></td>
                <td>
                  <span className={`badge ${passed ? 'bg-success' : 'bg-danger'}`}>
                    {passed ? 'Pass' : 'Fail'}
                  </span>
                </td>
                <td>
                  <small className={sub.resultsPublished ? 'text-success' : 'text-warning'}>
                    {sub.resultsPublished ? '● Published' : '● Pending'}
                  </small>
                </td>
                <td className="text-muted small">
                  {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                </td>
                <td>
                  {exam && (
                    <button
                      className="btn btn-outline-primary btn-sm py-0 px-2"
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
    );
  };

  // ── Main dashboard ─────────────────────────────────────────────────────────

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Teacher Dashboard</h5>
        </div>
        <div className="d-flex" style={{ minHeight: '70vh' }}>

          {/* Sidebar */}
          <div className="border-end bg-light d-flex flex-column p-3 gap-2" style={{ width: '200px', minWidth: '200px' }}>
            {navItem('exams', 'bi-journal-text', 'Exams')}
            {navItem('studentResults', 'bi-people', 'Student Results')}
            <hr className="my-1" />
            <button className="btn btn-success btn-sm text-start" onClick={() => navigate('/exam/new')}>
              <i className="bi bi-plus-lg me-2"></i>New Exam
            </button>
          </div>

          {/* Main content */}
          <div className="flex-grow-1 p-4 overflow-auto">
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
