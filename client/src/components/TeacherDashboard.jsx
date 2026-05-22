import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [searchText, setSearchText] = useState('');

  const filteredExams = exams.filter(exam => {
    const s = searchText.toLowerCase();
    return (exam.title || '').toLowerCase().includes(s) || (exam.id || '').toLowerCase().includes(s);
  });

  useEffect(() => {
    examService.getAllExams()
      .then(data => { setExams(data); setLoading(false); })
      .catch(err => { loggerService.error('TeacherDashboard › getAllExams():', err); setLoading(false); });
  }, []);

  const handleDelete = async (exam) => {
    if (!window.confirm(`Delete "${exam.title}"? This cannot be undone.`)) return;
    await examService.deleteExam(exam.id);
    setExams(prev => prev.filter(e => e.id !== exam.id));
    notifyService.notifySuccess(`"${exam.title}" deleted.`);
    loggerService.log('TeacherDashboard › deleted exam:', exam.id);
  };

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selectedExam) {
    const questions = selectedExam.questions || [];

    return (
      <div className="container mt-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Exam Details — {selectedExam.title}</h5>
            <button className="btn btn-light btn-sm" onClick={() => setSelectedExam(null)}>
              Back to Dashboard
            </button>
          </div>
          <div className="card-body">
            <div className="d-flex gap-4 mb-3">
              <span><strong>ID:</strong> {selectedExam.id}</span>
              <span><strong>Time limit:</strong> {selectedExam.timeLimit} min</span>
              <span><strong>Passing grade:</strong> {selectedExam.passingGrade}%</span>
            </div>
            <p><strong>Questions ({questions.length}):</strong></p>
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
        </div>
      </div>
    );
  }

  // ── Main dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Teacher Dashboard</h5>
        </div>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Exams</h5>
            <button className="btn btn-success btn-sm" onClick={() => navigate('/exam/new')}>+ Create New Exam</button>
          </div>

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
                  <div className="card h-100">
                    <div className="card-body">
                      <p className="text-muted small mb-1">ID: {exam.id}</p>
                      <h6 className="fw-semibold mb-2">{exam.title}</h6>
                      <div className="d-flex gap-3 text-muted small mb-3">
                        <span>Questions: <strong>{(exam.questions || []).length}</strong></span>
                        <span>Time: <strong>{exam.timeLimit} min</strong></span>
                        <span>Pass: <strong>{exam.passingGrade}%</strong></span>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <button className="btn btn-outline-info btn-sm" onClick={() => setSelectedExam(exam)}>
                          View Details
                        </button>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(`/exam/${exam.id}/scores`)}>
                          View Scores
                        </button>
                        <button className="btn btn-outline-warning btn-sm" onClick={() => navigate(`/exam/edit/${exam.id}`)}>
                          Edit
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(exam)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
