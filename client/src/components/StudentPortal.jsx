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

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-dark text-white">
          <h3>Student Portal</h3>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <label className="form-label fw-semibold">Enter Exam ID to Start</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="e.g. EX001"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
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
      </div>

      <div className="card shadow mt-4">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">My Results</h5>
        </div>
        <div className="card-body">
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
      </div>
    </div>
  );
};

export default StudentPortal;
