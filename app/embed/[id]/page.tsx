'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Question {
    id: string;
    question_text: string;
    question_type: string;
    options?: string[];
}

function EmbedChatContent() {
    const params = useParams();
    const formId = params?.id as string;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [inputValue, setInputValue] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (formId) fetchFormQuestions();
    }, [formId]);

    async function fetchFormQuestions() {
        setLoading(true);
        const { data } = await supabase
            .from('questions')
            .select('id, question_text, question_type, options')
            .eq('form_id', formId);

        if (data) setQuestions(data);
        setLoading(false);
    }

    async function handleNext(answerText: string) {
        if (!answerText.trim()) return;

        const currentQuestion = questions[currentIndex];
        const updatedAnswers = { ...answers, [currentQuestion.id]: answerText };
        setAnswers(updatedAnswers);
        setInputValue('');

        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(currentIndex + 1);
        } else {
            await supabase.from('submissions').insert([
                {
                    form_id: formId,
                    answers: updatedAnswers,
                },
            ]);
            setIsCompleted(true);
        }
    }

    if (loading) {
        return <div className="p-4 text-center text-xs text-slate-600 bg-white min-h-screen flex items-center justify-center">Loading chat...</div>;
    }

    if (questions.length === 0) {
        return <div className="p-4 text-center text-xs text-slate-600 bg-white min-h-screen flex items-center justify-center">No questions found.</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 rounded-xl shadow-xl overflow-hidden border border-slate-200 text-sm text-slate-800">
            {/* Header */}
            <div className="bg-indigo-600 text-white p-3 font-bold text-sm flex items-center justify-between shadow-sm">
                <span>FormChat Assistant</span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
                {!isCompleted ? (
                    <div className="flex items-start">
                        <div className="bg-white text-slate-900 p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200 max-w-[85%] text-xs leading-relaxed font-medium">
                            {questions[currentIndex]?.question_text}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 space-y-2">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                            ✓
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">Thank You!</h3>
                        <p className="text-xs text-slate-600">Your response has been successfully submitted.</p>
                    </div>
                )}
            </div>

            {/* Input / Options Footer */}
            {!isCompleted && (
                <div className="p-3 bg-white border-t border-slate-200">
                    {questions[currentIndex]?.question_type === 'yes_no' ? (
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={() => handleNext('Yes')}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => handleNext('No')}
                                className="flex-1 bg-slate-200 text-slate-800 py-2 rounded-lg text-xs font-medium hover:bg-slate-300 transition"
                            >
                                No
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleNext(inputValue)}
                                placeholder="Type your answer..."
                                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 pl-12 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={() => handleNext(inputValue)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                            >
                                Send
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function EmbedChatWidget() {
    return (
        <Suspense fallback={<div className="p-4 text-center text-xs text-slate-600 bg-white">Loading...</div>}>
            <EmbedChatContent />
        </Suspense>
    );
}