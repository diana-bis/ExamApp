import { useState } from 'react';

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
