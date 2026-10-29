'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
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
    const searchParams = useSearchParams();
    const router = useRouter();
    const formId = params?.id as string;
    const fromAdmin = searchParams.get('from') === 'admin';

    const [formTitle, setFormTitle] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    // حالات فلاتر التاريخ الجديدة
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (formId) fetchResponsesData();
    }, [formId]);

    async function fetchResponsesData() {
        setLoading(true);

        // 1. جلب عنوان الفورم
        const { data: formData } = await supabase
            .from('forms')
            .select('title')
            .eq('id', formId)
            .single();

        if (formData) setFormTitle(formData.title);

        // 2. جلب الأسئلة
        const { data: qData } = await supabase
            .from('questions')
            .select('id, question_text')
            .eq('form_id', formId);

        if (qData) setQuestions(qData);

        // 3. جلب الردود
        const { data: subData, error: subError } = await supabase
            .from('submissions')
            .select('*')
            .eq('form_id', formId);

        if (subError) {
            console.error('Error fetching submissions:', subError.message);
        }

        if (subData) {
            setSubmissions(subData);
        }

        setLoading(false);
    }

    // تصفية الردود بناءً على التاريخ المختار
    const filteredSubmissions = submissions.filter(sub => {
        if (!sub.submitted_at) return true;
        const subDate = new Date(sub.submitted_at).toISOString().split('T')[0];
        if (startDate && subDate < startDate) return false;
        if (endDate && subDate > endDate) return false;
        return true;
    });

    // دالة لتصدير الردود كملف CSV
    const exportToCSV = () => {
        if (submissions.length === 0) {
            alert('No submissions to export.');
            return;
        }

        const headers = ['Submission ID', 'Submitted At', ...questions.map(q => q.question_text)];
        
        const rows = filteredSubmissions.map((sub, index) => {
            const rowData = [
                `#${index + 1}`,
                sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'N/A',
                ...questions.map(q => `"${(sub.answers[q.id] || '').replace(/"/g, '""')}"`)
            ];
            return rowData.join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${formTitle || 'form'}_responses.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        {/* زر الرجوع الذكي */}
                        <button
                            onClick={() => router.push(fromAdmin ? '/admin' : '/dashboard')}
                            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-2 inline-block bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
                        >
                            ← {fromAdmin ? 'Back to Admin Panel' : 'Back to Dashboard'}
                        </button>
                        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
                            Responses for: <span className="text-indigo-600">{formTitle}</span>
                        </h1>
                    </div>

                    {/* Export CSV Button */}
                    <button
                        onClick={exportToCSV}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition text-sm flex items-center justify-center gap-2 self-start md:self-auto"
                    >
                        📥 Export as CSV
                    </button>
                </div>

                {/* Date Filters & Analytics Summary Cards */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h2 className="text-lg font-bold text-slate-800">📊 Analytics & Date Filter</h2>
                        
                        {/* Date Filters Inputs */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-500 font-medium">From:</span>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
                            />
                            <span className="text-xs text-slate-500 font-medium">To:</span>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
                            />
                            {(startDate || endDate) && (
                                <button 
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="text-xs text-indigo-600 hover:underline font-semibold ml-2"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Filtered Responses</p>
                            <h3 className="text-2xl font-extrabold text-indigo-600">{filteredSubmissions.length} <span className="text-xs text-slate-400 font-normal">/ {submissions.length}</span></h3>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Questions</p>
                            <h3 className="text-2xl font-extrabold text-slate-800">{questions.length}</h3>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Completion Rate</p>
                            <h3 className="text-2xl font-extrabold text-emerald-600">{filteredSubmissions.length > 0 ? '100%' : '0%'}</h3>
                        </div>
                    </div>
                </div>

                {/* Submissions Table / List */}
                {filteredSubmissions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <p className="text-slate-500 text-base font-medium">No responses found for the selected period.</p>
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
                                    {filteredSubmissions.map((sub, sIndex) => (
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