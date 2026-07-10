import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { submissionService } from '../api/SubmissionService';
import { authService } from '../services/AuthService';
import { loggerService } from '../services/LoggerService';
import { notifyService } from '../services/NotifyService';

const HEADER_GRADIENT = 'linear-gradient(135deg, #1a237e 0%, #0288d1 60%, #00bcd4 100%)';
const SIDEBAR_ACTIVE   = 'linear-gradient(135deg, #0288d1, #00bcd4)';

// Returns 'not_yet' | 'closed' | 'open'
const getAvailabilityStatus = (exam) => {
    const now = new Date();
    if (exam.availableFrom && new Date(exam.availableFrom) > now) return 'not_yet';
    if (exam.availableTo   && new Date(exam.availableTo)   < now) return 'closed';
    return 'open';
};

const fmtDate = (val) => val ? new Date(val).toLocaleString() : '';

const StudentPortal = () => {
  const navigate = useNavigate();
  // currently logged-in user
  const currentUser = authService.getCurrentUser();

  const [view, setView] = useState('findExam'); // 'findExam' | 'myResults'
  const [expandedSubs, setExpandedSubs] = useState(new Set());

  const toggleExpanded = (id) => setExpandedSubs(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // exam ID typed by student
  const [examId, setExamId] = useState('');
  // currently loaded exam
  const [exam, setExam] = useState(null);
  // loading state for fetching exam
  const [loading, setLoading] = useState(false);
  // student's past submissions
  const [mySubmissions, setMySubmissions] = useState([]);
  const [allExams, setAllExams] = useState([]);
  // existing submission for the currently previewed exam (null = not attempted yet)
  const [existingSubmission, setExistingSubmission] = useState(null);

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
      // check if student has already attempted this exam
      const sub = await submissionService.getSubmissionByStudentAndExam(currentUser?.id, data.id);
      setExistingSubmission(sub);
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
  const handleSelectSuggestion = async (selected) => {
    setExamId(selected.id);
    setExam(selected);
    notifyService.notifySuccess(`Exam "${selected.title}" loaded successfully.`);
    loggerService.log(`Exam found — title: "${selected.title}", questions: ${selected.questions.length}`);
    const sub = await submissionService.getSubmissionByStudentAndExam(currentUser?.id, selected.id);
    setExistingSubmission(sub);
  };

  const renderFindExamView = () => (
    <div className="d-flex flex-column align-items-center" style={{ maxWidth: 520, margin: '0 auto' }}>

      {/* Hero icon */}
      <div className="rounded-circle d-flex align-items-center justify-content-center mb-3"
        style={{ width: 72, height: 72, background: SIDEBAR_ACTIVE, boxShadow: '0 4px 16px rgba(2,136,209,0.35)' }}>
        <i className="bi bi-search text-white" style={{ fontSize: '1.8rem' }}></i>
      </div>
      <h5 className="fw-bold mb-1 text-center">Find Your Exam</h5>
      <p className="text-muted small mb-4 text-center">Type the exam title or ID to get started</p>

      <div className="w-100 mb-2">
        <div className="position-relative">
          <div className="input-group input-group-lg shadow-sm">
            <input
              type="text"
              className="form-control border-0"
              style={{ boxShadow: 'none', borderRadius: '10px 0 0 10px', background: '#f0f7ff' }}
              placeholder="Search by title or ID"
              value={examId}
              onChange={(e) => { setExamId(e.target.value); setExam(null); setExistingSubmission(null); }}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button
              className="btn text-white px-4 fw-semibold"
              type="button"
              onClick={handleFetchExam}
              disabled={loading}
              style={{ background: SIDEBAR_ACTIVE, borderRadius: '0 10px 10px 0', border: 'none' }}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Searching...</>
                : <><i className="bi bi-search me-2"></i>Find</>}
            </button>
          </div>

          {/* Suggestion dropdown */}
          {suggestions.length > 0 && (
            <div className="position-absolute w-100 shadow rounded-3 overflow-hidden"
              style={{ zIndex: 10, top: 'calc(100% + 4px)', border: '1px solid #cce5ff' }}>
              {suggestions.map(e => (
                <button
                  key={e.id}
                  type="button"
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center px-3 py-2"
                  style={{ transition: 'background 0.12s ease' }}
                  onMouseDown={() => handleSelectSuggestion(e)}
                >
                  <span className="fw-semibold small">{e.title}</span>
                  <span className="badge rounded-pill ms-2" style={{ background: '#e3f2fd', color: '#0288d1' }}>{e.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exam preview card */}
      {exam && (
        <div className="w-100 mt-3 rounded-4 overflow-hidden shadow-sm exam-preview-card">
          <div className="px-4 py-3 text-white d-flex align-items-center gap-3"
            style={{ background: SIDEBAR_ACTIVE }}>
            <i className="bi bi-journal-check" style={{ fontSize: '1.6rem' }}></i>
            <div>
              <div className="fw-bold fs-6">{exam.title}</div>
              <small className="opacity-75">ID: {exam.id}</small>
            </div>
          </div>
          <div className="px-4 py-3 bg-white" style={{ borderTop: '1px solid #e3f2fd' }}>
            <div className="d-flex gap-3 text-muted small mb-3 flex-wrap">
              <span><i className="bi bi-question-circle me-1"></i><strong>{exam.questions.length}</strong> question{exam.questions.length !== 1 ? 's' : ''}</span>
              <span><i className="bi bi-clock me-1"></i><strong>{exam.timeLimit}</strong> min</span>
              <span><i className="bi bi-award me-1"></i>Pass at <strong>{exam.passingGrade}%</strong></span>
              {exam.availableFrom && <span><i className="bi bi-calendar-check me-1"></i>Opens <strong>{fmtDate(exam.availableFrom)}</strong></span>}
              {exam.availableTo   && <span><i className="bi bi-calendar-x me-1"></i>Closes <strong>{fmtDate(exam.availableTo)}</strong></span>}
            </div>
            {(() => {
              const avail = getAvailabilityStatus(exam);
              if (avail === 'not_yet') return (
                <span className="badge px-3 py-2" style={{ fontSize: '0.85rem', borderRadius: 8, background: '#e3f2fd', color: '#0288d1' }}>
                  <i className="bi bi-hourglass-split me-2"></i>Opens {fmtDate(exam.availableFrom)}
                </span>
              );
              if (avail === 'closed') return (
                <span className="badge px-3 py-2" style={{ fontSize: '0.85rem', borderRadius: 8, background: '#ffebee', color: '#c62828' }}>
                  <i className="bi bi-calendar-x me-2"></i>Closed {fmtDate(exam.availableTo)}
                </span>
              );
              // open — check submission state
              if (existingSubmission && !existingSubmission.reopened) return (
                <span className="badge bg-secondary px-3 py-2" style={{ fontSize: '0.85rem', borderRadius: 8 }}>
                  <i className="bi bi-lock-fill me-2"></i>Already attempted
                </span>
              );
              if (existingSubmission?.reopened) return (
                <button className="btn text-white fw-semibold px-4" onClick={handleBegin}
                  style={{ background: 'linear-gradient(135deg, #e65100, #ff6d00)', border: 'none', borderRadius: 8 }}>
                  <i className="bi bi-arrow-repeat me-2"></i>Re-take Exam
                </button>
              );
              return (
                <button className="btn text-white fw-semibold px-4" onClick={handleBegin}
                  style={{ background: 'linear-gradient(135deg, #2e7d32, #43a047)', border: 'none', borderRadius: 8 }}>
                  <i className="bi bi-play-circle-fill me-2"></i>Begin Exam
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );

  // ── My results view ─────────────────────────────────────────────────────────

  const renderMyResultsView = () => {
    if (mySubmissions.length === 0) {
      return (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-inbox" style={{ fontSize: '3rem', opacity: 0.35 }}></i>
          <p className="mt-3">No submissions yet.</p>
        </div>
      );
    }

    // compute stats for the summary row
    const publishedSubs = mySubmissions.filter(s => s.resultsPublished);
    const passCount    = publishedSubs.filter(s => {
      const e = allExams.find(ex => ex.id === s.examId);
      return (s.grade ?? 0) >= (e?.passingGrade ?? 0);
    }).length;
    const failCount    = publishedSubs.length - passCount;
    const pendingCount = mySubmissions.filter(s => !s.resultsPublished).length;

    return (
      <div>
        {/* Stats summary */}
        <div className="row g-3 mb-4">
          {[
            { label: 'Submitted', value: mySubmissions.length, icon: 'bi-send-check',    color: '#0288d1', bg: '#e3f2fd' },
            { label: 'Passed',    value: passCount,            icon: 'bi-trophy-fill',   color: '#2e7d32', bg: '#e8f5e9' },
            { label: 'Failed',    value: failCount,            icon: 'bi-x-circle-fill', color: '#c62828', bg: '#ffebee' },
            { label: 'Pending',   value: pendingCount,         icon: 'bi-hourglass-split',color: '#e65100', bg: '#fff3e0' },
          ].map(stat => (
            <div key={stat.label} className="col-6 col-md-3">
              <div className="rounded-3 p-3 d-flex align-items-center gap-3 shadow-sm"
                style={{ background: stat.bg }}>
                <i className={`bi ${stat.icon}`} style={{ fontSize: '1.6rem', color: stat.color }}></i>
                <div>
                  <div className="fw-bold fs-5" style={{ color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <small className="text-muted">{stat.label}</small>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submission list */}
        <div className="d-flex flex-column gap-2">
          {mySubmissions.map(sub => {
            const examData = allExams.find(e => e.id === sub.examId);
            const passed   = (sub.grade ?? 0) >= (examData?.passingGrade ?? 0);
            const borderColor = !sub.resultsPublished ? '#ffc107'
              : passed ? '#28a745' : '#dc3545';

            return (
              <div key={sub.id} className="rounded-3 bg-white shadow-sm overflow-hidden result-card"
                style={{ borderLeft: `5px solid ${borderColor}` }}>
                <div className="px-4 py-3 d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <h6 className="mb-1 fw-semibold">{examData?.title ?? sub.examId}</h6>
                    <small className="text-muted">
                      <i className="bi bi-calendar3 me-1"></i>
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                    </small>
                  </div>
                  {sub.resultsPublished ? (
                    <div className="text-end">
                      <div className="fw-bold fs-5" style={{ color: passed ? '#2e7d32' : '#c62828' }}>
                        {sub.grade ?? '—'}%
                      </div>
                      <span className={`badge ${passed ? 'bg-success' : 'bg-danger'}`}>
                        {passed ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                  ) : (
                    <span className="badge bg-warning text-dark">
                      <i className="bi bi-hourglass-split me-1"></i>Pending review
                    </span>
                  )}
                </div>

                {/* Feedback */}
                {sub.resultsPublished && sub.feedback && (
                  <div className="px-4 pb-2">
                    <div className="rounded-3 p-2 small" style={{ background: '#f0f7ff', borderLeft: '3px solid #0288d1' }}>
                      <i className="bi bi-chat-left-quote me-1 text-primary"></i>
                      <span className="fw-semibold">Teacher feedback: </span>{sub.feedback}
                    </div>
                  </div>
                )}

                {/* View Details toggle — only when results published and exam data available */}
                {sub.resultsPublished && examData && (
                  <div className="px-4 pb-3">
                    <button
                      className="btn btn-sm d-flex align-items-center gap-1"
                      style={{ color: '#0288d1', background: 'none', border: 'none', padding: 0, fontSize: '0.82rem' }}
                      onClick={() => toggleExpanded(sub.id)}
                    >
                      <i className={`bi ${expandedSubs.has(sub.id) ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                      {expandedSubs.has(sub.id) ? 'Hide breakdown' : 'View question breakdown'}
                    </button>

                    {expandedSubs.has(sub.id) && (
                      <div className="mt-2 d-flex flex-column gap-2">
                        {examData.questions.map((q, idx) => {
                          const studentAnswer = sub.answers?.[q.id];
                          const isCorrect = q.type === 'MULTIPLE_CHOICE' && studentAnswer === q.correctAnswer;
                          const isWrong   = q.type === 'MULTIPLE_CHOICE' && studentAnswer !== q.correctAnswer;

                          return (
                            <div key={q.id} className="rounded-3 p-3 small"
                              style={{
                                background: q.type === 'MULTIPLE_CHOICE'
                                  ? (isCorrect ? '#f0fdf4' : '#fff5f5')
                                  : '#f8f9fa',
                                border: `1px solid ${q.type === 'MULTIPLE_CHOICE' ? (isCorrect ? '#bbf7d0' : '#fecaca') : '#dee2e6'}`
                              }}>
                              <div className="d-flex align-items-start gap-2 mb-2">
                                {q.type === 'MULTIPLE_CHOICE' && (
                                  <i className={`bi ${isCorrect ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} mt-1`}
                                    style={{ color: isCorrect ? '#16a34a' : '#dc2626', flexShrink: 0 }}></i>
                                )}
                                {q.type === 'OPEN_ENDED' && (
                                  <i className="bi bi-pencil-square mt-1 text-muted" style={{ flexShrink: 0 }}></i>
                                )}
                                <span className="fw-semibold text-dark">Q{idx + 1}. {q.text}</span>
                              </div>

                              {q.type === 'MULTIPLE_CHOICE' && (
                                <div className="d-flex flex-column gap-1 ms-4">
                                  <div>
                                    <span className="text-muted me-1">Your answer:</span>
                                    <span className="fw-semibold" style={{ color: isCorrect ? '#16a34a' : '#dc2626' }}>
                                      {studentAnswer ?? <em className="text-muted">No answer</em>}
                                    </span>
                                  </div>
                                  {isWrong && (
                                    <div>
                                      <span className="text-muted me-1">Correct answer:</span>
                                      <span className="fw-semibold" style={{ color: '#16a34a' }}>{q.correctAnswer}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {q.type === 'OPEN_ENDED' && (
                                <div className="ms-4">
                                  <span className="text-muted me-1">Your answer:</span>
                                  <span>{studentAnswer ?? <em className="text-muted">No answer</em>}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="container mt-4 mb-5">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .exam-preview-card { animation: fadeSlideIn 0.3s ease forwards; }
        .result-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .result-card:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(0,0,0,0.10) !important; }
      `}</style>

      <div className="card shadow-lg border-0 overflow-hidden">

        {/* Header */}
        <div className="card-header border-0 py-3 text-white" style={{ background: HEADER_GRADIENT }}>
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center"
              style={{ width: 46, height: 46, flexShrink: 0 }}>
              <i className="bi bi-mortarboard-fill text-white" style={{ fontSize: '1.4rem' }}></i>
            </div>
            <div>
              <h5 className="mb-0 fw-bold">Student Portal</h5>
              {currentUser && <small className="opacity-75">Welcome back, {currentUser.name}!</small>}
            </div>
          </div>
        </div>

        <div className="d-flex" style={{ minHeight: '70vh' }}>

          {/* Sidebar */}
          <div className="border-end d-flex flex-column p-3 gap-2"
            style={{ width: 200, minWidth: 200, background: '#f8fbff' }}>
            {[
              { id: 'findExam',  icon: 'bi-search',         label: 'Find Exam',   badge: null },
              { id: 'myResults', icon: 'bi-bar-chart-line',  label: 'My Results',  badge: mySubmissions.length || null },
            ].map(item => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  className="btn btn-sm text-start w-100 d-flex align-items-center gap-2"
                  style={{
                    background: active ? SIDEBAR_ACTIVE : 'transparent',
                    color: active ? '#fff' : '#555',
                    border: active ? 'none' : '1px solid #dee2e6',
                    borderRadius: 8,
                    transition: 'all 0.15s ease',
                    fontWeight: active ? 600 : 400,
                  }}
                  onClick={() => setView(item.id)}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span className="flex-grow-1">{item.label}</span>
                  {item.badge && (
                    <span className="badge rounded-pill"
                      style={{ background: active ? 'rgba(255,255,255,0.3)' : '#0288d1', color: '#fff', fontSize: '0.7rem' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Main content */}
          <div className="flex-grow-1 p-4 overflow-auto" style={{ background: '#fafcff' }}>
            {view === 'myResults' ? renderMyResultsView() : renderFindExamView()}
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
