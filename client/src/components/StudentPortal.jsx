import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { loggerService } from '../services/LoggerService';
import { notifyService } from '../services/NotifyService';

const StudentPortal = () => {
  const navigate = useNavigate();
  const [examId, setExamId] = useState('');
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetchExam = async () => {
    const id = examId.trim();
    if (!id) {
      notifyService.notifyError('Please enter an Exam ID.');
      return;
    }

    setLoading(true);
    setExam(null);
    loggerService.log(`Student fetching exam — id: "${id}"`);

    try {
      const data = await examService.getExamById(id);
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleFetchExam();
  };

  const handleBegin = () => {
    loggerService.log(`Student beginning exam — id: "${exam.id}"`);
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
    </div>
  );
};

export default StudentPortal;
