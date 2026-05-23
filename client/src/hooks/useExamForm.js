import { useState } from 'react';
import { notifyService } from '../services/NotifyService';

export const validateExamForm = (form) => {
    if (!form.title.trim()) {
        notifyService.notifyError('Title is required.');
        return false;
    }
    if (!form.timeLimit || form.timeLimit <= 0) {
        notifyService.notifyError('Time limit must be greater than 0.');
        return false;
    }
    if (form.passingGrade < 0 || form.passingGrade > 100) {
        notifyService.notifyError('Passing grade must be between 0 and 100.');
        return false;
    }
    for (const q of form.questions) {
        if (!q.text.trim()) {
            notifyService.notifyError('All questions must have text.');
            return false;
        }
        if (q.type === 'MULTIPLE_CHOICE' && q.options.some(o => !o.trim())) {
            notifyService.notifyError('All multiple choice options must be filled in.');
            return false;
        }
        if (q.type === 'MULTIPLE_CHOICE' && !q.correctAnswer) {
            notifyService.notifyError('Select a correct answer for each multiple choice question.');
            return false;
        }
    }
    return true;
};

const useExamForm = (initialForm) => {
    const [form, setForm] = useState(initialForm);

    const setField = (field, value) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const updateQuestion = (qi, changes) =>
        setForm(prev => {
            const questions = [...prev.questions];
            questions[qi] = { ...questions[qi], ...changes };
            return { ...prev, questions };
        });

    const removeQuestion = (qi) =>
        setForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qi) }));

    const addQuestion = (type) => {
        const q = type === 'MULTIPLE_CHOICE'
            ? { id: `q${Date.now()}`, type, text: '', options: ['', ''], correctAnswer: '' }
            : { id: `q${Date.now()}`, type, text: '' };
        setForm(prev => ({ ...prev, questions: [...prev.questions, q] }));
    };

    const updateOption = (qi, oi, value) =>
        setForm(prev => {
            const questions = [...prev.questions];
            const options = [...questions[qi].options];
            options[oi] = value;
            questions[qi] = { ...questions[qi], options };
            return { ...prev, questions };
        });

    const removeOption = (qi, oi) =>
        setForm(prev => {
            const questions = [...prev.questions];
            questions[qi] = { ...questions[qi], options: questions[qi].options.filter((_, i) => i !== oi) };
            return { ...prev, questions };
        });

    const addOption = (qi) =>
        setForm(prev => {
            const questions = [...prev.questions];
            questions[qi] = { ...questions[qi], options: [...questions[qi].options, ''] };
            return { ...prev, questions };
        });

    return { form, setForm, setField, updateQuestion, removeQuestion, addQuestion, updateOption, removeOption, addOption };
};

export default useExamForm;
