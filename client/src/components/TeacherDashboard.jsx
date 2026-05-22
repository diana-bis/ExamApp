import React, { useState, useEffect } from 'react';
import { examService } from '../api/ExamService';

const TeacherDashboard = () => {
  // State to hold list of exams - starts as empty array because we haven't loaded yet from the API
  const [exams, setExams] = useState([]);
  // State to track loading status - starts as true because data has not loaded yet
  const [loading, setLoading] = useState(true);
  // State to track which exam is being viewed in detail
  const [selectedExam, setSelectedExam] = useState(null);
  // State for search text input by user
  const [searchText, setSearchText] = useState('');

  // Filter exams based on search text
  const filteredExams = exams.filter(exam => {
    const search = searchText.toLowerCase();
    const title = exam.title || '';
    const id = exam.id || '';

    return (
      title.toLowerCase().includes(search) ||
      id.toLowerCase().includes(search)
    );
  });

  // Runs when component first loads
  useEffect(() => {
    examService.getAllExams()
      .then(data => {
        setExams(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // If an exam is selected, show its details
  if (selectedExam) {
    const questions = selectedExam.questions || [];

    return (
      <div className="container mt-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h3>Exam Details: {selectedExam.title}</h3>
            <button
              className="btn btn-light btn-sm"
              onClick={() => setSelectedExam(null)}
            >
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
                      {q.options.map((option, optionIndex) => (
                        <li key={optionIndex} className={option === q.correctAnswer ? 'fw-semibold text-success' : ''}>
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

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h3>Teacher Dashboard</h3>
        </div>
        <div className="card-body">
          <h5 className="card-title">Available Exams</h5>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Search by exam title or ID"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {/* Conditional rendering */}
          {loading ? (
            // Show loading message while data is loading
            <p>Loading exams...</p>
          ) : filteredExams.length === 0 ? (
            <p>No exams found</p>
          ) : (
            // Show exams after loading finishes
            <div className="row">
              {filteredExams.map(exam => (
                <div key={exam.id} className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-2 text-muted">ID: {exam.id}</h6>
                      <h5 className="card-title">{exam.title}</h5>
                      <p className="card-text mb-1">Questions: {(exam.questions || []).length}</p>
                      <button
                        className="btn btn-outline-info btn-sm"
                        onClick={() => setSelectedExam(exam)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-success mt-3">Create New Exam</button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
