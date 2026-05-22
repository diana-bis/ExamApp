import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TeacherDashboard from './TeacherDashboard';
import { getAllExams } from './api/examService';

vi.mock('./api/examService', () => ({
  getAllExams: vi.fn()
}));

const exams = [
  {
    id: 'EX001',
    title: 'JavaScript Basics',
    questions: [
      { id: 1, question: 'What is closure?', options: ['A', 'B'], answer: 'A' },
      { id: 2, question: 'What is hoisting?', options: ['A', 'B'], answer: 'B' }
    ]
  },
  {
    id: 'EX002',
    title: 'React Fundamentals',
    questions: [
      { id: 1, question: 'What is a hook?', options: ['A', 'B'], answer: 'A' }
    ]
  }
];

describe('TeacherDashboard', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows exams after loading', async () => {
    getAllExams.mockResolvedValue(exams);

    render(<TeacherDashboard />);

    expect(screen.getByText('Loading exams...')).toBeInTheDocument();
    expect(await screen.findByText('JavaScript Basics')).toBeInTheDocument();
    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Questions: 2')).toBeInTheDocument();
  });

  it('filters exams by search text', async () => {
    getAllExams.mockResolvedValue(exams);

    render(<TeacherDashboard />);

    await screen.findByText('JavaScript Basics');
    fireEvent.change(screen.getByPlaceholderText('Search by exam title or ID'), {
      target: { value: 'react' }
    });

    await waitFor(() => {
      expect(screen.queryByText('JavaScript Basics')).not.toBeInTheDocument();
    });
    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
  });
});
