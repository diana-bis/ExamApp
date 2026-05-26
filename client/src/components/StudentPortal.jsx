import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { submissionService } from '../api/SubmissionService';
import { authService } from '../services/AuthService';
import { loggerService } from '../services/LoggerService';
import { notifyService } from '../services/NotifyService';

const StudentPortal = () => {
  const navigate = useNavigate();
  // currently logged-in user
  const currentUser = authService.getCurrentUser();

  const [view, setView] = useState('findExam');

  // exam ID typed by student
  const [examId, setExamId] = useState('');
  // currently loaded exam
  const [exam, setExam] = useState(null);
  // loading state for fetching exam
  const [loading, setLoading] = useState(false);
  // student's past submissions
  const [mySubmissions, setMySubmissions] = useState([]);
  const [allExams, setAllExams] = useState([]);

  // Runs once when component mounts
  useEffect(() => {
    // safety check - if no user is logged in, don't attempt to load submission history
    if (!currentUser) return;
    Promise.all([
      submissionService.getSubmissionsByStudent(currentUser.id),
      examService.getAllExams(),
    ]).then(([subs, exams]) => {
      // sort submissions by submission date (newest first)
      setMySubmissions(subs.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
      setAllExams(exams);
    }).catch(err => loggerService.error('StudentPortal › load history failed:', err));
  }, []);

  // Search exam by ID
  const handleFetchExam = async () => {
    const id = examId.trim();
    if (!id) {
      notifyService.notifyError('Please enter an Exam ID.');
      return;
    }

    setLoading(true);
    setExam(null);
    loggerService.log(`Student fetching exam — id: "${id}"`);

    // fetch exam from backend/mockDb
    try {
      const data = await examService.getExamById(id);
      // prevent access to unpublished exams
      if (data.status && data.status !== 'published') {
        notifyService.notifyError('This exam is not yet available.');
        return;
      }
      loggerService.log(`Exam found — title: "${data.title}", questions: ${data.questions.length}`);
      notifyService.notifySuccess(`Exam "${data.title}" loaded successfully.`);
      setExam(data);
    } catch (err) {
      loggerService.error('Exam fetch failed:', err.message);
      notifyService.notifyError(`Exam not found: "${id}". Check the ID and try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Allow Enter key to search exam
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleFetchExam();
  };

  // when student clicks "Begin Exam", navigate to exam page with exam id in URL
  const handleBegin = () => {
    loggerService.log(`Student beginning exam — id: "${exam.id}"`);
    // navigate to TakeExam page
    navigate(`/exam/${exam.id}`);
  };

  // ── Find exam view ──────────────────────────────────────────────────────────

  // filter published exams by title or ID while the student is typing
  const suggestions = examId.trim() && !exam
    ? allExams.filter(e => {
        const s = examId.toLowerCase();
        return e.status === 'published' && (
          (e.title || '').toLowerCase().includes(s) ||
          (e.id || '').toLowerCase().includes(s)
        );
      })
    : [];

  // select a suggestion — set the exam directly without an extra fetch
  const handleSelectSuggestion = (selected) => {
    setExamId(selected.id);
    setExam(selected);
    notifyService.notifySuccess(`Exam "${selected.title}" loaded successfully.`);
    loggerService.log(`Exam found — title: "${selected.title}", questions: ${selected.questions.length}`);
  };

  const renderFindExamView = () => (
    <div>
      <div className="mb-4">
        <label className="form-label fw-semibold">Enter Exam ID to Start</label>
        <div className="position-relative">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search by title or ID"
              value={examId}
              onChange={(e) => { setExamId(e.target.value); setExam(null); }}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleFetchExam}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Find Exam'}
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 10, top: '100%' }}>
              {suggestions.map(e => (
                <button
                  key={e.id}
                  type="button"
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  onMouseDown={() => handleSelectSuggestion(e)}
                >
                  <span>{e.title}</span>
                  <small className="text-muted">{e.id}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {exam && (
        <div className="mt-3 p-3 border rounded bg-light">
          <h5 className="mb-1">{exam.title}</h5>
          <p className="text-muted mb-3">
            ID: <strong>{exam.id}</strong> &nbsp;|&nbsp; {exam.questions.length} question{exam.questions.length !== 1 ? 's' : ''}
          </p>
          <button className="btn btn-success" onClick={handleBegin}>
            Confirm and Begin
          </button>
        </div>
      )}
    </div>
  );

  // ── My results view ─────────────────────────────────────────────────────────

  const renderMyResultsView = () => (
    <div>
      {mySubmissions.length === 0 ? (
        <p className="text-muted">No submissions yet.</p>
      ) : (
        <div className="list-group">
          {mySubmissions.map(sub => {
            const examData = allExams.find(e => e.id === sub.examId);
            const passed = (sub.grade ?? 0) >= (examData?.passingGrade ?? 0);
            return (
              <div key={sub.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1 fw-semibold">{examData?.title ?? sub.examId}</h6>
                    <small className="text-muted">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                    </small>
                  </div>
                  {sub.resultsPublished ? (
                    <div className="text-end">
                      <div className="fw-bold">{sub.grade ?? '—'}%</div>
                      <span className={`badge ${passed ? 'bg-success' : 'bg-danger'}`}>
                        {passed ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                  ) : (
                    <span className="badge bg-warning text-dark">Pending review</span>
                  )}
                </div>
                {sub.resultsPublished && sub.feedback && (
                  <div className="mt-2 p-2 bg-light rounded border small">
                    <span className="fw-semibold">Teacher feedback: </span>{sub.feedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">Student Portal</h5>
        </div>
        <div className="d-flex" style={{ minHeight: '70vh' }}>

          {/* Sidebar */}
          <div className="border-end bg-light d-flex flex-column p-3 gap-2" style={{ width: '200px', minWidth: '200px' }}>
            <button
              className={`btn btn-sm text-start w-100 ${view === 'findExam' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setView('findExam')}
            >
              <i className="bi bi-search me-2"></i>Find Exam
            </button>
            <button
              className={`btn btn-sm text-start w-100 ${view === 'myResults' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setView('myResults')}
            >
              <i className="bi bi-bar-chart-line me-2"></i>My Results
              {mySubmissions.length > 0 && (
                <span className="badge bg-secondary ms-2">{mySubmissions.length}</span>
              )}
            </button>
          </div>

          {/* Main content */}
          <div className="flex-grow-1 p-4 overflow-auto">
            {view === 'myResults' ? renderMyResultsView() : renderFindExamView()}
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
