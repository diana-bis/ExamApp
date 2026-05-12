import React, { useState } from 'react';
import { getExamById } from './api/examService';

const StudentPortal = () => {
  // State for storing the text entered by the student
  const [examId, setExamId] = useState('');
  // State for storing the fetched exam object
  const [exam, setExam] = useState(null);
  // State for storing error messages
  const [error, setError] = useState('');
  // State to track loading status when fetching exam
  const [loading, setLoading] = useState(false);

  // Function to handle fetching exam by ID when student clicks "Start Exam"
  const handleFetchExam = () => {
    if (!examId) {
      setError("Please enter an Exam ID");
      return;
    }
    setLoading(true);
    setError('');
    // Clear previous exam result
    setExam(null);

    // Call the API function to fetch exam by ID
    getExamById(examId)
      .then(data => {
        setExam(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-dark text-white">
          <h3>Student Portal</h3>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <label className="form-label">Enter Exam ID to Start</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="e.g. EX001"
                value={examId}
                // Update state whenever user types
                onChange={(e) => setExamId(e.target.value)}
              />
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleFetchExam}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Start Exam'}
              </button>
            </div>
            {error && <div className="text-danger mt-2">{error}</div>}
          </div>

          {exam && (
            <div className="mt-4 p-3 border rounded bg-light">
              <h4>Exam Found: {exam.title}</h4>
              <p>Prepare yourself! There are {exam.questions.length} questions in this test.</p>
              <button className="btn btn-success">Confirm and Begin</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
