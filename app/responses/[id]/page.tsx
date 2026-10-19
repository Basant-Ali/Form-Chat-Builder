'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Submission {
    id: string;
    submitted_at: string;
    answers: Record<string, string>;
}

interface Question {
    id: string;
    question_text: string;
}

function ResponsesContent() {
    const params = useParams();
    const formId = params?.id as string;

    const [formTitle, setFormTitle] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (formId) fetchResponsesData();
    }, [formId]);

    async function fetchResponsesData() {
        setLoading(true);

        // 1. جلب عنوان الفورم
        const { data: formData, error: formError } = await supabase
            .from('forms')
            .select('title')
            .eq('id', formId)
            .single();

        if (formData) setFormTitle(formData.title);

        // 2. جلب الأسئلة
        const { data: qData, error: qError } = await supabase
            .from('questions')
            .select('id, question_text')
            .eq('form_id', formId);

        if (qData) setQuestions(qData);

        // 3. جلب الردود مع طباعة أي خطأ في الـ Console لو حدث
        const { data: subData, error: subError } = await supabase
            .from('submissions')
            .select('*')
            .eq('form_id', formId);

        if (subError) {
            console.error('Error fetching submissions:', subError.message);
        }

        if (subData) {
            console.log('Fetched Submissions:', subData); // طبعناهم هنا عشان نشوفهم
            setSubmissions(subData);
        }

        setLoading(false);
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-medium">
                Loading responses...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-800">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link
                            href="/dashboard"
                            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-2 inline-block bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
                        >
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
                            Responses for: <span className="text-indigo-600">{formTitle}</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Total Submissions: <span className="font-bold text-slate-700">{submissions.length}</span>
                        </p>
                    </div>
                </div>

                {/* Submissions Table / List */}
                {submissions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <p className="text-slate-500 text-base font-medium">No responses received yet for this form.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="px-6 py-4">#</th>
                                        <th className="px-6 py-4">Submitted At</th>
                                        {questions.map((q, idx) => (
                                            <th key={q.id} className="px-6 py-4">
                                                Q{idx + 1}: {q.question_text}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-sm">
                                    {submissions.map((sub, sIndex) => (
                                        <tr key={sub.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4 font-semibold text-slate-500">{sIndex + 1}</td>
                                            <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'N/A'}
                                            </td>
                                            {questions.map((q) => (
                                                <td key={q.id} className="px-6 py-4 text-slate-800 font-medium">
                                                    {sub.answers[q.id] || <span className="text-slate-400 italic">No answer</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ResponsesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>}>
            <ResponsesContent />
        </Suspense>
    );
}